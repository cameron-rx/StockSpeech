/**
 * Retrieve an environment variable, preferring the Cloudflare Workers
 * `platform.env` binding and falling back to a build-time static value.
 */
export function getEnv(platform: App.Platform | undefined, key: string, fallback: string): string {
	return (platform?.env as unknown as Record<string, string>)?.[key] ?? fallback;
}
