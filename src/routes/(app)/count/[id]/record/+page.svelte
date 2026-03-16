<script lang="ts">
	import { MicrophoneIcon, StopIcon } from 'phosphor-svelte';
	import { DeepgramService } from '$lib/services/transcription/deepgramService';

	let { data } = $props();
	let transcription = $state('Start recording to log items...');
	let isRecording = $state(false);

	let transcriptionService = new DeepgramService(data.keywords);

	const parseItem = (transcript: string) => {
		console.log(transcript);
	};

	const startRecording = async () => {
		isRecording = true;
		await transcriptionService.start((transcript, isFinal) => {
			if (isFinal && transcript !== '') {
				transcription = transcript;
				parseItem(transcription);
			} else if (transcript !== '') {
				transcription = transcript;
			}
		});
	};

	const stopRecording = () => {
		transcriptionService.stop();
		isRecording = false;
		transcription = 'Start recording to log items...';
	};
</script>

<div class="flex min-h-full w-full flex-col items-center gap-4 px-4 py-4">
	<h1 class="text-2xl font-bold">{data.count.name}</h1>
	{#if data.productListName}
		<div class="badge badge-soft badge-primary">{data.productListName}</div>
	{/if}
	<div class="card w-full rounded-2xl card-border">
		<div class="card-body items-center text-center text-base-content">
			<p>{transcription}</p>
		</div>
	</div>

	<div class="flex w-full grow flex-col card-border"></div>

	<div class="flex w-full flex-row items-center justify-center gap-8">
		<button class="btn btn-circle bg-blue-100" aria-label="Toggle Recording"> </button>
		{#if !isRecording}
			<button
				onclick={() => startRecording()}
				class="btn btn-circle bg-blue-400 btn-xl"
				aria-label="Toggle Recording"
			>
				<MicrophoneIcon color="white" weight="bold" />
			</button>
		{:else}
			<button
				onclick={() => stopRecording()}
				class="btn btn-circle bg-red-400 btn-xl"
				aria-label="Toggle Recording"
			>
				<StopIcon color="white" weight="bold" />
			</button>
		{/if}

		<button class="btn btn-circle bg-blue-100" aria-label="Toggle Recording"> </button>
	</div>
</div>
