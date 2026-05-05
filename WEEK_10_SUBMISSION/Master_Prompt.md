# 🏥 WEEK 10 — The AI Client Onboarding Machine
## ANTIGRAVITY MASTER PROMPT

> **System Identity**: You are Antigravity, an enterprise-grade AI automation architect. You are executing the Week 10 submission for "The AI Client Onboarding Machine" — a 26-node, 3-flow n8n agency operating system that transforms a single form submission into a complete client onboarding experience.

---

## 📋 MISSION BRIEF

Build and deliver a production-grade **AI Client Onboarding Machine** that replaces an entire agency operations team. The system must:

1. Accept a single form submission with 9 fields (client name, company, email, service, requirements, budget, agency name, your name, your email)
2. Look up the selected service from a **Service Database** (8 packaged services with SOPs, deliverables, tools, pricing, prerequisites)
3. Use **Gemini 2.5 Flash AI** to generate a complete, customized project plan grounded in exact database deliverables and SOP steps
4. Log the full onboarding record to a **CRM Summary Sheet** with serialized service + plan payloads
5. Expand deliverables into individual **Project Tracker** rows (one row per deliverable with status, owner, week, approval fields)
6. Render a **premium dark-themed HTML onboarding email** with 10 visual sections (roadmap timeline, workflow diagram, SOP steps, deliverables table, prerequisites checklist, payment schedule, communication plan, success metrics, warranty, next step)
7. Send the email to the client via **Gmail**
8. Send an **internal agency copy** with full project overview, deliverables, SOPs, payment schedule, prerequisites, and communication plan
9. Run a **Daily Kickoff Follow-Up** (Flow B) — scheduled at 10 AM, checks for clients 2+ days since welcome email, uses Gemini 2.0 Flash to write a personalized follow-up, sends it, updates CRM status
10. Run a **Weekly Monday Check-In** (Flow C) — scheduled every Monday, fetches active clients, calculates project week number, uses Gemini 2.0 Flash for weekly update email, logs communication to Sheets

---

## 🏗️ ARCHITECTURE SPECIFICATION

### Three-Flow Design

```
FLOW A: Primary Onboarding Pipeline (Form → AI Plan → CRM → Email)
┌─────────────────────────────────────────────────────────────────────┐
│ 📋 New Client Form (9 fields)                                      │
│   → 🔧 Parse Client Details                                       │
│   → 📥 Read Service from Database (Google Sheets lookup)           │
│   → 🔀 Merge Client + Service Data                                │
│   → 🤖 Gemini 2.5 Flash: Build Project Plan from SOPs             │
│   → 🔀 Parse Project Plan (with fallback logic)                   │
│   → ┌─ 📊 Log Client Summary (CRM append)                        │
│     ├─ 📊 Expand Deliverables → 📝 Log Deliverables Tracker      │
│     └─ 📝 Build HTML Client Email                                 │
│        → 📧 Send Onboarding Email to Client                       │
│        → 📧 Send Copy to Agency (internal)                        │
└─────────────────────────────────────────────────────────────────────┘

FLOW B: Delayed Kickoff Follow-Up
┌─────────────────────────────────────────────────────────────────────┐
│ ⏰ Daily 10 AM Schedule Trigger                                    │
│   → 📥 Fetch 'Welcome Email Sent' Clients                         │
│   → 🔍 Filter: 2+ Days Since Welcome                              │
│   → 🤖 Gemini 2.0 Flash: Write Follow-Up Email                    │
│   → 🔀 Parse Follow-Up Email (with fallback)                      │
│   → 📧 Send Kickoff Reminder                                      │
│   → 📝 Update CRM → Reminder Sent                                 │
└─────────────────────────────────────────────────────────────────────┘

FLOW C: Weekly Client Check-In
┌─────────────────────────────────────────────────────────────────────┐
│ ⏰ Every Monday Schedule Trigger                                   │
│   → 📥 Fetch All Active Clients                                   │
│   → 🔢 Calculate Week Number (from onboarding date)               │
│   → 🤖 Gemini 2.0 Flash: Write Check-In Email                     │
│   → 🔀 Parse Check-In Email (with fallback)                       │
│   → 📧 Send Weekly Check-In                                       │
│   → 📝 Log to Communications                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Node Inventory (26 Nodes)

| # | Node | Type | Function |
|---|------|------|----------|
| 1 | 📋 New Client Form | formTrigger v2.2 | 9-field onboarding intake |
| 2 | 🔧 Parse Client Details | Code (JS) | Sanitize/normalize form inputs |
| 3 | 📥 Read Service from Database | Google Sheets | Lookup service by name from Services tab |
| 4 | 🔀 Merge Client + Service Data | Code (JS) | Combine client + service into unified payload |
| 5 | 🤖 Gemini: Build Project Plan | HTTP Request | Gemini 2.5 Flash generates structured project plan JSON |
| 6 | 🔀 Parse Project Plan | Code (JS) | Parse AI JSON with database-grounded fallback |
| 7 | 📊 Log Client Summary | Google Sheets | Append full onboarding record to Summary tab |
| 8 | 📊 Expand Deliverables | Code (JS) | Convert deliverables array into individual tracker rows |
| 9 | 📝 Log Deliverables Tracker | Google Sheets | Append one row per deliverable to Client_Projects_Tab |
| 10 | 📝 Build HTML Client Email | Code (JS) | Render premium dark-themed HTML with 10 visual sections |
| 11 | 📧 Send Onboarding Email | Gmail | Send HTML package to client |
| 12 | 📧 Send Copy to Agency | Gmail | Internal agency copy with full project details |
| 13 | ⏰ Daily 10 AM Trigger | scheduleTrigger | Fires daily for follow-up checks |
| 14 | 📥 Fetch Welcome Email Clients | Google Sheets | Read clients from CRM |
| 15 | 🔍 Filter: 2+ Days | Code (JS) | Time-based filter for follow-up eligibility |
| 16 | 🤖 Gemini: Follow-Up Email | HTTP Request | Gemini 2.0 Flash writes personalized reminder |
| 17 | 🔀 Parse Follow-Up Email | Code (JS) | Parse with fallback |
| 18 | 📧 Send Kickoff Reminder | Gmail | Send follow-up to client |
| 19 | 📝 Update CRM → Reminder Sent | Google Sheets | Update client status |
| 20 | ⏰ Every Monday Trigger | scheduleTrigger | Fires weekly for check-ins |
| 21 | 📥 Fetch All Active Clients | Google Sheets | Read active clients |
| 22 | 🔢 Calculate Week Number | Code (JS) | Compute project week from onboarding date |
| 23 | 🤖 Gemini: Check-In Email | HTTP Request | Gemini 2.0 Flash writes weekly update |
| 24 | 🔀 Parse Check-In Email | Code (JS) | Parse with fallback |
| 25 | 📧 Send Weekly Check-In | Gmail | Send weekly update to client |
| 26 | 📝 Log to Communications | Google Sheets | Log communication record |

---

## 📊 SERVICE DATABASE (8 Packaged Services)

The system draws from a structured service catalog — the "brain" of the onboarding machine:

| ID | Service | Timeline | Price Range (INR) | Deliverables |
|----|---------|----------|-------------------|--------------|
| SRV-001 | AI Chatbot Setup | 2 Weeks | 25,000–50,000 | 10 deliverables |
| SRV-002 | Workflow Automation | 3 Weeks | 30,000–75,000 | 9 deliverables |
| SRV-003 | AI Voice Agent | 3 Weeks | 40,000–1,00,000 | 10 deliverables |
| SRV-004 | Lead Generation System | 2 Weeks | 20,000–60,000 | 10 deliverables |
| SRV-005 | Content Automation | 4 Weeks | 35,000–80,000 | 10 deliverables |
| SRV-006 | AI Video Production | 3 Weeks | 30,000–90,000 | 9 deliverables |
| SRV-007 | AI Customer Support | 4 Weeks | 50,000–1,20,000 | 10 deliverables |
| SRV-008 | Full AI Transformation | 8 Weeks | 1,50,000–3,50,000 | 10 deliverables |

Each service entry includes: Description, Deliverables (pipe-separated), SOP Steps (pipe-separated), Default Timeline, Tools Used, Price Range, Prerequisites From Client.

---

## 🧬 ENTERPRISE DNA CONFORMITY

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

---

## 🎯 DELIVERABLES CHECKLIST

### Required Outputs

| # | Deliverable | Format | Status |
|---|-------------|--------|--------|
| 1 | Deployed n8n Workflow | JSON + Live instance | ✅ |
| 2 | Master Prompt Document | Markdown (.md) | ✅ (this document) |
| 3 | Template Matching & Enhancement Report | Markdown (.md) | ✅ |
| 4 | Service Database | CSV | ✅ |
| 5 | Client Onboarding Data (Summary + Projects) | CSV | ✅ |
| 6 | Presentation Deck | PPTX | ✅ |
| 7 | Enterprise DNA Mini-Prompt | Markdown (.md) | ✅ |
| 8 | Repository Standards Audit | Markdown (.md) | ✅ |
| 9 | Weekly Submission Answers | Text (.txt) | ✅ |
| 10 | Setup & Deployment Guide | Markdown (.md) | ✅ |
| 11 | AI Learning Machine Analysis (reference) | Markdown (.md) | ✅ |

---

## 🔧 EXECUTION INSTRUCTIONS

### Phase 1 — Deploy to n8n
1. Import `🏥 AI Client Onboarding.json` to local n8n instance
2. Connect Google Sheets OAuth2 credentials
3. Connect Gmail OAuth2 credentials
4. Connect Gemini API key via HTTP Query Auth credential
5. Verify all 26 nodes are present and connected
6. Run auto-fix for typeVersion upgrades and expression format issues

### Phase 2 — Configure Data Layer
1. Create Google Sheet "Onboarding Clients" with tabs: Summary, Services, Client_Projects_Tab, Communications
2. Populate Services tab with all 8 service records from `Onboarding Clients - Services.csv`
3. Verify column headers match workflow expectations
4. Update placeholder sheet IDs (`REPLACE_ONBOARDING_SHEET_ID`, `REPLACE_COMMUNICATIONS_TAB_GID`) in Flow B and Flow C nodes

### Phase 3 — Test End-to-End
1. Submit test client via the form trigger
2. Verify: CRM log created, deliverables expanded, HTML email sent, agency copy sent
3. Wait 2+ days (or adjust filter) to verify Flow B kickoff reminder
4. Wait for Monday to verify Flow C weekly check-in (or test manually)

### Phase 4 — Enterprise Hardening
1. Add Error Trigger workflow for admin alerting
2. Implement Safe Mode gate before email send nodes
3. Connect to centralized Log-Drain (ID: `FEK7PNwR6I3XZygD`)
4. Upgrade all nodes to latest typeVersions
5. Replace hardcoded email addresses with environment variables

---

## 📈 VALUE PROPOSITION

### Paid Tools Replaced (Zero-Cost Hack)
- **HubSpot/Salesforce CRM** (₹3,500–₹12,000/month) → Google Sheets structured CRM
- **Monday.com/Asana PM** (₹2,000–₹8,000/month) → Deliverables tracker with auto-expansion
- **Mailchimp/SendGrid** (₹1,000–₹5,000/month) → Gmail + Gemini AI personalization
- **PandaDoc/Proposify** (₹1,500–₹4,000/month) → AI-generated premium HTML onboarding package
- **Zapier/Make.com** (₹1,600–₹6,000/month) → Self-hosted n8n (free)

**Total monthly savings: ₹9,600–₹35,000/month**
**Cost per onboarding: ~₹2 (Gemini API cost)**

---

## 🏆 INNOVATIONS BEYOND CURRICULUM

1. **Database-Grounded AI Planning** — Forces Gemini to use EXACT deliverables and SOPs from the service database, eliminating hallucinated scope
2. **Deliverables-to-Tracker Auto-Expansion** — Single onboarding creates N individual task rows for project management
3. **Premium Dark-Themed HTML Email Engine** — 10-section visual onboarding package with gradient headers, timeline nodes, progress bars, workflow diagrams
4. **Three-Flow Lifecycle Architecture** — Not just onboarding, but ongoing follow-up and weekly check-ins
5. **Defensive JSON Parsing** — Every AI parse node has full fallback logic that reconstructs output from database defaults
6. **Internal Agency Copy** — Separate formatted email for the agency with full project details and tracking status
7. **Week-Number-Aware Communication** — Weekly check-ins reference the correct project week number
8. **8-Service Catalog Engine** — One workflow handles all 8 service types by pulling config from the database
9. **Communication Audit Trail** — Every email sent is logged to a Communications tab with type, week, subject, and status

---

*Generated by Antigravity • Week 10 Submission • The AI Client Onboarding Machine*
*Deployed to n8n instance at localhost:5678*
