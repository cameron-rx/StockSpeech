import { fail } from '@sveltejs/kit';
import OpenAI from 'openai';
import { OPEN_AI_API_KEY } from '$env/static/private';
import type { Actions, PageServerLoad } from './$types';

type ImportedProduct = {
	name: string;
	unit: string | null;
};

type ProductImportResponse = {
	products: ImportedProduct[];
};

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return { products: [] };

	const { data: products } = await locals.supabase
		.from('products')
		.select('id, name, unit')
		.eq('user_id', user.id)
		.order('display_order');

	return { products: products ?? [] };
};

export const actions: Actions = {
	addProduct: async ({ locals, request }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const unit = (formData.get('unit') as string) || null;

		if (!name?.trim()) return fail(400, { error: 'Name is required' });

		const { error } = await locals.supabase
			.from('products')
			.insert({ name: name.trim(), unit, user_id: user.id });

		if (error) return fail(500, { error: error.message });
	},

	uploadProducts: async ({ locals, request, platform }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });

		const formData = await request.formData();
		const file = formData.get('productList');

		if (!(file instanceof File)) {
			return fail(400, { error: 'No file uploaded' });
		}

		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);
		let binary = '';
		for (let i = 0; i < uint8Array.length; i++) {
			binary += String.fromCharCode(uint8Array[i]);
		}
		const base64 = btoa(binary);
		const dataUrl = `data:${file.type};base64,${base64}`;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const apiKey = (platform?.env as any)?.OPENAI_API_KEY ?? OPEN_AI_API_KEY;
		const client = new OpenAI({ apiKey });
		const systemPrompt = `You are a stock management assistant. Extract a product list from the provided file.
		Return ONLY valid JSON in this exact format, no markdown, no explanation:
		{"products":[{"name":"string","unit":"string or null"}]}
		- unit should be the unit of measure if present (e.g. bottle, kg, case), otherwise null
		- include every distinct product you can identify
		- normalise product names to title case`;

		const response = await client.responses.create({
			model: 'gpt-5-nano',
			input: [
				{
					role: 'user',
					content: [
						{
							type: 'input_file',
							filename: file.name,
							file_data: dataUrl
						},
						{
							type: 'input_text',
							text: 'Extract products from this file'
						}
					]
				}
			],
			instructions: systemPrompt
		});

		const res = JSON.parse(response.output_text) as ProductImportResponse;
		const productsToInsert = res.products.map((p) => {
			return { name: p.name, unit: p.unit, user_id: user.id };
		});

		const { error } = await locals.supabase.from('products').insert(productsToInsert);

		if (error) return fail(500, { error: error.message });
	},

	deleteProduct: async ({ locals, request }) => {
		const formData = await request.formData();
		const productId = formData.get('productId') as string;

		const { error } = await locals.supabase.from('products').delete().eq('id', productId);

		if (error) return fail(500, { error: error.message });
	},

	editProduct: async ({ locals, request }) => {
		const formData = await request.formData();
		const productId = formData.get('productId') as string;
		const name = formData.get('name') as string;
		const unit = (formData.get('unit') as string) || null;

		if (!name?.trim()) return fail(400, { error: 'Name is required' });

		const { error } = await locals.supabase
			.from('products')
			.update({ name: name.trim(), unit })
			.eq('id', productId);

		if (error) return fail(500, { error: error.message });
	}
};
