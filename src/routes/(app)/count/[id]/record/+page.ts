// routes/(app)/count/[id]/record/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data, parent }) => {
	const { supabase } = await parent();
	return { ...data, supabase };
};
