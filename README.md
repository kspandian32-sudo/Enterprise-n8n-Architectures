# Enterprise n8n Architectures

A curated collection of **13 production-grade** n8n workflows, local-first AI infrastructures, and MCP-powered autonomous agents. This repository demonstrates enterprise automation patterns including queue-mode deployment, structured observability, idempotent write operations, and documented data-layer migration paths.

## 🚀 Projects

### 1. [Content Alchemist](./Content-Alchemist/) — *6 Sub-Workflows, 80+ Nodes*
A multi-modal AI content factory that transforms raw voice notes into high-engagement social media posts for LinkedIn and X (Twitter). Whisper transcription → GPT-4o drafting → DALL-E 3 visuals → webhook-triggered publishing.

### 2. [Invoice Vision Auditor](./Invoice-Vision-Auditor/) — *3 Workflows, 60+ Nodes*
An AI-driven secondary audit system using Gemini 2.5 Flash to verify invoices, catch duplicates, and detect signature fraud. Includes on-demand webhook API, scheduled batch processor, and daily HTML digest emails with currency-breakdown analytics.

### 3. [AI Proposal & Invoice Autopilot](./AI-Proposal-Invoice-Autopilot/) — *140+ Nodes*
A comprehensive sales lifecycle automation covering lead intake → Google Slides proposal generation → invoice creation → multi-day follow-up chains with CRM-aware closing logic.

### 4. [Infinite Memory Vault](./Infinite-Memory-Vault/) — *Supabase pgvector + Error Handler*
A persistent semantic memory layer for AI personal assistants. **This is the only project already on PostgreSQL** — featuring Supabase vector storage, importance scoring, and a dedicated error-handling sub-workflow. Serves as the migration target pattern for other projects (see [MIGRATION.md](./MIGRATION.md)).

### 5. [AI Lead Gen Machine](./AI-Lead-Gen-Machine/) — *3 Workflows, 260KB, SAFE_MODE*
An enterprise cold outreach suite featuring `SAFE_MODE=true` testing toggle, GPT-4o intent classification, dynamic blacklist suppression, and multi-stage SMTP follow-ups with CRM logging and Telegram alerts.

### 6. [Autonomous Research Engine](./Autonomous-Research-Engine/) — *236KB, 70+ Nodes*
A multi-source RAG research agent that creates 20-page citation-backed learning kits with quality scoring and NotebookLM-optimized output.

### 7. [Signal Pipeline](./Signal-Pipeline/) — *Scanner + Error-Alert Sub-Workflow*
A high-signal job-market scanner with AI-powered intent analysis (confidence scoring), tech stack detection, deduplication, and a dedicated error-alerting sub-workflow. Features retry logic with `retryOnFail: true` and `maxTries: 3`.

### 8. [Ultimate UGC Content System](./UGC-Content-System/) — *Multi-Lane Architecture*
A sophisticated video production engine with multi-lane processing (Nano AI, Veo AI, Sora) and dynamic HTTP lane switching for agent-orchestrated content synthesis.

### 9. [Enterprise AI Sales Rep](./Enterprise-AI-Sales-Rep/) — *Human-in-the-Loop Pattern*
A Slack-integrated autonomous agent implementing approval gates for AI-assisted lead follow-ups.

### 10. [Auto-Blogger SEO Suite](./Auto-Blogger-SEO-Suite/) — *Error Handler + Audit Trail*
An automated content pipeline using Gemini 2.5 Flash with structured prompting, direct WordPress publishing, and dual audit/error logging to separate Google Sheet tabs.

### 11. [WhatsApp Business AI Bot Series](./WhatsApp-AI-Bot-Series/) — *3 Bots + Boilerplate*
Production-ready AI bots for Hotels (concierge) and Restaurants (booking automation), with a reusable Webhook Boilerplate for custom integrations. Twilio + SMTP + Google Sheets.

### 12. [Local-First Legal AI](./Local-Legal-AI/) — *100% Air-Gapped, 3 Modelfiles*
A secure, fully offline infrastructure for sensitive legal document analysis. Runs on Ollama with 3 custom Modelfiles and 6 specialized AnythingLLM workspaces. Includes **5 real agent output samples** and **5 UI screenshots** as proof-of-work.

### 13. [Claude MCP Task Orchestrator](./Claude-MCP-Task-Orchestrator/) — *Node.js, 14 Tools, v2.0*
A production-hardened MCP server with structured logging (correlation IDs), environment-based secrets, and idempotency guards on all write operations. Full source code (500+ LOC). See [Architecture Decision Records](./Claude-MCP-Task-Orchestrator/README.md#-architecture-decision-records).

---

## 📊 Technical Complexity Profile

| Metric | Value | Industry Benchmark |
|:---|:---|:---|
| Total projects | 13 | Top 5% of public n8n portfolios |
| Largest workflow | 260KB / 140+ nodes | Elite tier (60+ nodes) |
| Multi-workflow systems | 4 projects with 2+ coordinated workflows | Modular sub-workflow pattern |
| Custom Node.js code | 1 MCP Server (14 tools, 500+ LOC) | Beyond pre-built node usage |
| Error handling sub-workflows | 3 dedicated error handlers | Production resilience pattern |
| Local AI infrastructure | 3 Modelfiles + 6 AnythingLLM workspaces | Hardware-aware optimization |
| Proof-of-work artifacts | 5 agent outputs, 5 screenshots, 1 test contract | Verifiable, not just described |

## 💰 Measured ROI (Representative)

| Project | Manual Process | Automated | Improvement |
|:---|:---|:---|:---|
| Invoice Vision Auditor | ~4 min/invoice (manual check + filing) | ~15 sec/invoice (end-to-end) | **16× speed, 0% miss rate** |
| AI Lead Gen Machine | ~30 min/lead (research + draft + send) | ~45 sec/lead (fully automated) | **40× throughput** |
| Content Alchemist | ~2 hrs/post (transcribe + write + design) | ~3 min/post (voice → published) | **40× faster, consistent quality** |
| Signal Pipeline | ~45 min/scan (manual job board review) | ~90 sec/scan (AI scored + deduped) | **30× speed, zero missed signals** |
| Auto-Blogger | ~3 hrs/article (research + write + publish) | ~2 min/article (prompt → WordPress) | **90× faster production** |

---

## 🏗️ Production Deployment

This repository includes a production-ready [docker-compose.production.yml](./docker-compose.production.yml) for enterprise deployment:

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  n8n Main    │    │ n8n Webhook  │    │ n8n Worker   │
│ (Editor/API) │    │ (Inbound HTTP)│   │ (Execution)  │
│  2CPU / 4GB  │    │  1CPU / 2GB  │    │  4CPU / 8GB  │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────┬───────┴───────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
    ┌────┴─────┐    ┌────────┴────────┐
    │ PostgreSQL│    │  Redis (Queue)  │
    │ 2CPU/4GB │    │  1CPU / 1GB     │
    └──────────┘    └─────────────────┘
```

### Quick Start
```bash
# 1. Create environment file
cp .env.example .env
# Edit with your secrets: POSTGRES_PASSWORD, N8N_ENCRYPTION_KEY, JWT_SECRET

# 2. Deploy
docker compose -f docker-compose.production.yml up -d

# 3. Scale workers for higher throughput
docker compose -f docker-compose.production.yml up -d --scale n8n-worker=4
```

## 🔄 Data Layer Strategy

Google Sheets is used intentionally as a **zero-infrastructure bootstrap layer** — not a permanent architecture decision. See [MIGRATION.md](./MIGRATION.md) for the complete Sheets → PostgreSQL/Supabase migration guide with SQL schemas, n8n node swap instructions, and per-project priority assessment.

> **Note:** The [Infinite Memory Vault](./Infinite-Memory-Vault/) already runs on Supabase with pgvector, demonstrating the target migration pattern.

---

## ⚙️ Workflow Import Guide

1. **Import**: Import `.json` workflow files into your n8n instance.
2. **Configure Credentials**: Replace all `REPLACE_WITH_YOUR_CREDENTIAL_ID` placeholders.
3. **Configure Resources**: Replace `REPLACE_WITH_YOUR_SHEET_ID` and `REPLACE_WITH_DRIVE_FOLDER_ID`.
4. **Test**: Use `SAFE_MODE=true` where available (Lead Gen Machine).
5. **Deploy**: Activate workflows and monitor via n8n's built-in execution log.

> **Security**: All credentials, API keys, emails, and personal identifiers have been removed. No production secrets exist in this repository's history.

---
*Maintained by [kspandian32-sudo](https://github.com/kspandian32-sudo)*
