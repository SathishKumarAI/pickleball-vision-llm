/**
 * Owns: every call to the FastAPI control plane — base URL, bearer token,
 * and turning a non-2xx response into a typed ApiError. Does NOT own Supabase
 * auth (lib/supabase/*) or job realtime (lib/hooks/useJobRealtime.ts).
 *
 * Reconstructed 2026-09-26 from its call sites — the original web/lib/ was never
 * committed (the .gitignore `lib/` pattern ignored it).
 */

import { API_URL, LOCAL_PREVIEW } from "@/lib/env";

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }

  /** Quota exhausted — the UI offers an upgrade rather than an error. */
  get isQuota(): boolean {
    return this.status === 402 || this.status === 429;
  }
}

async function bearer(): Promise<string | null> {
  if (LOCAL_PREVIEW) return null;
  // Imported lazily: this module is used from server components too, where the
  // browser client must not be constructed.
  const { createClient } = await import("@/lib/supabase/client");
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Call the control plane. Throws ApiError on a non-2xx response.
 *
 *   const { jobs } = await api<{ jobs: Job[] }>("/jobs");
 *   await api(`/jobs/${id}/cancel`, { method: "POST" });
 */
export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const token = await bearer();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError(0, `Can't reach the API at ${API_URL}. Is the control plane running?`);
  }

  const text = await res.text();
  const body = text ? safeJson(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, messageFrom(body) ?? `Request failed (${res.status}).`, body);
  }
  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function messageFrom(body: unknown): string | null {
  if (typeof body === "string") return body || null;
  if (body && typeof body === "object") {
    const d = (body as Record<string, unknown>).detail ?? (body as Record<string, unknown>).message;
    if (typeof d === "string") return d;
  }
  return null;
}

export interface Job {
  id: string;
  status: "queued" | "running" | "done" | "error" | "cancelling" | "cancelled";
  progress?: number;
  message?: string;
  error?: string;
  created_at?: string;
  filename?: string;
}
