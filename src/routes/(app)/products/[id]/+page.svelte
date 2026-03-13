<script lang="ts">
	import { PlusIcon } from 'phosphor-svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';

	let { data, form } = $props();

	let dialog: HTMLDialogElement;
</script>

<Breadcrumbs crumbs={[{ label: 'Products', href: resolve('/products') }, { label: data.productList.name }]} />

<div class="mx-4 my-4 flex flex-col gap-4">
	<h1 class="text-2xl font-bold">{data.productList.name}</h1>

	{#each data.products as product (product.id)}
		<div class="bg-base-100 flex items-center justify-between rounded-lg p-4 shadow-sm">
			<span class="font-medium">{product.name}</span>
			{#if product.unit}
				<span class="badge badge-ghost">{product.unit}</span>
			{/if}
		</div>
	{:else}
		<p class="text-base-content/60 text-sm">No products yet. Add one with the + button.</p>
	{/each}
</div>

<div class="fab bottom-20">
	<button class="btn btn-circle btn-lg btn-primary" onclick={() => dialog.showModal()}>
		<PlusIcon weight="bold" />
	</button>
</div>

<dialog bind:this={dialog} class="modal">
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
				<button type="button" class="btn btn-ghost" onclick={() => dialog.close()}>Cancel</button>
				<button type="submit" class="btn btn-primary">Add</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
