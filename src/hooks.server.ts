import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import { type Handle, type HandleServerError } from '@sveltejs/kit';
import { getEnv } from '$lib/server/env';

export const handle: Handle = async ({ event, resolve }) => {
	const supabaseUrl = getEnv(event.platform, 'PUBLIC_SUPABASE_URL', PUBLIC_SUPABASE_URL);
	const supabaseKey = getEnv(
		event.platform,
		'PUBLIC_SUPABASE_PUBLISHABLE_KEY',
		PUBLIC_SUPABASE_PUBLISHABLE_KEY
	);

	event.locals.supabase = createServerClient(supabaseUrl, supabaseKey, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) =>
					event.cookies.set(name, value, { ...options, path: '/' })
				);
			}
		}
	});

	// Safe session helper — validates the JWT by contacting Supabase Auth server
	event.locals.safeGetSession = async () => {
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error || !user) return { session: null, user: null };
		return { session: null, user };
	};

	if (event.url.pathname.startsWith('/api/')) {
		const { user } = await event.locals.safeGetSession();
		if (!user) {
			return new Response('Unauthorized', { status: 401 });
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

export const handleError: HandleServerError = ({ error, event }) => {
	console.error('Server error:', error, event.url.pathname);
	return { message: 'An unexpected error occurred' };
};
