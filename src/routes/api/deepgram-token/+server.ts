import { DEEPGRAM_API_KEY } from '$env/static/private';
import { DeepgramClient } from '@deepgram/sdk';
import { json } from '@sveltejs/kit';

export async function POST() {
	const client = new DeepgramClient({ apiKey: DEEPGRAM_API_KEY });
	const { access_token } = await client.auth.v1.tokens.grant();
	return json({ access_token });
}
