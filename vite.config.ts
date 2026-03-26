import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			pwaAssets: {
				config: true
			},
			registerType: 'autoUpdate',
			manifest: {
				name: 'StockSpeech',
				short_name: 'StockSpeech',
				description: 'Voice-powered stock counting',
				theme_color: '#2a1f0e',
				background_color: '#2a1f0e',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				icons: [
					{ src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
					{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
					{
						src: 'maskable-icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
			}
		})
	],
	ssr: {
		noExternal: ['phosphor-svelte']
	}
});
