# 🎙️ Content Alchemist — AI Content Factory

The **Content Alchemist** is a multi-modal automation suite designed to transform raw ideas (voice notes) into a complete social media distribution engine.

## 🌟 Overview

This project takes a single audio file (typically a voice note recorded on the go) and uses a series of decoupled n8n workflows to:
1.  **Transcribe**: Using a high-fidelity Whisper server (hosted on Google Colab).
2.  **Ghostwrite**: Using GPT-4o with a specific "CEO Ghostwriter" persona.
3.  **Visualize**: Automatically building DALL-E 3 image prompts and generating matching visuals.
4.  **Distribute**: Logging content to Google Sheets and sending alerts via Telegram.

## 🏗️ Architecture

The system is split into **6 specialized workflows** to ensure modularity and high reliability:

1.  **[Workflow A (MAIN)](./A_Main_Workflow/)**: The orchestrator.
2.  **[Workflow B (LinkedIn)](./B_LinkedIn_Branch/)**: Visual LinkedIn post generation.
3.  **[Workflow C (X/Twitter)](./C_Twitter_Branch/)**: Serialized thread generation.
4.  **[Workflow D (Hooks)](./D_Hooks_Archive/)**: Viral hook storage and audio archiving.
5.  **[One-Time Setup](./E_OneTime_Setup/)**: Automates folder and sheet creation.
6.  **[Sheet Headers](./F_Sheet_Headers/)**: Initializes database columns.

## 🛠️ Setup Instructions

1.  Run the **One-Time Setup** workflow to create your Google Drive folders and Google Sheets.
2.  Copy the resulting Folder/Sheet IDs into the **Config** node of Workflow A.
3.  Ensure your **Colab/Whisper** server is running and the ngrok URL is updated in Workflow A.
4.  Drop an audio file into the `Incoming Audio` folder and watch the alchemy happen!
