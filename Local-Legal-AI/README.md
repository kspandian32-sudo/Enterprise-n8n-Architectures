# ⚖️ Local-First Legal AI (Infrastructure & Privacy)

A fully self-hosted, air-gapped legal analysis engine designed for law firms and SMEs handling highly sensitive contracts. This system runs 100% offline, ensuring that not a single byte of confidential data ever leaves the local machine.

## 🌟 The "Airplane Mode" Proof
- **Efficiency**: Analyzes a 12-page NDA in under 3 minutes.
- **Privacy**: No cloud, no OpenAI, no leaks. Data never leaves your hardware.
- **Cost**: ₹0 recurring budget (replacing ₹20,000 - ₹1,00,000 in professional review fees).

## 🏗️ Technical Architecture
`mermaid
graph LR
    A[PDF/DOCX Contract] --> B[AnythingLLM UI]
    B --> C[Local Vector DB]
    C --> D[AnythingLLM RAG Engine]
    D --> E[Ollama API :11434]
    E --> F[Local Model: Deepseek-R1/Qwen]
    F --> G[Analysis Output]
    G --> B
    style B fill:#f9f,stroke:#333
    style F fill:#bfb,stroke:#333
`

## 🛠️ The Specialized Legal Agents (Workspaces)
This system utilizes **six isolated AnythingLLM workspaces**, each configured as a dedicated AI legal agent:

1.  **NDAs & Confidentiality** — Plain English translation and obligation parsing.
2.  **Vendor Contracts** — Clause extraction and structured table generation.
3.  **Client Contracts** — IP ownership risk analysis.
4.  **Employment & Consulting** — Red flag detection and unfair clause identification.
5.  **Founder Agreements** — Termination & exit strategy analysis.
6.  **Miscellaneous** — Comprehensive multi-dimensional risk scanning.

## ⚙️ The "Golden Ticket": Custom Modelfiles
We don't just run vanilla models. We use **three context-optimized variants** via custom Ollama Modelfiles to ensure the AI reads the **whole contract**, not just fragments:

- **deepseek-legal (Optimized Deepseek-R1 8B)**: Features **chain-of-thought** reasoning so every output is defensible.
- **qwen-coder-legal (Optimized Qwen2.5-Coder)**: Optimized for structured JSON and table outputs.
- **qwen-legal (Optimized Qwen2.5 7B)**: Tuned for speed and plain-English translation.


## 🧠 Model Behaviors & Reasoning Modes
The core innovation in this build is the **Behavioral Split** across workspaces. By varying the system prompts and underlying models, we achieve different "thinking" profiles:

- **Streaming Thinking (Chain-of-Thought)**: In the deep-reasoning workspaces, the model (deepseek-legal) is configured to stream its internal logic. You can see the AI "thinking" through conflicting clauses before delivering a verdict. This is the **fantastic reasoning** mode for high-stakes risk analysis.
- **Reporting Mode (Direct Extraction)**: In extraction-heavy workspaces (e.g., Vendor Contracts), the system is tuned for **0-shot precision**. It skips the conversational fluff to deliver machine-ready tables and JSON segments.

### Why this adds value:
Most people treat an LLM as a single-purpose chatbot. This project proves we can treat a single LLM as a **multi-purpose suite of specialized legal engines**, each with its own "brain" optimized for either deep reflection or rapid reporting.


### ✨ Featured Agent: The Red Flag Detector
The **Employment & Consulting** agent provides a "beautiful illustration" of identifying contractual risks. It doesn't just list clauses; it ranks them by severity (🔴 CRITICAL to 🔵 LOW) and provides a **Specific Suggested Fix** for each:

- **Critical Catch**: Identified a 24-month post-termination non-compete clause that would effectively bar the founder from hiring any other SaaS firm in India.
- **Liability Alert**: Flagged an uncapped indemnity clause that could expose the business to unlimited financial liability.
- **Actionable Advice**: For every red flag, the AI suggests the exact negotiation target (e.g., "Request to cap indemnity at 1X contract value").

Explore the full output here: **[Red Flags Analysis Sample](./Agent-Responses/Employment%20&%20Consulting.txt)**

## ⚡ Automation & Experience
- **Auto-System Prompt**: Upload a PDF and type **"Go"**. The optimized system prompt fires automatically—no re-typing instructions.
- **Audit Trail**: Every session produces a timestamped audit trail for professional due diligence.

---
*Developed for Indian D2C founders. Replaces the ₹2,000–₹10,000/hour spent just "trying to understand" a document before calling a lawyer.*


## 📊 Agent Output Samples (Proof of Work)
We have included real analysis outputs from the 6 specialized agents. Even with the same prompt ("Analyze this contract"), each agent focuses on its domain:

- **[Client Contracts Output](./Agent-Responses/Client%20Contract.txt)**: Focuses on IP transfer and "Work-for-hire" risks.
- **[Vendor Contracts Output](./Agent-Responses/Vendor%20Contracts.txt)**: Produces a high-precision table of obligations and payment triggers.
- **[Employment Output](./Agent-Responses/Employment%20&%20Consulting.txt)**: Flags non-compete and solicitation red flags.
- **[Founder Agreement Output](./Agent-Responses/Founder%20Agreement.txt)**: Analyzes vesting and exit conditions.

Scan the **[Screenshots](./Screenshots/)** folder for proof of the offline UI and "Airplane Mode" execution.


