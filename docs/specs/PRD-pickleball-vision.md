# PRD: Pickleball-Vision-LLM — AI Game Analysis

| | |
|---|---|
| **Status** | Draft v2 — supersedes v1 (2026-06-07, in git history) |
| **Author** | Sathish Kumar |
| **Reviewers** | TBD |
| **Created / Updated** | 2026-06-07 / **2026-09-26** |
| **Design doc** | `docs/specs/RFC-004-local-first-dual-mode.md` |
| **Backlog** | `docs/BACKLOG.md` |

**What changed in v2, and why.** v1 assumed a single product: a paid managed-cloud SaaS.
v2 adds a **local-first, self-hostable open-source mode** running on the user's own GPU,
and **YouTube URL ingest**. Prior-art research (2026-09-26) also moved four model choices
and set honest accuracy expectations that v1 did not have. See §12.

---

## 1. Problem / Opportunity

Pickleball is the fastest-growing US sport and players still have no affordable,
automated, **private** way to analyze their game. Coaching costs ~$125/session. Every
software option meters you: PB Vision caps a video at 30 minutes and charges per minute
(Starter $19.99/mo for 100 min); SwingVision gates scoring behind $24.99/mo; Veo and Hudl
cap recording hours. All of them require uploading footage of you and the people you play
with to someone else's cloud — and one 2026 entrant discloses licensing aggregated player
data to third parties.

Two gaps sit open:

1. **Cost structure.** Every competitor meters minutes because cloud GPU costs money per
   video. Analysis on hardware you already own has no per-video cost and no reason to cap
   length.
2. **The coaching layer is the weakest part of every product, and nobody runs their own
   model.** PB Vision's "AI Coach" is templated cues plus a data bridge to *your*
   ChatGPT/Claude/Gemini account — so the data leaves anyway. A reviewer calls their
   coaching "underdeveloped". A local LLM reading local stats is a category difference, not
   feature parity.

Evidence: `docs/inspiration/competitive-landscape-2026-09.md`.

## 2. Target users

- **Recreational player** — "where am I losing points?" Wants a clear answer, not a stat
  dump. Primary user of the clip lane.
- **Competitive player / coach** — positioning, shot selection, rally patterns, trends over
  time. Primary user of the full-match lane.
- **Self-hoster / developer** — has a GPU, wants to own the pipeline, will fine-tune. The
  reason the project is open source, and the source of contributed accuracy improvements.
- **Club / league** (later) — batch analysis, oversight.

Context: post-match, on a desktop, with a phone-recorded clip or a YouTube link.

## 3. Goals

| Goal | Measured by |
|---|---|
| A clip becomes an annotated video + coaching report | end-to-end run on real footage, not a stub |
| Runs entirely on one consumer GPU, no cloud account | `git clone` to first result on a 16 GB card, documented in the README |
| No data leaves the machine in local mode | zero outbound network calls during analysis, asserted by a test |
| No metering: any length, any number of videos | full-match lane completes a 60-min input |
| Honest accuracy, published | measured numbers in the repo, including the bad ones |
| The managed SaaS mode keeps working | its existing offline test suite stays green |

## 4. Non-goals

- **Real-time / live analysis.** Post-recording only.
- **Officiating.** In/out is a *coach's estimate*, never a line call. Non-negotiable: the
  nearest comparable product is in active patent litigation over single-camera line calling
  (*Infinity Cube v. Mangolytics*, No. 3:22-cv-00547, S.D. Cal.), and PB Vision explicitly
  disclaims the feature. See `docs/inspiration/competitive-landscape-2026-09.md` §6.
- **Face recognition or cross-session player re-identification.** Pose keypoints are not
  biometric data under GDPR Art. 4(14) *until* used to re-identify across sessions. Staying
  on the safe side of that line is a design constraint.
- **Bulk YouTube ingestion or scraping for training data.** One clip the user has rights
  to, at a time. No channel, playlist, or batch ingest — see §9.
- **Multi-camera or calibrated 3D tracking.** That is capital, not code ($10K–$100K+/venue).
- **Mobile app. Multi-sport.** Architecture allows pickleball-first extension later.

## 5. Success metrics

**Product**

| Metric | Target | Note |
|---|---|---|
| Clip lane latency | 3-min clip analyzed in ≤3 min wall clock on a 16 GB GPU | **unverified** — the M0 GPU seam run sets the real number |
| Full-match lane | 60-min input completes without manual intervention | dead-time skipping via rally segmentation is where the speedup lives |
| Setup | clone to first result in ≤15 min following the README | on a machine with an NVIDIA GPU and drivers |
| Reliability | ≥99% of jobs reach `done` or a clear `error`, never silent loss | already true of the control plane |
| Coaching usefulness | ≥70% rated useful | thumbs rubric; the honest baseline is that competitors are weak here |

**Model quality — the numbers that are actually in doubt**

| Metric | Target | Grounding |
|---|---|---|
| Ball tracking F1 | **≥0.90 on our own labeled pickleball clips** | WASB-SBDT reports tennis F1 95.6 / badminton 93.1 (τ=4px). Pickleball is smaller and faster; 0.90 is the honest ask |
| Shot-type accuracy | **70–85%** | published fine-grained racket-sport stroke classification lands here: MediaEval table tennis best 74.2%. Anything claiming 95% is measuring something easier |
| Court keypoint error | ≤3px median | TennisCourtDetector: 1.83px with refinement |
| Player ID switches | <1 per rally | the same-kit doubles case is the known failure, for us and for every competitor |

**Anti-metric — what we will not claim:** PB Vision advertises "95%+ accuracy on shot
detection" unaudited, while a review documents a 27 mph drive logged at 60 mph. We publish
the measurement method with every number or we publish no number.

## 6. Requirements (MoSCoW)

**Must**
- Local mode: no account, no billing, no quota, no network egress during analysis.
- Ingest: local file **and** YouTube URL with an optional start/end timestamp.
- Two lanes: **clip** (30 s–3 min, interactive) and **full match** (queued, resumable).
- Annotated output video: ball trajectory, player boxes + track IDs, shot labels.
- Court homography → real-world units. Everything in §"shot metrics" depends on it.
- Shot metrics: type, speed (mph), depth, placement, per rally.
- Rally segmentation: count, length, longest, dead-time skipping.
- Coaching report: plain-language, from a **local** LLM, grounded in the computed stats.
- Stats persisted in a file the user can query directly (SQLite).
- The managed-cloud mode continues to work unchanged.

**Should**
- Court coverage heatmap, kitchen-line arrival %, positioning zones.
- Skill-rating composite — **formula published in the repo**, unlike every competitor.
- Auto highlights (rally length / event-driven ffmpeg cut list).
- Error attribution: net vs out, and forced vs unforced (PB Vision has no forced/unforced
  split — a genuine gap to fill).
- CLI (`pvl analyze <url|file>`) for headless use.
- Trend view across sessions (same person, self-declared, not face-matched).

**Could**
- DUPR / VAIR-compatible stat export — ecosystem value without surrendering video.
- Fine-tune loop: harvest failing frames → label → retrain → publish weights.
- Hand-battle and speedup detection; stacking detection.
- VLM rally description over the geometric stats.

**Won't (now)**
- Line calling as an officiating claim · live analysis · mobile · multi-sport · facility
  hardware integrations · social feed.

## 7. Non-functional requirements

| Area | Local mode | Managed mode |
|---|---|---|
| Hardware | one NVIDIA GPU, 16 GB target. **Blackwell `sm_120` needs `torch>=2.7.0+cu128`** — Ultralytics' default install ships an older torch and fails with `no kernel image is available` | Modal serverless GPU |
| State | SQLite | Supabase Postgres + RLS |
| Storage | filesystem under `./data/` | Supabase Storage, signed URLs |
| Auth | none — single user, bound to localhost | Supabase JWT + per-user ownership |
| Privacy | **no egress during analysis**, enforced by test | retention policy + GDPR delete |
| Cost | electricity | ≤~$0.05/video blended (`docs/BUDGET_PLAN.md`) |
| Licence | open source, permissive; every reused model's licence recorded | same |

VRAM budget is the real constraint: detector + pose + ball tracker + an 8B VLM at Q4 must
coexist in 16 GB, or run in sequenced stages. Sequencing is the fallback, and it is cheap.

## 8. User flows

**Local, clip lane (the one that must feel good)**
1. `pvl serve` (or `docker compose up`) → open localhost. No login.
2. Paste a YouTube URL + start/end, or drop a file.
3. Watch progress per stage (download → detect → track → court → analyze → coach).
4. Get: annotated video, shot table, court heatmap, coaching report. All on disk.
5. Query `data/analyses.db` directly if wanted.

**Local, full-match lane** — same entry, queued; rally segmentation skips dead time;
resumable across a crash; notify on completion.

**Managed** — unchanged from v1: register → upload → poll → download, with billing/quota.

## 9. YouTube ingest — the boundary, stated plainly

`yt-dlp` fetching third-party YouTube video conflicts with YouTube's ToS, which bars
automated access and unauthorized downloading. Pending 2026 litigation targets scraping
video for model training.

Therefore:
- The feature exists for **one clip at a time that the user has rights to** — their own
  upload, or footage they are permitted to analyze.
- **No batch, channel, or playlist ingest.** Not an oversight — removing the affordance is
  the control.
- **No harvesting into a training set.** Fine-tuning data comes from user-supplied footage
  with explicit consent.
- The README states this, and the hosted mode does not offer URL ingest at all.

## 10. Open questions

- Which local LLM runtime: Ollama vs llama.cpp direct vs LM Studio? (Leaning Ollama —
  lowest setup cost for a self-hoster.)
- Does the coaching layer get the VLM reading frames, or only the stat table? (Stats first;
  VLM is a "Could".)
- Skill-rating weights: fixed and published first, or learned? (Fixed first — it can be
  explained, which is the differentiator.)
- Retention defaults in local mode: keep everything, or prune intermediates?
- Do we publish fine-tuned weights, and under which licence, given the source datasets'
  CC BY 4.0 terms?

## 11. Milestones

| Milestone | Gate |
|---|---|
| **M0 — GPU seam** | one real clip end-to-end on the local 5070 Ti, per-stage timings recorded. **This unblocks every latency number in this document.** |
| **M1 — local lane** | no-auth local mode, file + YouTube clip ingest, SQLite, annotated output |
| **M2 — measured vision** | WASB ball backend + court homography + labeled eval set; publish real F1 |
| **M3 — coaching** | local LLM report grounded in stats; shot metrics in mph |
| **M4 — full-match lane** | queued, resumable, dead-time skipping |
| **M5 — open-source release** | README a stranger can follow, published weights + numbers |

Managed-mode deployment milestones stay as they are in `docs/ROADMAP.md`.

## 12. Model decisions changed by 2026-09-26 research

| Stage | v1 | v2 | Why |
|---|---|---|---|
| Ball | TrackNetV3 | **WASB-SBDT** (MIT) | tennis F1 95.6 vs MonoTrack 92.1, validated across 5 sports; TrackNetV3's 97.5% is badminton-only on a torch-1.10 stack |
| Tracking | `boxmot` BoT-SORT | **`roboflow/trackers`** (Apache 2.0) | maintained, benchmarked on SportsMOT/SoccerNet, `supervision`-native. BoT-SORT ReID stays for same-kit doubles |
| Court | hand-rolled numpy DLT | **TennisCourtDetector pattern**, retrained | 1.83px median error, weights published |
| Pose | unspecified | **ViTPose-L** | 78.3 AP; chosen by PadelTracker100 after a SOTA comparison on the closest sport |
| Coach LLM | Bedrock cloud / `hf` | **Qwen3-VL-8B Q4 local** (~6–8 GB) | fits 16 GB alongside the vision stack |

Full evidence: `docs/inspiration/oss-prior-art-2026-09.md`. `docs/MODELS_AND_REUSE.md` is
updated to match.

## References
- Design: `docs/specs/RFC-004-local-first-dual-mode.md` · `docs/adr/0008-dual-mode-local-and-managed.md`
- Research: `docs/inspiration/oss-prior-art-2026-09.md` · `docs/inspiration/competitive-landscape-2026-09.md` · `docs/inspiration/pb-vision/`
- Build: `docs/BACKLOG.md` · `docs/UI_COMPONENTS.md` · `docs/MODELS_AND_REUSE.md` · `docs/ROADMAP.md`
- Market: [PB Vision](https://pb.vision/) · [SwingVision](https://swing.vision/)
