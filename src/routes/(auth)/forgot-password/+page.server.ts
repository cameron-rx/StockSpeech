import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getRequiredString } from '$lib/server/form';

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const form = await request.formData();
		const email = getRequiredString(form, 'email');

		if (!email) {
			return fail(400, { message: 'Email is required' });
		}

		const redirectTo = `${url.origin}/auth/callback?next=/reset-password`;

		const { error } = await locals.supabase.auth.resetPasswordForEmail(email, { redirectTo });

		if (error) {
			console.error('Password reset error:', error.message);
		}

		// Always return success to not reveal if email exists
		return { success: true };
	}
};
