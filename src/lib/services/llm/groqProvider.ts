import OpenAI from 'openai';
import type { ParsedItem, ParseTranscriptFn } from './types';
import { getSystemPrompt } from './prompt';

export function createGroqParser(apiKey: string, model = 'openai/gpt-oss-20b'): ParseTranscriptFn {
	const openai = new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });

	return async (transcript, products) => {
		const response = await openai.responses.create({
			model,
			instructions: getSystemPrompt(products),
			input: `Transcript: "${transcript}"`,
			text: { format: { type: 'json_object' } }
		});

		const parsed = JSON.parse(response.output_text ?? '{"items":[]}') as {
			items: ParsedItem[];
		};

		return parsed.items ?? [];
	};
}
