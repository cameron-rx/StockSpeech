<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		bottom?: '20' | '24';
		onclick?: () => void;
		href?: string;
	}

	let { children, bottom = '20', onclick, href }: Props = $props();
</script>

<div class="fab {bottom === '24' ? 'bottom-24' : 'bottom-20'}">
	{#if href}
		<a {href} class="btn btn-circle btn-xl btn-accent">
			{@render children()}
		</a>
	{:else}
		<button class="btn btn-circle btn-xl btn-accent" {onclick}>
			{@render children()}
		</button>
	{/if}
</div>
