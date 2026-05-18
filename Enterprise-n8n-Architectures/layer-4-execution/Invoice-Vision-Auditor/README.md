# 📄 Invoice Vision Auditor

A sophisticated AI-driven invoice processing system that uses Gemini 1.5 Flash to audit invoices for errors, duplicates, and fraud.

## 🌟 Key Features
- **Visual Intelligence**: Uses Gemini Vision to "read" PDFs and images of invoices.
- **Auto-Verification**: Cross-checks against a database of verified invoices to catch duplicates and vendor inconsistencies.
- **Flagging System**: Automatically routes suspicious invoices to a "Needs Review" folder and alerts the team.
- **Daily Digest**: A scheduled summary of the day's finances and audit results.

## 🏗️ Components
1. **Auto-Processor**: The main background engine triggered by new files in Google Drive.
2. **On-Demand API**: A webhook-based endpoint for instantaneous processing from other business apps.
3. **Daily Digest**: A reporting tool that summarizes counts, amounts, and common audit flags.

## ⚙️ Setup
1. Create a Google Sheet with "Verified", "Flagged", and "Needs Review" tabs.
2. Setup a Gemini 1.5 Flash API key.
3. Configure your Telegram or Email alertness nodes.
