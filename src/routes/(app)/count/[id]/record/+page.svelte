<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import {
		MicrophoneIcon,
		StopIcon,
		ArrowCounterClockwiseIcon,
		PlusIcon,
		XIcon
	} from 'phosphor-svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { StockItem } from '$lib/services/llm/types';
	import { AssemblyAIService } from '$lib/services/transcription/assemblyaiService.js';
	import ActionDropdown from '$lib/components/ActionDropdown.svelte';
	import CountItemRow from '$lib/components/CountItemRow.svelte';
	import EditItemModal from '$lib/components/EditItemModal.svelte';

	let { data } = $props();
	let transcription = $state('Start recording to log items...');
	let isRecording = $state(false);
	let savedItems = $state<StockItem[]>([]);

	// NOTE: If realtime subscriptions break, the supabase client from data.supabase
	// may need to be replaced with a dedicated browser client:
	//   import { createBrowserClient } from '@supabase/ssr';
	//   import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
	//   const browserSupabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);

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

	let isFinalFlash = $state(false);
	let flashTimeout: ReturnType<typeof setTimeout> | null = null;

	let transcriptionService = untrack(() => new AssemblyAIService(data.keywords));

	onMount(() => {
		const channel = data.supabase
			.channel(`count_items_${data.count.id}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'count_items',
					filter: `stock_count_id=eq.${data.count.id}`
				},
				(payload: {
					new: {
						id: string;
						product_id: string;
						quantity: number;
						confidence?: number;
						raw_transcription?: string;
					};
				}) => {
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
			.subscribe((status: string, err: Error | undefined) => {
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
		try {
			isRecording = true;
			await transcriptionService.start((transcript, isFinal) => {
				if (isFinal && transcript !== '') {
					transcription = transcript;
					parseItem(transcript);
					isFinalFlash = true;
					if (flashTimeout) clearTimeout(flashTimeout);
					flashTimeout = setTimeout(() => {
						isFinalFlash = false;
					}, 1000);
				} else if (transcript !== '') {
					transcription = transcript;
				}
			});
			transcription = 'Listening for items...';
		} catch (err) {
			isRecording = false;
			transcription = 'Failed to start recording. Please check microphone permissions.';
			console.error('Recording error:', err);
		}
	};

	const stopRecording = () => {
		transcriptionService.stop();
		isRecording = false;
		transcription = 'Start recording to log items...';
	};
</script>

<div class="flex h-full flex-col">
	<!-- Fixed header: close + transcription -->
	<div class="shrink-0 px-4 pt-4 pb-2">
		<div class="flex justify-end">
			<a href={resolve(`/count/${data.count.id}`)} class="btn btn-circle btn-ghost">
				<XIcon size={20} weight="bold" />
			</a>
		</div>

		<div class="relative mt-2 rounded-xl px-4 py-3">
			<div
				class="absolute inset-0 rounded-xl border-2 transition-colors {isRecording
					? 'animate-pulse border-accent'
					: 'border-accent/40'}"
			></div>
			{#if isFinalFlash}
				<div class="absolute inset-0 animate-ping rounded-xl bg-success/30"></div>
			{/if}
			<p class="relative text-center text-lg text-base-content/60">
				{transcription}
			</p>
		</div>
	</div>

	<!-- Scrollable items feed -->
	<div class="flex-1 overflow-y-auto overscroll-y-contain px-4 py-4">
		<div class="flex flex-col gap-2">
			{#each savedItems as item (item.id)}
				<CountItemRow name={item.itemName} quantity={item.count} confidence={item.confidence}>
					{#snippet actions()}
						<ActionDropdown>
							{#snippet items()}
								<li><button onclick={() => openEditItem(item)}>Edit</button></li>
								<li>
									<button class="text-error" onclick={() => openDeleteItem(item)}>Delete</button>
								</li>
							{/snippet}
						</ActionDropdown>
					{/snippet}
				</CountItemRow>
			{/each}
		</div>
	</div>

	<!-- Fixed bottom spacer for the recording controls -->
	<div class="h-28 shrink-0"></div>
</div>

<div
	class="fixed right-0 bottom-0 left-0 flex justify-center pb-[calc(1rem+env(safe-area-inset-bottom))]"
>
	<div
		class="flex flex-row items-center gap-8 rounded-full bg-primary px-6 py-3 text-primary-content shadow-lg"
	>
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
				style={savedItems.length === 0
					? '--btn-fg: color-mix(in oklch, var(--color-primary-content) 40%, transparent)'
					: ''}
				disabled={savedItems.length === 0}
				aria-label="Undo last item"
			>
				<ArrowCounterClockwiseIcon weight="bold" size={24} />
			</button>
		</form>

		{#if !isRecording}
			<button
				onclick={() => startRecording()}
				class="btn btn-circle btn-xl btn-accent"
				aria-label="Toggle Recording"
			>
				<MicrophoneIcon color="white" weight="bold" />
			</button>
		{:else}
			<button
				onclick={() => stopRecording()}
				class="btn btn-circle btn-xl btn-error"
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

<EditItemModal
	bind:dialog={editItemDialog}
	action="?/editItem"
	itemId={selectedItem?.id}
	bind:productId={editProductId}
	bind:quantity={editQuantity}
	products={data.products}
	onsubmit={() => {
		const id = selectedItem?.id;
		const name = data.products.find((p) => p.id === editProductId)?.name ?? '';
		const qty = editQuantity ?? 0;
		savedItems = savedItems.map((i) => (i.id === id ? { ...i, itemName: name, count: qty } : i));
	}}
/>

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
