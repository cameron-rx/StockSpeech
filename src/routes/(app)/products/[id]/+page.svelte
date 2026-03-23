<script lang="ts">
	import { PlusIcon } from 'phosphor-svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import ActionDropdown from '$lib/components/ActionDropdown.svelte';
	import ConfirmDeleteModal from '$lib/components/ConfirmDeleteModal.svelte';
	import FAB from '$lib/components/FAB.svelte';

	let { data, form } = $props();

	let addDialog = $state<HTMLDialogElement>();
	let deleteProductDialog = $state<HTMLDialogElement>();
	let editProductDialog = $state<HTMLDialogElement>();

	type Product = (typeof data.products)[0];
	let selectedProduct = $state<Product | null>(null);
	let editName = $state('');
	let editUnit = $state('');

	function openDeleteProduct(product: Product) {
		selectedProduct = product;
		deleteProductDialog?.showModal();
	}

	function openEditProduct(product: Product) {
		selectedProduct = product;
		editName = product.name;
		editUnit = product.unit ?? '';
		editProductDialog?.showModal();
	}
</script>

<Breadcrumbs crumbs={[{ label: 'Products', href: resolve('/products') }, { label: data.productList.name }]} />

<div class="mx-4 my-4 flex flex-col gap-4">
	<h1 class="text-2xl font-bold">{data.productList.name}</h1>

	{#each data.products as product (product.id)}
		<div class="bg-base-100 flex items-center justify-between rounded-lg p-4 shadow-sm">
			<div class="flex items-center gap-2">
				<span class="font-medium">{product.name}</span>
				{#if product.unit}
					<span class="badge badge-ghost">{product.unit}</span>
				{/if}
			</div>
			<ActionDropdown>
				{#snippet items()}
					<li><button onclick={() => openEditProduct(product)}>Edit</button></li>
					<li>
						<button class="text-error" onclick={() => openDeleteProduct(product)}>Delete</button>
					</li>
				{/snippet}
			</ActionDropdown>
		</div>
	{:else}
		<p class="text-base-content/60 text-sm">No products yet. Add one with the + button.</p>
	{/each}
</div>

<FAB onclick={() => addDialog?.showModal()}>
	{#snippet children()}<PlusIcon weight="bold" />{/snippet}
</FAB>

<dialog bind:this={addDialog} class="modal">
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">Add Product</h3>

		<form method="POST" action="?/addProduct" use:enhance>
			<label class="floating-label mb-4">
				<input class="input w-full" type="text" name="name" placeholder="Product name" required />
				<span>Name</span>
			</label>

			<label class="floating-label mb-4">
				<input class="input w-full" type="text" name="unit" placeholder="e.g. bottle, kg, case" />
				<span>Unit (optional)</span>
			</label>

			{#if form?.error}
				<p class="text-error mb-4 text-sm">{form.error}</p>
			{/if}

			<div class="modal-action">
				<button type="button" class="btn btn-ghost" onclick={() => addDialog?.close()}>Cancel</button>
				<button type="submit" class="btn btn-primary">Add</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<ConfirmDeleteModal
	bind:dialog={deleteProductDialog}
	title="Delete product?"
	message={`This will permanently delete "${selectedProduct?.name ?? 'this product'}".`}
	action="?/deleteProduct"
>
	{#snippet hiddenInputs()}
		<input type="hidden" name="productId" value={selectedProduct?.id} />
	{/snippet}
</ConfirmDeleteModal>

<dialog bind:this={editProductDialog} class="modal">
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">Edit Product</h3>
		<form
			method="POST"
			action="?/editProduct"
			use:enhance={() =>
				async ({ update }) => {
					editProductDialog?.close();
					await update();
				}}
			class="flex flex-col gap-4"
		>
			<input type="hidden" name="productId" value={selectedProduct?.id} />
			<label class="floating-label">
				<input
					class="input w-full"
					type="text"
					name="name"
					placeholder="Product name"
					bind:value={editName}
					required
				/>
				<span>Name</span>
			</label>
			<label class="floating-label">
				<input
					class="input w-full"
					type="text"
					name="unit"
					placeholder="e.g. bottle, kg, case"
					bind:value={editUnit}
				/>
				<span>Unit (optional)</span>
			</label>
			<div class="modal-action mt-0">
				<button type="button" class="btn btn-ghost" onclick={() => editProductDialog?.close()}>
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
