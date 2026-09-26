/**
 * Owns: live job state for one job id. Uses Supabase Realtime when a project is
 * configured, and falls back to polling the control plane otherwise — so the
 * progress UI works in local preview too. Does NOT own rendering (JobProgress)
 * or the fetch layer (lib/api.ts).
 *
 * Reconstructed 2026-09-26 from its call sites — the original web/lib/ was never
 * committed (the .gitignore `lib/` pattern ignored it).
 */

"use client";

import { useEffect, useState } from "react";
import { api, type Job } from "@/lib/api";
import { LOCAL_PREVIEW } from "@/lib/env";

const POLL_MS = 2000;
const TERMINAL = new Set(["done", "error", "cancelled"]);

/** Live state for `jobId`, or null until the first read lands. */
export function useJobRealtime(jobId: string): Job | null {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let channel: { unsubscribe: () => void } | undefined;

    async function read(): Promise<Job | null> {
      try {
        const next = await api<Job>(`/jobs/${jobId}`);
        if (alive) setJob(next);
        return next;
      } catch {
        return null; // transient; the next tick retries
      }
    }

    async function poll() {
      const next = await read();
      if (!alive) return;
      // Stop polling once the job can no longer change.
      if (next && TERMINAL.has(next.status)) return;
      timer = setTimeout(poll, POLL_MS);
    }

    async function subscribe() {
      // First read is always over HTTP so the UI has state immediately.
      const first = await read();
      if (!alive || (first && TERMINAL.has(first.status))) return;

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient() as unknown as {
        channel: (name: string) => {
          on: (
            ev: string,
            filter: Record<string, unknown>,
            cb: (payload: { new: Job }) => void,
          ) => { subscribe: () => { unsubscribe: () => void } };
        };
      };

      channel = supabase
        .channel(`job:${jobId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
          ({ new: next }) => {
            if (alive) setJob(next);
          },
        )
        .subscribe();
    }

    if (LOCAL_PREVIEW) void poll();
    else void subscribe();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      channel?.unsubscribe();
    };
  }, [jobId]);

  return job;
}
