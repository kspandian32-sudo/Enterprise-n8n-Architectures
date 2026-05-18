# Workflow A: The Main Orchestrator

## 📋 Role
This is the entry point for the entire suite. it monitors for new audio files, handles transcription, and runs the CEO ghostwriter logic.

## 🔄 Flow
**Google Drive Poll (New Audio)** -> **Make Public** -> **Whisper API (Colab)** -> **GPT-4o CEO Ghostwriter** -> **Trigger Branches (B, C, D)** -> **Telegram Alert**

## 💡 Why this way?
- **Decoupled Processing**: By triggering sub-workflows for LinkedIn and Twitter, we ensure that a failure in one branch (like a DALL-E rate limit) doesn't stop the others.
- **Central Config**: All IDs are managed in a single node, making environment migration instant.
