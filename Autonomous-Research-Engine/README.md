# 🔍 Autonomous Research Engine (AI Learning Machine v2)

A powerful multi-source research agent that creates 20-page "Learning Kits" from a single topic. It cross-references YouTube transcripts and Web results to ensure maximum accuracy.

## 🌟 Key Features
- **RAG Architecture**: Merges YouTube transcripts, SerpAPI results, and deep-web snippets into a single context block.
- **Citations Included**: Automatically generates a formal "References" section with clickable links.
- **NotebookLM Optimized**: Prepares the output specifically for ingestion into Google's NotebookLM for audio deep-dives.
- **Quality Scorer**: An AI-audit layer that scores every doc from 1-50; failed documents are routed for manual review.

## 🏗️ Process Flow
1. **Request Intake**: Topic, Knowledge Level (Beginner to Expert).
2. **Planner**: AI splits the topic into 5-8 deep-dive sub-questions.
3. **Researcher**: Multi-threaded search across YouTube and Web.
4. **Writer**: Context-aware generation based on the "Knowledge Level" instruction.
5. **Quality Audit**: Scores for accuracy, depth, and clarity.

## ⚙️ Setup
- Requires Gemini 1.5 Pro or GPT-4o keys.
- Requires SerpAPI and Apify (YouTube Transcript) keys.
- Google Docs integration for the final output.
