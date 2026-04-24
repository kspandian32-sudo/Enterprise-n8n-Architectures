# 💼 Enterprise AI Sales Rep

A Slack-integrated autonomous agent that manages the end-to-end sales follow-up process. It identifies leads, classifies their intent, and drafts personalized messages.

## 🌟 Key Features
- **Slack Command Center**: Operates entirely from Slack. Trigger follow-ups, check status, and receive alerts without leaving the app.
- **Intent-Based Routing**: Automatically distinguishes between "Interested", "Follow up later", and "Not Interested" using LLM classification.
- **Dynamic Context**: Pulls latest lead information from Google Sheets to ensure messages are relevant and non-robotic.
- **Safety Layer**: Includes a "Draft Mode" where the agent presents the message to a human in Slack for approval before sending.

## ⚙️ Setup
- Requires a Slack App with `chat:write` and `commands` scopes.
- Requires Google Sheets for lead storage.
- Requires GPT-4o or Claude 3.5 Sonnet credentials.
