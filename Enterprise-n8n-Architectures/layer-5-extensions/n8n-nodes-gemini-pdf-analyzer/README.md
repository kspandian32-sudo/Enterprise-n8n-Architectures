# n8n-nodes-gemini-pdf-analyzer

[![npm version](https://badge.fury.io/js/n8n-nodes-gemini-pdf-analyzer.svg)](https://badge.fury.io/js/n8n-nodes-gemini-pdf-analyzer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An **n8n community node** that uses **Google Gemini Vision AI** to analyze PDF documents and extract structured data. Built for the Invoice Vision Auditor automation system.

---

## 🚀 What This Node Does

This node accepts a PDF binary (from Google Drive, a webhook, or any file source) and sends it to the **Gemini multimodal API**. It returns a clean, structured JSON object — no manual parsing, no fragile regex.

**Two operation modes:**
- **Analyze Invoice** — Extracts vendor, invoice number, amounts, dates, signature status, and compliance errors from any invoice PDF.
- **Analyze Document (Custom Prompt)** — Send any PDF with your own prompt and receive structured JSON back.

---

## 📦 Installation

### In your n8n instance (Community Nodes)

1. Go to **Settings → Community Nodes → Install**
2. Search for: `n8n-nodes-gemini-pdf-analyzer`
3. Click **Install**

### Manual (Self-Hosted n8n)

```bash
npm install n8n-nodes-gemini-pdf-analyzer
```

Then restart your n8n instance.

---

## 🔑 Credentials Setup

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. In n8n, go to **Credentials → New → Google Gemini API**
3. Paste your API key

---

## ⚙️ Node Parameters

| Parameter | Description | Default |
|:---|:---|:---|
| **Operation** | `Analyze Invoice` or `Analyze Document (Custom Prompt)` | Analyze Invoice |
| **Model** | Gemini model to use | `gemini-2.5-flash` |
| **Input Binary Field** | Name of the binary field containing the PDF | `data` |
| **Custom Prompt** | *(Custom mode only)* Your analysis instructions | — |
| **Confidence Threshold** | Below this score, a warning is added | `0.75` |
| **Temperature** | Gemini creativity (0 = deterministic) | `0` |
| **Continue on Error** | Don't stop the workflow if Gemini fails | `true` |

---

## 📤 Output Fields (Invoice Mode)

```json
{
  "file_name": "invoice_2024_001.pdf",
  "vendor_name": "Acme Corp Ltd",
  "invoice_number": "INV-2024-001",
  "invoice_date": "2024-01-15",
  "due_date": "2024-02-15",
  "line_items_count": 3,
  "total_amount": 4850.00,
  "currency": "USD",
  "has_signature": true,
  "signature_valid": true,
  "confidence_score": 0.94,
  "errors": [],
  "warnings": [],
  "processed_at": "2024-04-25T09:00:00.000Z",
  "model_used": "gemini-2.5-flash"
}
```

---

## 🏗️ Example Workflow

```
[Google Drive Trigger] → [Download File] → [Gemini PDF Analyzer] → [IF: Errors?] → [Log to Sheets]
```

This is exactly the architecture powering the [Invoice Vision Auditor](https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/Invoice-Vision-Auditor) — a production system processing live invoices daily.

---

## 🛠️ Development

```bash
git clone https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures.git
cd Enterprise-n8n-Architectures/n8n-nodes-gemini-pdf-analyzer
npm install
npm run build
```

To test locally with your n8n instance:
```bash
npm link
# In your n8n custom extensions folder:
npm link n8n-nodes-gemini-pdf-analyzer
```

---

## 📄 License

MIT — free to use, modify, and distribute.

---

*Part of the [Enterprise n8n Architectures](https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures) portfolio.*
