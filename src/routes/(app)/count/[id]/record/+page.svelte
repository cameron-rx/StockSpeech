<script lang="ts">
	import { MicrophoneIcon, StopIcon } from 'phosphor-svelte';
	import { DeepgramService } from '$lib/services/transcription/deepgramService';
	import type { StockItem } from '$lib/services/llm/types';

	let { data } = $props();
	let transcription = $state('Start recording to log items...');
	let isRecording = $state(false);
	let savedItems = $state<StockItem[]>([]);

	let debugString = $state('Debug string');

	let transcriptionService = new DeepgramService(data.keywords);

	$effect(() => {
		const supabase = data.supabase!;
		// Track data.session.access_token as a reactive dependency so this effect
		// re-runs if the layout refreshes the session (common on iOS Safari).
		const _sessionToken = data.session?.access_token;
		let channel: ReturnType<typeof supabase.channel> | null = null;

		const subscribe = (accessToken: string) => {
			if (channel) {
				supabase.removeChannel(channel);
				channel = null;
			}

			supabase.realtime.setAuth(accessToken);

			channel = supabase
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
					if (err) console.error('Realtime error:', err);
					console.log('Realtime status:', status);
					debugString = `${status} : ${err}`;

					// Retry on connection failure (covers iOS WebSocket drops)
					if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
						setTimeout(() => {
							if (data.session?.access_token) subscribe(data.session.access_token);
						}, 2000);
					}
				});
		};

		if (_sessionToken) {
			subscribe(_sessionToken);
		}

		// Keep token fresh on refresh events
		const {
			data: { subscription: authListener }
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (session?.access_token) {
				subscribe(session.access_token);
			} else if (event === 'SIGNED_OUT') {
				if (channel) {
					supabase.removeChannel(channel);
					channel = null;
				}
			}
		});

		// Re-subscribe when iOS returns from background
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				supabase.auth.getSession().then(({ data: { session } }) => {
					if (session?.access_token) {
						subscribe(session.access_token);
					}
				});
			}
		};

		// Re-subscribe on iOS back-forward cache restoration
		const handlePageShow = (e: PageTransitionEvent) => {
			if (e.persisted && data.session?.access_token) {
				subscribe(data.session.access_token);
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('pageshow', handlePageShow);

		return () => {
			authListener.unsubscribe();
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('pageshow', handlePageShow);
			if (channel) supabase.removeChannel(channel);
		};
	});

	const parseItem = async (transcript: string) => {
		await fetch('/api/open-ai-parse', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				transcript,
				stockCountId: data.count.id,
				products: data.products
			})
		});
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
		transcription = 'Listening for items...';
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
