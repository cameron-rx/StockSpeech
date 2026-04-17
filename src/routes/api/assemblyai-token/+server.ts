import { ASSEMBLY_AI_API_KEY } from '$env/static/private';
import { AssemblyAI } from 'assemblyai';
import { json } from '@sveltejs/kit';
import { getEnv } from '$lib/server/env';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ platform }) => {
	const apiKey = getEnv(platform, 'ASSEMBLY_AI_API_KEY', ASSEMBLY_AI_API_KEY);
	const client = new AssemblyAI({ apiKey });
	const access_token = await client.streaming.createTemporaryToken({
		expires_in_seconds: 60
	});

	return json({ access_token });
};
