import 'dotenv/config';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import pool from './db.js';
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { z } from "zod";

// ===== INPUT VALIDATION SCHEMAS (CLAUDE-PATTERN) =====
const schemas = {
  read_file: z.object({
    path: z.string().min(1).describe('Absolute file path'),
  }),
  write_file: z.object({
    path: z.string().min(1),
    text: z.string(),
  }),
  list_files: z.object({
    dir: z.string().optional(),
  }),
  add_task: z.object({
    task: z.string().min(1).max(500),
    assigned_to: z.string().optional(),
    status: z.enum(["To Do", "In Progress", "Done", "Blocked"]).default("To Do"),
    priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional().nullable(),
  }),
  list_tasks: z.object({
    status: z.enum(["To Do", "In Progress", "Done", "Blocked"]).optional(),
    priority: z.enum(["High", "Medium", "Low"]).optional(),
    assigned_to: z.string().optional(),
  }),
  update_task: z.object({
    id: z.number().int().positive(),
    task: z.string().optional(),
    assigned_to: z.string().optional(),
    status: z.enum(["To Do", "In Progress", "Done", "Blocked"]).optional(),
    priority: z.enum(["High", "Medium", "Low"]).optional(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional().nullable(),
  }),
  save_standup_report: z.object({
    report_markdown: z.string().min(10),
    done_summary: z.string(),
    in_progress_summary: z.string(),
    blocked_summary: z.string(),
    overdue_count: z.number(),
    ai_summary: z.string().max(500),
  }),
  get_overdue_tasks: z.object({}).optional(),
  get_task_summary: z.object({}).optional(),
  generate_standup_data: z.object({}).optional(),
  read_standup_history: z.object({}).optional(),
};

// ── Central validation wrapper ────────────────────────────────────────────────
function validateInput(toolName, rawInput) {
  const schema = schemas[toolName];
  if (!schema) {
    return { ok: false, error: { code: -32601, message: `Unknown tool: ${toolName}` } };
  }
  const result = schema.safeParse(rawInput ?? {});
  if (!result.success) {
    const detail = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { ok: false, error: { code: -32602, message: `Invalid params — ${detail}` } };
  }
  return { ok: true, data: result.data };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  logger.tool(requestId, name, "STARTED", { args: Object.keys(args || {}) });

  // 1. Validate
  const validation = validateInput(name, args);
  if (!validation.ok) {
    logger.warn({ tool: name, input: args, error: validation.error }, 'Input validation failed');
    return { 
      content: [{ type: "text", text: `JSON-RPC ERROR [${validation.error.code}]: ${validation.error.message}` }],
      isError: true 
    };
  }

  // 2. Execute
  const validatedArgs = validation.data;
  try {
    const result = await executeToolHandler(name, validatedArgs, requestId);
    const durationMs = Date.now() - startTime;
    logger.tool(requestId, name, "SUCCESS", { durationMs });
    return result;
  } catch (err) {
    const durationMs = Date.now() - startTime;
    logger.error({ tool: name, input: validatedArgs, err: err.message }, 'Tool execution error');
    return { 
      content: [{ type: "text", text: `INTERNAL ERROR [${requestId.slice(0, 8)}]: ${err.message}` }], 
      isError: true 
    };
  }
});

async function executeToolHandler(name, args, requestId) {
  if (name === "read_file") {
    const content = fs.readFileSync(args.path, "utf8");
    return { content: [{ type: "text", text: content }] };
  }

  if (name === "write_file") {
    const { isDuplicate } = checkIdempotency("write_file", { path: args.path, text: args.text });
    if (isDuplicate) return { content: [{ type: "text", text: `File already written (dedup): ${args.path}` }] };
    fs.writeFileSync(args.path, args.text);
    return { content: [{ type: "text", text: `File written successfully: ${args.path}` }] };
  }

  if (name === "list_files") {
    const dir = args.dir || ".";
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const listing = entries.map((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return `📁 ${entry.name}/`;
      const stats = fs.statSync(fullPath);
      return `📄 ${entry.name}  (${(stats.size / 1024).toFixed(1)} KB)`;
    });
    return { content: [{ type: "text", text: `Contents of ${path.resolve(dir)}:\n\n${listing.join("\n")}` }] };
  }

  if (name === "add_task") {
    const { isDuplicate } = checkIdempotency("add_task", { task: args.task });
    if (isDuplicate) return { content: [{ type: "text", text: `Task already added (dedup): "${args.task}"` }] };
    const row = await addTask(args);
    return { content: [{ type: "text", text: `✅ Task created: id=${row.id}` }] };
  }

  if (name === "list_tasks") {
    const rows = await listTasks(args);
    const text = rows.length
      ? rows.map(r => `[${r.id}] ${r.task} | ${r.assigned_to} | ${r.status} | ${r.priority} | Due: ${r.due_date ?? '—'}`).join('\n')
      : 'No tasks found.';
    return { content: [{ type: "text", text }] };
  }

  if (name === "update_task") {
    const { id, ...updates } = args;
    const row = await updateTask(id, updates);
    return { content: [{ type: "text", text: `✅ Task id=${row.id} updated.` }] };
  }

  if (name === "get_overdue_tasks") {
    const { rows } = await pool.query(
      `SELECT id, task, status, priority, to_char(due_date, 'YYYY-MM-DD') AS due_date 
       FROM tasks WHERE due_date < CURRENT_DATE AND status != 'Done'`
    );
    if (rows.length === 0) return { content: [{ type: "text", text: "No overdue tasks! You're all caught up." }] };
    const formatted = rows.map(t => `🔴 #${t.id} | ${t.task} | Due: ${t.due_date} | Status: ${t.status} | Priority: ${t.priority}`);
    return { content: [{ type: "text", text: `${rows.length} overdue task(s):\n\n${formatted.join("\n")}` }] };
  }

  if (name === "get_task_summary") {
    const { rows: stats } = await pool.query(`SELECT status, count(*) FROM tasks GROUP BY status`);
    const { rows: pStats } = await pool.query(`SELECT priority, count(*) FROM tasks GROUP BY priority`);
    const { rows: overdue } = await pool.query(`SELECT count(*) FROM tasks WHERE due_date < CURRENT_DATE AND status != 'Done'`);
    const total = stats.reduce((acc, row) => acc + Number(row.count), 0);
    if (total === 0) return { content: [{ type: "text", text: "No tasks in the database yet." }] };

    const summary = [
      `Total tasks: ${total}`,
      `By status → ${stats.map(r => `${r.status}: ${r.count}`).join(" | ")}`,
      `By priority → ${pStats.map(r => `${r.priority}: ${r.count}`).join(" | ")}`,
      `Overdue: ${overdue[0].count}`,
    ].join("\n");
    return { content: [{ type: "text", text: summary }] };
  }

  if (name === "generate_standup_data") {
    const { rows: tasks } = await pool.query(`SELECT id, task, assigned_to, status, priority, to_char(due_date, 'YYYY-MM-DD') AS due_date FROM tasks`);
    const today = getToday();
    if (tasks.length === 0) return { content: [{ type: "text", text: "No tasks found. Add some tasks first." }] };

    const done = tasks.filter((t) => t.status === "Done");
    const inProgress = tasks.filter((t) => t.status === "In Progress");
    const toDo = tasks.filter((t) => t.status === "To Do");
    const blocked = tasks.filter((t) => t.status === "Blocked");
    const overdue = tasks.filter((t) => t.due_date && t.due_date < today && t.status !== "Done");
    const dueToday = tasks.filter((t) => t.due_date === today && t.status !== "Done");

    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    const dueThisWeek = tasks.filter((t) => t.due_date && t.due_date > today && t.due_date <= nextWeek.toISOString().split("T")[0] && t.status !== "Done");

    const fmt = (list) => list.length === 0 ? "  (none)" : list.map((t) => `  #${t.id} | ${t.task} | ${t.assigned_to || "Unassigned"} | ${t.priority} | Due: ${t.due_date || "N/A"}`).join("\n");

    const data = [
      `===== STANDUP DATA FOR ${today} =====`, "",
      `TOTAL TASKS: ${tasks.length}`, "",
      `✅ DONE (${done.length}):`, fmt(done), "",
      `🔄 IN PROGRESS (${inProgress.length}):`, fmt(inProgress), "",
      `📋 TO DO (${toDo.length}):`, fmt(toDo), "",
      `🚫 BLOCKED (${blocked.length}):`, fmt(blocked), "",
      `🔴 OVERDUE (${overdue.length}):`, fmt(overdue), "",
      `⚡ DUE TODAY (${dueToday.length}):`, fmt(dueToday), "",
      `📅 DUE THIS WEEK (${dueThisWeek.length}):`, fmt(dueThisWeek), "",
      `===== END DATA =====`, "",
      `Analyze this data and write a standup report, then use save_standup_report to persist it.`,
    ].join("\n");
    return { content: [{ type: "text", text: data }] };
  }

  if (name === "save_standup_report") {
    const today = getToday();
    const { isDuplicate } = checkIdempotency("save_standup", { date: today });
    if (isDuplicate) return { content: [{ type: "text", text: "Standup already saved for today (dedup guard)." }] };

    if (!fs.existsSync(CONFIG.STANDUP_DIR)) fs.mkdirSync(CONFIG.STANDUP_DIR, { recursive: true });
    const filepath = path.join(CONFIG.STANDUP_DIR, `standup-${today}.md`);
    fs.writeFileSync(filepath, args.report_markdown);

    await pool.query(
      `INSERT INTO standup_log (date, done_summary, in_progress_summary, blocked_summary, overdue_count, ai_summary)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (date) DO UPDATE SET
         done_summary = EXCLUDED.done_summary,
         in_progress_summary = EXCLUDED.in_progress_summary,
         blocked_summary = EXCLUDED.blocked_summary,
         overdue_count = EXCLUDED.overdue_count,
         ai_summary = EXCLUDED.ai_summary`,
      [today, args.done_summary, args.in_progress_summary, args.blocked_summary, args.overdue_count, args.ai_summary]
    );

    return { content: [{ type: "text", text: `Standup report saved!\n📄 Local: ${filepath}\n📊 DB: Saved to standup_log` }] };
  }

  if (name === "read_standup_history") {
    const { rows } = await pool.query(
      `SELECT to_char(date, 'YYYY-MM-DD') as date, done_summary, in_progress_summary, blocked_summary, overdue_count, ai_summary 
       FROM standup_log ORDER BY date DESC LIMIT 10`
    );
    if (rows.length === 0) return { content: [{ type: "text", text: "No standup history yet." }] };

    const formatted = rows.map(
      (e) => `📅 ${e.date}\n  Done: ${e.done_summary}\n  In Progress: ${e.in_progress_summary}\n  Blocked: ${e.blocked_summary}\n  Overdue: ${e.overdue_count}\n  Summary: ${e.ai_summary}`
    ).join("\n\n");

    return { content: [{ type: "text", text: `Standup History (${rows.length} entries):\n\n${formatted}` }] };
  }

  throw new Error("Unknown tool: " + name);
}

// ===== SERVER STARTUP =====
const transport = new StdioServerTransport();
server.connect(transport).catch((err) => {
  logger.error("Failed to connect server", { error: err.message });
  process.exit(1);
});

logger.info("MCP Task Orchestrator v2.0.0 is running (Supabase Edition)");
