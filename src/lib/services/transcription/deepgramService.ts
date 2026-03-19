import { DeepgramClient } from '@deepgram/sdk';
import type { TranscriptionService } from './types';
import { MicrophoneService } from '../microphone/microphoneService';

export class DeepgramService implements TranscriptionService {
	private mic = new MicrophoneService();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private connection: any = null;
	private keywords: string[];

	constructor(keywords: string[] = []) {
		this.keywords = keywords;
	}

	async start(onTranscript: (text: string, isFinal: boolean) => void): Promise<void> {
		// 1. Fetch Deepgram access token from edge function
		const res = await fetch('/api/deepgram-token', { method: 'POST' });
		const { access_token } = (await res.json()) as { access_token: string };

		// 2. Create client + connection
		const client = new DeepgramClient({ accessToken: access_token });
		const connection = await client.listen.v1.connect({
			model: 'nova-3',
			encoding: 'linear16',
			sample_rate: 16000,
			channels: 1,
			interim_results: 'true',
			punctuate: 'true',
			numerals: 'true',
			endpointing: 500,
			keyterm: this.keywords,
			Authorization: `Bearer ${access_token}`
		});
		this.connection = connection;

		// 3. Register event handlers
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		connection.on('message', (data: any) => {
			if (data.type !== 'Results') return;
			const transcript: string = data.channel?.alternatives?.[0]?.transcript ?? '';
			onTranscript(transcript, data.is_final);
		});
		connection.on('error', (err: unknown) => console.error('Deepgram error', err));

		// 4. Open socket
		connection.connect();
		await connection.waitForOpen();

		// 5. Start mic and pipe PCM chunks
		await this.mic.start((chunk: Int16Array) => {
			connection.socket.send(chunk.buffer as ArrayBuffer);
		});
	}

	stop(): void {
		this.mic.stop();
		this.connection?.close();
		this.connection = null;
	}
}
