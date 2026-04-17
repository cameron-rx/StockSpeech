/**
 * Returns a Tailwind background class based on a confidence score (0–1).
 */
export function confidenceClass(score: number | null | undefined): string {
	if (score == null) return 'bg-base-300';
	if (score >= 0.9) return 'bg-success';
	if (score >= 0.5) return 'bg-warning';
	return 'bg-error';
}

/**
 * Formats a Date as a human-readable relative time string.
 */
export function relativeTime(d: Date): string {
	const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
	if (seconds < 60) return 'Just now';
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}min ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}hr ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
	const weeks = Math.floor(days / 7);
	return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}
