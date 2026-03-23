import { GoogleGenAI } from '@google/genai';
import type { ParsedItem, ParseTranscriptFn } from './openaiProvider';

export function createGeminiParser(apiKey: string, model = 'gemini-2.5-flash'): ParseTranscriptFn {
	const ai = new GoogleGenAI({ apiKey });

	return async (transcript, products) => {
		const response = await ai.models.generateContent({
			model,
			config: {
				responseMimeType: 'application/json',
				systemInstruction: `You are a stock counting assistant in a cocktail bar. Extract items and quantities from a voice transcript that has been automatically transcribed and may contain errors.
Only include items that match the product list. Count can be a decimal or integer value. Confidence is measured in a range from 0-1. Return JSON: { "items": [{ "itemName": string, "count": number, "confidence": number }] }

When interpreting quantities, account for common speech-to-text mistranscriptions:
- Homophones for numbers: "to" or "too" used as a quantity means 2; "for" used as a quantity means 4; "won" means 1; "ate" means 8
- Written-out numbers: convert "one", "two", "three" etc. to digits
- Fractions: "half" or "a half" = 0.5; "quarter" = 0.25; "and a half" adds 0.5 (e.g. "two and a half" = 2.5)
- "dozen" = 12
- When a word that is normally a preposition ("to", "for") appears directly before a product name, treat it as the number equivalent

#Product List
${products.join(', ')}`
			},
			contents: `Transcript: "${transcript}"`
		});

		const parsed = JSON.parse(response.text ?? '{"items":[]}') as { items: ParsedItem[] };
		return parsed.items ?? [];
	};
}
