<script lang="ts">
	import { PlusIcon, DotsThreeVerticalIcon } from 'phosphor-svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { venueState } from '$lib/state/venue.svelte';

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

<div class="mx-4 my-4 flex h-auto w-auto flex-col gap-8">
	{#each data.counts as count (count.id)}
		<div class="card card-xs w-full bg-base-100 shadow-sm">
			<div class="flex items-stretch">
				<a href={resolve(`/count/${count.id}`)} class="card-body flex-1">
					<div class="flex flex-row items-start justify-between gap-2">
						<h2 class="card-title">{count.name}</h2>
						<div class="flex flex-row flex-wrap justify-end gap-2">
							{#if count.productListName}
								<div class="badge badge-soft badge-primary">{count.productListName}</div>
							{/if}
							<div class="badge {count.completed ? 'badge-success' : 'badge-warning'}">
								{count.completed ? 'Completed' : 'In Progress'}
							</div>
						</div>
					</div>
					<p>{count.userName}</p>
					<p>{count.date.toLocaleDateString()}</p>
				</a>
				<div class="flex items-start pt-3 pr-3">
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
								<button onclick={() => openEditCount(count)}>Edit</button>
							</li>
							<li>
								<button class="text-error" onclick={() => openDeleteCount(count)}>Delete</button>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<p class="text-base-content/60 text-sm">No counts yet. Start one with the + button.</p>
	{/each}
</div>

<div class="fab bottom-24">
	<button class="btn btn-circle btn-lg btn-primary" onclick={() => createDialog?.showModal()}>
		<PlusIcon weight="bold" />
	</button>
</div>

<dialog bind:this={createDialog} class="modal">
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

<dialog bind:this={deleteCountDialog} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Delete count?</h3>
		<p class="py-4 text-sm text-base-content/60">
			This will permanently delete "{selectedCount?.name ?? 'this count'}" and all its recorded
			items.
		</p>
		<div class="modal-action">
			<button class="btn btn-ghost" onclick={() => deleteCountDialog?.close()}>Cancel</button>
			<form
				method="POST"
				action="?/deleteCount"
				use:enhance={() =>
					async ({ update }) => {
						deleteCountDialog?.close();
						await update();
					}}
			>
				<input type="hidden" name="countId" value={selectedCount?.id} />
				<button type="submit" class="btn btn-error">Delete</button>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

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
