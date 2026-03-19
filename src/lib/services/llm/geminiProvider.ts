import { GoogleGenAI } from '@google/genai';
import type { ParsedItem, ParseTranscriptFn } from './openaiProvider';

export function createGeminiParser(apiKey: string, model = 'gemini-2.5-flash'): ParseTranscriptFn {
	const ai = new GoogleGenAI({ apiKey });

	return async (transcript, products) => {
		const response = await ai.models.generateContent({
			model,
			config: {
				responseMimeType: 'application/json',
				systemInstruction: `You are a stock counting assistant in a cocktail bar. Extract items and quantities from a voice transcript.
Only include items that match the product list. Count can be a decimal or integer value. Confidence is measured in a range from 0-1. Return JSON: { "items": [{ "itemName": string, "count": number, "confidence": number }] } \n#Product List\n${products.join(', ')}`
			},
			contents: `Transcript: "${transcript}"`
		});

		const parsed = JSON.parse(response.text ?? '{"items":[]}') as { items: ParsedItem[] };
		return parsed.items ?? [];
	};
}
