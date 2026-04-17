import OpenAI from 'openai';
import type { ParsedItem, ParseTranscriptFn } from './types';
import { getSystemPrompt } from './prompt';

export function createOpenAIParser(apiKey: string, model = 'gpt-5.4-mini'): ParseTranscriptFn {
	const openai = new OpenAI({ apiKey });

	return async (transcript, products) => {
		const response = await openai.responses.create({
			model,
			instructions: getSystemPrompt(products),
			input: `Transcript: "${transcript}". Respond in JSON.`,
			text: { format: { type: 'json_object' } }
		});

		const parsed = JSON.parse(response.output_text ?? '{"items":[]}') as {
			items: ParsedItem[];
		};

		return parsed.items ?? [];
	};
}
