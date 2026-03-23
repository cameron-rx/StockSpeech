<script lang="ts">
	import { onMount } from 'svelte';
	import { MicrophoneIcon, StopIcon, XIcon } from 'phosphor-svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { createBrowserClient } from '@supabase/ssr';
	import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
	import type { StockItem } from '$lib/services/llm/types';
	import { AssemblyAIService } from '$lib/services/transcription/assemblyaiService.js';
	import ActionDropdown from '$lib/components/ActionDropdown.svelte';

	let { data } = $props();
	let transcription = $state('Start recording to log items...');
	let isRecording = $state(false);
	let savedItems = $state<StockItem[]>([]);
	const browserSupabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);

	let debugString = $state('Debug string');

	let deleteItemDialog = $state<HTMLDialogElement>();
	let editItemDialog = $state<HTMLDialogElement>();
	let selectedItem = $state<StockItem | null>(null);
	let editProductId = $state('');
	let editQuantity = $state<number | null>(null);

	function openDeleteItem(item: StockItem) {
		selectedItem = item;
		deleteItemDialog?.showModal();
	}

	function openEditItem(item: StockItem) {
		selectedItem = item;
		editProductId = data.products.find((p) => p.name === item.itemName)?.id ?? '';
		editQuantity = item.count;
		editItemDialog?.showModal();
	}

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
				<div class="flex items-center gap-2">
					<span class="badge badge-neutral">{item.count}</span>
					<ActionDropdown>
						{#snippet items()}
							<li><button onclick={() => openEditItem(item)}>Edit</button></li>
							<li><button class="text-error" onclick={() => openDeleteItem(item)}>Delete</button></li>
						{/snippet}
					</ActionDropdown>
				</div>
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

<dialog bind:this={deleteItemDialog} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Delete item?</h3>
		<p class="py-4 text-sm text-base-content/60">
			Remove "{selectedItem?.itemName ?? 'this item'}" from the count?
		</p>
		<div class="modal-action">
			<button class="btn btn-ghost" onclick={() => deleteItemDialog?.close()}>Cancel</button>
			<form
				method="POST"
				action="?/deleteItem"
				use:enhance={() =>
					async ({ update }) => {
						const id = selectedItem?.id;
						deleteItemDialog?.close();
						savedItems = savedItems.filter((i) => i.id !== id);
						await update({ invalidateAll: false });
					}}
			>
				<input type="hidden" name="itemId" value={selectedItem?.id} />
				<button type="submit" class="btn btn-error">Delete</button>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<dialog bind:this={editItemDialog} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Edit item</h3>
		<form
			method="POST"
			action="?/editItem"
			use:enhance={() =>
				async ({ update }) => {
					const id = selectedItem?.id;
					const name = data.products.find((p) => p.id === editProductId)?.name ?? '';
					const qty = editQuantity ?? 0;
					editItemDialog?.close();
					savedItems = savedItems.map((i) =>
						i.id === id ? { ...i, itemName: name, count: qty } : i
					);
					await update({ invalidateAll: false });
				}}
			class="flex flex-col gap-4 pt-4"
		>
			<input type="hidden" name="itemId" value={selectedItem?.id} />
			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium">Product</span>
				<select name="productId" class="select select-bordered w-full" bind:value={editProductId}>
					{#each data.products as p (p.id)}
						<option value={p.id}>{p.name}</option>
					{/each}
				</select>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium">Quantity</span>
				<input
					type="number"
					name="quantity"
					class="input input-bordered w-full"
					bind:value={editQuantity}
					min="0"
					step="any"
				/>
			</label>
			<div class="modal-action mt-0">
				<button type="button" class="btn btn-ghost" onclick={() => editItemDialog?.close()}>
					Cancel
				</button>
				<button type="submit" class="btn btn-primary">Save</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
