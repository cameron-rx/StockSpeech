<script lang="ts">
	import { onMount } from 'svelte';
	import { MicrophoneIcon, StopIcon, XIcon } from 'phosphor-svelte';
	import { resolve } from '$app/paths';
	import { createBrowserClient } from '@supabase/ssr';
	import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
	import type { StockItem } from '$lib/services/llm/types';
	import { AssemblyAIService } from '$lib/services/transcription/assemblyaiService.js';

	let { data } = $props();
	let transcription = $state('Start recording to log items...');
	let isRecording = $state(false);
	let savedItems = $state<StockItem[]>([]);
	const browserSupabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);

	let debugString = $state('Debug string');

	let transcriptionService = new AssemblyAIService(data.keywords);

	onMount(() => {
		const channel = browserSupabase
			.channel(`count_items_${data.count.id}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'count_items',
					filter: `stock_count_id=eq.${data.count.id}`
				},
				(payload) => {
					const product = data.products.find(
						(p: { id: string; name: string }) => p.id === payload.new.product_id
					);
					if (product) {
						savedItems = [
							{
								id: payload.new.id,
								itemName: product.name,
								count: payload.new.quantity,
								confidence: 1,
								rawTranscript: ''
							},
							...savedItems
						];
					}
				}
			)
			.subscribe((status, err) => {
				console.log('Realtime status:', status, err);
				debugString = `${status} : ${err}`;
			});

		return () => {
			data.supabase.removeChannel(channel);
		};
	});

	const parseItem = async (transcript: string) => {
		await fetch('/api/llm-parse', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				transcript,
				stockCountId: data.count.id,
				products: data.products,
				provider: 'openai'
			})
		});
	};

	const startRecording = async () => {
		isRecording = true;
		await transcriptionService.start((transcript, isFinal) => {
			if (isFinal && transcript !== '') {
				transcription = transcript;
				parseItem(transcript);
			} else if (transcript !== '') {
				transcription = transcript;
			}
		});
		transcription = 'Listening for items...';
	};

	const stopRecording = () => {
		transcriptionService.stop();
		isRecording = false;
		transcription = 'Start recording to log items...';
	};
</script>

<div class="relative flex min-h-full w-full flex-col items-center gap-4 px-4 py-4">
	<a
		href={resolve(`/count/${data.count.id}`)}
		class="btn btn-ghost btn-sm btn-square absolute top-4 right-4"
		aria-label="Close"
	>
		<XIcon weight="bold" size={20} />
	</a>
	<h1 class="text-2xl font-bold">{data.count.name}</h1>
	{#if data.productListName}
		<div class="badge badge-soft badge-primary">{data.productListName}</div>
	{/if}
	<p>{debugString}</p>
	<div class="card w-full rounded-2xl card-border">
		<div class="card-body items-center text-center text-base-content">
			<p>{transcription}</p>
		</div>
	</div>

	<div class="flex w-full grow flex-col gap-2 overflow-y-auto">
		{#each savedItems as item (item.id)}
			<div
				class="flex items-center justify-between rounded-xl border border-base-content/10 px-4 py-3"
			>
				<span class="font-medium">{item.itemName}</span>
				<span class="badge badge-neutral">{item.count}</span>
			</div>
		{/each}
	</div>

	<div class="flex w-full flex-row items-center justify-center gap-8">
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
	</div>
</div>
