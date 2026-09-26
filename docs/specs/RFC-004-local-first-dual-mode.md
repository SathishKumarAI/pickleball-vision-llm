# RFC-004 — Local-First Mode Alongside the Managed Stack

| | |
|---|---|
| **Status** | Draft — awaiting review |
| **Author** | Sathish Kumar |
| **Created** | 2026-09-26 |
| **Supersedes** | nothing; **partially amends** [RFC-003 managed stack](RFC-003-managed-stack.md) and [ADR-0005](../adr/0005-managed-stack.md) |
| **Decision record** | [ADR-0008](../adr/0008-dual-mode-local-and-managed.md) |
| **Product doc** | [PRD v2](PRD-pickleball-vision.md) |

## Goals

1. Run the entire product on one consumer GPU with no cloud account, no login, no billing,
   and **no network egress during analysis**.
2. Accept a **YouTube URL with a timestamp range** as an input, alongside file upload.
3. Two processing lanes: interactive **clip** (30 s–3 min) and queued **full match** (60 min+).
4. Keep the managed-cloud mode working, with its offline test suite green.
5. Add **one module per seam**, not a fork. Dual mode must not mean double implementation
   of features.

## Non-goals

Real-time analysis · officiating claims · face recognition or cross-session re-ID · bulk
YouTube ingest · multi-camera 3D · a second frontend.

## Background — why this is cheap

`app/` was built against three abstract services, each already having a real and a fake
implementation:

| ABC | Real | Fake | Selected in |
|---|---|---|---|
| `Dispatcher` (`app/services/dispatch.py`) | `ModalDispatcher` | `FakeDispatcher` | `app/deps.py:get_dispatcher` |
| `Repo` (`app/services/repo.py`) | `SupabaseRepo` | `InMemoryRepo` | `app/deps.py:get_repo` |
| `Storage` (`app/services/storage.py`) | `SupabaseStorage` | `FakeStorage` | `app/deps.py:get_storage` |

Local mode is a **third implementation of each**. Every router, model and test above that
line is untouched. This is why "dual mode, both maintained" costs roughly three modules
rather than a parallel product.

The vision pipeline is already mode-agnostic: `Pipeline.process_video` in `src/` is called
by `worker/runner.run_job`, which is pure and tested. Local mode calls the same `run_job`.

## Design

### 1. Mode selection must be explicit

Today's wiring infers the mode: *if* Supabase is configured use it, *else* fall back to
`Fake`. Adding a third option to that chain is how a machine ends up silently running
`FakeDispatcher` and reporting success without analyzing anything.

So: **an explicit `PVL_MODE` of `local` | `managed`**, no default guessing, and startup
fails loudly if the selected mode's prerequisites are missing. `Fake*` stays reachable only
from tests, never from a config gap.

```
PVL_MODE=local    → LocalDispatcher  + SqliteRepo    + LocalStorage  + auth bypass
PVL_MODE=managed  → ModalDispatcher  + SupabaseRepo  + SupabaseStorage + JWT
```

### 2. The three local implementations

**`LocalDispatcher`** — runs `worker.runner.run_job` in a **subprocess**, not a thread.
Reasons, in order: a wedged CUDA context can be killed; the GIL does not serialize the
FastAPI event loop against frame decoding; and `cancel()` becomes a real kill rather than a
cooperative flag. It writes progress through the same `Repo` the router reads, so the
existing progress UI works unchanged. One job at a time, guarded by a lock — a 16 GB card
cannot hold two pipelines.

**`SqliteRepo`** — same `Repo` interface. One file, `data/analyses.db`. Users can query it
directly with any SQL tool, which is strictly better than PB Vision's cloud-only PBQL
console. Schema mirrors `supabase/migrations/` minus the RLS and multi-tenant columns.

**`LocalStorage`** — filesystem under `./data/`. `signed_url()` returns a
`/files/{path}`-style local route with a short-lived token, so the frontend's download and
video-player code paths do not branch on mode.

### 3. YouTube ingest

New router: `POST /jobs/youtube` taking `{url, start?, end?, lane}`. It shells out to
`yt-dlp`, requesting the smallest stream that still satisfies the analysis floor (≥720p),
trims to `[start, end]` with ffmpeg, and hands the file to `Storage` — after which the flow
is identical to an upload. So it is an *ingest adapter*, not a second pipeline.

Constraints from PRD §9, enforced in code rather than documented and forgotten:
- one URL per request, **no playlist/channel expansion** (`--no-playlist`)
- a duration ceiling; reject a 4-hour stream before downloading it
- available in **local mode only** — the managed API does not expose the route
- ingested media is never written into a training-data path

### 4. Two lanes

A lane is a **parameter set plus a queue policy**, not a second pipeline:

| | clip | full match |
|---|---|---|
| duration | 30 s–3 min | unbounded |
| queue | runs immediately, one at a time | queued, resumable |
| rally segmentation | analyze everything | **skip dead time** — segment first, then analyze only rally spans |
| output | annotated video + full report | same, plus a highlight cut list |

Dead-time skipping is where the full-match lane earns its keep: a league-night recording is
mostly walking and changeovers. `src/vision/analysis/rally.py` already segments rallies —
the lane reorders the pipeline to run it on a cheap pass first.

**Resume** is per-stage: each completed stage writes its artifact under the job directory,
and a restart skips stages whose artifact already exists. Cheap, and it makes a crash on
minute 55 survivable.

### 5. Model stack (per 2026-09-26 research)

| Stage | Choice | Notes |
|---|---|---|
| Detector | Ultralytics YOLO, pickleball weights | existing `get_detector()` factory |
| Ball | **WASB-SBDT** (MIT) as a new backend beside `TrackNetBall` | strongest cross-sport baseline; already used as a pickleball bootstrap by `pickleball-ai` |
| Tracking | **`roboflow/trackers`** ByteTrack; BoT-SORT + ReID for same-kit doubles | replaces the `boxmot` path |
| Court | TennisCourtDetector-style heatmap keypoints + `cv2.findHomography` | retrained on pickleball geometry |
| Pose | **ViTPose-L** (RTMPose CPU fallback) | |
| Coach | **Qwen3-VL-8B Q4 via a local runtime**, as a fourth LLM adapter beside `rule`/`hf`/`cloud` | ~6–8 GB |

**VRAM is the binding constraint**, not compute: detector + pose + ball + an 8B VLM do not
comfortably co-reside in 16 GB. Stages therefore **load, run and release** in sequence, with
the LLM last, after the vision models are freed. Sequencing costs wall-clock, not
correctness, and it is the difference between running on a 16 GB card and not.

`torch>=2.7.0+cu128` is installed **before** anything pulls Ultralytics, or Blackwell fails
with `no kernel image is available for execution on the device`.

### 6. Frontend

All 8 existing pages stay. Changes are additive:
- upload page gains a URL + timestamp-range input and a lane selector
- nav hides billing/quota/admin when the app reports local mode
- new analysis components per `docs/UI_COMPONENTS.md`

No second frontend, no separate HTML report renderer. One presentation layer is the whole
reason to prefer this over a standalone CLI — though `pvl analyze <url|file>` exists as a
thin headless entrypoint over the same pipeline.

## Alternatives considered

**A standalone local CLI with its own HTML report.** Smaller first diff, then every
analytics feature ships twice — once in React, once in a template. Rejected: that is the
dual-maintenance cost the seam design exists to avoid.

**Local mode as a Modal-emulating shim.** Keep one dispatcher and fake the Modal API
locally. Rejected: an emulation layer that must stay faithful to a moving third-party API,
to avoid writing one subprocess call.

**Fork into two repos.** Clean separation, genuinely double maintenance, and shared
vision-pipeline fixes would need porting. Rejected.

**Run local mode on the existing `Fake*` services.** They exist for tests and do not
persist or analyze. Would produce a product that reports success having done nothing.
Rejected — and the explicit `PVL_MODE` exists to make this unreachable by accident.

## Risks

| Risk | Mitigation |
|---|---|
| **Accuracy is the real product risk, not architecture.** No public validated pickleball ball-tracking number exists | build a labeled eval set early; publish measured F1 including bad results. M2 gates on this |
| 16 GB VRAM insufficient for the full stack | sequenced load/release; smaller pose model; VLM quantization already budgeted |
| Blackwell `sm_120` toolchain breakage | pin `torch>=2.7.0+cu128` in the local extra; document the failure string so it is searchable |
| Dual-mode drift — a feature lands in one mode only | features live below the service seam; a test asserts both modes serve the same routes |
| YouTube ToS exposure | one clip, no batch, local-only, no training harvest (PRD §9) |
| `yt-dlp` breaks when YouTube changes | pin it, fail with a clear message, and keep file upload as the path that always works |
| Full-match lane wedges on hour-long input | per-stage resume; subprocess kill; dead-time skipping reduces the window |

## Verification

Offline (no GPU, must stay green on any dev box):
- `SqliteRepo` passes the same contract tests as `InMemoryRepo` and `SupabaseRepo`
- `LocalStorage` round-trips a file and issues a working local signed URL
- `LocalDispatcher` runs a stub job to completion, and `cancel()` kills it
- YouTube ingest **rejects** a playlist URL and an over-ceiling duration, with `yt-dlp` mocked
- a **no-egress test** asserts zero outbound sockets during an analysis in local mode
- both modes expose the same route set, minus the deliberate exclusions

On the GPU box (M0):
- one real clip end-to-end, per-stage timings + peak VRAM recorded in
  `docs/thinking/M0-seam-results.md`
- the same clip through both lanes, outputs diffed

## Open questions

Local LLM runtime (Ollama vs llama.cpp vs LM Studio) · whether the VLM sees frames or only
the stat table · local-mode retention defaults · publishing fine-tuned weights given source
datasets' CC BY 4.0 terms.
