<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		onclick?: () => void;
		href?: string;
	}

	let { children, onclick, href }: Props = $props();
</script>

{#if href}
	<a {href} class="btn btn-circle btn-md btn-accent">
		{@render children()}
	</a>
{:else}
	<button class="btn btn-circle btn-md btn-accent" {onclick}>
		{@render children()}
	</button>
{/if}
