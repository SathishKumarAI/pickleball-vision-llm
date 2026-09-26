"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Quota = { plan: string; videos_used: number; videos_limit: number; remaining: number };

export default function QuotaMeter() {
  const [q, setQ] = useState<Quota | null>(null);
  useEffect(() => {
    api<Quota>("/account/usage").then(setQ).catch(() => {});
  }, []);

  if (!q) return <div className="skeleton h-[68px] w-full rounded-xl" />;

  // Local mode has no cap (limit -1): show what was analysed, no meter, no upsell.
  if (q.videos_limit < 0) {
    return (
      <div className="panel p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Local — unlimited</span>
          <span className="font-mono text-xs text-ink/55">{q.videos_used} analysed this month</span>
        </div>
        <p className="mt-2 text-xs text-ink/55">Analysis runs on this machine. No quota, no billing.</p>
      </div>
    );
  }

  const pct = q.videos_limit ? Math.min(100, (q.videos_used / q.videos_limit) * 100) : 0;
  const low = q.remaining <= 1;
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium capitalize">{q.plan} plan</span>
        <span className="font-mono text-xs text-ink/55">{q.videos_used} / {q.videos_limit} this month</span>
      </div>
      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-ink/10"
           role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${low ? "bg-flame" : "bg-lime"}`} style={{ width: `${pct}%` }} />
      </div>
      {low && (
        <p className="mt-2 text-xs text-flame">
          {q.remaining === 0 ? "You're out of analyses this month." : "1 analysis left this month."}{" "}
          <Link href="/billing" className="ink-link">Upgrade →</Link>
        </p>
      )}
    </div>
  );
}
