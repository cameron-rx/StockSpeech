import { fail, redirect } from '@sveltejs/kit';
import { getString, getRequiredString } from '$lib/server/form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return { counts: [], hasProducts: false };

	const [{ data: countRows }, { count: productCount }] = await Promise.all([
		locals.supabase
			.from('stock_counts')
			.select('id, name, completed, started_at')
			.eq('user_id', user.id)
			.order('started_at', { ascending: false }),
		locals.supabase
			.from('products')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', user.id)
	]);

	const counts =
		countRows?.map((row) => ({
			id: row.id,
			name: row.name,
			completed: row.completed !== 'in_progress',
			date: new Date(row.started_at)
		})) ?? [];

	return { counts, hasProducts: (productCount ?? 0) > 0 };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });
		const formData = await request.formData();
		const name = getRequiredString(formData, 'name');

		if (!name) return fail(400, { error: 'Name is required' });

		const { data, error } = await locals.supabase
			.from('stock_counts')
			.insert({
				name,
				user_id: user.id
			})
			.select('id')
			.single();

		if (error) return fail(500, { error: error.message });

		redirect(303, `/count/${data.id}`);
	},

	deleteCount: async ({ locals, request }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });

		const formData = await request.formData();
		const countId = getString(formData, 'countId');
		if (!countId) return fail(400, { error: 'Count ID is required' });

		const { error } = await locals.supabase.from('stock_counts').delete().eq('id', countId).eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	},

	editCount: async ({ locals, request }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });

		const formData = await request.formData();
		const countId = getString(formData, 'countId');
		const name = getRequiredString(formData, 'name');

		if (!countId) return fail(400, { error: 'Count ID is required' });
		if (!name) return fail(400, { error: 'Name is required' });

		const { error } = await locals.supabase.from('stock_counts').update({ name }).eq('id', countId).eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	}
};
