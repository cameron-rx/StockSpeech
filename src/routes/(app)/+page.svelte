<script lang="ts">
	import { PlusIcon } from 'phosphor-svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import ActionDropdown from '$lib/components/ActionDropdown.svelte';
	import ConfirmDeleteModal from '$lib/components/ConfirmDeleteModal.svelte';
	import FAB from '$lib/components/FAB.svelte';
	import CountCard from '$lib/components/CountCard.svelte';

	let { data, form } = $props();

	let createDialog = $state<HTMLDialogElement>();
	let deleteCountDialog = $state<HTMLDialogElement>();
	let editCountDialog = $state<HTMLDialogElement>();

	type Count = (typeof data.counts)[0];
	let selectedCount = $state<Count | null>(null);
	let editName = $state('');

	function openDeleteCount(count: Count) {
		selectedCount = count;
		deleteCountDialog?.showModal();
	}

	function openEditCount(count: Count) {
		selectedCount = count;
		editName = count.name;
		editCountDialog?.showModal();
	}
</script>

<div class="mx-4 my-4 flex h-auto w-auto flex-col gap-4">
	{#each data.counts as count (count.id)}
		<CountCard
			name={count.name}
			completed={count.completed}
			userName={count.userName}
			date={count.date}
			href={resolve(`/count/${count.id}`)}
		>
			{#snippet actions()}
				<ActionDropdown>
					{#snippet items()}
						<li><button onclick={() => openEditCount(count)}>Edit</button></li>
						<li>
							<button class="text-error" onclick={() => openDeleteCount(count)}>Delete</button>
						</li>
					{/snippet}
				</ActionDropdown>
			{/snippet}
		</CountCard>
	{:else}
		<p class="text-base-content/60 text-sm">No counts yet. Start one with the + button.</p>
	{/each}
</div>

<FAB bottom="24" onclick={() => createDialog?.showModal()}>
	<PlusIcon weight="bold" />
</FAB>

<dialog bind:this={createDialog} class="modal">
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">New Count</h3>

		<form method="POST" action="?/create" use:enhance>
			<label class="floating-label mb-4">
				<input class="input w-full" type="text" name="name" placeholder="Count name" required />
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
	bind:dialog={deleteCountDialog}
	title="Delete count?"
	message={`This will permanently delete "${selectedCount?.name ?? 'this count'}" and all its recorded items.`}
	action="?/deleteCount"
>
	{#snippet hiddenInputs()}
		<input type="hidden" name="countId" value={selectedCount?.id} />
	{/snippet}
</ConfirmDeleteModal>

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
			<input type="hidden" name="countId" value={selectedCount?.id} />
			<label class="floating-label">
				<input
					class="input w-full"
					type="text"
					name="name"
					placeholder="Count name"
					bind:value={editName}
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
