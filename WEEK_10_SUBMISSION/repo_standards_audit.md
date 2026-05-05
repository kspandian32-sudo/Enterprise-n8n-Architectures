# 🛡️ Repository Standards Audit: Enterprise n8n Architectures

This report distills the architectural DNA and operational standards maintained in the `kspandian32-sudo/Enterprise-n8n-Architectures` repository. These standards are mandatory for all new builds to ensure compatibility with the existing ecosystem.

## 1. Structural Standards (The 5-Layer Hierarchy)
All projects must be categorized into one of the five functional layers:
- **Layer 1 (Perception):** Ingestion nodes (Webhooks, Scanners, Listeners).
- **Layer 2 (Core):** AI Planning, Prompt libraries, and Logic Orchestration.
- **Layer 3 (Memory):** Database schemas (Supabase/Postgres), Vector stores, and Execution logs.
- **Layer 4 (Execution):** The "Workhorses." Specific solution workflows (e.g., Onboarding, Auditing).
- **Layer 5 (Extensions):** Custom Node.js code, bridges, or external tool integrations.

## 2. The "v7.6 Resilient" Standard
This is the highest internal standard for production stability. Every workflow MUST implement:
- **Zero-Hardcoding Policy:** No API keys, Chat IDs, or URLs in node parameters. Use environment variables (`$env`) or a `🔧 Configuration` node at the start of the workflow.
- **Global SAFE_MODE Branch:** Every destructive action (sending email, writing to DB, publishing) must be gated by an `🛡️ IF: Safe Mode?` node connected to a global environment flag.
- **Unified Log-Drain:** Every workflow must contain an Error Trigger or a sub-workflow call that pipes data to the centralized `Log-Drain` (ID: `FEK7PNwR6I3XZygD`) for Telegram alerts and Supabase logging.

## 3. Intelligence & Agentic Patterns
- **Compound AI Architecture:** Design systems as a loop of specialized roles (Planner -> Executor -> Evaluator).
- **JSON-RPC Determinism:** AI tools must interact via strict, typed JSON-RPC interfaces to minimize "hallucinated" parameters.
- **Decision Tracing:** Log not just the output, but the *reasoning path* (Decision Traces) to provide "Proof of Cognition."

## 4. Documentation & Identity
- **Mermaid Visualization:** Every major workflow or layer must have a corresponding Mermaid.js diagram in its README.
- **Badge Observability:** Use status badges for Audit Scores and Live Portal status.
- **ROI Tracking:** Maintain a table of "Manual vs. Automated" time/cost savings for every major solution.

## 5. Technical Stack Consistency
- **Persistence:** Supabase/PostgreSQL is the primary source of truth. Google Sheets is strictly for "Zero-Infrastructure Bootstrapping."
- **Alerting:** Telegram is the mandatory real-time alert channel.
- **Deployment:** Must be Docker-Compose ready for horizontal scaling (Queue-mode).
