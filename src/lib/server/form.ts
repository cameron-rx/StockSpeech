/**
 * Safely extract a string value from FormData, returning null if missing or not a string.
 */
export function getString(formData: FormData, key: string): string | null {
	const val = formData.get(key);
	return typeof val === 'string' ? val : null;
}

/**
 * Extract a required trimmed string from FormData.
 * Returns the trimmed value or null if missing/empty.
 */
export function getRequiredString(formData: FormData, key: string): string | null {
	const val = getString(formData, key);
	return val?.trim() || null;
}

/**
 * Extract a numeric value from FormData, returning null if missing or NaN.
 */
export function getNumber(formData: FormData, key: string): number | null {
	const val = getString(formData, key);
	if (val == null) return null;
	const num = Number(val);
	return Number.isNaN(num) ? null : num;
}
