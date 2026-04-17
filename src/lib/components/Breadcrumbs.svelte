<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Crumb {
		label: string;
		href?: string;
	}

	interface Props {
		crumbs: Crumb[];
		actions?: Snippet;
	}

	let { crumbs, actions }: Props = $props();
</script>

<div class="sticky top-0 z-10 flex items-center justify-between bg-base-100 px-4 pt-4 pb-2">
	<div class="breadcrumbs text-sm">
		<ul>
			{#each crumbs as crumb (crumb.label)}
				<li>
					{#if crumb.href}
						<a href={crumb.href}>{crumb.label}</a>
					{:else}
						{crumb.label}
					{/if}
				</li>
			{/each}
		</ul>
	</div>
	{#if actions}
		<div class="flex items-center gap-2">
			{@render actions()}
		</div>
	{/if}
</div>
