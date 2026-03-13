<script lang="ts">
	import CountCard from '$lib/components/CountCard.svelte';
	import { PlusIcon } from 'phosphor-svelte';
	import { enhance } from '$app/forms';
	import { venueState } from '$lib/state/venue.svelte';

	let { data, form } = $props();

	let dialog: HTMLDialogElement;
</script>

<div class="mx-4 my-4 flex h-auto w-auto flex-col gap-8">
	{#each data.counts as count (count.id)}
		<CountCard {...count} />
	{:else}
		<p class="text-base-content/60 text-sm">No counts yet. Start one with the + button.</p>
	{/each}
</div>

<div class="fab bottom-20">
	<button class="btn btn-circle btn-lg btn-primary" onclick={() => dialog.showModal()}>
		<PlusIcon weight="bold" />
	</button>
</div>

<dialog bind:this={dialog} class="modal">
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">New Count</h3>

		<form method="POST" action="?/create" use:enhance>
			<input type="hidden" name="venue_id" value={venueState.value} />

			<label class="floating-label mb-4">
				<input class="input w-full" type="text" name="name" placeholder="Count name" required />
				<span>Name</span>
			</label>

			<label class="floating-label mb-4">
				<select class="select w-full" name="product_list_id" required>
					<option value="" disabled selected>Select a product list</option>
					{#each data.productLists as list (list.id)}
						<option value={list.id}>{list.name}</option>
					{/each}
				</select>
				<span>Product List</span>
			</label>

			{#if form?.error}
				<p class="text-error mb-4 text-sm">{form.error}</p>
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
