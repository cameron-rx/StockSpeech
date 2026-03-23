<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Snippet } from 'svelte';

	interface Props {
		dialog?: HTMLDialogElement;
		title: string;
		message: string;
		action: string;
		hiddenInputs?: Snippet;
		submitLabel?: string;
	}

	let {
		dialog = $bindable(),
		title,
		message,
		action,
		hiddenInputs,
		submitLabel = 'Delete'
	}: Props = $props();
</script>

<dialog bind:this={dialog} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">{title}</h3>
		<p class="py-4 text-sm text-base-content/60">{message}</p>
		<div class="modal-action">
			<button class="btn btn-ghost" onclick={() => dialog?.close()}>Cancel</button>
			<form
				method="POST"
				{action}
				use:enhance={() =>
					async ({ update }) => {
						dialog?.close();
						await update();
					}}
			>
				{@render hiddenInputs?.()}
				<button type="submit" class="btn btn-error">{submitLabel}</button>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
