# 🏆 Enterprise-n8n-Architectures: The "Gold Standard" Suite

Welcome to the production repository for **Pure Remedy Solutions — Mission Control**. This suite represents a professional-grade, modular n8n architecture designed for high-integrity agency operations.

---

## 🏗️ The "Gold Standard" Modular Architecture

We have moved beyond fragile, single-file automations to a **7-Component Modular System** utilizing advanced **Sub-workflow Delegation**.

### 📦 Core Modular Engines
1.  **🏥 Onboarding Engine (v7.6 Gold)**: The primary client intake processor. Generates comprehensive project plans using **Gemini 2.5 Flash**.
2.  **🏥 Follow-Up Engine (Modular)**: Automated multi-touch lead nurturing with intelligent sentiment detection.
3.  **🏥 Weekly Check-In Engine (Modular)**: Batch-processes all active clients to send high-end, responsive HTML status reports.
4.  **🏥 Offboarding Trigger (Modular)**: The "Scheduler" engine that identifies completed projects and delegates actions to the Completion engine.
5.  **🛡️ Global Error Handler (Standardized)**: The centralized safety net that sends real-time Telegram alerts for any node failure.
6.  **🛡️ Completion Logic (Standardized)**: The "Action" engine. Handles AI reporting, final email delivery, and CRM archiving.
7.  **🛡️ Log-Drain Registry**: The value-tracking hub. Records **ROI (Minutes Saved)** directly to Supabase for automated reporting.

---

## 💎 Key Enterprise Upgrades

### 1. Advanced Sub-workflow Delegation (Trigger -> Action)
We have implemented a decoupled architecture where scheduling/triggering is separated from logic/execution. This allows for centralized maintenance and 100% logic reuse across the suite.

### 2. The Compound AI "Evaluator" Pattern
Unlike basic automation, this system uses a **Planner -> Evaluator** loop. Every project plan is audited by a secondary `🛡️ Evaluator: Sanity Check` node for budget mismatches and tone compliance before dispatch.

### 3. Google Sheets V4.7 "Production" Hardening
The entire suite utilizes the latest **n8n Google Sheets V4.7** engine with explicit Resource Mapper schemas. This prevents metadata lookup errors and ensures high-speed, reliable CRM updates.

### 4. Automated ROI Tracking (Empirical Value)
Every successful execution records the precise minutes of human labor saved (e.g., 120 mins per Onboarding). This turns technical automation into a measurable financial asset.

---

## 🛠️ Setup & Deployment

### 🔑 Verified Production Credentials
Ensure your n8n instance has these specific IDs mapped:
- **Google Sheets**: `hiWj9Xv9QRzG92uS`
- **Gemini API**: `1jdjTjj9aaTK6i6Y`
- **Gmail SMTP**: `udtIzlJq8iqmL3aZ`
- **Log-Drain Registry**: `FEK7PNwR6I3XZygD`

### ⚙️ Operational Protocols
- **Safe Mode**: Toggle `SAFE_MODE=true` in your `.env` to simulate emails without dispatching.
- **CLI Import**: For maximum stability, import via n8n CLI:
  ```bash
  docker exec -i n8n n8n import:workflow --input=/tmp/workflow.json
  ```

---

**Architect**: Pandian K S  
**Brand**: Pure Remedy Solutions  
**Status**: 🟢 Production Stable (v7.6 Gold)
