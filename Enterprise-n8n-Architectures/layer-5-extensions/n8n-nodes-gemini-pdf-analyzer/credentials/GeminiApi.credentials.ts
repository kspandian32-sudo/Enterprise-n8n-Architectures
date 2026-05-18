import {
  IAuthenticateGeneric,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class GeminiApi implements ICredentialType {
  name = 'geminiApi';
  displayName = 'Google Gemini API';
  documentationUrl = 'https://ai.google.dev/gemini-api/docs/api-key';
  properties: INodeProperties[] = [
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
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      qs: {
        key: '={{$credentials.apiKey}}',
      },
    },
  };
}
