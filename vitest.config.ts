import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	test: {
		env: {
			// loaded from .env by vitest automatically
		}
	},
	resolve: {
		alias: {
			$lib: resolve('./src/lib')
		}
	}
});
