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

// ===== STRUCTURED LOGGING =====
function createLogger() {
  const log = (level, message, meta = {}) => {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
    console.error(JSON.stringify(entry));
  };

  return {
    info: (msg, meta) => log("INFO", msg, meta),
    warn: (msg, meta) => log("WARN", msg, meta),
    error: (msg, meta) => log("ERROR", msg, meta),
    tool: (requestId, toolName, status, meta = {}) =>
      log("TOOL", `${toolName} -> ${status}`, { requestId, toolName, ...meta }),
  };
}

const logger = createLogger();

const CONFIG = {
  STANDUP_DIR: process.env.MCP_STANDUP_DIR || path.join(process.cwd(), "standups"),
};

// ===== IDEMPOTENCY GUARD =====
const recentWrites = new Map();
const IDEMPOTENCY_WINDOW_MS = 5000;

function checkIdempotency(operation, payload) {
  const hash = crypto
    .createHash("sha256")
    .update(`${operation}:${JSON.stringify(payload)}`)
    .digest("hex")
    .slice(0, 16);

  const now = Date.now();
  if (recentWrites.has(hash)) {
    const lastWrite = recentWrites.get(hash);
    if (now - lastWrite < IDEMPOTENCY_WINDOW_MS) {
      return { isDuplicate: true, hash };
    }
  }
  recentWrites.set(hash, now);
  for (const [key, timestamp] of recentWrites) {
    if (now - timestamp > IDEMPOTENCY_WINDOW_MS * 2) {
      recentWrites.delete(key);
    }
  }
  return { isDuplicate: false, hash };
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

// ===== MCP SERVER =====
const server = new Server(
  { name: "mcp-task-orchestrator", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

// ===== TOOL DEFINITIONS (11 tools - raw sheets removed) =====
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "read_file",
      description: "Read a local file and return its contents",
      inputSchema: {
        type: "object",
        properties: { path: { type: "string", description: "Path to the file" } },
        required: ["path"],
      },
    },
    {
      name: "write_file",
      description: "Write text content to a local file (creates or overwrites)",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the file" },
          text: { type: "string", description: "Content to write" },
        },
        required: ["path", "text"],
      },
    },
    {
      name: "list_files",
      description: "List files and folders in a directory. Shows file sizes and types.",
      inputSchema: {
        type: "object",
        properties: {
          dir: { type: "string", description: "Directory path to list (defaults to current directory)" },
        },
      },
    },
    {
      name: "add_task",
      description: "Add a new task. Auto-assigns an ID. Status defaults to 'To Do'.",
      inputSchema: {
        type: "object",
        properties: {
          task: { type: "string", description: "Task description" },
          assigned_to: { type: "string", description: "Person assigned (optional)" },
          status: { type: "string", enum: ["To Do", "In Progress", "Done", "Blocked"], description: "Status" },
          priority: { type: "string", enum: ["High", "Medium", "Low"], description: "Priority level (default: Medium)" },
          due_date: { type: "string", description: "Due date in YYYY-MM-DD format (optional)" },
        },
        required: ["task"],
      },
    },
    {
      name: "list_tasks",
      description: "List tasks with optional filters by status, priority, or assigned person.",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["To Do", "In Progress", "Done", "Blocked"], description: "Filter by status" },
          priority: { type: "string", enum: ["High", "Medium", "Low"], description: "Filter by priority" },
          assigned_to: { type: "string", description: "Filter by person assigned" },
        },
      },
    },
    {
      name: "update_task",
      description: "Update a task by its ID. Can change status, priority, assigned person, due date, or description.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "number", description: "Task ID to update" },
          task: { type: "string", description: "New task description" },
          assigned_to: { type: "string", description: "New assignee" },
          status: { type: "string", enum: ["To Do", "In Progress", "Done", "Blocked"], description: "New status" },
          priority: { type: "string", enum: ["High", "Medium", "Low"], description: "New priority" },
          due_date: { type: "string", description: "New due date in YYYY-MM-DD format" },
        },
        required: ["id"],
      },
    },
    {
      name: "get_overdue_tasks",
      description: "Get all tasks that are past their due date and not yet Done",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_task_summary",
      description: "Get a summary — counts by status, priority, and overdue items",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "generate_standup_data",
      description: "Gathers all task data and organizes it for a standup report.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "save_standup_report",
      description: "Saves the standup report locally and logs a summary row to Postgres.",
      inputSchema: {
        type: "object",
        properties: {
          report_markdown: { type: "string", description: "The full standup report in markdown format" },
          done_summary: { type: "string", description: "Brief summary of completed tasks" },
          in_progress_summary: { type: "string", description: "Brief summary of in-progress tasks" },
          blocked_summary: { type: "string", description: "Brief summary of blocked/overdue items" },
          overdue_count: { type: "number", description: "Number of overdue tasks" },
          ai_summary: { type: "string", description: "A 1-2 sentence AI-generated overall assessment" },
        },
        required: ["report_markdown", "done_summary", "in_progress_summary", "blocked_summary", "overdue_count", "ai_summary"],
      },
    },
    {
      name: "read_standup_history",
      description: "Read past standup entries from Postgres.",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

// ===== TOOL IMPLEMENTATIONS =====

async function addTask({ task, assigned_to, status, priority, due_date }) {
  const { rows } = await pool.query(
    `INSERT INTO tasks (task, assigned_to, status, priority, due_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      task,
      assigned_to ?? 'Unassigned',
      status      ?? 'To Do',
      priority    ?? 'Medium',
      due_date    ?? null,
    ]
  );
  return rows[0];
}

async function listTasks({ status, priority, assigned_to } = {}) {
  const conditions = [];
  const values     = [];

  if (status)      { conditions.push(`status = $${values.length + 1}`);      values.push(status); }
  if (priority)    { conditions.push(`priority = $${values.length + 1}`);    values.push(priority); }
  if (assigned_to) { conditions.push(`assigned_to = $${values.length + 1}`); values.push(assigned_to); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT id, task, assigned_to, status, priority,
            to_char(due_date, 'YYYY-MM-DD') AS due_date,
            created_at, updated_at
     FROM tasks
     ${where}
     ORDER BY
       CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
       due_date NULLS LAST`,
    values
  );
  return rows;
}

async function updateTask(id, updates) {
  const allowed = ['task', 'assigned_to', 'status', 'priority', 'due_date'];
  const fields  = Object.keys(updates).filter(k => allowed.includes(k));

  if (fields.length === 0) throw new Error('No valid fields to update.');

  const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const values     = [id, ...fields.map(f => updates[f])];

  const { rows } = await pool.query(
    `UPDATE tasks
     SET ${setClauses}
     WHERE id = $1
     RETURNING *`,
    values
  );

  if (rows.length === 0) throw new Error(`Task id=${id} not found.`);
  return rows[0];
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  logger.tool(requestId, name, "STARTED", { args: Object.keys(args || {}) });

  try {
    const result = await executeToolHandler(name, args, requestId);
    const durationMs = Date.now() - startTime;
    logger.tool(requestId, name, "SUCCESS", { durationMs });
    return result;
  } catch (err) {
    const durationMs = Date.now() - startTime;
    logger.tool(requestId, name, "FAILED", { durationMs, error: err.message });
    return { content: [{ type: "text", text: `ERROR [${requestId.slice(0, 8)}]: ${err.message}` }], isError: true };
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
