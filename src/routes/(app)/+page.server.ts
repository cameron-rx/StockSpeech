import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: countRows }, { data: productLists }] = await Promise.all([
		locals.supabase
			.from('stock_counts')
			.select('id, name, completed, started_at, user:profiles!user_id(full_name)')
			.order('started_at', { ascending: false }),
		locals.supabase.from('product_lists').select('id, name')
	]);

	const counts =
		countRows?.map((row) => ({
			id: row.id,
			name: row.name,
			completed: row.completed !== 'in_progress',
			date: new Date(row.started_at),
			userName: (Array.isArray(row.user) ? row.user[0] : row.user)?.full_name ?? 'Unknown'
		})) ?? [];

	return { counts, productLists: productLists ?? [] };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const productListId = formData.get('product_list_id') as string;
		const venueId = formData.get('venue_id') as string;

		if (!name?.trim()) return fail(400, { error: 'Name is required' });
		if (!productListId) return fail(400, { error: 'Please select a product list' });
		if (!venueId) return fail(400, { error: 'No venue selected. Please set one in Settings.' });

		const { data, error } = await locals.supabase
			.from('stock_counts')
			.insert({
				name: name.trim(),
				product_list_id: productListId,
				venue_id: venueId,
				user_id: user.id
			})
			.select('id')
			.single();

		if (error) return fail(500, { error: error.message });

		redirect(303, `/count/${data.id}`);
	}
};
