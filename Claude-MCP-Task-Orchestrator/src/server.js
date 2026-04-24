import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { google } from "googleapis";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// ===== STRUCTURED LOGGING =====
// Enterprise pattern: every tool invocation gets a unique requestId
// for traceability across distributed systems.
function createLogger() {
  const log = (level, message, meta = {}) => {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
    // Logs to stderr (MCP convention: stdout is for JSON-RPC, stderr for diagnostics)
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

// ===== CONFIGURATION (Environment-Based Secrets Management) =====
// Enterprise pattern: secrets come from environment variables, never hardcoded.
// For production, inject these via Docker secrets, Vault, or .env files.
const CONFIG = {
  SPREADSHEET_ID: process.env.MCP_SPREADSHEET_ID || "REPLACE_WITH_YOUR_SPREADSHEET_ID",
  KEY_FILE: process.env.GOOGLE_APPLICATION_CREDENTIALS || "path/to/your/service-account.json",
  TASK_RANGE: "Sheet1!A:F",
  STANDUP_RANGE: "Standup Log!A:F",
  STANDUP_DIR: process.env.MCP_STANDUP_DIR || path.join(process.cwd(), "standups"),
};

// ===== GOOGLE SHEETS SETUP =====
let auth = null;
let sheets = null;

async function getAuth() {
  if (!auth) {
    try {
      auth = new google.auth.GoogleAuth({
        keyFile: CONFIG.KEY_FILE,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      sheets = google.sheets({ version: "v4", auth });
      logger.info("Google Auth initialized successfully");
    } catch (err) {
      logger.error("Failed to initialize Google Auth", { error: err.message });
      throw err;
    }
  }
  return { auth, sheets };
}

// ===== HELPERS =====

async function getAllTasks() {
  const { sheets: sheetsApi } = await getAuth();
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: CONFIG.SPREADSHEET_ID,
    range: CONFIG.TASK_RANGE,
  });

  const rows = res.data.values || [];
  if (rows.length <= 1) return [];

  const headers = rows[0];
  return rows.slice(1).map((row, index) => {
    const task = {};
    headers.forEach((header, i) => {
      task[header] = row[i] || "";
    });
    task._rowIndex = index + 2;
    return task;
  });
}

async function getNextId() {
  const tasks = await getAllTasks();
  if (tasks.length === 0) return 1;
  const maxId = Math.max(...tasks.map((t) => parseInt(t.ID) || 0));
  return maxId + 1;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

// ===== IDEMPOTENCY GUARD =====
// Enterprise pattern: prevents duplicate writes within a short window.
// Tracks recent write operations by a hash of their payload.
const recentWrites = new Map();
const IDEMPOTENCY_WINDOW_MS = 5000; // 5-second dedup window

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

  // Cleanup old entries
  for (const [key, timestamp] of recentWrites) {
    if (now - timestamp > IDEMPOTENCY_WINDOW_MS * 2) {
      recentWrites.delete(key);
    }
  }

  return { isDuplicate: false, hash };
}

// ===== MCP SERVER =====
const server = new Server(
  { name: "mcp-task-orchestrator", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

logger.info("MCP Task Orchestrator v2.0.0 initializing", {
  spreadsheetId: CONFIG.SPREADSHEET_ID.slice(0, 8) + "...",
  standupDir: CONFIG.STANDUP_DIR,
});

// ===== TOOL DEFINITIONS (14 tools) =====
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // === FILE TOOLS ===
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

    // === GOOGLE SHEETS — RAW ACCESS ===
    {
      name: "read_sheet",
      description: "Read all rows from the Google Sheet (raw task data)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "append_sheet_row",
      description: "Add a raw row to the bottom of the Google Sheet",
      inputSchema: {
        type: "object",
        properties: {
          values: { type: "array", items: { type: "string" }, description: "Array of cell values for the new row" },
        },
        required: ["values"],
      },
    },
    {
      name: "update_sheet_cell",
      description: "Update a specific cell in the Google Sheet",
      inputSchema: {
        type: "object",
        properties: {
          cell: { type: "string", description: "Cell reference like A1, B2" },
          value: { type: "string", description: "New value to set" },
        },
        required: ["cell", "value"],
      },
    },

    // === SMART TASK MANAGER ===
    {
      name: "add_task",
      description: "Add a new task. Auto-assigns an ID. Status defaults to 'To Do'.",
      inputSchema: {
        type: "object",
        properties: {
          task: { type: "string", description: "Task description" },
          assigned_to: { type: "string", description: "Person assigned (optional)" },
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

    // === DAILY STANDUP AUTO-REPORTER ===
    {
      name: "generate_standup_data",
      description: "Gathers all task data and organizes it for a standup report. Returns tasks grouped by status, highlights overdue tasks, and provides structured data for AI analysis.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "save_standup_report",
      description: "Saves the standup report locally and logs a summary row to the Google Sheet.",
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
      description: "Read past standup entries from the Standup Log sheet.",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

// ===== TOOL EXECUTION (All 14 handlers with structured logging) =====
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
    return { content: [{ type: "text", text: `ERROR [${requestId.slice(0, 8)}]: ${err.message}` }] };
  }
});

async function executeToolHandler(name, args, requestId) {

  // ===== FILE TOOLS =====

  if (name === "read_file") {
    const content = fs.readFileSync(args.path, "utf8");
    return { content: [{ type: "text", text: content }] };
  }

  if (name === "write_file") {
    const { isDuplicate } = checkIdempotency("write_file", { path: args.path, text: args.text });
    if (isDuplicate) {
      logger.warn("Idempotency guard: duplicate write_file blocked", { requestId, path: args.path });
      return { content: [{ type: "text", text: `File already written (dedup): ${args.path}` }] };
    }
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

  // ===== GOOGLE SHEETS — RAW ACCESS =====

  if (name === "read_sheet") {
    const { sheets: sheetsApi } = await getAuth();
    const res = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      range: CONFIG.TASK_RANGE,
    });
    return { content: [{ type: "text", text: JSON.stringify(res.data.values) }] };
  }

  if (name === "append_sheet_row") {
    const { isDuplicate } = checkIdempotency("append_row", args.values);
    if (isDuplicate) {
      logger.warn("Idempotency guard: duplicate append blocked", { requestId });
      return { content: [{ type: "text", text: "Row already added (dedup guard)." }] };
    }
    const { sheets: sheetsApi } = await getAuth();
    await sheetsApi.spreadsheets.values.append({
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      range: CONFIG.TASK_RANGE,
      valueInputOption: "RAW",
      requestBody: { values: [args.values] },
    });
    return { content: [{ type: "text", text: "Row added successfully!" }] };
  }

  if (name === "update_sheet_cell") {
    const { sheets: sheetsApi } = await getAuth();
    await sheetsApi.spreadsheets.values.update({
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      range: `Sheet1!${args.cell}`,
      valueInputOption: "RAW",
      requestBody: { values: [[args.value]] },
    });
    return { content: [{ type: "text", text: `Cell ${args.cell} updated to "${args.value}"` }] };
  }

  // ===== SMART TASK MANAGER =====

  if (name === "add_task") {
    const { isDuplicate } = checkIdempotency("add_task", { task: args.task });
    if (isDuplicate) {
      logger.warn("Idempotency guard: duplicate task creation blocked", { requestId, task: args.task });
      return { content: [{ type: "text", text: `Task already added (dedup): "${args.task}"` }] };
    }

    const { sheets: sheetsApi } = await getAuth();
    const nextId = await getNextId();
    const row = [String(nextId), args.task, args.assigned_to || "", "To Do", args.priority || "Medium", args.due_date || ""];
    await sheetsApi.spreadsheets.values.append({
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      range: CONFIG.TASK_RANGE,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });

    logger.info("Task created", { requestId, taskId: nextId, task: args.task });
    return { content: [{ type: "text", text: `Task #${nextId} added: "${args.task}" | Priority: ${args.priority || "Medium"} | Due: ${args.due_date || "No date set"}` }] };
  }

  if (name === "list_tasks") {
    let tasks = await getAllTasks();
    if (args.status) tasks = tasks.filter((t) => t.Status.toLowerCase() === args.status.toLowerCase());
    if (args.priority) tasks = tasks.filter((t) => t.Priority.toLowerCase() === args.priority.toLowerCase());
    if (args.assigned_to) tasks = tasks.filter((t) => t["Assigned To"].toLowerCase() === args.assigned_to.toLowerCase());

    if (tasks.length === 0) return { content: [{ type: "text", text: "No tasks found matching the filters." }] };

    const formatted = tasks.map(
      (t) => `#${t.ID} | ${t.Task} | Assigned: ${t["Assigned To"] || "Unassigned"} | Status: ${t.Status} | Priority: ${t.Priority} | Due: ${t["Due Date"] || "No date"}`
    );
    return { content: [{ type: "text", text: `Found ${tasks.length} task(s):\n\n${formatted.join("\n")}` }] };
  }

  if (name === "update_task") {
    const { sheets: sheetsApi } = await getAuth();
    const tasks = await getAllTasks();
    const task = tasks.find((t) => parseInt(t.ID) === args.id);
    if (!task) return { content: [{ type: "text", text: `ERROR: Task #${args.id} not found.` }] };

    const rowIndex = task._rowIndex;
    const updatedRow = [
      task.ID,
      args.task || task.Task,
      args.assigned_to !== undefined ? args.assigned_to : task["Assigned To"],
      args.status || task.Status,
      args.priority || task.Priority,
      args.due_date !== undefined ? args.due_date : task["Due Date"],
    ];

    await sheetsApi.spreadsheets.values.update({
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      range: `Sheet1!A${rowIndex}:F${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [updatedRow] },
    });

    const changes = [];
    if (args.task) changes.push(`description → "${args.task}"`);
    if (args.status) changes.push(`status → ${args.status}`);
    if (args.priority) changes.push(`priority → ${args.priority}`);
    if (args.assigned_to !== undefined) changes.push(`assigned to → ${args.assigned_to || "Unassigned"}`);
    if (args.due_date !== undefined) changes.push(`due date → ${args.due_date || "Removed"}`);

    logger.info("Task updated", { requestId, taskId: args.id, changes });
    return { content: [{ type: "text", text: `Task #${args.id} updated: ${changes.join(", ")}` }] };
  }

  if (name === "get_overdue_tasks") {
    const tasks = await getAllTasks();
    const today = getToday();
    const overdue = tasks.filter((t) => t["Due Date"] && t["Due Date"] < today && t.Status.toLowerCase() !== "done");

    if (overdue.length === 0) return { content: [{ type: "text", text: "No overdue tasks! You're all caught up." }] };

    const formatted = overdue.map(
      (t) => `🔴 #${t.ID} | ${t.Task} | Due: ${t["Due Date"]} | Status: ${t.Status} | Priority: ${t.Priority}`
    );
    return { content: [{ type: "text", text: `${overdue.length} overdue task(s):\n\n${formatted.join("\n")}` }] };
  }

  if (name === "get_task_summary") {
    const tasks = await getAllTasks();
    if (tasks.length === 0) return { content: [{ type: "text", text: "No tasks in the sheet yet." }] };

    const today = getToday();
    const byStatus = {};
    tasks.forEach((t) => { byStatus[t.Status || "Unknown"] = (byStatus[t.Status || "Unknown"] || 0) + 1; });
    const byPriority = {};
    tasks.forEach((t) => { byPriority[t.Priority || "Unknown"] = (byPriority[t.Priority || "Unknown"] || 0) + 1; });
    const overdueCount = tasks.filter((t) => t["Due Date"] && t["Due Date"] < today && t.Status.toLowerCase() !== "done").length;

    const summary = [
      `Total tasks: ${tasks.length}`,
      `By status → ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(" | ")}`,
      `By priority → ${Object.entries(byPriority).map(([k, v]) => `${k}: ${v}`).join(" | ")}`,
      `Overdue: ${overdueCount}`,
    ].join("\n");
    return { content: [{ type: "text", text: summary }] };
  }

  // ===== DAILY STANDUP AUTO-REPORTER =====

  if (name === "generate_standup_data") {
    const tasks = await getAllTasks();
    const today = getToday();
    if (tasks.length === 0) return { content: [{ type: "text", text: "No tasks found. Add some tasks first." }] };

    const done = tasks.filter((t) => t.Status.toLowerCase() === "done");
    const inProgress = tasks.filter((t) => t.Status.toLowerCase() === "in progress");
    const toDo = tasks.filter((t) => t.Status.toLowerCase() === "to do");
    const blocked = tasks.filter((t) => t.Status.toLowerCase() === "blocked");
    const overdue = tasks.filter((t) => t["Due Date"] && t["Due Date"] < today && t.Status.toLowerCase() !== "done");
    const dueToday = tasks.filter((t) => t["Due Date"] === today && t.Status.toLowerCase() !== "done");
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    const dueThisWeek = tasks.filter((t) => t["Due Date"] && t["Due Date"] > today && t["Due Date"] <= nextWeek.toISOString().split("T")[0] && t.Status.toLowerCase() !== "done");

    const fmt = (list) => list.length === 0 ? "  (none)" : list.map((t) => `  #${t.ID} | ${t.Task} | ${t["Assigned To"] || "Unassigned"} | ${t.Priority} | Due: ${t["Due Date"] || "N/A"}`).join("\n");

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
    const { isDuplicate } = checkIdempotency("save_standup", { date: getToday() });
    if (isDuplicate) {
      logger.warn("Idempotency guard: duplicate standup save blocked", { requestId });
      return { content: [{ type: "text", text: "Standup already saved for today (dedup guard)." }] };
    }

    const { sheets: sheetsApi } = await getAuth();
    const today = getToday();

    if (!fs.existsSync(CONFIG.STANDUP_DIR)) fs.mkdirSync(CONFIG.STANDUP_DIR, { recursive: true });
    const filepath = path.join(CONFIG.STANDUP_DIR, `standup-${today}.md`);
    fs.writeFileSync(filepath, args.report_markdown);

    await sheetsApi.spreadsheets.values.append({
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      range: CONFIG.STANDUP_RANGE,
      valueInputOption: "RAW",
      requestBody: { values: [[today, args.done_summary, args.in_progress_summary, args.blocked_summary, String(args.overdue_count), args.ai_summary]] },
    });

    logger.info("Standup report saved", { requestId, filepath });
    return { content: [{ type: "text", text: `Standup report saved!\n📄 Local: ${filepath}\n📊 Sheet: New row in "Standup Log"` }] };
  }

  if (name === "read_standup_history") {
    const { sheets: sheetsApi } = await getAuth();
    const res = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      range: CONFIG.STANDUP_RANGE,
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return { content: [{ type: "text", text: "No standup history yet." }] };

    const headers = rows[0];
    const entries = rows.slice(1).map((row) => {
      const entry = {};
      headers.forEach((h, i) => { entry[h] = row[i] || ""; });
      return entry;
    });

    const formatted = entries.map(
      (e) => `📅 ${e.Date}\n  Done: ${e.Done}\n  In Progress: ${e["In Progress"]}\n  Blocked: ${e.Blocked}\n  Overdue: ${e.Overdue}\n  Summary: ${e.Summary}`
    ).join("\n\n");

    return { content: [{ type: "text", text: `Standup History (${entries.length} entries):\n\n${formatted}` }] };
  }

  throw new Error("Unknown tool: " + name);
}

// ===== SERVER STARTUP =====
const transport = new StdioServerTransport();
server.connect(transport).catch((err) => {
  logger.error("Failed to connect server", { error: err.message });
  process.exit(1);
});

logger.info("MCP Task Orchestrator v2.0.0 is running");
