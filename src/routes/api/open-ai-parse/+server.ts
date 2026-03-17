import OpenAI from 'openai';
import { OPEN_AI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { StockItem } from '$lib/services/llm/types';

type Product = { id: string; name: string };

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const { transcript, stockCountId, products } = await request.json() as {
		transcript: string;
		stockCountId: string;
		products: Product[];
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const apiKey = (platform?.env as any)?.OPEN_AI_API_KEY ?? OPEN_AI_API_KEY;
	const openai = new OpenAI({ apiKey });

	const completion = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
		response_format: { type: 'json_object' },
		messages: [
			{
				role: 'system',
				content: `You are a stock counting assistant. Extract items and quantities from a voice transcript.
Only include items that match the product list. Return JSON: { "items": [{ "itemName": string, "count": number, "confidence": number }] }`
			},
			{
				role: 'user',
				content: `Transcript: "${transcript}"\nProduct list: ${products.map(p => p.name).join(', ')}`
			}
		]
	});

	const parsed = JSON.parse(completion.choices[0].message.content ?? '{"items":[]}') as {
		items: Array<{ itemName: string; count: number; confidence: number }>;
	};
	const llmItems = parsed.items ?? [];

	const toInsert = llmItems
		.map(item => {
			const product = products.find(p => p.name.toLowerCase() === item.itemName.toLowerCase());
			return product
				? { stock_count_id: stockCountId, product_id: product.id, quantity: item.count }
				: null;
		})
		.filter((item): item is NonNullable<typeof item> => item !== null);

	if (toInsert.length > 0) {
		await locals.supabase.from('count_items').insert(toInsert);
	}

	const stockItems: StockItem[] = llmItems
		.filter(item => products.some(p => p.name.toLowerCase() === item.itemName.toLowerCase()))
		.map(item => {
			const product = products.find(p => p.name.toLowerCase() === item.itemName.toLowerCase())!;
			return { ...item, id: product.id, rawTranscript: transcript };
		});

	return json(stockItems);
};
