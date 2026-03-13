<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	interface Props {
		href: string;
		label: string;
		icon: Snippet;
	}

	let { href, label, icon }: Props = $props();

	let active = $derived(page.url.pathname === href);
</script>

<a
	{href}
	aria-label={label}
	aria-current={active ? 'page' : undefined}
	class:dock-active={active}
>
	{@render icon()}
	<span class="dock-label">{label}</span>
</a>
