import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  NodeApiError,
  IDataObject,
  JsonObject,
} from 'n8n-workflow';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface GeminiAnalysisResult {
  vendor_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  line_items_count: number | null;
  total_amount: number | null;
  currency: string | null;
  has_signature: boolean;
  signature_valid: boolean;
  confidence_score: number;
  errors: string[];
  warnings: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Node Definition
// ─────────────────────────────────────────────────────────────────────────────

export class GeminiPdfAnalyzer implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Gemini PDF Analyzer',
    name: 'geminiPdfAnalyzer',
    icon: 'file:gemini.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description:
      'Analyze PDFs using Google Gemini Vision AI. Extract structured data from invoices, contracts, and other documents.',
    defaults: {
      name: 'Gemini PDF Analyzer',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'geminiApi',
        required: true,
      },
    ],
    properties: [
      // ── Operation ─────────────────────────────────────────────────────────
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Analyze Invoice',
            value: 'analyzeInvoice',
            description: 'Extract structured fields from an invoice PDF (vendor, amount, dates, etc.)',
            action: 'Analyze invoice pdf with gemini',
          },
          {
            name: 'Analyze Document (Custom Prompt)',
            value: 'analyzeCustom',
            description: 'Send any PDF to Gemini with a custom prompt and get back structured JSON',
            action: 'Analyze document with custom prompt',
          },
        ],
        default: 'analyzeInvoice',
      },

      // ── Model ─────────────────────────────────────────────────────────────
      {
        displayName: 'Model',
        name: 'model',
        type: 'options',
        options: [
          {
            name: 'Gemini 2.5 Flash (Recommended)',
            value: 'gemini-2.5-flash',
          },
          {
            name: 'Gemini 2.0 Flash',
            value: 'gemini-2.0-flash',
          },
          {
            name: 'Gemini 1.5 Pro (Highest Quality)',
            value: 'gemini-1.5-pro',
          },
        ],
        default: 'gemini-2.5-flash',
        description: 'The Gemini model to use for analysis',
      },

      // ── Binary Input Field ────────────────────────────────────────────────
      {
        displayName: 'Input Binary Field',
        name: 'binaryField',
        type: 'string',
        default: 'data',
        required: true,
        description:
          'Name of the binary property containing the PDF. Use "data" if coming from a Google Drive download or Read Binary File node.',
        hint: 'Must contain a PDF file. Images (PNG, JPEG) also work.',
      },

      // ── Custom Prompt (only for analyzeCustom) ────────────────────────────
      {
        displayName: 'Custom Prompt',
        name: 'customPrompt',
        type: 'string',
        typeOptions: {
          rows: 6,
        },
        default:
          'Analyze this document and return a JSON object with the key fields you find. Include a confidence_score (0.0 to 1.0) field.',
        displayOptions: {
          show: {
            operation: ['analyzeCustom'],
          },
        },
        description: 'The prompt to send to Gemini along with the PDF',
      },

      // ── Options ───────────────────────────────────────────────────────────
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Confidence Threshold',
            name: 'confidenceThreshold',
            type: 'number',
            typeOptions: {
              minValue: 0,
              maxValue: 1,
              numberPrecision: 2,
            },
            default: 0.75,
            description: 'If Gemini\'s confidence_score falls below this value, a "Low confidence" warning is added to the output',
          },
          {
            displayName: 'Temperature',
            name: 'temperature',
            type: 'number',
            typeOptions: {
              minValue: 0,
              maxValue: 1,
              numberPrecision: 1,
            },
            default: 0,
            description:
              'Controls randomness. 0 = deterministic (recommended for structured extraction). 1 = creative.',
          },
          {
            displayName: 'Max Output Tokens',
            name: 'maxOutputTokens',
            type: 'number',
            default: 2048,
            description: 'Maximum number of tokens in the Gemini response',
          },
          {
            displayName: 'Continue on Error',
            name: 'continueOnError',
            type: 'boolean',
            default: true,
            description: 'Whether to continue the workflow if Gemini returns an error, returning a partial result instead of stopping',
          },
        ],
      },
    ],
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Execute
  // ─────────────────────────────────────────────────────────────────────────

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        // ── Parameters ──────────────────────────────────────────────────────
        const operation = this.getNodeParameter('operation', itemIndex) as string;
        const model = this.getNodeParameter('model', itemIndex) as string;
        const binaryField = this.getNodeParameter('binaryField', itemIndex) as string;
        const options = this.getNodeParameter('options', itemIndex, {}) as {
          confidenceThreshold?: number;
          temperature?: number;
          maxOutputTokens?: number;
          continueOnError?: boolean;
        };

        const confidenceThreshold = options.confidenceThreshold ?? 0.75;
        const temperature = options.temperature ?? 0;
        const maxOutputTokens = options.maxOutputTokens ?? 2048;
        const continueOnError = options.continueOnError ?? true;

        // ── Get PDF binary data ──────────────────────────────────────────────
        const binaryData = this.helpers.assertBinaryData(itemIndex, binaryField);
        const bufferData = await this.helpers.getBinaryDataBuffer(itemIndex, binaryField);
        const base64Pdf = bufferData.toString('base64');
        const mimeType = binaryData.mimeType || 'application/pdf';

        // ── Build prompt ──────────────────────────────────────────────────────
        let prompt: string;
        if (operation === 'analyzeInvoice') {
          prompt = buildInvoicePrompt();
        } else {
          prompt = this.getNodeParameter('customPrompt', itemIndex) as string;
        }

        // ── Build Gemini request payload ─────────────────────────────────────
        const payload = {
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Pdf,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        };

        // ── Call Gemini API ──────────────────────────────────────────────────
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

        let geminiResponse: IDataObject;
        try {
          geminiResponse = (await this.helpers.requestWithAuthentication.call(
            this,
            'geminiApi',
            {
              method: 'POST',
              url: apiUrl,
              body: payload,
              json: true,
              timeout: 90000,
            },
          )) as IDataObject;
        } catch (apiError) {
          if (continueOnError) {
            returnData.push({
              json: buildErrorOutput(binaryData.fileName || 'unknown.pdf', String(apiError)),
              pairedItem: itemIndex,
            });
            continue;
          }
          throw new NodeApiError(this.getNode(), apiError as JsonObject, {
            message: 'Gemini API call failed. Check your API key and try again.',
          });
        }

        // ── Parse response ────────────────────────────────────────────────────
        let analysisResult: GeminiAnalysisResult;
        if (operation === 'analyzeInvoice') {
          analysisResult = parseInvoiceResponse(geminiResponse, binaryData.fileName || 'unknown.pdf');
        } else {
          analysisResult = parseCustomResponse(geminiResponse);
        }

        // ── Add confidence warning ────────────────────────────────────────────
        if (
          analysisResult.confidence_score < confidenceThreshold &&
          !analysisResult.warnings.includes('Low confidence — manual review recommended')
        ) {
          analysisResult.warnings.push('Low confidence — manual review recommended');
        }

        // ── Return structured output ──────────────────────────────────────────
        returnData.push({
          json: {
            file_name: binaryData.fileName || 'unknown.pdf',
            ...analysisResult,
            processed_at: new Date().toISOString(),
            model_used: model,
          },
          pairedItem: itemIndex,
        });
      } catch (error) {
        const continueOnError =
          ((this.getNodeParameter('options', itemIndex, {}) as { continueOnError?: boolean })
            .continueOnError) ?? true;

        if (continueOnError) {
          returnData.push({
            json: {
              error: true,
              error_message: (error as Error).message,
              file_name: 'unknown.pdf',
              processed_at: new Date().toISOString(),
            },
            pairedItem: itemIndex,
          });
          continue;
        }
        if (error instanceof NodeOperationError) throw error;
        throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
      }
    }

    return [returnData];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildInvoicePrompt(): string {
  return (
    'You are an invoice auditor. Analyze this invoice PDF.\n' +
    'Return ONLY a raw JSON object with no markdown and no code fences.\n' +
    'Fields:\n' +
    '  vendor_name (string or null)\n' +
    '  invoice_number (string or null)\n' +
    '  invoice_date (YYYY-MM-DD or null)\n' +
    '  due_date (YYYY-MM-DD or null)\n' +
    '  line_items_count (integer or null)\n' +
    '  total_amount (number or null)\n' +
    '  currency (3-letter ISO code or null)\n' +
    '  has_signature (boolean)\n' +
    '  signature_valid (boolean — true ONLY for handwritten ink or rubber stamp, not printed names)\n' +
    '  confidence_score (float 0.0 to 1.0 — how confident you are in the extraction)\n' +
    '  errors (array — include any of: "No signature found", "Total amount missing", ' +
    '"Not a valid invoice", "Invoice number missing" — whichever apply)\n' +
    '  warnings (array — include any of: "Due date has passed", "Currency unclear" — whichever apply)\n' +
    'Return ONLY the JSON. No other text.'
  );
}

function parseInvoiceResponse(
  geminiResponse: IDataObject,
  fileName: string,
): GeminiAnalysisResult {
  const defaultResult: GeminiAnalysisResult = {
    vendor_name: null,
    invoice_number: null,
    invoice_date: null,
    due_date: null,
    line_items_count: null,
    total_amount: null,
    currency: null,
    has_signature: false,
    signature_valid: false,
    confidence_score: 0,
    errors: [`AI parse failure for file: ${fileName}`],
    warnings: [],
  };

  try {
    const candidates = geminiResponse.candidates as Array<{
      content: { parts: Array<{ text: string }> };
    }>;
    if (!candidates?.[0]?.content?.parts?.[0]?.text) {
      return defaultResult;
    }

    const raw = candidates[0].content.parts[0].text;
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return { ...defaultResult, errors: ['No JSON object found in Gemini response'] };
    }

    const parsed = JSON.parse(raw.slice(start, end + 1)) as Partial<GeminiAnalysisResult>;

    return {
      vendor_name: parsed.vendor_name ?? null,
      invoice_number: parsed.invoice_number ? String(parsed.invoice_number) : null,
      invoice_date: parsed.invoice_date ?? null,
      due_date: parsed.due_date ?? null,
      line_items_count: parsed.line_items_count ?? null,
      total_amount: parsed.total_amount != null ? Number(parsed.total_amount) : null,
      currency: parsed.currency ?? null,
      has_signature: Boolean(parsed.has_signature),
      signature_valid: Boolean(parsed.signature_valid),
      confidence_score: Math.min(1, Math.max(0, Number(parsed.confidence_score) || 0)),
      errors: Array.isArray(parsed.errors) ? parsed.errors : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    };
  } catch (e) {
    return { ...defaultResult, errors: [`JSON parse error: ${(e as Error).message}`] };
  }
}

function parseCustomResponse(geminiResponse: IDataObject): GeminiAnalysisResult {
  const defaultResult: GeminiAnalysisResult = {
    vendor_name: null,
    invoice_number: null,
    invoice_date: null,
    due_date: null,
    line_items_count: null,
    total_amount: null,
    currency: null,
    has_signature: false,
    signature_valid: false,
    confidence_score: 0,
    errors: ['Could not parse Gemini response as JSON'],
    warnings: [],
  };

  try {
    const candidates = geminiResponse.candidates as Array<{
      content: { parts: Array<{ text: string }> };
    }>;
    const raw = candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) {
      // Return raw text as a field if no JSON found
      return {
        ...defaultResult,
        errors: [],
        warnings: ['Response was plain text, not JSON'],
      };
    }
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Partial<GeminiAnalysisResult>;
    return {
      vendor_name: parsed.vendor_name ?? null,
      invoice_number: parsed.invoice_number ?? null,
      invoice_date: parsed.invoice_date ?? null,
      due_date: parsed.due_date ?? null,
      line_items_count: parsed.line_items_count ?? null,
      total_amount: parsed.total_amount != null ? Number(parsed.total_amount) : null,
      currency: parsed.currency ?? null,
      has_signature: Boolean(parsed.has_signature ?? false),
      signature_valid: Boolean(parsed.signature_valid ?? false),
      confidence_score: Math.min(1, Math.max(0, Number(parsed.confidence_score) || 0.5)),
      errors: Array.isArray(parsed.errors) ? parsed.errors : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    };
  } catch {
    return defaultResult;
  }
}

function buildErrorOutput(fileName: string, errorMessage: string): IDataObject {
  return {
    file_name: fileName,
    vendor_name: null,
    invoice_number: null,
    invoice_date: null,
    due_date: null,
    line_items_count: null,
    total_amount: null,
    currency: null,
    has_signature: false,
    signature_valid: false,
    confidence_score: 0,
    errors: [`API Error: ${errorMessage}`],
    warnings: [],
    processed_at: new Date().toISOString(),
    model_used: 'unknown',
  };
}
