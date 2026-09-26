/**
 * Owns: the server-side (RSC / route handler) Supabase client, reading auth
 * cookies. Does NOT own the browser client (./client.ts) or middleware session
 * refresh (web/middleware.ts).
 *
 * Reconstructed 2026-09-26 — see the note in ./client.ts.
 */

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { LOCAL_PREVIEW, PREVIEW_USER, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/** Server Supabase client, or a preview stand-in that reports a signed-in user. */
export function createClient() {
  if (LOCAL_PREVIEW) {
    return {
      auth: {
        getUser: async () => ({ data: { user: PREVIEW_USER }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
      },
    } as unknown as ReturnType<typeof createServerClient>;
  }

  const store = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        // In a Server Component this throws; middleware already refreshes the
        // session, so swallowing it is correct rather than merely convenient.
        try {
          cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* read-only cookie store */
        }
      },
    },
  });
}
