<script lang="ts">
	import { onMount } from 'svelte';
	import { MicrophoneIcon, StopIcon, ArrowCounterClockwiseIcon, PlusIcon } from 'phosphor-svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { createBrowserClient } from '@supabase/ssr';
	import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
	import type { StockItem } from '$lib/services/llm/types';
	import { AssemblyAIService } from '$lib/services/transcription/assemblyaiService.js';
	import ActionDropdown from '$lib/components/ActionDropdown.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';

	let { data } = $props();
	let transcription = $state('Start recording to log items...');
	let isRecording = $state(false);
	let savedItems = $state<StockItem[]>([]);
	const browserSupabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);

	let deleteItemDialog = $state<HTMLDialogElement>();
	let editItemDialog = $state<HTMLDialogElement>();
	let addItemDialog = $state<HTMLDialogElement>();
	let addProductId = $state('');
	let addQuantity = $state<number | null>(null);
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

	function confidenceClass(score: number | null | undefined): string {
		if (score == null) return 'bg-base-300';
		if (score >= 0.9) return 'bg-success';
		if (score >= 0.5) return 'bg-warning';
		return 'bg-error';
	}

	const { keywords } = data;
	let transcriptionService = new AssemblyAIService(keywords);

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
								confidence: payload.new.confidence ?? 1,
								rawTranscript: payload.new.raw_transcription ?? ''
							},
							...savedItems
						];
					}
				}
			)
			.subscribe((status, err) => {
				console.log('Realtime status:', status, err);
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

<Breadcrumbs
	crumbs={[
		{ label: 'Counts', href: resolve('/') },
		{ label: data.count.name, href: resolve(`/count/${data.count.id}`) },
		{ label: 'Record' }
	]}
/>

<div class="mx-4 my-4 flex flex-col gap-4 pb-32">
	<div class="rounded-xl border border-base-content/10 px-4 py-3">
		<p class="text-center text-lg text-base-content/60">{transcription}</p>
	</div>

	<div class="flex flex-col gap-2">
		{#each savedItems as item (item.id)}
			<div class="flex rounded-xl border border-base-content/10">
				<div class="w-1.5 shrink-0 rounded-l-xl {confidenceClass(item.confidence)}"></div>
				<div class="flex flex-1 flex-col justify-center gap-1 px-4 py-3">
					<div class="flex items-center justify-between gap-2">
						<span class="font-medium">{item.itemName}</span>
						<span class="badge min-w-12 justify-center badge-neutral">{item.count}</span>
					</div>
				</div>
				<div class="flex items-start pt-3 pr-3">
					<ActionDropdown>
						{#snippet items()}
							<li><button onclick={() => openEditItem(item)}>Edit</button></li>
							<li>
								<button class="text-error" onclick={() => openDeleteItem(item)}>Delete</button>
							</li>
						{/snippet}
					</ActionDropdown>
				</div>
			</div>
		{/each}
	</div>
</div>

<div
	class="fixed right-0 bottom-0 left-0 flex justify-center pb-[calc(1rem+env(safe-area-inset-bottom))]"
>
	<div class="flex flex-row items-center gap-8 rounded-full bg-base-200 px-6 py-3 shadow-lg">
		<form
			method="POST"
			action="?/deleteItem"
			use:enhance={() =>
				async ({ update }) => {
					const id = savedItems[0]?.id;
					savedItems = savedItems.filter((i) => i.id !== id);
					await update({ invalidateAll: false });
				}}
		>
			<input type="hidden" name="itemId" value={savedItems[0]?.id} />
			<button
				type="submit"
				class="btn btn-circle btn-ghost btn-xl"
				disabled={savedItems.length === 0}
				aria-label="Undo last item"
			>
				<ArrowCounterClockwiseIcon weight="bold" size={24} />
			</button>
		</form>

		{#if !isRecording}
			<button
				onclick={() => startRecording()}
				class="btn btn-circle btn-accent btn-xl"
				aria-label="Toggle Recording"
			>
				<MicrophoneIcon color="white" weight="bold" />
			</button>
		{:else}
			<button
				onclick={() => stopRecording()}
				class="btn btn-circle btn-error btn-xl"
				aria-label="Toggle Recording"
			>
				<StopIcon color="white" weight="bold" />
			</button>
		{/if}

		<button
			class="btn btn-circle btn-ghost btn-xl"
			aria-label="Add item manually"
			onclick={() => addItemDialog?.showModal()}
		>
			<PlusIcon weight="bold" size={24} />
		</button>
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
				<select name="productId" class="select-bordered select w-full" bind:value={editProductId}>
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
					class="input-bordered input w-full"
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

<dialog bind:this={addItemDialog} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Add item</h3>
		<form
			method="POST"
			action="?/addItem"
			use:enhance={() =>
				async ({ update }) => {
					addItemDialog?.close();
					addProductId = '';
					addQuantity = null;
					await update({ invalidateAll: false });
				}}
			class="flex flex-col gap-4 pt-4"
		>
			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium">Product</span>
				<input
					class="input-bordered input w-full"
					list="add-products-list"
					name="productId"
					bind:value={addProductId}
					placeholder="Search products..."
					autocomplete="off"
				/>
				<datalist id="add-products-list">
					{#each data.products as p (p.id)}
						<option value={p.name}></option>
					{/each}
				</datalist>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium">Quantity</span>
				<input
					type="number"
					name="quantity"
					class="input-bordered input w-full"
					bind:value={addQuantity}
					min="0"
					step="any"
				/>
			</label>
			<div class="modal-action mt-0">
				<button type="button" class="btn btn-ghost" onclick={() => addItemDialog?.close()}>
					Cancel
				</button>
				<button type="submit" class="btn btn-primary">Add</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
