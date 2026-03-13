import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public'
import { createServerClient } from '@supabase/ssr'
import { type Handle, type HandleServerError } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  const supabaseUrl = event.platform?.env?.PUBLIC_SUPABASE_URL ?? PUBLIC_SUPABASE_URL
  const supabaseKey = event.platform?.env?.PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? PUBLIC_SUPABASE_PUBLISHABLE_KEY

  event.locals.supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return event.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          event.cookies.set(name, value, { ...options, path: '/' })
        )
      }
    }
  })

  // Safe session helper — always validates the JWT, never trusts the cookie alone
  event.locals.safeGetSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession()
    if (!session) return { session: null, user: null }

    const { data: { user }, error } = await event.locals.supabase.auth.getUser()
    if (error) return { session: null, user: null }

    return { session, user }
  }


  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    }
  })
}

export const handleError: HandleServerError = ({ error, event }) => {
  console.error('Server error:', error, event.url.pathname)
  return { message: 'An unexpected error occurred' }
}