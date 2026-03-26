import {
	defineConfig,
	minimal2023Preset,
	combinePresetAndAppleSplashScreens
} from '@vite-pwa/assets-generator/config';

export default defineConfig({
	headLinkOptions: {
		preset: '2023'
	},
	preset: combinePresetAndAppleSplashScreens(
		{
			...minimal2023Preset,
			transparent: {
				sizes: [64, 192, 512],
				favicons: [[48, 'favicon.ico']],
				padding: 0
			},
			maskable: {
				sizes: [512],
				padding: 0
			},
			apple: {
				sizes: [180],
				padding: 0
			}
		},
		{
			padding: 0.15,
			resizeOptions: {
				background: '#2a1f0e',
				fit: 'contain'
			},
			darkResizeOptions: {
				background: '#2a1f0e',
				fit: 'contain'
			},
			linkMediaOptions: {
				log: true,
				addMediaScreen: true,
				basePath: '/',
				xhtml: false
			},
			png: {
				compressionLevel: 9,
				quality: 80
			},
			name: (landscape, size, dark) => {
				return `apple-splash-${landscape ? 'landscape' : 'portrait'}-${dark ? 'dark-' : ''}${size.width}x${size.height}.png`;
			}
		}
	),
	images: ['static/icon.svg']
});
