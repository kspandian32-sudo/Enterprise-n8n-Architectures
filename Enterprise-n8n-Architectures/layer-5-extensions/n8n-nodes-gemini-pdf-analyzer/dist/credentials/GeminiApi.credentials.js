"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiApi = void 0;
class GeminiApi {
    constructor() {
        this.name = 'geminiApi';
        this.displayName = 'Google Gemini API';
        this.documentationUrl = 'https://ai.google.dev/gemini-api/docs/api-key';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'Your Google Gemini API Key from Google AI Studio (aistudio.google.com)',
            },
        ];
        // Appends the key as a query parameter: ?key=YOUR_API_KEY
        this.authenticate = {
            type: 'generic',
            properties: {
                qs: {
                    key: '={{$credentials.apiKey}}',
                },
            },
        };
    }
}
exports.GeminiApi = GeminiApi;
//# sourceMappingURL=GeminiApi.credentials.js.map