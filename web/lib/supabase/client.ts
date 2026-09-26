/**
 * Owns: the browser-side Supabase client, and the stand-in used when no Supabase
 * project is configured. Does NOT own API calls (lib/api.ts) or job realtime
 * (lib/hooks/useJobRealtime.ts).
 *
 * Reconstructed 2026-09-26: the original web/lib/ was never committed — the
 * .gitignore `lib/` pattern (meant for Python build output) silently ignored it.
 */

import { createBrowserClient } from "@supabase/ssr";
import { LOCAL_PREVIEW, PREVIEW_USER, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

type PreviewClient = {
  auth: {
    getUser: () => Promise<{ data: { user: typeof PREVIEW_USER | null }; error: null }>;
    getSession: () => Promise<{ data: { session: null }; error: null }>;
    signInWithPassword: (c: unknown) => Promise<{ data: null; error: { message: string } }>;
    signUp: (c: unknown) => Promise<{ data: null; error: { message: string } }>;
    signOut: () => Promise<{ error: null }>;
  };
  storage: {
    from: (bucket: string) => {
      upload: (path: string, file: unknown, opts?: unknown) => Promise<{ data: null; error: { message: string } }>;
    };
  };
};

const NO_CLOUD = {
  message: "Local preview: no Supabase project configured, so sign-in and uploads are off.",
};

function previewClient(): PreviewClient {
  return {
    auth: {
      getUser: async () => ({ data: { user: PREVIEW_USER }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: NO_CLOUD }),
      signUp: async () => ({ data: null, error: NO_CLOUD }),
      signOut: async () => ({ error: null }),
    },
    storage: {
      from: () => ({ upload: async () => ({ data: null, error: NO_CLOUD }) }),
    },
  };
}

/** Browser Supabase client, or a preview stand-in when unconfigured. */
export function createClient() {
  if (LOCAL_PREVIEW) return previewClient() as unknown as ReturnType<typeof createBrowserClient>;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
