# AI Influencer Factory — Enterprise Edition

An autonomous content production and publishing system built for professional n8n environments. This solution transforms high-level character briefs into fully-realized 30-day Instagram content plans with automated image generation and scheduling.

## 🏗️ System Architecture

This solution follows the **5-Layer Enterprise n8n Standard**:

1.  **Perception Layer**: 10-field intake form with automated normalization.
2.  **Core Layer**: Cascaded GPT-4o-mini logic for character strategy and content planning.
3.  **Memory Layer**: Dual-tab Google Sheets (v4.7) state management (Master & Calendar).
4.  **Execution Layer**: Direct Ideogram API image generation and Instagram Graph API publishing.
5.  **Extension Layer**: Global Log Drain telemetry and Telegram error alerts.

## 🚀 Key Features

*   **Global Configuration**: Centralized `⚙️ Global Config` node for 10-second environment migration.
*   **Safe Mode Protocol**: Toggle risk-free testing for all execution nodes.
*   **Defensive Parsing**: Regex-based JSON sanitization to handle non-deterministic AI output.
*   **Observability**: Real-time telemetry streamed to external log drains via `📝 Log` nodes.
*   **Closed-Loop Ops**: Moves from "Prompt Kit" to "Autonomous Content Asset Library."

## 🛠️ Hardening & Defensive Logic

To ensure enterprise stability, the following defensive patterns are implemented:

1.  **Strict Type Validation**: All `🛡️ Gate` nodes use strict type checking to prevent null-pointer exceptions during logic branching.
2.  **Telemetry-First Execution**: Telemetry nodes (`📝 Log: Start`, `📝 Log: Success`, etc.) are strategically placed at every major transition to provide real-time visibility into the workflow's state.
3.  **JSON Sanitization**: The `🔧 Data: Normalize` and `🔧 Data: Expand Calendar` nodes include aggressive string-to-JSON cleaning, handling common AI formatting artifacts (like triple-backticks or trailing commas).
4.  **Async-Safe Telemetry**: All HTTP-based logging nodes use fully-qualified URLs derived from `⚙️ Global Config` to prevent workflow-wide trigger failures.

## 🕹️ Operation Strategy: Safe Mode vs. Production

The system includes a built-in "Safe Mode" switch within the `⚙️ Global Config` node.

| Feature | `safeMode = true` (Safety ON) | `safeMode = false` (Production) |
| :--- | :--- | :--- |
| **Engine (Asset Gen)** | AI generates profile & calendar; logs to sheets; sends email. | (Same) |
| **Auto-Publisher** | Reads due posts; marks as "Posted" without calling external APIs. | Calls Ideogram API and Instagram Graph API for real publishing. |
| **Telemetry** | Full logs sent to drain. | Full logs sent to drain. |

**Recommendation**: Keep `safeMode = true` until the character profile and 30-day calendar look perfect in your Google Sheet. Once validated, flip to `false` to enable autonomous content generation and publishing.

## 📁 Repository Structure

*   `workflows/ai_influencer_engine.json`: The core strategy and asset generation engine.
*   `workflows/auto_publisher.json`: The cron-triggered Instagram scheduler.

## 🛠️ Setup Instructions

1.  **Credentials**: Configure OpenAI, Google Sheets (OAuth2), Instagram Graph API, and Ideogram API credentials.
2.  **Configuration**: Update the `⚙️ Global Config` node in both workflows with your Spreadsheet ID and Log Drain URL.
3.  **Safe Mode**: Set `safeMode=true` for initial testing.
4.  **Database**: Ensure your Google Sheet has a `Master` and `Calendar` tab with matching headers.

---
*Aligned with the [Enterprise n8n Architectures](https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures) standards.*
