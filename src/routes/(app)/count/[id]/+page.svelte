<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { MicrophoneIcon } from 'phosphor-svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import ActionDropdown from '$lib/components/ActionDropdown.svelte';
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
</script>

<Breadcrumbs crumbs={[{ label: 'Counts', href: resolve('/') }, { label: data.count.name }]} />

<div class="mx-4 my-4 flex flex-col gap-4">
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold">{data.count.name}</h1>
		</div>

		<div class="flex flex-row items-center gap-2">
			{#if data.count.productListName}
				<div class="badge badge-soft badge-primary">{data.count.productListName}</div>
			{/if}
			<div class="badge {completed ? 'badge-success' : 'badge-warning'}">
				{completed ? 'Completed' : 'In Progress'}
			</div>
			<ActionDropdown width="w-36">
				{#snippet items()}
					<li>
						<button onclick={() => { editCountName = data.count.name; editCountDialog?.showModal(); }}>
							Edit
						</button>
					</li>
					{#if !completed}
						<li>
							<button onclick={() => completeDialog?.showModal()}>Mark Complete</button>
						</li>
					{/if}
					<li>
						<button class="text-error" onclick={() => deleteDialog?.showModal()}>Delete</button>
					</li>
				{/snippet}
			</ActionDropdown>
		</div>
	</div>

	{#each data.items as item (item.id)}
		{@const product = getProduct(item)}
		<div class="flex items-center justify-between rounded-lg bg-base-100 p-4 shadow-sm">
			<div>
				<span class="font-medium">{product?.name ?? 'Unknown'}</span>
				{#if product?.unit}
					<span class="ml-2 text-sm text-base-content/60">{product.unit}</span>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				<span class="text-lg font-semibold">{item.quantity ?? '—'}</span>
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
</div>

{#if !completed}
	<FAB href={resolve(`/count/${data.count.id}/record`)}>
		{#snippet children()}<MicrophoneIcon weight="bold" />{/snippet}
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
				<select name="productId" class="select select-bordered w-full" bind:value={editProductId}>
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
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
