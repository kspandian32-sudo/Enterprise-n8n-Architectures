# Data Layer Migration Guide: Google Sheets → PostgreSQL / Supabase

> This document provides a concrete migration path from the current Google Sheets data layer to a production-grade PostgreSQL backend. Google Sheets is used intentionally as a **zero-infrastructure bootstrap layer** — it provides a human-readable dashboard with zero hosting cost. This is a deliberate architectural tradeoff, not a permanent decision.

## Why Sheets Works for SMB Scale

| Dimension | Google Sheets | Acceptable For |
|:---|:---|:---|
| Read throughput | 100 requests / 100 seconds | < 50 concurrent users |
| Write throughput | 100 requests / 100 seconds | < 300 writes/minute |
| Data volume | 10M cells per spreadsheet | < 100K rows |
| Cost | Free (Google Workspace) | Bootstrapping / PoC |
| Human readability | Native spreadsheet UI | Non-technical stakeholders |

This makes Sheets a valid choice for the WhatsApp Bot, Signal Pipeline, and Auto-Blogger at SMB scale (< 1,000 daily operations).

## When to Migrate

Migrate to PostgreSQL/Supabase when **any** of these thresholds are reached:

- **Write volume** exceeds 200 operations/minute sustained
- **Data rows** exceed 50,000 per sheet tab
- **Concurrent users** exceed 10 with write access
- **Compliance** requires ACID transactions or tamper-evident audit logs
- **Query complexity** requires JOINs, aggregations, or full-text search

## Target Architecture

```
┌─────────────────────────────────────────────────┐
│                n8n Workflows                     │
│  (Invoice Auditor, Lead Gen, Signal Pipeline)    │
├──────────────┬──────────────────────────────────┤
│   WRITE PATH │            READ PATH             │
│      ▼       │                ▼                  │
│  Supabase    │     Google Sheets (Sync Target)   │
│  PostgreSQL  │     ← pg_notify / Sheets API      │
│              │                                    │
│  • ACID txns │     • Human-readable dashboard     │
│  • Row locks │     • Stakeholder sharing           │
│  • pgvector  │     • No SQL knowledge needed       │
│  • Audit log │     • Real-time pivot tables         │
└──────────────┴──────────────────────────────────┘
```

## Migration Steps

### Phase 1: Supabase Setup (30 minutes)
```sql
-- Create the task management schema (MCP Orchestrator)
CREATE TABLE tasks (
  id          SERIAL PRIMARY KEY,
  task        TEXT NOT NULL,
  assigned_to TEXT DEFAULT '',
  status      TEXT DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Done', 'Blocked')),
  priority    TEXT DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit log with tamper evidence
CREATE TABLE audit_log (
  id          SERIAL PRIMARY KEY,
  table_name  TEXT NOT NULL,
  operation   TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  row_id      INTEGER NOT NULL,
  old_data    JSONB,
  new_data    JSONB,
  changed_by  TEXT DEFAULT 'system',
  changed_at  TIMESTAMPTZ DEFAULT NOW(),
  checksum    TEXT GENERATED ALWAYS AS (
    encode(sha256((old_data::text || new_data::text || changed_at::text)::bytea), 'hex')
  ) STORED
);

-- Auto-populate audit log
CREATE OR REPLACE FUNCTION audit_trigger() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, row_id, old_data, new_data, changed_by)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    current_setting('app.current_user', true)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_audit AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

### Phase 2: n8n Node Swap (Per Workflow)
Replace Google Sheets nodes with Postgres nodes:

```diff
- Node: n8n-nodes-base.googleSheets (Read/Append)
+ Node: n8n-nodes-base.postgres (Execute Query)

- Credentials: googleSheetsOAuth2Api
+ Credentials: postgres (Supabase connection string)

- Parameters: { sheetId: "...", range: "Sheet1!A:F" }
+ Parameters: { query: "SELECT * FROM tasks WHERE status = $1", values: ["To Do"] }
```

### Phase 3: Sheets as Read-Only Dashboard (Optional)
Keep Google Sheets as a stakeholder-facing view by syncing from Postgres:

```javascript
// n8n Code Node: Sync Postgres → Sheets (run on schedule)
const tasks = $input.all().map(item => item.json);
const rows = tasks.map(t => [t.id, t.task, t.assigned_to, t.status, t.priority, t.due_date]);
// Clear and re-populate the Sheets tab
return [{ json: { values: rows } }];
```

## Project-Specific Notes

| Project | Current Data Layer | Migration Priority | Notes |
|:---|:---|:---|:---|
| MCP Orchestrator | Google Sheets | **High** | Replace with Supabase; already uses env-based config |
| Invoice Vision Auditor | Google Sheets | **High** | Benefits from ACID for financial data integrity |
| AI Lead Gen Machine | Google Sheets | **Medium** | CRM data; Supabase enables proper relational modeling |
| Signal Pipeline | Google Sheets | **Medium** | Already has pgvector in Infinite Memory Vault — reuse |
| Infinite Memory Vault | **Supabase (pgvector)** | ✅ Already done | This project already demonstrates the target pattern |
| WhatsApp Bot Series | Google Sheets | **Low** | Low volume; Sheets is appropriate at current scale |
| Auto-Blogger | Google Sheets | **Low** | < 10 writes/day; Sheets is fine |

---
*This migration can be executed incrementally. Start with the MCP Orchestrator (highest visibility) and the Invoice Auditor (financial compliance requirements).*
