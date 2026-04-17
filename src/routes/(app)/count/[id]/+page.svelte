<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { MicrophoneIcon } from 'phosphor-svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import ActionDropdown from '$lib/components/ActionDropdown.svelte';
	import CountCard from '$lib/components/CountCard.svelte';
	import CountItemRow from '$lib/components/CountItemRow.svelte';
	import ConfirmDeleteModal from '$lib/components/ConfirmDeleteModal.svelte';
	import EditCountModal from '$lib/components/EditCountModal.svelte';
	import EditItemModal from '$lib/components/EditItemModal.svelte';
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

	function openEditItem(item: Item) {
		selectedItem = item;
		const p = getProduct(item);
		editProductId = (p as { id?: string } | null)?.id ?? '';
		editQuantity = item.quantity ?? null;
		editItemDialog?.showModal();
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
</script>

<Breadcrumbs crumbs={[{ label: 'Counts', href: resolve('/') }, { label: data.count.name }]} />

<div class="mx-4 my-4 flex flex-col gap-4">
	<CountCard name={data.count.name} {completed} date={data.count.date}>
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
							<button class="text-success" onclick={() => completeDialog?.showModal()}
								>Mark Complete</button
							>
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
			<CountItemRow
				name={product?.name ?? 'Unknown'}
				quantity={item.quantity}
				unit={product?.unit}
				confidence={item.confidence}
			>
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
			<CountItemRow name={row.name} quantity={row.total} unit={row.unit} />
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

<EditCountModal bind:dialog={editCountDialog} bind:name={editCountName} action="?/editCount" />

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

<EditItemModal
	bind:dialog={editItemDialog}
	action="?/editItem"
	itemId={selectedItem?.id}
	bind:productId={editProductId}
	bind:quantity={editQuantity}
	products={data.products}
/>
