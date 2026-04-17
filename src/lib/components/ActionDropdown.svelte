<script lang="ts">
	import { DotsThreeVerticalIcon } from 'phosphor-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		items: Snippet;
		width?: string;
	}

	let { items, width = 'w-28' }: Props = $props();
</script>

<div class="dropdown dropdown-end">
	<button tabindex="0" class="btn btn-square btn-ghost btn-sm">
		<DotsThreeVerticalIcon weight="bold" size={20} />
	</button>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<ul tabindex="0" class="dropdown-content menu z-10 rounded-box bg-base-100 {width} p-1 shadow">
		{@render items()}
	</ul>
</div>
