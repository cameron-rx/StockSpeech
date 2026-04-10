import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { data: count } = await locals.supabase
		.from('stock_counts')
		.select('id, name, completed')
		.eq('id', params.id)
		.single();

	if (!count || count.completed !== 'in_progress') redirect(303, `/count/${params.id}`);

	const { data: productRows } = await locals.supabase
		.from('products')
		.select('id, name')
		.order('display_order');

	const products = (productRows ?? []).map((p) => ({ id: p.id, name: p.name }));
	const keywords = products.map((p) => p.name);

	return {
		count: { id: count.id, name: count.name, completed: count.completed },
		keywords,
		products
	};
};

export const actions: Actions = {
	deleteItem: async ({ request, locals }) => {
		const formData = await request.formData();
		const itemId = formData.get('itemId') as string;
		const { error } = await locals.supabase.from('count_items').delete().eq('id', itemId);
		if (error) return fail(500, { error: error.message });
	},

	editItem: async ({ request, locals }) => {
		const formData = await request.formData();
		const itemId = formData.get('itemId') as string;
		const productId = formData.get('productId') as string;
		const quantity = Number(formData.get('quantity'));
		const { error } = await locals.supabase
			.from('count_items')
			.update({ product_id: productId, quantity })
			.eq('id', itemId);
		if (error) return fail(500, { error: error.message });
	},

	addItem: async ({ request, locals, params }) => {
		const formData = await request.formData();
		const productName = formData.get('productId') as string;
		const quantity = Number(formData.get('quantity'));

		const { data: product } = await locals.supabase
			.from('products')
			.select('id')
			.ilike('name', productName)
			.single();

		if (!product) return fail(400, { error: 'Product not found' });

		const { error } = await locals.supabase
			.from('count_items')
			.insert({ stock_count_id: params.id, product_id: product.id, quantity });
		if (error) return fail(500, { error: error.message });
	}
};
