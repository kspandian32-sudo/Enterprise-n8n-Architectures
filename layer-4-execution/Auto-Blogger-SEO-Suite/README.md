# ✍️ Auto-Blogger SEO Suite

An automated end-to-end content pipeline that researches, generates, and publishes high-authority SEO articles directly to WordPress — with built-in error handling, audit logging, and a failed-post review queue.

## 🌟 Key Features
- **AI Content Generation**: Uses Gemini 2.5 Flash with a specialized "Expert Ayurvedic Naturopath" system prompt to generate deep-dive, scientifically-backed articles.
- **Structured Content Architecture**: Every article follows a 5-part structure: Hook → Ancient Wisdom → Modern Science → Actionable Recipe → Conclusion.
- **Direct WordPress Publishing**: Posts are created as drafts in WordPress via the native API, with proper category and tag assignment.
- **Error Handling & Audit Trail**: Built-in `continueOnFail` on critical nodes, a dedicated **Error Handler** routing path, and dual Google Sheets logging (Audit Log + Failed Posts Review Queue).

## 🏗️ Architecture

```
Manual Trigger → Set Post Config → Generate Content (Gemini)
                                        ├── ✅ Format for WordPress → Create Post → Log Success → Write to Audit Log
                                        └── ❌ Error Handler → Log Error → Write to Review Queue
```

### Node Breakdown (8 nodes)
1. **Set Post Config**: JavaScript-based configuration node defining topic, category, and SEO keywords.
2. **Generate Content (Gemini)**: HTTP Request to Gemini 2.5 Flash API with structured prompt engineering.
3. **Format for WordPress**: JS code node that cleans HTML output and structures metadata.
4. **Create WordPress Post**: Native WordPress node creating drafts with proper taxonomy.
5. **Log Success / Log Error**: Structured JavaScript logging with `run_id`, timestamps, and error details.
6. **Write to Audit Log**: Appends every run (success or failure) to a central Google Sheet for observability.
7. **Write to Review Queue**: Routes failed posts with error details to a separate "Failed Posts" sheet tab for manual review.

## 🔧 Technical Highlights
- **Fail-Safe Design**: `continueOnFail: true` on both the Gemini API call and WordPress publish nodes prevents crashes from propagating.
- **Run ID Tracking**: Every execution generates a unique `run_id` (ISO timestamp) for traceability across the audit log.
- **SEO-Optimized Prompts**: The Gemini prompt enforces rich HTML output (`<h1>`, `<h2>`, `<ul>`, `<strong>`) instead of markdown, ensuring WordPress renders correctly.

## ⚙️ Setup
1. Configure Google Gemini (PaLM) API credentials.
2. Configure WordPress API credentials (URL + Application Password).
3. Create a Google Sheet with "Audit Log" and "Failed Posts" tabs.
4. Update the `Set Post Config` node with your desired topic and keywords.
