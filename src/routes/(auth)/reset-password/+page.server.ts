import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getString } from '$lib/server/form';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const password = getString(form, 'password');
		const confirmPassword = getString(form, 'confirm-password');

		if (!password || !confirmPassword) {
			return fail(400, { message: 'Both fields are required' });
		}

		if (password.length < 6) {
			return fail(400, { message: 'Password must be at least 6 characters' });
		}

		if (password !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match' });
		}

		const { error } = await locals.supabase.auth.updateUser({ password });

		if (error) {
			return fail(400, { message: error.message });
		}

		redirect(303, '/');
	}
};
