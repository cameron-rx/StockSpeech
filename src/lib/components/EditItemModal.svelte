<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		dialog?: HTMLDialogElement;
		action: string;
		itemId: string | undefined;
		productId: string;
		quantity: number | null;
		products: { id: string; name: string; unit?: string | null }[];
		onsubmit?: () => void;
	}

	let {
		dialog = $bindable(),
		action,
		itemId,
		productId = $bindable(),
		quantity = $bindable(),
		products,
		onsubmit
	}: Props = $props();
</script>

<dialog bind:this={dialog} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Edit item</h3>
		<form
			method="POST"
			{action}
			use:enhance={() =>
				async ({ update }) => {
					dialog?.close();
					onsubmit?.();
					await update();
				}}
			class="flex flex-col gap-4 pt-4"
		>
			<input type="hidden" name="itemId" value={itemId} />
			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium">Product</span>
				<select name="productId" class="select-bordered select w-full" bind:value={productId}>
					{#each products as p (p.id)}
						<option value={p.id}>{p.name}{p.unit ? ` (${p.unit})` : ''}</option>
					{/each}
				</select>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium">Quantity</span>
				<input
					type="number"
					name="quantity"
					class="input-bordered input w-full"
					bind:value={quantity}
					min="0"
					step="any"
				/>
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
