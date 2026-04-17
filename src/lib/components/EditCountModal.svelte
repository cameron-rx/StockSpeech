<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Snippet } from 'svelte';

	interface Props {
		dialog?: HTMLDialogElement;
		name: string;
		action: string;
		hiddenInputs?: Snippet;
	}

	let { dialog = $bindable(), name = $bindable(), action, hiddenInputs }: Props = $props();
</script>

<dialog bind:this={dialog} class="modal">
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">Edit Count</h3>
		<form
			method="POST"
			{action}
			use:enhance={() =>
				async ({ update }) => {
					dialog?.close();
					await update();
				}}
			class="flex flex-col gap-4"
		>
			{@render hiddenInputs?.()}
			<label class="floating-label">
				<input
					class="input w-full"
					type="text"
					name="name"
					placeholder="Count name"
					bind:value={name}
					required
				/>
				<span>Name</span>
			</label>
			<div class="modal-action mt-0">
				<button type="button" class="btn btn-ghost" onclick={() => dialog?.close()}>
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
