# ADR-0008: Dual mode — local-first open source alongside the managed stack

**Status:** Accepted · **Date:** 2026-09-26

## Context
[ADR-0005](0005-managed-stack.md) chose a managed-first stack (Modal + Supabase + Vercel +
Stripe) for ~200 paying customers. That decision stands for the hosted product, but it
makes three things impossible: running with no cloud account, analyzing a video of
unlimited length, and keeping footage of the people you play with on your own machine.

Two facts changed:

1. **Hardware.** The development machine now has an RTX 5070 Ti (16 GB). The pipeline that
   ADR-0005 pushed to serverless GPU can run locally.
2. **Competitive research (2026-09-26).** Every commercial competitor meters minutes because
   cloud GPU costs money per video (PB Vision: 30-minute hard cap, $19.99/mo for 100
   minutes). None runs its own LLM — PB Vision bridges to the *user's* ChatGPT/Claude/Gemini
   account, so data leaves regardless. Local inference plus a local model is therefore a
   category difference, not feature parity. Evidence:
   `docs/inspiration/competitive-landscape-2026-09.md`.

The alternative to dual mode was choosing one: keep the SaaS and drop local (loses the
open-source proposition), or go local-only (discards working billing, quota and Modal
integration).

## Decision
**Run both modes from one codebase, selected by an explicit `PVL_MODE` of `local` or
`managed`.**

Local mode is a **third implementation of the three service ABCs that already exist**
(`Dispatcher`, `Repo`, `Storage` in `app/services/`), not a fork:

| Seam | `managed` | `local` |
|---|---|---|
| dispatch | `ModalDispatcher` | `LocalDispatcher` — subprocess running `worker.runner.run_job` on the local GPU |
| repo | `SupabaseRepo` | `SqliteRepo` — `data/analyses.db`, user-queryable |
| storage | `SupabaseStorage` | `LocalStorage` — filesystem under `./data/` |
| auth | Supabase JWT | bypassed, bound to localhost |
| ingest | direct-to-storage upload (ADR-0007) | upload **plus** single-clip YouTube URL |

Mode selection is **explicit and fails loudly**. The current wiring infers services from
whether Supabase is configured, falling back to `Fake*` — which would let a misconfigured
local install report success having analyzed nothing. `Fake*` stays test-only.

Design: [RFC-004](../specs/RFC-004-local-first-dual-mode.md).

## Consequences
- ✅ Product exists without any cloud account; no metering, no length cap.
- ✅ No egress during analysis — enforced by a test, because it is a headline claim.
- ✅ ADR-0005 remains valid for the hosted product; nothing is deleted.
- ✅ Features land **below** the service seam, so they land in both modes at once.
- ➖ Two test matrices and two deploy stories. Accepted deliberately; a route-parity test
  and the shared seam are the controls against drift.
- ➖ 16 GB VRAM will not hold detector + pose + ball + an 8B VLM simultaneously; stages
  load and release in sequence. Costs wall-clock, not correctness.
- ➖ `yt-dlp` is a fragile dependency on someone else's site. File upload stays the path
  that always works.
- 🔁 Revisit if maintaining both modes measurably slows feature delivery — the seam makes
  dropping either one cheap.

## Boundaries this decision locks in
- **No officiating claims.** In/out is a coach's estimate. The nearest comparable product
  is in active patent litigation over single-camera line calling (*Infinity Cube v.
  Mangolytics*, No. 3:22-cv-00547, S.D. Cal.), and PB Vision itself disclaims the feature.
- **No face recognition or cross-session re-identification.** Pose keypoints stay outside
  GDPR Art. 4(14) biometric data only while they are not used to re-identify people.
- **No bulk YouTube ingest and no scraped training data.** One clip the user has rights to.
  Removing the batch affordance *is* the control.

## References
- [RFC-004](../specs/RFC-004-local-first-dual-mode.md) · [PRD v2](../specs/PRD-pickleball-vision.md) · `docs/BACKLOG.md`
- Amends [ADR-0005](0005-managed-stack.md); extends [ADR-0007](0007-direct-to-storage-upload.md) with a second ingest path
- Research: `docs/inspiration/oss-prior-art-2026-09.md` · `docs/inspiration/competitive-landscape-2026-09.md`
- Seams: `app/services/dispatch.py` · `app/services/repo.py` · `app/services/storage.py` · `app/deps.py`
