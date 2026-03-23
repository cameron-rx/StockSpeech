import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: rows } = await locals.supabase
		.from('product_lists')
		.select('id, name, creator:profiles!created_by(full_name)')
		.order('created_at', { ascending: false });

	const productLists =
		rows?.map((pl) => ({
			id: pl.id,
			name: pl.name,
			userName: (Array.isArray(pl.creator) ? pl.creator[0] : pl.creator)?.full_name ?? 'Unknown'
		})) ?? [];

	return { productLists };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const venueId = formData.get('venue_id') as string;

		if (!name?.trim()) return fail(400, { error: 'Name is required' });
		if (!venueId) return fail(400, { error: 'No venue selected. Please set one in Settings.' });

		const { data, error } = await locals.supabase
			.from('product_lists')
			.insert({ name: name.trim(), venue_id: venueId, created_by: user.id })
			.select('id')
			.single();

		if (error) return fail(500, { error: error.message });

		redirect(303, `/products/${data.id}`);
	},

	deleteList: async ({ locals, request }) => {
		const formData = await request.formData();
		const listId = formData.get('listId') as string;

		const { error } = await locals.supabase.from('product_lists').delete().eq('id', listId);

		if (error) return fail(500, { error: error.message });
	},

	editList: async ({ locals, request }) => {
		const formData = await request.formData();
		const listId = formData.get('listId') as string;
		const name = formData.get('name') as string;

		if (!name?.trim()) return fail(400, { error: 'Name is required' });

		const { error } = await locals.supabase
			.from('product_lists')
			.update({ name: name.trim() })
			.eq('id', listId);

		if (error) return fail(500, { error: error.message });
	}
};
