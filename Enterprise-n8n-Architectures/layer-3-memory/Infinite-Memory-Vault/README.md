# 🧠 Infinite Memory Vault

A persistent, semantic memory system for AI agents. It allows a Telegram-based personal assistant to "remember" and "forget" facts, which are stored as vector embeddings in a database.

## 🌟 Key Features
- **Voice-First**: Supports voice note transcription (Whisper) for hands-free memory entry.
- **Semantic Search**: Uses vector embeddings to find relevant past memories during a conversation.
- **Importance Scoring**: AI automatically ranks memories by importance to prevent database noise.
- **Self-Healing**: Built-in error handling to catch and report database or API timeouts.

## 🏗️ Components
1. **Main Vault**: Handles commands like `/remember [fact]` and `/forget [keyword]`.
2. **Error Handler**: A dedicated sub-workflow for centralized error alerting via Telegram.

## ⚙️ Setup
- Requires a Supabase (or similar) vector database for memory storage.
- Requires a Flowise or LangChain API for semantic orchestration.
- Uses Telegram as the primary interface.
