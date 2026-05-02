# 🚀 Pure Remedy Solutions — Mission Control

Welcome to the central nervous system for **Pure Remedy Solutions**. This repository contains the Next.js monitoring dashboard and the high-integrity **n8n Outreach Automation** blueprints.

---

## 🏗️ Outreach System Architecture

We operate a 5-stage automated outreach and sales engine, hardened for production stability and centralized monitoring.

### 📦 Core Workflows (`/workflows`)
1.  **WF-A — Main Campaign**: The primary engine. Handles lead scoring, AI copy generation (GPT-4o), and SMTP dispatch.
2.  **WF-B — Reply & Bounce**: Monitor's Gmail for replies and bounces. Updates the CRM in real-time and alerts via Telegram.
3.  **WF-C — Breakup**: The final automated touchpoint. Routes "Interested" leads to the dashboard and closes cold threads.
4.  **Autopilot — Proposals**: End-to-end proposal and invoice generation using Google Slides and PDF automation.
5.  **Log-Drain — Centralized**: The safety net. A sub-workflow that captures errors from all other engines and logs them to Supabase + Telegram.
6.  **Layer-1: Lead Intake**: Connects the landing page form to Supabase and Telegram. Supports 10 normalized fields.

---

## 🌐 Pandian AI Landing Page (`/landing-page`)

The public-facing frontend for lead generation, optimized for conversion and high-integrity data capture.

- **URL**: [https://pandian-ai.com](https://pandian-ai.com)
- **Tech Stack**: Vite, React, Tailwind CSS, Framer Motion.
- **Lead Intake**: Custom 10-field form (FullName, Email, Company, Industry, ProjectType, Budget, Timeline, Phone, Goal, TechStack).
- **Integration**: Asynchronous POST to n8n `layer-1-perception` webhook.

### Building the Landing Page
```bash
cd landing-page
npm install
npm run build
```
The output will be in `landing-page/dist/`, which is ready for deployment to Hostinger or any static host.

---

## 🛠️ Setup & Environment

To deploy or update these workflows, ensure your `n8n.env` (or local environment) contains the following keys:

### 🔑 Credentials Required
- **OpenAI**: `OPENAI_API_KEY` (Used for intent classification and copy generation).
- **Telegram**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (Used for real-time alerts).
- **Supabase**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Used for persistent memory and logging).
- **Google Cloud**: OAuth2 credentials for Sheets and Gmail.
- **SMTP**: For high-deliverability email dispatch.

### ⚙️ Operational Flags
- `SAFE_MODE`: Set to `true` to simulate email sends without actually hitting recipients.
- `N8N_BRAND_PERSONA`: Defines the AI's "Voice of Founder" for memory and responses.

---

## 🚦 Monitoring & Debugging

All workflows are connected to the **Log-Drain**. If a node fails:
1.  A surgical error report is sent to the **Telegram Admin Channel**.
2.  The error is permanently logged in the `execution_logs` table in Supabase.
3.  The Mission Control dashboard (this Next.js app) visualizes the overall health.

### Running the Dashboard
```bash
npm run dev
```

---

## 📜 Maintenance
Workflows should be updated by exporting the JSON from n8n and overwriting the files in the `workflows/` directory. Always ensure `typeVersion` compatibility when migrating n8n instances.

**Founder's Note**: Lead with the answer, follow with context. Keep the brand vault growing. 🌿

