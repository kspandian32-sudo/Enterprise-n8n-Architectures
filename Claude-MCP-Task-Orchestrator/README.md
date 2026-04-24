# 🤖 Claude MCP Task Orchestrator (v2.0)

A production-hardened Model Context Protocol (MCP) server that transforms Claude Desktop from a chatbot into an **Autonomous Operator**. This system bridges Claude directly to Google Sheets with structured logging, idempotency guards, and environment-based secrets management.

## 🔧 Enterprise Engineering Patterns

### 1. Structured Logging with Correlation IDs
Every tool invocation generates a unique `requestId` (UUID v4) that is logged with timestamps and duration metrics to stderr. This enables distributed tracing across multi-agent systems.

```json
{"timestamp":"2026-04-25T04:30:00Z","level":"TOOL","message":"add_task -> SUCCESS","requestId":"a1b2c3d4-...","durationMs":342}
```

### 2. Environment-Based Secrets Management
All sensitive configuration is injected via environment variables — never hardcoded:
- `MCP_SPREADSHEET_ID` — Target Google Sheet
- `GOOGLE_APPLICATION_CREDENTIALS` — Path to service account JSON
- `MCP_STANDUP_DIR` — Local standup report directory

### 3. Idempotency Guards
Write operations (`add_task`, `write_file`, `append_sheet_row`, `save_standup_report`) are protected by a SHA-256 payload hash with a 5-second deduplication window. This prevents double-writes caused by LLM retry behavior.

### 4. Performance Timing
Every tool call logs its execution duration in milliseconds, enabling performance profiling and SLA monitoring.

## 🛠️ Included Tools (14)

| Category | Tools | Description |
|:---|:---|:---|
| **File I/O** | `read_file`, `write_file`, `list_files` | Local filesystem management |
| **Sheets (Raw)** | `read_sheet`, `append_sheet_row`, `update_sheet_cell` | Direct Google Sheets API access |
| **Task Manager** | `add_task`, `list_tasks`, `update_task` | Smart CRUD with auto-ID assignment |
| **Risk Detection** | `get_overdue_tasks`, `get_task_summary` | Automated overdue flagging and dashboards |
| **Standup Reporter** | `generate_standup_data`, `save_standup_report`, `read_standup_history` | AI-driven daily report generation |

## 📊 Infrastructure Cost Efficiency

| Traditional Stack | This Build | Monthly Savings |
|:---|:---|:---|
| Claude API (pay-per-token) | Claude Desktop Free Tier | ₹2,000–5,000 |
| Notion AI / ClickUp AI | Google Sheets (free API) | ₹1,500–5,000 |
| Dedicated Task Management SaaS | Custom MCP Server (Node.js) | ₹2,000–3,000 |
| **Total** | **Zero recurring cost** | **₹5,500–13,000/mo** |

## 🚀 Setup

### Prerequisites
- Node.js 18+
- Google Cloud service account with Sheets API access
- Claude Desktop with MCP support

### Installation
```bash
npm install
```

### Claude Desktop Configuration
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "mcp-tools": {
      "command": "node",
      "args": ["path/to/src/server.js"],
      "env": {
        "MCP_SPREADSHEET_ID": "your-spreadsheet-id",
        "GOOGLE_APPLICATION_CREDENTIALS": "path/to/service-account.json"
      }
    }
  }
}
```

## 🏗️ Architecture Decision Records

### Why Google Sheets over Postgres?
Google Sheets was chosen deliberately as the **human-facing dashboard layer**. For write-heavy production loads (>300 writes/min), the recommended upgrade path is Supabase (already used in the Infinite Memory Vault project) with Sheets as a read-only sync target.

### Why Stdio over HTTP?
MCP's Stdio transport is the standard for Claude Desktop integration. It provides zero-latency local communication without the overhead of HTTP server management, port conflicts, or TLS configuration.

---
*Part of the [Enterprise n8n Architectures](https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures) portfolio.*
