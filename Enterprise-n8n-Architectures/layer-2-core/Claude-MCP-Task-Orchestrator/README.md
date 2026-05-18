# 🤖 Claude MCP Task Orchestrator (v2.0)

A production-hardened Model Context Protocol (MCP) server that transforms Claude Desktop from a chatbot into an **Autonomous Operator**. This system bridges Claude directly to an **Enterprise Supabase PostgreSQL** database with structured logging, idempotency guards, and environment-based secrets management.

*(Migrated from Google Sheets to Supabase for high-performance ACID compliance).*

## 🔧 Enterprise Engineering Patterns

### 1. Structured Logging with Correlation IDs
Every tool invocation generates a unique `requestId` (UUID v4) that is logged with timestamps and duration metrics to stderr. This enables distributed tracing across multi-agent systems.

```json
{"timestamp":"2026-04-25T04:30:00Z","level":"TOOL","message":"add_task -> SUCCESS","requestId":"a1b2c3d4-...","durationMs":342}
```

### 2. Environment-Based Secrets Management
All sensitive configuration is injected via environment variables — never hardcoded:
- `SUPABASE_DB_URL` — Database connection string (Postgres URI)
- `MCP_STANDUP_DIR` — Local standup report directory

### 3. Connection Pooling & Resiliency
Uses the `pg` driver's native `Pool` capabilities to handle concurrent connections efficiently, with a "fail-fast" boot sequence that immediately exits if the database is unreachable, saving hours of debugging.

### 4. Idempotency Guards
Write operations (`add_task`, `write_file`, `save_standup_report`) are protected by a SHA-256 payload hash with a 5-second deduplication window. This prevents double-writes caused by LLM retry behavior.

## 🛠️ Included Tools (11)

| Category | Tools | Description |
|:---|:---|:---|
| **File I/O** | `read_file`, `write_file`, `list_files` | Local filesystem management |
| **Task Manager** | `add_task`, `list_tasks`, `update_task` | Smart CRUD operations natively executed in Postgres |
| **Risk Detection** | `get_overdue_tasks`, `get_task_summary` | Automated overdue flagging using Postgres Aggregate functions |
| **Standup Reporter** | `generate_standup_data`, `save_standup_report`, `read_standup_history` | AI-driven daily report generation backed by the `standup_log` table |

## 📊 Infrastructure Cost Efficiency

| Traditional Stack | This Build | Monthly Savings |
|:---|:---|:---|
| Claude API (pay-per-token) | Claude Desktop Free Tier | ₹2,000–5,000 |
| Notion AI / ClickUp AI | Supabase (Free Tier) | ₹1,500–5,000 |
| Dedicated Task Management SaaS | Custom MCP Server (Node.js) | ₹2,000–3,000 |
| **Total** | **Zero recurring cost** | **₹5,500–13,000/mo** |

## 🚀 Setup

### Prerequisites
- Node.js 18+
- Supabase Project (Postgres)
- Claude Desktop with MCP support

### Installation
```bash
npm install
```

### Configuration
Create a `.env` file in the root directory:
```env
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

### Database Schema
Run the provided `setup.sql` in your Supabase SQL Editor to create the necessary tables (`tasks` and `standup_log`).

### Claude Desktop Configuration
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "mcp-tools": {
      "command": "node",
      "args": ["path/to/src/server.js"],
      "env": {}
    }
  }
}
```
*(Note: Because the server reads directly from `.env`, you do not need to expose your database URL directly inside the Claude config file).*

## 🏗️ Architecture Decision Records

### Why Supabase PostgreSQL over Google Sheets?
Google Sheets was initially chosen as a low-code visual dashboard. However, as the autonomous orchestrator scales, it requires high-performance write speeds, concurrent read locks, and aggregate query capabilities (`COUNT`, `GROUP BY`). Migrating to Supabase provides absolute ACID compliance while preventing the Node.js process from parsing heavy JSON arrays in memory.

### Why Stdio over HTTP?
MCP's Stdio transport is the standard for Claude Desktop integration. It provides zero-latency local communication without the overhead of HTTP server management, port conflicts, or TLS configuration.

---
*Part of the [Enterprise n8n Architectures](https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures) portfolio.*
