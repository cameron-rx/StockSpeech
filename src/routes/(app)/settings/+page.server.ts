import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) redirect(303, '/login');

	const [{ data: profile }, { data: venueUsers }] = await Promise.all([
		locals.supabase.from('profiles').select('full_name').eq('id', user.id).single(),
		locals.supabase.from('venue_users').select('venue_id').eq('user_id', user.id)
	]);

	const venueIds = venueUsers?.map((vu) => vu.venue_id) ?? [];

	const { data: venues } = venueIds.length
		? await locals.supabase.from('venues').select('id, name').in('id', venueIds)
		: { data: [] };

	return {
		fullName: profile?.full_name ?? '',
		venues
	};
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		await locals.supabase.auth.signOut();
		redirect(303, '/login');
	}
};
