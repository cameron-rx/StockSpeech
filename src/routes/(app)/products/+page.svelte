<script lang="ts">
	import { PlusIcon } from 'phosphor-svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { venueState } from '$lib/state/venue.svelte';
	import ActionDropdown from '$lib/components/ActionDropdown.svelte';
	import ConfirmDeleteModal from '$lib/components/ConfirmDeleteModal.svelte';
	import FAB from '$lib/components/FAB.svelte';

	let { data, form } = $props();

	let createDialog = $state<HTMLDialogElement>();
	let deleteListDialog = $state<HTMLDialogElement>();
	let editListDialog = $state<HTMLDialogElement>();

	type ProductList = (typeof data.productLists)[0];
	let selectedList = $state<ProductList | null>(null);
	let editName = $state('');

	function openDeleteList(list: ProductList) {
		selectedList = list;
		deleteListDialog?.showModal();
	}

	function openEditList(list: ProductList) {
		selectedList = list;
		editName = list.name;
		editListDialog?.showModal();
	}
</script>

<div class="mx-4 my-4 flex h-auto w-auto flex-col gap-8">
	{#each data.productLists as productList (productList.id)}
		<div class="card card-xs w-full bg-base-100 shadow-sm">
			<div class="flex items-stretch">
				<a href={resolve(`/products/${productList.id}`)} class="card-body flex-1">
					<h2 class="card-title">{productList.name}</h2>
					<p>{productList.userName}</p>
				</a>
				<div class="flex items-start pt-3 pr-3">
					<ActionDropdown>
						{#snippet items()}
							<li><button onclick={() => openEditList(productList)}>Edit</button></li>
							<li>
								<button class="text-error" onclick={() => openDeleteList(productList)}>Delete</button>
							</li>
						{/snippet}
					</ActionDropdown>
				</div>
			</div>
		</div>
	{/each}
</div>

<FAB onclick={() => createDialog?.showModal()}>
	<PlusIcon weight="bold" />
</FAB>

<dialog bind:this={createDialog} class="modal">
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">New Product List</h3>

		<form method="POST" action="?/create" use:enhance>
			<input type="hidden" name="venue_id" value={venueState.value} />

			<label class="floating-label mb-4">
				<input
					class="input w-full"
					type="text"
					name="name"
					placeholder="Product list name"
					required
				/>
				<span>Name</span>
			</label>

			{#if form?.error}
				<p class="mb-4 text-sm text-error">{form.error}</p>
			{/if}

			<div class="modal-action">
				<button type="button" class="btn btn-ghost" onclick={() => createDialog?.close()}>
					Cancel
				</button>
				<button type="submit" class="btn btn-primary">Create</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<ConfirmDeleteModal
	bind:dialog={deleteListDialog}
	title="Delete product list?"
	message={`This will permanently delete "${selectedList?.name ?? 'this list'}" and all its products.`}
	action="?/deleteList"
>
	{#snippet hiddenInputs()}
		<input type="hidden" name="listId" value={selectedList?.id} />
	{/snippet}
</ConfirmDeleteModal>

<dialog bind:this={editListDialog} class="modal">
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">Edit Product List</h3>
		<form
			method="POST"
			action="?/editList"
			use:enhance={() =>
				async ({ update }) => {
					editListDialog?.close();
					await update();
				}}
			class="flex flex-col gap-4"
		>
			<input type="hidden" name="listId" value={selectedList?.id} />
			<label class="floating-label">
				<input
					class="input w-full"
					type="text"
					name="name"
					placeholder="Product list name"
					bind:value={editName}
					required
				/>
				<span>Name</span>
			</label>
			<div class="modal-action mt-0">
				<button type="button" class="btn btn-ghost" onclick={() => editListDialog?.close()}>
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
