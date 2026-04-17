import { GoogleGenAI } from '@google/genai';
import type { ParsedItem, ParseTranscriptFn } from './types';
import { getSystemPrompt } from './prompt';

export function createGeminiParser(apiKey: string, model = 'gemini-2.5-flash'): ParseTranscriptFn {
	const ai = new GoogleGenAI({ apiKey });

	return async (transcript, products) => {
		const response = await ai.models.generateContent({
			model,
			config: {
				responseMimeType: 'application/json',
				systemInstruction: getSystemPrompt(products)
			},
			contents: `Transcript: "${transcript}"`
		});

		const parsed = JSON.parse(response.text ?? '{"items":[]}') as { items: ParsedItem[] };
		return parsed.items ?? [];
	};
}
