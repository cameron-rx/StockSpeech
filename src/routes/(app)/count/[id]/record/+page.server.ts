import { fail, redirect } from '@sveltejs/kit';
import { getString, getNumber } from '$lib/server/form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { user } = await locals.safeGetSession();
	if (!user) redirect(303, '/login');

	const { data: count } = await locals.supabase
		.from('stock_counts')
		.select('id, name, completed')
		.eq('id', params.id)
		.eq('user_id', user.id)
		.single();

	if (!count || count.completed !== 'in_progress') redirect(303, `/count/${params.id}`);

	const { data: productRows } = await locals.supabase
		.from('products')
		.select('id, name')
		.eq('user_id', user.id)
		.eq('active', true)
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
		const itemId = getString(formData, 'itemId');
		if (!itemId) return fail(400, { error: 'Item ID is required' });
		const { error } = await locals.supabase.from('count_items').delete().eq('id', itemId);
		if (error) return fail(500, { error: error.message });
	},

	editItem: async ({ request, locals }) => {
		const formData = await request.formData();
		const itemId = getString(formData, 'itemId');
		const productId = getString(formData, 'productId');
		const quantity = getNumber(formData, 'quantity');

		if (!itemId || !productId || quantity == null) return fail(400, { error: 'Missing fields' });
		const { error } = await locals.supabase
			.from('count_items')
			.update({ product_id: productId, quantity })
			.eq('id', itemId);
		if (error) return fail(500, { error: error.message });
	},

	addItem: async ({ request, locals, params }) => {
		const formData = await request.formData();
		const productName = getString(formData, 'productId');
		const quantity = getNumber(formData, 'quantity');

		if (!productName || quantity == null) return fail(400, { error: 'Missing fields' });

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
