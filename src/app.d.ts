// See https://svelte.dev/docs/kit/types#app.d.ts
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/client" />

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession(): Promise<{session: Session | null; user: User | null}>;
		}
		// interface PageData {}
		// interface PageState {}
	}
}


export {};
