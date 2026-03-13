<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';

	interface Props {
		href: string;
		label: string;
		icon: Snippet;
	}

	let { href, label, icon }: Props = $props();

	let active = $derived(href === '/' ? page.url.pathname === '/' || page.url.pathname.startsWith('/count') : page.url.pathname.startsWith(href));
</script>

<a
	href={resolve(href)}
	aria-label={label}
	aria-current={active ? 'page' : undefined}
	class:dock-active={active}
>
	{@render icon()}
	<span class="dock-label">{label}</span>
</a>
