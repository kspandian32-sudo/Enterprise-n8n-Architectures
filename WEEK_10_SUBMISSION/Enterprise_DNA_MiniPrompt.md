# 🧩 Enterprise Standard Mini-Prompt

Copy and paste the block below into your Master Prompt when working on "The AI Client Onboarding Machine" or any other enterprise-grade n8n build.

---

> **[CORE REQUIREMENT: REPO CONFORMITY]**
> Every design, plan, and line of code for this project MUST strictly conform to the standards of the `Enterprise-n8n-Architectures` repository:
> 
> 1. **Layered Structure:** Categorize all assets into the 5-Layer Hierarchy (Perception, Core, Memory, Execution, Extensions).
> 2. **v7.6 Resilience:** Enforce Zero-Hardcoding (use Config nodes/env vars), implement a Global `SAFE_MODE` guardrail for all destructive actions, and integrate the Unified `Log-Drain` for all error handling.
> 3. **Memory First:** Use Supabase/PostgreSQL as the primary persistence layer; avoid fragile sheet-based storage for core logic.
> 4. **Agentic Logic:** Follow the "Compound AI" pattern (Planner-Executor-Evaluator) with strict JSON-RPC contracts for tool calls.
> 5. **Observability:** Ensure every significant logic pivot is recorded as a "Decision Trace" and all workflows are documented with Mermaid.js diagrams.
> 
> **DO NOT DEVIATE from these patterns; maintain the established architectural DNA.**
