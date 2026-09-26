/**
 * Owns: which mode the frontend is running in, and the two public env values
 * everything else reads. Does NOT own auth, fetching, or any Supabase client.
 *
 * When Supabase env vars are absent the app runs in LOCAL PREVIEW: no account,
 * no session, a stand-in user. That is the frontend half of the auth bypass
 * described in docs/specs/RFC-004-local-first-dual-mode.md (backlog L5).
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when no Supabase project is configured — render the UI without a login. */
export const LOCAL_PREVIEW = !SUPABASE_URL || !SUPABASE_ANON_KEY;

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** The stand-in identity used in local preview so pages have a user to render. */
export const PREVIEW_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "local@localhost",
} as const;
