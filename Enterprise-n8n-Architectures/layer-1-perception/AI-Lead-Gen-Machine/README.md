# 📧 AI Lead Gen Machine (SAFE PRO SMTP)

A robust, enterprise-grade cold outreach suite designed for high-deliverability and "safe" testing. It uses SMTP for sending and supports complex follow-up logic.

## 🌟 Key Features
- **SAFE_MODE Toggle**: A global flag that prevents actual email sending — allowing you to test the entire logic with simulated logs.
- **Intent Classification**: Uses GPT-4o to classify replies as "Hot Lead", "OOO", "Not Interested", or "Unsubscribe".
- **Dynamic Blacklisting**: Automatically suppresses leads who unsubscribe or bounce across all campaigns.
- **Multistage Follow-up**: Automated 3-stage follow-up (WF-A, B, C) that stops immediately when a reply is detected.

## 🏗️ Components
1. **WF-A: Main Campaign** (79KB): Handles lead scoring, AI draft generation, and initial outreach.
2. **WF-B: Reply + Bounce Handler** (91KB): Monitors the inbox for replies and bounces, updates CRM, and triggers high-priority Telegram alerts.
3. **WF-C: Breakup Sequence** (89KB): Scheduled follow-ups that bridge the lead context and send tailored sequences.

## 🔧 Technical Highlights
- **Blacklist Suppression Gate**: JavaScript-based lookup that cross-references every outbound lead against the blacklist before sending.
- **CRM Dashboard Logging**: Every action (send, reply, bounce, unsubscribe) is logged to a centralized Google Sheet with timestamps.
- **Telegram Real-Time Alerts**: High-priority events fire instant Telegram notifications for human-in-the-loop awareness.

## ⚙️ Setup
- Configure your SMTP server details (Mailgun, SendGrid, or custom).
- Setup the Apollo/Lead Source Google Sheet.
- Setup a Telegram Bot for real-time notifications.
