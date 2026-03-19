import { ASSEMBLY_AI_API_KEY } from '$env/static/private';
import { AssemblyAI } from 'assemblyai';
import { json } from '@sveltejs/kit';

export async function POST() {
	const client = new AssemblyAI({ apiKey: ASSEMBLY_AI_API_KEY });
	const access_token = await client.streaming.createTemporaryToken({
		expires_in_seconds: 60
	});

	return json({ access_token });
}
