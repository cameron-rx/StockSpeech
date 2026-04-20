import { ASSEMBLY_AI_API_KEY } from '$env/static/private';
import { AssemblyAI } from 'assemblyai';
import { json } from '@sveltejs/kit';
import { getEnv } from '$lib/server/env';
import { rateLimit } from '$lib/server/rateLimit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ platform, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return new Response('Unauthorized', { status: 401 });

	if (!rateLimit(`assemblyai:${user.id}`, 10, 60_000)) {
		return new Response('Too many requests', { status: 429 });
	}
	const apiKey = getEnv(platform, 'ASSEMBLY_AI_API_KEY', ASSEMBLY_AI_API_KEY);
	const client = new AssemblyAI({ apiKey });
	const access_token = await client.streaming.createTemporaryToken({
		expires_in_seconds: 60
	});

	return json({ access_token });
};
