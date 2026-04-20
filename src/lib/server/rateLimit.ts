/**
 * Simple in-memory sliding-window rate limiter.
 * Note: this resets on deploy/restart and is per-isolate on Cloudflare Workers.
 * For production at scale, use Cloudflare Rate Limiting or a KV-backed solution.
 */

const windows = new Map<string, number[]>();

/**
 * Check if a request should be rate limited.
 * @param key Unique identifier (e.g. user ID + endpoint)
 * @param maxRequests Maximum requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns true if the request is allowed, false if rate limited
 */
export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
	const now = Date.now();
	const timestamps = windows.get(key) ?? [];

	// Remove expired timestamps
	const valid = timestamps.filter((t) => now - t < windowMs);

	if (valid.length >= maxRequests) {
		windows.set(key, valid);
		return false; // rate limited
	}

	valid.push(now);
	windows.set(key, valid);
	return true; // allowed
}
