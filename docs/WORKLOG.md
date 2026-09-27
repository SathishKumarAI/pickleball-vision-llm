# Worklog

Dated entries, newest first. What was done, what it cost, what was learned — not a
changelog of diffs. The reasoning that does not fit in a commit message goes here.

---

## 2026-09-26 → 09-27 — Local-first pivot planned; the frontend turned out to be unrunnable

**Asked for:** research prior art (open source and proprietary), write a PRD, build a
feature backlog, spec the UI components, and make the vision model run locally as open
source, with YouTube video as an input.

**Shipped:** 5 commits on `docs/local-first-dual-mode-prd`. Planning documents, then —
unplanned — repairing the app so it runs at all, then the local-mode auth path.

### Decisions taken

| Decision | Choice | Why |
|---|---|---|
| Cloud vs local | **Dual mode, both maintained** | `app/` already injects `Dispatcher`/`Repo`/`Storage` with fakes, so local is a third impl per seam, not a fork. ADR-0008. |
| Model strategy | **Assemble pretrained, fine-tune on measured failure** | no validated pickleball ball-tracking number exists publicly; bootstrapping beats training from scratch on 120-image datasets |
| Video length | **Two lanes** — clip (30 s–3 min) + queued full match | a league-night recording is mostly dead time; rally segmentation first is where the speedup is |

### Research findings that changed the plan

Two agents, ~90 min wall clock. Five model choices moved, each on a measured number:
ball **TrackNetV3 → WASB-SBDT** (tennis F1 95.6 vs MonoTrack 92.1, five sports, MIT —
and `pickleball-ai` already bootstraps pickleball from those weights); tracking
**boxmot → `roboflow/trackers`**; court **hand-rolled DLT → TennisCourtDetector pattern**
(1.83px median); pose **→ ViTPose-L**; coach **Bedrock → Qwen3-VL-8B Q4 local**.
`MODELS_AND_REUSE.md` was wrong on two of five stages.

Three things worth remembering beyond the doc:

1. **`rallymetry` is building the same product** — "local-first computer vision system for
   analyzing recorded doubles pickleball matches", same pipeline shape, 44 commits, no
   coaching LLM. Two independent projects converging on this repo's `src/vision/` →
   `src/fusion/` split is validation of the layout. The LLM coach is the differentiator.
2. **PB Vision runs no LLM.** Its "AI Coach" exports a data file to the *user's own*
   ChatGPT/Claude/Gemini account. So their user's data leaves the device regardless — a
   local model over local stats is a category difference, not feature parity.
3. **Fine-grained shot classification tops out in the 70s–80s%** in published work
   (MediaEval best 74.2%). PB Vision advertises unaudited "95%+" while a review documents a
   27 mph drive logged at 60 mph. The PRD now states the achievable number.

Two boundaries are now locked by evidence, not taste: **no officiating claims** (the
nearest comparable product, SwingVision, is in active patent litigation over single-camera
line calling — *Infinity Cube v. Mangolytics*, 3:22-cv-00547 S.D. Cal.; PB Vision itself
disclaims the feature), and **no bulk YouTube ingest or scraped training data** (ToS bars
automated downloading; 2026 suits target scraping video for model training). Removing the
batch affordance *is* the control. Also no face recognition or cross-session re-ID — that
is the line where pose keypoints become biometric data under GDPR Art. 4(14).

### The expensive discovery

Asked to show the UI, found **the Next.js app could not run from a clone.** Two
`.gitignore` patterns had silently eaten six files it imports:

- line 17 `lib/` — a Python build-output pattern — ignored the whole of **`web/lib/`**: the
  API client, both Supabase clients, the realtime hook.
- line 197 `*.json` — sitting among `*.mp4`, `*.csv`, `*.pkl` — took **`web/package.json`**
  and **`web/tsconfig.json`**.

None of them exist at any commit. They lived only on the machine that built them, which is
why `docs/STATUS.md` could honestly record "`npm run build` clean" — it *was* clean there.

**The lesson worth keeping: a blanket ignore plus a green build on the author's box is a
failure that survives review indefinitely.** Nothing in the repo could have caught it;
every check passed on the only machine that ran them. A CI job on a fresh checkout would
have failed on day one — backlog `P1`.

`web/lib/` was reconstructed from its call sites, so contracts match usage but internals
are new. Recorded in the files themselves so nobody mistakes them for the originals.

### Also found and fixed

- **Three demo passwords committed in plaintext** in `docs/DEMO_ACCESS.md` and
  `scripts/seed_demo_users.py`, on `main`, in a repo intended for open source. Accounts were
  never created, so nothing was live. The seed script now generates them per run into a
  gitignored file. **History was not rewritten** — it breaks every clone, and the fix that
  matters is never reusing those values. Treat them as burned (`P8`).
- **Local mode had a 3-video quota.** A self-hoster would hit "quota exceeded" on the third
  video analyzed on their own GPU. Fixed at `check_quota`, where `/jobs` and
  `/account/usage` both converge, rather than in each caller.
- `docs/README.md` described a `src/pickleball_vision/` layout and three directories that
  do not exist. Rewritten as a real index.
- `pyproject.toml` declares MIT but **there is no `LICENSE` file** — blocking for release
  (`R1`).
- Bare `pytest` dies collecting `scripts/tests`, which imports the deleted
  `pickleball_vision` package. Use `pytest tests` (`P7`).

### State at the end

Running on this machine via `bash scripts/dev-local.sh` — frontend `:3000`, API `:8000`
with `PVL_MODE=local`. Every page browsable, no login, API answers without a token, quota
exempt.

`python -m pytest tests -q` → **61 passed, 1 failed, 1 skipped**. The failure is
`test_sklearn_model_head`, needing scikit-learn from the `[vision]` extra — pre-existing.
`npx tsc --noEmit` exits 0. 52 of those 61 were the pre-existing suite, which had never
been run on this machine before today.

**Cannot yet put a video through it.** `SqliteRepo`, `LocalStorage` and `LocalDispatcher`
(L2–L4) do not exist, and torch is not installed, so nothing reaches the GPU. Empty lists
are genuinely empty.

**Not verified:** no browser screenshot — the Chrome extension is not connected here, so
client-rendered components are confirmed only through the API shape they read plus a clean
typecheck.

### Environment facts new to the repo

This machine has an **RTX 5070 Ti, 16 GB, driver 610.47**, Python 3.12.10 — the repo's
docs said "no GPU, Python 3.14", which described the Linux box. The 5070 Ti is Blackwell
`sm_120`: install `torch>=2.7.0+cu128` **before** anything pulls Ultralytics, or it fails
with `no kernel image is available for execution on the device`. 16 GB will not hold
detector + pose + ball + an 8B VLM at once; sequence the stages, LLM last.

### Next

`M0-1` — the Blackwell torch install, then one real clip through `Pipeline.process_video`
with per-stage timings and peak VRAM into `docs/thinking/M0-seam-results.md`. Every latency
and cost number in the PRD is a guess until that runs. Then `L2`–`L4`, then `V1` (the
labeled eval set) before any accuracy claim.

Spec still awaiting review: `docs/specs/RFC-004-local-first-dual-mode.md`.
