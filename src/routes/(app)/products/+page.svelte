<script lang="ts">
	import ProductListCard from '$lib/components/ProductListCard.svelte';
	import { PlusIcon } from 'phosphor-svelte';
	import { enhance } from '$app/forms';
	import { venueState } from '$lib/state/venue.svelte';

	let { data, form } = $props();

	let dialog: HTMLDialogElement;
</script>

<div class="mx-4 my-4 flex h-auto w-auto flex-col gap-8">
	{#each data.productLists as productList (productList.id)}
		<ProductListCard {...productList} />
	{/each}
</div>

<div class="fab bottom-20">
	<button class="btn btn-circle btn-lg btn-primary" onclick={() => dialog.showModal()}>
		<PlusIcon weight="bold" />
	</button>
</div>

<dialog bind:this={dialog} class="modal">
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
				<button type="button" class="btn btn-ghost" onclick={() => dialog.close()}>Cancel</button>
				<button type="submit" class="btn btn-primary">Create</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
