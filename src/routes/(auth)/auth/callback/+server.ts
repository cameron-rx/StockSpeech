import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	const type = url.searchParams.get('type');

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			redirect(303, type === 'invite' ? '/welcome' : next);
		}
	}

	// If no code or exchange failed, redirect to login with error
	redirect(303, '/login');
};
