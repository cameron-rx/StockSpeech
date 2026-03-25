<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { MicrophoneIcon } from 'phosphor-svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import ActionDropdown from '$lib/components/ActionDropdown.svelte';
	import CountCard from '$lib/components/CountCard.svelte';
	import ConfirmDeleteModal from '$lib/components/ConfirmDeleteModal.svelte';
	import FAB from '$lib/components/FAB.svelte';

	let { data } = $props();

	const completed = $derived(data.count.completed !== 'in_progress');

	let completeDialog = $state<HTMLDialogElement>();
	let deleteDialog = $state<HTMLDialogElement>();
	let editCountDialog = $state<HTMLDialogElement>();
	let deleteItemDialog = $state<HTMLDialogElement>();
	let editItemDialog = $state<HTMLDialogElement>();

	let editCountName = $state('');
	let activeTab = $state<'items' | 'totals'>('items');
	let totalsSearch = $state('');

	type Item = (typeof data.items)[0];
	let selectedItem = $state<Item | null>(null);
	let editProductId = $state('');
	let editQuantity = $state<number | null>(null);

	function getProduct(item: Item) {
		return Array.isArray(item.product) ? item.product[0] : item.product;
	}

	function openDeleteItem(item: Item) {
		selectedItem = item;
		deleteItemDialog?.showModal();
	}

	const totals = $derived(
		Object.values(
			data.items.reduce<
				Record<string, { name: string; unit: string | null | undefined; total: number }>
			>((acc, item) => {
				const product = getProduct(item);
				const id = (product as { id?: string } | null)?.id ?? product?.name ?? 'unknown';
				if (!acc[id]) {
					acc[id] = { name: product?.name ?? 'Unknown', unit: product?.unit, total: 0 };
				}
				acc[id].total += item.quantity ?? 0;
				return acc;
			}, {})
		).sort((a, b) => a.name.localeCompare(b.name))
	);

	const filteredTotals = $derived(
		totalsSearch.trim()
			? totals.filter((r) => r.name.toLowerCase().includes(totalsSearch.toLowerCase()))
			: totals
	);

	function confidenceClass(score: number | null | undefined): string {
		if (score == null) return 'bg-base-300';
		if (score >= 0.9) return 'bg-green-500';
		if (score >= 0.5) return 'bg-amber-500';
		return 'bg-red-500';
	}

	function openEditItem(item: Item) {
		selectedItem = item;
		const p = getProduct(item);
		editProductId = (p as { id?: string } | null)?.id ?? '';
		editQuantity = item.quantity ?? null;
		editItemDialog?.showModal();
	}
</script>

<Breadcrumbs crumbs={[{ label: 'Counts', href: resolve('/') }, { label: data.count.name }]} />

<div class="mx-4 my-4 flex flex-col gap-4">
	<CountCard
		name={data.count.name}
		completed={completed}
		userName={data.count.userName}
		date={data.count.date}
		productListName={data.count.productListName}
	>
		{#snippet actions()}
			<ActionDropdown width="w-36">
				{#snippet items()}
					<li>
						<button
							onclick={() => {
								editCountName = data.count.name;
								editCountDialog?.showModal();
							}}
						>
							Edit
						</button>
					</li>
					{#if !completed}
						<li>
							<button class="text-success" onclick={() => completeDialog?.showModal()}>Mark Complete</button>
						</li>
					{/if}
					<li>
						<button class="text-error" onclick={() => deleteDialog?.showModal()}>Delete</button>
					</li>
				{/snippet}
			</ActionDropdown>
		{/snippet}
	</CountCard>

	<div role="tablist" class="tabs-border tabs">
		<button
			role="tab"
			class="tab {activeTab === 'items' ? 'tab-active' : ''}"
			onclick={() => {
				activeTab = 'items';
				totalsSearch = '';
			}}
		>
			Items
		</button>
		<button
			role="tab"
			class="tab {activeTab === 'totals' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'totals')}
		>
			Totals
		</button>
	</div>

	{#if activeTab === 'items'}
		{#each data.items as item (item.id)}
			{@const product = getProduct(item)}
			<div class="flex rounded-xl border border-base-content/10">
				<div class="w-1.5 shrink-0 rounded-l-xl {confidenceClass(item.confidence)}"></div>
				<div class="flex flex-1 flex-col justify-center gap-1 px-4 py-3">
					<div class="flex items-center justify-between gap-2">
						<span class="font-medium">{product?.name ?? 'Unknown'}</span>
						<span class="badge badge-neutral min-w-12 justify-center">{item.quantity ?? '—'}</span>
					</div>
					{#if product?.unit}
						<span class="text-xs text-base-content/60">{product.unit}</span>
					{/if}
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
		{:else}
			<p class="text-base-content/60 text-sm">No items recorded yet.</p>
		{/each}
	{/if}

	{#if activeTab === 'totals'}
		<input
			type="search"
			class="input-bordered input w-full"
			placeholder="Search products…"
			bind:value={totalsSearch}
		/>
		{#each filteredTotals as row (row.name)}
			<div class="flex rounded-xl border border-base-content/10">
				<div class="flex flex-1 flex-col justify-center gap-1 px-4 py-3">
					<div class="flex items-center justify-between gap-2">
						<span class="font-medium">{row.name}</span>
						<span class="badge badge-neutral min-w-12 justify-center">{row.total}</span>
					</div>
					{#if row.unit}
						<span class="text-xs text-base-content/60">{row.unit}</span>
					{/if}
				</div>
			</div>
		{:else}
			<p class="text-base-content/60 text-sm">No matching products.</p>
		{/each}
	{/if}
</div>

{#if !completed}
	<FAB href={resolve(`/count/${data.count.id}/record`)}>
		<MicrophoneIcon weight="bold" />
	</FAB>
{/if}

<dialog bind:this={editCountDialog} class="modal">
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">Edit Count</h3>
		<form
			method="POST"
			action="?/editCount"
			use:enhance={() =>
				async ({ update }) => {
					editCountDialog?.close();
					await update();
				}}
			class="flex flex-col gap-4"
		>
			<label class="floating-label">
				<input
					class="input w-full"
					type="text"
					name="name"
					placeholder="Count name"
					bind:value={editCountName}
					required
				/>
				<span>Name</span>
			</label>
			<div class="modal-action mt-0">
				<button type="button" class="btn btn-ghost" onclick={() => editCountDialog?.close()}>
					Cancel
				</button>
				<button type="submit" class="btn btn-primary">Save</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<dialog bind:this={completeDialog} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Mark as complete?</h3>
		<p class="py-4 text-sm text-base-content/60">
			This will mark "{data.count.name}" as completed.
		</p>
		<div class="modal-action">
			<button class="btn btn-ghost" onclick={() => completeDialog?.close()}>Cancel</button>
			<form
				method="POST"
				action="?/complete"
				use:enhance={() =>
					async ({ update }) => {
						completeDialog?.close();
						await update();
					}}
			>
				<button type="submit" class="btn btn-success">Complete</button>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<ConfirmDeleteModal
	bind:dialog={deleteDialog}
	title="Delete count?"
	message={`This will permanently delete "${data.count.name}" and all its recorded items.`}
	action="?/delete"
/>

<ConfirmDeleteModal
	bind:dialog={deleteItemDialog}
	title="Delete item?"
	message={`This will permanently delete "${selectedItem ? (getProduct(selectedItem)?.name ?? 'this item') : 'this item'}" from the count.`}
	action="?/deleteItem"
>
	{#snippet hiddenInputs()}
		<input type="hidden" name="itemId" value={selectedItem?.id} />
	{/snippet}
</ConfirmDeleteModal>

<dialog bind:this={editItemDialog} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Edit item</h3>
		<form
			method="POST"
			action="?/editItem"
			use:enhance={() =>
				async ({ update }) => {
					editItemDialog?.close();
					await update();
				}}
			class="flex flex-col gap-4 pt-4"
		>
			<input type="hidden" name="itemId" value={selectedItem?.id} />
			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium">Product</span>
				<select name="productId" class="select-bordered select w-full" bind:value={editProductId}>
					{#each data.products as p (p.id)}
						<option value={p.id}>{p.name}{p.unit ? ` (${p.unit})` : ''}</option>
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
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
