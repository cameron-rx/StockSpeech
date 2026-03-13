import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const { session, user } = await locals.safeGetSession()

   // Redirect to login if not authenticated
  if (!session && url.pathname !== '/login') {
    redirect(303, '/login')
  }

  // Redirect away from login if already authenticated
  if (session && url.pathname === '/login') {
    redirect(303, '/')
  }

  return { session, user }
}