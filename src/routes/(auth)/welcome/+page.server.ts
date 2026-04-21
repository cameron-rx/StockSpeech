import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getString, getRequiredString } from '$lib/server/form';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) redirect(303, '/login');
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Not authenticated' });

		const form = await request.formData();
		const fullName = getRequiredString(form, 'fullName');
		const password = getString(form, 'password');
		const confirmPassword = getString(form, 'confirm-password');

		if (!fullName) {
			return fail(400, { message: 'Name is required' });
		}

		if (!password || !confirmPassword) {
			return fail(400, { message: 'Both password fields are required' });
		}

		if (password.length < 6) {
			return fail(400, { message: 'Password must be at least 6 characters' });
		}

		if (password !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match' });
		}

		const { error: passwordError } = await locals.supabase.auth.updateUser({ password });

		if (passwordError) {
			return fail(400, { message: passwordError.message });
		}

		const { error: profileError } = await locals.supabase
			.from('profiles')
			.update({ full_name: fullName })
			.eq('id', user.id);

		if (profileError) {
			return fail(500, { message: profileError.message });
		}

		redirect(303, '/');
	}
};
