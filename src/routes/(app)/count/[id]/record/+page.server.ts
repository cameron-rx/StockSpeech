import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { data: count } = await locals.supabase
		.from('stock_counts')
		.select('id, name, completed')
		.eq('id', params.id)
		.single();

	if (!count || count.completed !== 'in_progress') redirect(303, `/count/${params.id}`);

	return { count };
};
