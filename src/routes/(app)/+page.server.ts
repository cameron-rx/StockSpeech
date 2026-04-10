import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: countRows }] = await Promise.all([
		locals.supabase
			.from('stock_counts')
			.select('id, name, completed, started_at, user:profiles!user_id(full_name)')
			.order('started_at', { ascending: false })
	]);

	const counts =
		countRows?.map((row) => ({
			id: row.id,
			name: row.name,
			completed: row.completed !== 'in_progress',
			date: new Date(row.started_at),
			userName: (Array.isArray(row.user) ? row.user[0] : row.user)?.full_name ?? 'Unknown'
		})) ?? [];

	return { counts };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });
		const formData = await request.formData();
		const name = formData.get('name') as string;

		if (!name?.trim()) return fail(400, { error: 'Name is required' });

		const { data, error } = await locals.supabase
			.from('stock_counts')
			.insert({
				name: name.trim(),
				user_id: user.id
			})
			.select('id')
			.single();

		if (error) return fail(500, { error: error.message });

		redirect(303, `/count/${data.id}`);
	},

	deleteCount: async ({ locals, request }) => {
		const formData = await request.formData();
		const countId = formData.get('countId') as string;

		const { error } = await locals.supabase.from('stock_counts').delete().eq('id', countId);

		if (error) return fail(500, { error: error.message });
	},

	editCount: async ({ locals, request }) => {
		const formData = await request.formData();
		const countId = formData.get('countId') as string;
		const name = formData.get('name') as string;

		if (!name?.trim()) return fail(400, { error: 'Name is required' });

		const { error } = await locals.supabase
			.from('stock_counts')
			.update({ name: name.trim() })
			.eq('id', countId);

		if (error) return fail(500, { error: error.message });
	}
};
