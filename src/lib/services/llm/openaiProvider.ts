import OpenAI from 'openai';

export type ParsedItem = { itemName: string; count: number; confidence: number };

export type ParseTranscriptFn = (transcript: string, products: string[]) => Promise<ParsedItem[]>;

export function createOpenAIParser(apiKey: string, model = 'gpt-5.4-mini'): ParseTranscriptFn {
	const openai = new OpenAI({ apiKey });

	return async (transcript, products) => {
		const response = await openai.responses.create({
			model,
			instructions: `You are a stock counting assistant in a cocktail bar. Extract items and quantities from a voice transcript.
Only include items that match the product list. Count can be a decimal or integer value. Confidence is measured in a range from 0-1. Return JSON: { "items": [{ "itemName": string, "count": number, "confidence": number }] } \n#Product List\n${products.join(', ')}`,
			input: `Transcript: "${transcript}". Respond in JSON.`,
			text: { format: { type: 'json_object' } }
		});

		const parsed = JSON.parse(response.output_text ?? '{"items":[]}') as {
			items: ParsedItem[];
		};

		return parsed.items ?? [];
	};
}
