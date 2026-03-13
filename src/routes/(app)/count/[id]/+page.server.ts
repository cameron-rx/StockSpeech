import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { data: count } = await locals.supabase
		.from('stock_counts')
		.select('id, name, completed, started_at, product_list:product_lists!product_list_id(name)')
		.eq('id', params.id)
		.single();

	if (!count) redirect(303, '/');

	const { data: items } = await locals.supabase
		.from('count_items')
		.select('id, quantity, product:products!product_id(name, unit)')
		.eq('stock_count_id', params.id);

	const pl = count!.product_list;
	const productListName = (Array.isArray(pl) ? pl[0] : pl)?.name ?? null;

	return {
		count: { ...count!, productListName },
		items: items ?? []
	};
};

export const actions: Actions = {
	delete: async ({ locals, params }) => {
		const { error } = await locals.supabase
			.from('stock_counts')
			.delete()
			.eq('id', params.id);

		if (error) return fail(500, { error: error.message });

		redirect(303, '/');
	},

	complete: async ({ locals, params }) => {
		const { error } = await locals.supabase
			.from('stock_counts')
			.update({ completed: 'completed', completed_at: new Date().toISOString() })
			.eq('id', params.id);

		if (error) return fail(500, { error: error.message });
	}
};
