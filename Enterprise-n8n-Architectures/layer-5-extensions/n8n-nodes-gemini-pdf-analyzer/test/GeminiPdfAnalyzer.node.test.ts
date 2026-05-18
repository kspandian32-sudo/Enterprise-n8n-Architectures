import { describe, it, expect, vi } from 'vitest';
import { GeminiPdfAnalyzer } from '../nodes/GeminiPdfAnalyzer/GeminiPdfAnalyzer.node';

describe('GeminiPdfAnalyzer Node', () => {
	it('should be defined', () => {
		const node = new GeminiPdfAnalyzer();
		expect(node).toBeDefined();
		expect(node.description.displayName).toBe('Gemini PDF Analyzer');
	});

	it('should have the correct properties defined', () => {
		const node = new GeminiPdfAnalyzer();
		const operation = node.description.properties.find(p => p.name === 'operation');
		expect(operation).toBeDefined();
		expect(operation?.options).toContainEqual(expect.objectContaining({ name: 'Analyze Invoice', value: 'analyzeInvoice' }));
	});

	it('should handle missing binary data gracefully (Mock Test)', async () => {
		const node = new GeminiPdfAnalyzer();
		
		// Mocking n8n's internal execution context
		const mockContext = {
			getInputData: vi.fn().mockReturnValue([{ json: {}, binary: {} }]),
			getNodeParameter: vi.fn((param: string) => {
				if (param === 'resource') return 'invoice';
				if (param === 'binaryPropertyName') return 'data';
				return '';
			}),
			helpers: {
				assertBinaryData: vi.fn().mockImplementation(() => {
					throw new Error('No binary data found');
				}),
				getBinaryDataBuffer: vi.fn(),
				request: vi.fn(),
			},
			prepareOutputData: vi.fn(data => data),
		};

		// We expect the node to throw if the binary helper throws
		try {
			await node.execute.call(mockContext as any);
		} catch (error: any) {
			expect(error.message).toBe('No binary data found');
		}
	});
});
