import { fail, redirect } from '@sveltejs/kit';
import { getString, getRequiredString, getNumber } from '$lib/server/form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { user } = await locals.safeGetSession();
	if (!user) redirect(303, '/login');

	const [{ data: count }, { data: items }, { data: products }] = await Promise.all([
		locals.supabase
			.from('stock_counts')
			.select('id, name, completed, started_at')
			.eq('id', params.id)
			.eq('user_id', user.id)
			.single(),
		locals.supabase
			.from('count_items')
			.select('id, quantity, confidence, product:products!product_id(id, name, unit)')
			.eq('stock_count_id', params.id),
		locals.supabase.from('products').select('id, name, unit').eq('active', true).order('name')
	]);

	if (!count) redirect(303, '/');

	return {
		count: { ...count!, date: new Date(count!.started_at) },
		items: items ?? [],
		products: products ?? []
	};
};

export const actions: Actions = {
	delete: async ({ locals, params }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });

		const { error } = await locals.supabase.from('stock_counts').delete().eq('id', params.id).eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });

		redirect(303, '/');
	},

	complete: async ({ locals, params }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });

		const { error } = await locals.supabase
			.from('stock_counts')
			.update({ completed: 'completed', completed_at: new Date().toISOString() })
			.eq('id', params.id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	},

	deleteItem: async ({ request, locals }) => {
		const formData = await request.formData();
		const itemId = getString(formData, 'itemId');
		if (!itemId) return fail(400, { error: 'Item ID is required' });

		const { error } = await locals.supabase.from('count_items').delete().eq('id', itemId);

		if (error) return fail(500, { error: error.message });
	},

	editCount: async ({ locals, params, request }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });

		const formData = await request.formData();
		const name = getRequiredString(formData, 'name');

		if (!name) return fail(400, { error: 'Name is required' });

		const { error } = await locals.supabase
			.from('stock_counts')
			.update({ name })
			.eq('id', params.id)
			.eq('user_id', user.id);

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
	}
};
