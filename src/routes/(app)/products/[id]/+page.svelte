<script lang="ts">
	import { PlusIcon, DotsThreeVerticalIcon } from 'phosphor-svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';

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
			<div class="dropdown dropdown-end">
				<button tabindex="0" class="btn btn-ghost btn-sm btn-square">
					<DotsThreeVerticalIcon weight="bold" size={20} />
				</button>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<ul
					tabindex="0"
					class="dropdown-content menu bg-base-100 rounded-box z-10 w-28 p-1 shadow"
				>
					<li>
						<button onclick={() => openEditProduct(product)}>Edit</button>
					</li>
					<li>
						<button class="text-error" onclick={() => openDeleteProduct(product)}>Delete</button>
					</li>
				</ul>
			</div>
		</div>
	{:else}
		<p class="text-base-content/60 text-sm">No products yet. Add one with the + button.</p>
	{/each}
</div>

<div class="fab bottom-20">
	<button class="btn btn-circle btn-lg btn-primary" onclick={() => addDialog?.showModal()}>
		<PlusIcon weight="bold" />
	</button>
</div>

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

<dialog bind:this={deleteProductDialog} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Delete product?</h3>
		<p class="py-4 text-sm text-base-content/60">
			This will permanently delete "{selectedProduct?.name ?? 'this product'}".
		</p>
		<div class="modal-action">
			<button class="btn btn-ghost" onclick={() => deleteProductDialog?.close()}>Cancel</button>
			<form
				method="POST"
				action="?/deleteProduct"
				use:enhance={() =>
					async ({ update }) => {
						deleteProductDialog?.close();
						await update();
					}}
			>
				<input type="hidden" name="productId" value={selectedProduct?.id} />
				<button type="submit" class="btn btn-error">Delete</button>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

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
