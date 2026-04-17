import { DEEPGRAM_API_KEY } from '$env/static/private';
import { DeepgramClient } from '@deepgram/sdk';
import { json } from '@sveltejs/kit';
import { getEnv } from '$lib/server/env';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ platform }) => {
	const apiKey = getEnv(platform, 'DEEPGRAM_API_KEY', DEEPGRAM_API_KEY);
	const client = new DeepgramClient({ apiKey });
	const { access_token } = await client.auth.v1.tokens.grant();
	return json({ access_token });
};
