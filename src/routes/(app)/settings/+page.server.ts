import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) redirect(303, '/login');

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('full_name')
		.eq('id', user.id)
		.single();

	return {
		email: user.email ?? '',
		fullName: profile?.full_name ?? ''
	};
};

export const actions: Actions = {
	updateProfile: async ({ locals, request }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Not authenticated' });

		const formData = await request.formData();
		const fullName = (formData.get('fullName') as string)?.trim();

		if (!fullName) return fail(400, { error: 'Name is required' });

		const { error } = await locals.supabase
			.from('profiles')
			.update({ full_name: fullName })
			.eq('id', user.id);

		if (error) return fail(500, { error: error.message });

		return { success: true };
	},

	logout: async ({ locals }) => {
		await locals.supabase.auth.signOut();
		redirect(303, '/login');
	}
};
