import { GROQ_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { StockItem } from '$lib/services/llm/types';
import { createGroqParser, type ParseTranscriptFn } from '$lib/services/llm/groqProvider';

type Product = { id: string; name: string };

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const { transcript, stockCountId, products } = (await request.json()) as {
		transcript: string;
		stockCountId: string;
		products: Product[];
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const apiKey = (platform?.env as any)?.GROQ_API_KEY ?? GROQ_API_KEY;
	const parseTranscript: ParseTranscriptFn = createGroqParser(apiKey, 'llama-3.3-70b-versatile');

	const llmItems = await parseTranscript(
		transcript,
		products.map((p) => p.name)
	);

	const toInsert = llmItems
		.map((item) => {
			const product = products.find((p) => p.name.toLowerCase() === item.itemName.toLowerCase());
			return product
				? { stock_count_id: stockCountId, product_id: product.id, quantity: item.count }
				: null;
		})
		.filter((item): item is NonNullable<typeof item> => item !== null);

	if (toInsert.length > 0) {
		await locals.supabase.from('count_items').insert(toInsert);
	}

	const stockItems: StockItem[] = llmItems
		.filter((item) => products.some((p) => p.name.toLowerCase() === item.itemName.toLowerCase()))
		.map((item) => {
			const product = products.find((p) => p.name.toLowerCase() === item.itemName.toLowerCase())!;
			return { ...item, id: product.id, rawTranscript: transcript };
		});

	return json(stockItems);
};
