<script lang="ts">
	interface Crumb {
		label: string;
		href?: string;
	}

	interface Props {
		crumbs: Crumb[];
	}

	let { crumbs }: Props = $props();
</script>

<div class="sticky top-0 z-10 breadcrumbs bg-base-100 px-4 pt-4 pb-2 text-sm">
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
