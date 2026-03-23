import type { TranscriptionService } from './types';
import { MicrophoneService } from '../microphone/microphoneService';
import { StreamingTranscriber } from 'assemblyai';

const CHUNK_SAMPLES = 1600; // 100ms at 16kHz

const NUMBER_KEYTERMS = [
	'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
	'eleven', 'twelve', 'dozen', 'half', 'quarter'
];

export class AssemblyAIService implements TranscriptionService {
	private mic = new MicrophoneService();
	private transcriber: StreamingTranscriber | null = null;
	private keywords: string[];
	private buffer: Int16Array[] = [];
	private bufferSamples = 0;

	constructor(keywords: string[] = []) {
		this.keywords = [...new Set([...keywords, ...NUMBER_KEYTERMS])];
	}

	async start(onTranscript: (text: string, isFinal: boolean) => void): Promise<void> {
		const res = await fetch('/api/assemblyai-token', { method: 'POST' });
		const { access_token } = (await res.json()) as { access_token: string };

		const transcriber = new StreamingTranscriber({
			speechModel: 'u3-rt-pro',
			sampleRate: 16000,
			keytermsPrompt: this.keywords,
			token: access_token
		});
		this.transcriber = transcriber;

		transcriber.on('open', ({ id }) => console.log(`AssemblyAI session opened: ${id}`));
		transcriber.on('error', (error) => console.error('AssemblyAI error:', error));
		transcriber.on('close', (code, reason) =>
			console.log('AssemblyAI session closed:', code, reason)
		);

		transcriber.on('turn', (turn) => {
			console.log(turn);
			if (!turn.transcript) return;
			onTranscript(turn.transcript, turn.end_of_turn);
		});

		await transcriber.connect();

		await this.mic.start((chunk: Int16Array) => {
			this.buffer.push(chunk);
			this.bufferSamples += chunk.length;

			if (this.bufferSamples >= CHUNK_SAMPLES) {
				const total = new Int16Array(this.bufferSamples);
				let offset = 0;
				for (const c of this.buffer) {
					total.set(c, offset);
					offset += c.length;
				}
				transcriber.sendAudio(total.buffer as ArrayBuffer);
				this.buffer = [];
				this.bufferSamples = 0;
			}
		});
	}

	stop(): void {
		this.mic.stop();
		this.buffer = [];
		this.bufferSamples = 0;
		this.transcriber?.close();
		this.transcriber = null;
	}
}
