import { fail } from '@sveltejs/kit';
import OpenAI from 'openai';
import { OPEN_AI_API_KEY } from '$env/static/private';
import { getEnv } from '$lib/server/env';
import { getString, getRequiredString } from '$lib/server/form';
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

	const { data: productRows } = await locals.supabase
		.from('products')
		.select('id, name, unit, active, count_items!product_id(id)')
		.eq('user_id', user.id)
		.order('display_order');

	const products = (productRows ?? []).map((p) => ({
		id: p.id,
		name: p.name,
		unit: p.unit,
		active: p.active,
		inUse: Array.isArray(p.count_items) && p.count_items.length > 0
	}));

	return { products };
};

export const actions: Actions = {
	addProduct: async ({ locals, request }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });

		const formData = await request.formData();
		const name = getRequiredString(formData, 'name');
		const unit = getString(formData, 'unit') || null;

		if (!name) return fail(400, { error: 'Name is required' });

		const { error } = await locals.supabase
			.from('products')
			.insert({ name, unit, user_id: user.id });

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

		const apiKey = getEnv(platform, 'OPEN_AI_API_KEY', OPEN_AI_API_KEY);
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
		const productId = getString(formData, 'productId');
		if (!productId) return fail(400, { error: 'Product ID is required' });

		const { data: refs } = await locals.supabase
			.from('count_items')
			.select('id')
			.eq('product_id', productId)
			.limit(1);

		if (refs && refs.length > 0)
			return fail(400, { error: 'Product is in use and cannot be deleted.' });

		const { error } = await locals.supabase.from('products').delete().eq('id', productId);

		if (error) return fail(500, { error: error.message });
	},

	disableProduct: async ({ locals, request }) => {
		const formData = await request.formData();
		const productId = getString(formData, 'productId');
		if (!productId) return fail(400, { error: 'Product ID is required' });

		const { error } = await locals.supabase
			.from('products')
			.update({ active: false })
			.eq('id', productId);

		if (error) return fail(500, { error: error.message });
	},

	enableProduct: async ({ locals, request }) => {
		const formData = await request.formData();
		const productId = getString(formData, 'productId');
		if (!productId) return fail(400, { error: 'Product ID is required' });

		const { error } = await locals.supabase
			.from('products')
			.update({ active: true })
			.eq('id', productId);

		if (error) return fail(500, { error: error.message });
	},

	editProduct: async ({ locals, request }) => {
		const formData = await request.formData();
		const productId = getString(formData, 'productId');
		const name = getRequiredString(formData, 'name');
		const unit = getString(formData, 'unit') || null;

		if (!productId) return fail(400, { error: 'Product ID is required' });
		if (!name) return fail(400, { error: 'Name is required' });

		const { error } = await locals.supabase
			.from('products')
			.update({ name, unit })
			.eq('id', productId);

		if (error) return fail(500, { error: error.message });
	}
};
