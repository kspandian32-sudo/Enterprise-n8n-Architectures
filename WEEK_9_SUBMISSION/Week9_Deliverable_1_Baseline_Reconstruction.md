# Deliverable 1 — Baseline Workflow Reconstruction

## 🏗️ The Enterprise Dual-Workflow Architecture
The **AI Influencer Factory v3** has been evolved into a two-tier enterprise system. This architecture separates the **heavy generation** (Engine) from the **autonomous delivery** (Publisher).

---

## 🏎️ Tier 1: The Main Engine
**Goal:** Generate 100% of the influencer identity and 30-day strategy from a single form submission.

### Node-by-Node Reconstruction
| # | Node Name | Node Type | Version | Purpose | Data In | Data Out |
|---|-----------|-----------|---------|---------|---------|----------|
| 1 | 🗓️ Trigger: Form | formTrigger | 2.2 | 10-field intake form for persona definition. | User submission | Raw form fields |
| 2 | ⚙️ Global Config | code | 2 | Centralized IDs and Safe Mode toggle. | Trigger data | Config object |
| 3 | 🤖 AI: Profile | openAi | 1.8 | GPT-4o-mini identity generation. | Form data | Character JSON |
| 4 | 🤖 AI: 30-Day Calendar | openAi | 1.8 | GPT-4o-mini content strategy generation. | Profile data | Calendar JSON |
| 5 | 🔧 Data: Normalize | code | 2 | Defensive parsing and syntax sanitization. | AI response | Clean JSON |
| 6 | 💾 Memory: Log Master | googleSheets | 4.7 | Persistent logging of persona identity. | Normalized data | Master Row |
| 7 | 🔧 Data: Expand Calendar | code | 2 | Batch expansion of 30-day array. | Master log data | 30 Items |
| 8 | 💾 Memory: Log Calendar | googleSheets | 4.7 | Persistent logging of content schedule. | 30 day items | Calendar Rows |
| 9 | 🚀 Execute: Send Email | emailSend | 2.1 | Automated delivery of the "Mega Package." | Master log data | SMTP status |
| 10 | 📝 Log: Start | httpRequest | 4.4 | Telemetry: Pipeline initialization. | Trigger data | Log status |
| 11 | 📝 Log: Success | httpRequest | 4.4 | Telemetry: Pipeline completion signal. | Final status | Log status |

---

## 📡 Tier 2: The Auto-Publisher
**Goal:** Autonomous daily execution, image generation, and social media posting.

### Node-by-Node Reconstruction
| # | Node Name | Node Type | Version | Purpose | Data In | Data Out |
|---|-----------|-----------|---------|---------|---------|----------|
| 1 | 🗓️ Trigger: Schedule | scheduleTrigger | 1.1 | Daily 9:00 AM autonomous trigger. | None | Timestamp |
| 2 | ⚙️ Global Config | code | 2 | Shared constants (Spreadsheet IDs). | Trigger data | Config object |
| 3 | 💾 Memory: Read Calendar | googleSheets | 4.7 | Fetches all pending posts for processing. | Config data | Full Sheet Data |
| 4 | 🔧 Data: Filter for Today | filter | 2 | Matches current date and "Posted=No" status. | Sheet data | Filtered Rows |
| 5 | ❓ IF: Safe Mode? | if | 2 | Defensive gate to prevent accidental costs. | Config data | Boolean Path |
| 6 | 🤖 AI: Ideogram (MOCK) | httpRequest | 4.4 | **Safe Mode:** Simulates image generation. | Filtered Row | "MOCK_IMG" |
| 7 | 🚀 Execute: Instagram (MOCK) | httpRequest | 4.4 | **Safe Mode:** Simulates social posting. | Mock Image | "MOCK_POSTED" |
| 8 | 💾 Memory: Mark Posted | googleSheets | 4.7 | Updates the sheet to prevent double-posting. | Execution data | Updated Row |

---

## 🛡️ Enterprise Architectural Patterns

1.  **Distributed Autonomy**: By splitting the system into two workflows, we ensure that the **Daily Publisher** can run reliably even if the **Form Engine** is offline or busy.
2.  **Global Resilience (SAFE_MODE)**: Implemented a centralized toggle that allows for "Dry Run" testing of expensive APIs (Ideogram/Instagram) without burning credits.
3.  **Advanced Telemetry Logic**: Integrated HTTP-based log nodes that provide a "Flight Recorder" capability, streaming progress to an external dashboard.
4.  **Defensive Sanitization**: Used custom JS in `Data: Normalize` to strip backslashes, fix double-escaping, and ensure AI outputs never crash the downstream database.
5.  **Schema Alignment**: Ensured 100% parity between n8n JSON structures and Google Sheets column headers for "Zero-Configuration" scaling.
