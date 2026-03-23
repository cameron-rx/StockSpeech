import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { data: productList } = await locals.supabase
		.from('product_lists')
		.select('id, name')
		.eq('id', params.id)
		.single();

	if (!productList) redirect(303, '/products');

	const { data: products } = await locals.supabase
		.from('products')
		.select('id, name, unit')
		.eq('product_list_id', params.id)
		.order('display_order');

	return { productList: productList!, products: products ?? [] };
};

export const actions: Actions = {
	addProduct: async ({ locals, params, request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const unit = (formData.get('unit') as string) || null;

		if (!name?.trim()) return fail(400, { error: 'Name is required' });

		const { error } = await locals.supabase
			.from('products')
			.insert({ name: name.trim(), unit, product_list_id: params.id });

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
