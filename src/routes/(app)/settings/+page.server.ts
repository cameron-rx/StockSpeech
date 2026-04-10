import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) redirect(303, '/login');

	const [{ data: profile }] = await Promise.all([
		locals.supabase.from('profiles').select('full_name').eq('id', user.id).single()
	]);

	return {
		fullName: profile?.full_name ?? ''
	};
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		await locals.supabase.auth.signOut();
		redirect(303, '/login');
	}
};
