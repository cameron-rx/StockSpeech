import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { data: count } = await locals.supabase
		.from('stock_counts')
		.select('id, name, completed, product_list:product_lists!product_list_id(id, name, products(id, name))')
		.eq('id', params.id)
		.single();

	if (!count || count.completed !== 'in_progress') redirect(303, `/count/${params.id}`);

	const pl = Array.isArray(count.product_list) ? count.product_list[0] : count.product_list;
	const productListName = pl?.name ?? null;
	const products = (pl?.products ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }));
	const keywords = products.map((p: { name: string }) => p.name);

	return {
		count: { id: count.id, name: count.name, completed: count.completed },
		productListName,
		keywords,
		products
	};
};
