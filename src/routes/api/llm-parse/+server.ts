import { GROQ_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEnv } from '$lib/server/env';
import { createGroqParser } from '$lib/services/llm/groqProvider';
import type { ParseTranscriptFn } from '$lib/services/llm/types';

type Product = { id: string; name: string };

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const { transcript, stockCountId, products } = (await request.json()) as {
		transcript: string;
		stockCountId: string;
		products: Product[];
	};

	const apiKey = getEnv(platform, 'GROQ_API_KEY', GROQ_API_KEY);
	const parseTranscript: ParseTranscriptFn = createGroqParser(apiKey, 'llama-3.3-70b-versatile');

	const llmItems = await parseTranscript(
		transcript,
		products.map((p) => p.name)
	);

	const toInsert = llmItems
		.map((item) => {
			const product = products.find((p) => p.name.toLowerCase() === item.itemName.toLowerCase());
			return product
				? {
						stock_count_id: stockCountId,
						product_id: product.id,
						quantity: item.count,
						confidence: item.confidence,
						raw_transcription: transcript
					}
				: null;
		})
		.filter((item): item is NonNullable<typeof item> => item !== null);

	if (toInsert.length > 0) {
		const { error } = await locals.supabase.from('count_items').insert(toInsert);
		if (error) console.error('[llm-parse] insert error:', error);
	}

	return new Response(null, { status: 204 });
};
