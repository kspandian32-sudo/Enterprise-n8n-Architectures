# 🎬 Ultimate UGC Content System

A state-of-the-art video automation engine for User-Generated Content (UGC) creators and agencies. It automates the video generation "lanes" using AI agents.

## 🌟 Key Features
- **Multi-Lane Processing**: Dedicated lanes for Nano AI, Veo AI, and Sora-style simulations.
- **Agent Orchestration**: Uses n8n AI Agents to transform raw briefs into structured scene descriptions.
- **HTTP Lane Switching**: Dynamically routes projects to different video synthesis APIs based on the selected "Lane" in the CRM.
- **Real-Time Logging**: Updates a central Google Sheet at every stage—from "Scripting" to "Synthesizing" to "Done".

## 🏗️ Technical Highlights
- **Dynamic Switch Logic**: A centralized router that handles multiple synthesis protocols.
- **Error Bridges**: Built-in logic to handle API timeouts from heavy video processing tasks.

## ⚙️ Setup
- Requires integrations with video generation APIs (Veo, Sora-simulators, etc.).
- Requires a structured UGC Production Google Sheet.
