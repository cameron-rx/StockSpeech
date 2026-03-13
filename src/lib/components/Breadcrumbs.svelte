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

<div class="breadcrumbs px-4 pt-4 text-sm">
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
