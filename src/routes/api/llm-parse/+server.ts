import { GROQ_API_KEY } from '$env/static/private';

import type { RequestHandler } from './$types';
import { getEnv } from '$lib/server/env';
import { rateLimit } from '$lib/server/rateLimit';
import { createGroqParser } from '$lib/services/llm/groqProvider';
import type { ParseTranscriptFn } from '$lib/services/llm/types';

type Product = { id: string; name: string };

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return new Response('Unauthorized', { status: 401 });

	if (!rateLimit(`llm:${user.id}`, 30, 60_000)) {
		return new Response('Too many requests', { status: 429 });
	}
	const body = (await request.json()) as {
		transcript: string;
		stockCountId: string;
		products: Product[];
	};

	const { transcript, stockCountId, products } = body;

	if (!transcript || typeof transcript !== 'string' || transcript.length > 2000) {
		return new Response('Invalid transcript', { status: 400 });
	}
	if (!stockCountId || typeof stockCountId !== 'string') {
		return new Response('Invalid stockCountId', { status: 400 });
	}
	if (!Array.isArray(products) || products.length > 500) {
		return new Response('Invalid products', { status: 400 });
	}

	// Verify the stock count belongs to this user
	const { data: countOwner } = await locals.supabase
		.from('stock_counts')
		.select('id')
		.eq('id', stockCountId)
		.eq('user_id', user.id)
		.single();
	if (!countOwner) {
		return new Response('Forbidden', { status: 403 });
	}

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
