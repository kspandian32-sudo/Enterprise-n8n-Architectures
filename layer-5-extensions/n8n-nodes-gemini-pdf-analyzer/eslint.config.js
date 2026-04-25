const n8nNodesBase = require('eslint-plugin-n8n-nodes-base');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: './tsconfig.json',
			},
		},
		plugins: {
			'n8n-nodes-base': n8nNodesBase,
		},
		rules: {
			...n8nNodesBase.configs.nodes.rules,
			...n8nNodesBase.configs.credentials.rules,
			'n8n-nodes-base/node-dirname-against-convention': 'error',
			'n8n-nodes-base/node-execute-block-missing-continue-on-fail': 'off',
			'n8n-nodes-base/node-param-default-wrong-for-simplify': 'off',
			'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
			'n8n-nodes-base/cred-class-field-documentation-url-not-http-url': 'off',
		},
	},
];
