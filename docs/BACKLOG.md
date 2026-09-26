# Backlog

> Created 2026-09-26. Supersedes `docs/thinking/2026-06-07-mini-features-backlog.md`
> (kept for history). Drives [PRD v2](specs/PRD-pickleball-vision.md) and
> [RFC-004](specs/RFC-004-local-first-dual-mode.md).
>
> **Every item states a done-criterion you can run.** "Implemented" is not a
> done-criterion. Legend: 🟢 offline-verifiable on any dev box · 🎮 needs the local GPU ·
> 🧰 needs managed infra · ✅ already built.
>
> Mirror to Plane as work items labelled `repo:pickleball-vision-llm` plus a `type:` label
> when pulling one into a cycle — the id here (`L1`, `V3`) goes in the Plane title so the
> two stay linked.

## Order, and why

M0 first because **every latency and cost number in the PRD is currently a guess** — the
pipeline has never run on a GPU. Then the local lane (L), because it is what makes the
product exist without a cloud account. Then measured vision (V), because accuracy is the
real product risk and no competitor or OSS project has published a pickleball ball-tracking
number. Coaching (C) after that, since it consumes V's output. UI (U) tracks L and V.
Full-match (F), platform (P) and release (R) last.

---

## Epic M0 — Close the GPU seam 🎮

The one blocker. The control plane has only ever been tested against a stub processor.

| id | Item | Done when |
|---|---|---|
| M0-0 | Make this machine a working dev box | `python -m pytest -q` collects and passes. Today it fails at collection: `No module named 'jwt'`, `No module named 'pickleball_vision'` — deps missing and the package not installed editable. The "52 pytest green" on record was measured on the Linux box |
| M0-1 | Install the Blackwell-safe stack | `python -c "import torch;print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"` prints `True NVIDIA GeForce RTX 5070 Ti`. `torch>=2.7.0+cu128` installed **before** ultralytics |
| M0-2 | One real clip end-to-end | a 60 s clip goes file → `Pipeline.process_video` → annotated mp4 that a human watches and confirms tracks the ball |
| M0-3 | Record the numbers | `docs/thinking/M0-seam-results.md` holds per-stage wall-clock, peak VRAM per stage, and cold-start cost. PRD §5 latency targets updated from measurement |
| M0-4 | VRAM co-residency check | measured: can detector + pose + ball + 8B VLM co-reside in 16 GB, or is sequencing required? Answer recorded, RFC-004 §5 updated |

## Epic L — Local-first mode 🟢 (GPU only at the seam)

| id | Item | Done when | Dep |
|---|---|---|---|
| L1 | Explicit `PVL_MODE` selection | `PVL_MODE=local` and `managed` both boot; an unset/invalid value **fails at startup with a clear message**; `Fake*` unreachable outside tests | — |
| L2 | `SqliteRepo` | passes the same `Repo` contract tests as `InMemoryRepo`; `data/analyses.db` openable in any SQL tool | L1 |
| L3 | `LocalStorage` | file round-trips; local signed URL serves the video to the existing player component unchanged | L1 |
| L4 | `LocalDispatcher` (subprocess) | stub job runs to completion with progress visible in the UI; `cancel()` kills the process, job lands in `error`/`cancelled`, no orphan | L1 |
| L5 | Auth bypass in local mode | every app route reachable with no token; **bound to localhost**; a test asserts managed mode still rejects an unauthenticated call | L1 |
| L6 | No-egress guarantee | a test asserts **zero outbound sockets** during a local analysis. This is a headline product claim — it gets a test, not a paragraph | L1–L4 |
| L7 | `pvl analyze <file>` CLI | one command, no server, writes annotated video + report + db row | L2–L4 |
| L8 | Route-parity test | both modes expose the same route set minus the documented exclusions (billing/quota/admin local, youtube managed) | L1 |
| L9 | One-command start | `docker compose up` **or** `pvl serve` gets a stranger from clone to a working localhost app; README verified by following it on a clean machine | L1–L5 |

## Epic I — Ingest 🟢

| id | Item | Done when | Dep |
|---|---|---|---|
| I1 | `POST /jobs/youtube` | a URL + start/end downloads via `yt-dlp`, trims with ffmpeg, and enters the identical job flow as an upload | L1–L3 |
| I2 | Ingest guardrails | playlist/channel URLs **rejected**; over-ceiling durations rejected **before download**; `--no-playlist` enforced; tests with `yt-dlp` mocked | I1 |
| I3 | Local-only exposure | the youtube route is absent in managed mode, asserted by test | I1, L8 |
| I4 | Timestamp-range UI | paste URL, pick start/end, see estimated duration before submitting | I1, U1 |

## Epic V — Measured vision 🎮

The accuracy epic. Nothing here is done on the strength of a green import.

| id | Item | Done when | Dep |
|---|---|---|---|
| V1 | **Labeled eval set** | ≥500 frames from ≥3 real clips (varied court, lighting, camera height) with ball position labelled; stored with a documented format and a licence note. **Do this first — without it every other V item is unmeasurable** | M0-2 |
| V2 | WASB-SBDT ball backend | new backend beside `TrackNetBall`, selected by config; runs on the eval set | V1 |
| V3 | Publish ball-tracking F1 | measured F1 on V1's eval set, in the repo, **including if it is bad**. Target ≥0.90; report what it actually is | V2 |
| V4 | Trajectory outlier rejection | the real-footage case that produced **353 px/frame** junk now yields physically plausible tracks; test pins the old failing sequence | V1 |
| V5 | Court keypoint model | pickleball-geometry keypoints, TennisCourtDetector pattern; median error ≤3px on a held-out set | V1 |
| V6 | Homography → real units | a known court dimension measured from video within ±5%; this unblocks every mph/ft metric | V5 |
| V7 | `roboflow/trackers` migration | replaces the `boxmot` path; ID-switch count on a labelled doubles clip **<1 per rally** | M0-1 |
| V8 | Same-kit doubles ReID | BoT-SORT + ReID beats V7's baseline on a matching-shirts clip; number recorded. If it does not, say so and keep ByteTrack | V7 |
| V9 | ViTPose-L pose | player keypoints at usable fps within the VRAM budget; fps + VRAM recorded | M0-4 |
| V10 | Shot-type classifier | trained on pose + ball trajectory + court position; accuracy reported per class on a held-out set. **Expect 70–85%; do not ship a claim above what is measured** | V6, V9 |
| V11 | Shot speed in mph | ±10% of a hand-measured reference shot | V6 |
| V12 | Net / out estimate | labelled **"coach's estimate"** in every surface it appears. Never an officiating claim (PRD §4) | V6 |
| V13 | Rally segmentation on real footage | rally count matches a human count on a 10-min clip, ±1 | V1 |
| V14 | Fine-tune loop | harvest failing frames → label → retrain → re-measure, documented end to end so a contributor can repeat it. **Triggered by V3 falling short, not scheduled upfront** | V3 |

## Epic C — Coaching 🎮

| id | Item | Done when | Dep |
|---|---|---|---|
| C1 | Local LLM adapter | fourth adapter beside `rule`/`hf`/`cloud`; generates a report with the network off | M0-4 |
| C2 | Stat-grounded prompt | every claim in the report traces to a computed stat; a test asserts the prompt carries no invented metrics | C1, V10 |
| C3 | Pickleball vocabulary | *dink*, *kitchen*, *third-shot drop*, *Erne*, *speedup*, *reset* used correctly in output — reviewed against `docs/inspiration/pb-vision/` terminology | C1 |
| C4 | Improvement advice | report names the top 3 weaknesses **with the stat that justifies each** and one drill per weakness | C2 |
| C5 | Skill-rating composite | fixed published weights, formula in the repo. **The differentiator is that it is auditable**, not that it matches PB Vision's number | V10, V11 |
| C6 | Forced vs unforced errors | split that PB Vision does not offer; agreement with a human rater on a labelled clip reported | V10, V13 |

## Epic U — UI 🟢

Per `docs/UI_COMPONENTS.md`. Reuses `DESIGN.md` tokens; no new design system.

| id | Item | Done when | Dep |
|---|---|---|---|
| U1 | Ingest panel | URL + timestamp + lane selector alongside the existing dropzone | I1 |
| U2 | Mode-aware nav | billing/quota/admin hidden in local mode; no dead links | L1 |
| U3 | Stage progress | per-stage progress (download → detect → track → court → analyze → coach), not one bar | L4 |
| U4 | Shot table | sortable, filterable, click-to-seek in the video. The Shot Explorer equivalent | V10 |
| U5 | Rally timeline | scrubber showing rally spans and dead time over the video | V13 |
| U6 | Court heatmap | coverage + kitchen arrival on a top-down court | V6 |
| U7 | Trajectory overlay | ball path drawn over a paused frame | V2 |
| U8 | Coaching report view | weaknesses + drills, each linked to the stat and the clip that shows it | C4 |
| U9 | Skill-rating card | score, sub-scores, **and the formula, visible** | C5 |
| U10 | Local empty/error states | no-GPU, yt-dlp-missing, ffmpeg-missing, VRAM-exhausted each produce an actionable message, not a stack trace | L9 |

## Epic F — Full-match lane 🎮

| id | Item | Done when | Dep |
|---|---|---|---|
| F1 | Queued lane | a 60-min input completes unattended | L4, V13 |
| F2 | Dead-time skipping | cheap rally pass first, full analysis only on rally spans; **measured speedup vs analyzing everything** recorded | V13 |
| F3 | Per-stage resume | kill the process mid-run; restart skips completed stages and finishes | F1 |
| F4 | Highlight cut list | ffmpeg cut list from rally length + events; produces a watchable reel | V13 |
| F5 | Completion notification | local notification or a finished-state the UI surfaces without polling | F1 |

## Epic P — Platform 🟢

| id | Item | Done when |
|---|---|---|
| P1 | CI on push | offline pytest + `web` build run on push; the stale `.github/workflows` fixed |
| P2 | Local-mode docs | `docs/GETTING_STARTED.md` covers the local path, including the `sm_120` trap verbatim so it is searchable |
| P3 | Stat export | JSON/CSV out of SQLite; the local answer to PBQL |
| P4 | DUPR/VAIR-compatible export | stat feed export without sending video anywhere |
| P5 | Trend view | multiple sessions for a self-declared player. **No face matching** (PRD §4) |
| P6 | Doc-truth check | no doc claims a model choice that `MODELS_AND_REUSE.md` contradicts |

## Epic R — Open-source release

| id | Item | Done when |
|---|---|---|
| R1 | Licence + attribution | project licence chosen; **every reused model's licence recorded** (WASB MIT, trackers Apache 2.0, Roboflow datasets CC BY 4.0 unless restricted) |
| R2 | README a stranger can follow | someone with an NVIDIA GPU reaches a first result in ≤15 min without asking a question |
| R3 | Published numbers | ball F1, shot-type accuracy per class, court error, throughput on a named GPU — with the method |
| R4 | Published weights | fine-tuned weights released, if R1's licence review allows given source-dataset terms |
| R5 | Boundaries in the README | no officiating claim · no face recognition · YouTube single-clip rule · consent expectation for filmed players |

---

## Already built — do not re-file

✅ FastAPI control plane (auth, jobs, billing, account, admin) · injectable
repo/dispatch/storage with fakes · Modal worker seam (`worker/runner.run_job`) · Supabase
schema + RLS · Stripe billing + quota · Next.js frontend, 8 pages, Athletic Editorial
design system · `src/vision/analysis/` trajectory + actions + rally (offline, tested) ·
lazy vision adapters (Roboflow detector, ByteTrack, BoT-SORT, TrackNet ball) · structured
logging + admin log viewer · ADRs 0001–0007 · RFC-001/002/003.

Detail: `docs/STATUS.md`.

## Deliberately not doing

Line calling as officiating · face recognition / cross-session re-ID · bulk YouTube or
scraped training data · multi-camera 3D tracking · facility hardware integrations · mobile
app · multi-sport · a second frontend for local mode.
