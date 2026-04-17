<script lang="ts">
	import { PlusIcon, FileIcon } from 'phosphor-svelte';
	import FAB from '$lib/components/FAB.svelte';
	import { enhance } from '$app/forms';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import ActionDropdown from '$lib/components/ActionDropdown.svelte';
	import ConfirmDeleteModal from '$lib/components/ConfirmDeleteModal.svelte';

	let { data, form } = $props();

	let addDialog = $state<HTMLDialogElement>();
	let deleteProductDialog = $state<HTMLDialogElement>();
	let editProductDialog = $state<HTMLDialogElement>();
	let fileDialog = $state<HTMLDialogElement>();

	let fileIsUploading = $state<boolean>(false);
	let fileIsUploaded = $state<boolean>(false);

	let productsSearch = $state('');

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

	const activeProducts = $derived(data.products.filter((p) => p.active));

	const disabledProducts = $derived(data.products.filter((p) => !p.active));

	const filteredActive = $derived(
		productsSearch.trim()
			? activeProducts.filter((p) => p.name.toLowerCase().includes(productsSearch.toLowerCase()))
			: activeProducts
	);

	const filteredDisabled = $derived(
		productsSearch.trim()
			? disabledProducts.filter((p) => p.name.toLowerCase().includes(productsSearch.toLowerCase()))
			: disabledProducts
	);

	function closeFileDialog() {
		fileDialog?.close();
		if (fileIsUploaded || !fileIsUploading) {
			fileIsUploaded = false;
			fileIsUploading = false;
		}
	}
</script>

<Breadcrumbs crumbs={[{ label: 'Products' }]}>
	{#snippet actions()}
		<button class="btn btn-circle btn-md btn-accent" onclick={() => fileDialog?.showModal()}>
			<FileIcon weight="bold" />
		</button>
		<FAB onclick={() => addDialog?.showModal()}>
			<PlusIcon weight="bold" />
		</FAB>
	{/snippet}
</Breadcrumbs>

<div class="mx-4 my-4 flex flex-col gap-4">
	<input
		type="search"
		class="input-bordered input w-full"
		placeholder="Search products…"
		bind:value={productsSearch}
	/>

	{#each filteredActive as product (product.id)}
		<div class="flex rounded-xl border border-base-content/10">
			<div class="flex flex-1 flex-col justify-center gap-1 px-4 py-3">
				<span class="font-medium">{product.name}</span>
				{#if product.unit}
					<span class="text-xs text-base-content/60">{product.unit}</span>
				{/if}
			</div>
			<div class="flex items-start pt-3 pr-3">
				<ActionDropdown>
					{#snippet items()}
						<li><button onclick={() => openEditProduct(product)}>Edit</button></li>
						{#if product.inUse}
							<li>
								<form method="POST" action="?/disableProduct" use:enhance>
									<input type="hidden" name="productId" value={product.id} />
									<button type="submit" class="text-warning">Disable</button>
								</form>
							</li>
						{:else}
							<li>
								<button class="text-error" onclick={() => openDeleteProduct(product)}>Delete</button
								>
							</li>
						{/if}
					{/snippet}
				</ActionDropdown>
			</div>
		</div>
	{:else}
		<p class="text-base-content/60 text-sm">
			{productsSearch.trim()
				? 'No matching products.'
				: 'No products yet. Add one with the + button.'}
		</p>
	{/each}

	{#if filteredDisabled.length > 0}
		<p class="mt-2 text-xs font-semibold tracking-widest text-base-content/40 uppercase">
			Disabled
		</p>
		{#each filteredDisabled as product (product.id)}
			<div class="flex rounded-xl border border-base-content/10">
				<div class="flex flex-1 flex-col justify-center gap-1 px-4 py-3">
					<span class="font-medium text-base-content/40">{product.name}</span>
					{#if product.unit}
						<span class="text-xs text-base-content/25">{product.unit}</span>
					{/if}
				</div>
				<div class="flex items-start pt-3 pr-3">
					<ActionDropdown>
						{#snippet items()}
							<li>
								<form method="POST" action="?/enableProduct" use:enhance>
									<input type="hidden" name="productId" value={product.id} />
									<button type="submit" class="text-success">Enable</button>
								</form>
							</li>
							{#if !product.inUse}
								<li>
									<button class="text-error" onclick={() => openDeleteProduct(product)}
										>Delete</button
									>
								</li>
							{/if}
						{/snippet}
					</ActionDropdown>
				</div>
			</div>
		{/each}
	{/if}
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
				<p class="mb-4 text-sm text-error">{form.error}</p>
			{/if}

			<div class="modal-action">
				<button type="button" class="btn btn-ghost" onclick={() => addDialog?.close()}
					>Cancel</button
				>
				<button type="submit" class="btn btn-primary">Add</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<dialog bind:this={fileDialog} class="modal">
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">Upload Product List</h3>

		{#if fileIsUploaded}
			<span>Your file has successfully uploaded</span>
			<div class="modal-action">
				<button type="button" class="btn btn-ghost" onclick={() => closeFileDialog()}>Exit</button>
			</div>
		{:else if !fileIsUploading}
			<form
				method="POST"
				action="?/uploadProducts"
				enctype="multipart/form-data"
				use:enhance={() => {
					fileIsUploading = true;
					return async ({ update }) => {
						fileIsUploaded = true;
						await update();
					};
				}}
			>
				<input
					class="file-input"
					accept=".pdf, image/*"
					id="productList"
					name="productList"
					type="file"
				/>
				{#if form?.error}
					<p class="mb-4 text-sm text-error">{form.error}</p>
				{/if}

				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={() => closeFileDialog()}
						>Cancel</button
					>
					<button type="submit" class="btn btn-primary">Upload</button>
				</div>
			</form>
		{:else}
			<span class="loading loading-xl loading-spinner"></span>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => closeFileDialog()}>close</button>
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
