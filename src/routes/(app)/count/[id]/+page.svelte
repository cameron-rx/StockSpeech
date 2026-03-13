<script lang="ts">
	import { enhance } from '$app/forms';
	import { MicrophoneIcon } from 'phosphor-svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';

	let { data } = $props();

	const completed = $derived(data.count.completed !== 'in_progress');

	let deleteDialog: HTMLDialogElement;
	let completeDialog: HTMLDialogElement;
</script>

<Breadcrumbs crumbs={[{ label: 'Counts', href: '/' }, { label: data.count.name }]} />

<div class="mx-4 my-4 flex flex-col gap-4">
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold">{data.count.name}</h1>
			{#if data.count.productListName}
				<p class="text-sm text-base-content/60">{data.count.productListName}</p>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<div class="badge {completed ? 'badge-success' : 'badge-warning'}">
				{completed ? 'Completed' : 'In Progress'}
			</div>
		</div>
	</div>

	{#if !completed}
		<button class="btn btn-outline btn-sm btn-success" onclick={() => completeDialog.showModal()}>
			Mark as Complete
		</button>
	{/if}

	<button class="btn text-error btn-outline btn-sm" onclick={() => deleteDialog.showModal()}>
		Delete
	</button>

	{#each data.items as item (item.id)}
		{@const product = Array.isArray(item.product) ? item.product[0] : item.product}
		<div class="flex items-center justify-between rounded-lg bg-base-100 p-4 shadow-sm">
			<div>
				<span class="font-medium">{product?.name ?? 'Unknown'}</span>
				{#if product?.unit}
					<span class="ml-2 text-sm text-base-content/60">{product.unit}</span>
				{/if}
			</div>
			<span class="text-lg font-semibold">{item.quantity ?? '—'}</span>
		</div>
	{:else}
		<p class="text-base-content/60 text-sm">No items recorded yet.</p>
	{/each}
</div>

{#if !completed}
	<div class="fab bottom-20">
		<a href="/count/{data.count.id}/record" class="btn btn-circle btn-lg btn-primary">
			<MicrophoneIcon weight="bold" />
		</a>
	</div>
{/if}

<dialog bind:this={completeDialog} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Mark as complete?</h3>
		<p class="py-4 text-sm text-base-content/60">
			This will mark "{data.count.name}" as completed.
		</p>
		<div class="modal-action">
			<button class="btn btn-ghost" onclick={() => completeDialog.close()}>Cancel</button>
			<form method="POST" action="?/complete" use:enhance={() => ({ onResult: () => completeDialog.close() })}>
				<button type="submit" class="btn btn-success">Complete</button>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<dialog bind:this={deleteDialog} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Delete count?</h3>
		<p class="py-4 text-sm text-base-content/60">
			This will permanently delete "{data.count.name}" and all its recorded items.
		</p>
		<div class="modal-action">
			<button class="btn btn-ghost" onclick={() => deleteDialog.close()}>Cancel</button>
			<form method="POST" action="?/delete" use:enhance>
				<button type="submit" class="btn btn-error">Delete</button>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
