# STATUS — where this stopped, what to do next

> Written 2026-09-26. Re-entry context. Full build-state handoff:
> [`docs/STATUS.md`](docs/STATUS.md). The queue: [`docs/BACKLOG.md`](docs/BACKLOG.md).

## Where we stopped

Direction changed on 2026-09-26: the product is now **dual mode** — the existing managed
SaaS (Modal + Supabase + Vercel + Stripe) *and* a new **local-first, open-source mode** that
runs on one consumer GPU with no cloud account, plus YouTube clip ingest.

Written this session, not yet implemented in code:

| Document | What it settles |
|---|---|
| [`docs/specs/PRD-pickleball-vision.md`](docs/specs/PRD-pickleball-vision.md) | v2 — dual mode, two lanes, honest accuracy targets, legal boundaries |
| [`docs/specs/RFC-004-local-first-dual-mode.md`](docs/specs/RFC-004-local-first-dual-mode.md) | the design: three local service impls, explicit `PVL_MODE`, ingest adapter |
| [`docs/adr/0008-dual-mode-local-and-managed.md`](docs/adr/0008-dual-mode-local-and-managed.md) | the decision, amending ADR-0005 |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | epics M0/L/I/V/C/U/F/P/R, every item with a runnable done-criterion |
| [`docs/UI_COMPONENTS.md`](docs/UI_COMPONENTS.md) | 11 missing components, 7 existing ones, what changes |
| [`docs/inspiration/oss-prior-art-2026-09.md`](docs/inspiration/oss-prior-art-2026-09.md) | measured OSS survey; moved 5 model choices |
| [`docs/inspiration/competitive-landscape-2026-09.md`](docs/inspiration/competitive-landscape-2026-09.md) | competitor feature matrix, pricing, patent + ToS boundaries |

**No product code was written.** The spec is awaiting review; implementation starts after
an implementation plan exists.

## Next action

**`M0` in the backlog — close the GPU seam.** Nothing else is worth doing first: the
pipeline has never run on a GPU, so every latency and cost number in the PRD is a guess. One
real clip, per-stage timings and peak VRAM into `docs/thinking/M0-seam-results.md`.

Then `L1` (explicit `PVL_MODE`) → `L2`–`L4` (the three local service impls) → `V1` (labeled
eval set, before any accuracy claim).

## Environment traps

- **This box has an RTX 5070 Ti, 16 GB, driver 610.47. Python 3.12.10. `torch` is not
  installed yet.** Earlier docs (`docs/STATUS.md`) say "no GPU, Python 3.14" — that was the
  Linux machine, and it is no longer true here.
- **5070 Ti is Blackwell `sm_120`.** Install `torch>=2.7.0+cu128` **before** anything pulls
  Ultralytics, or you get `no kernel image is available for execution on the device`.
  Never `pip install -r` the TrackNet-lineage requirements verbatim (they pin torch 1.10).
- **16 GB will not hold detector + pose + ball + an 8B VLM at once.** Sequence the stages,
  LLM last. Confirm at M0-4.
- **Don't `next build` while the dev server runs** on the same `.next` — it corrupts chunks.
  Dev: `cd web && ./node_modules/.bin/next dev -p 3000`.
- **Windows + Git Bash here**, not Linux; earlier docs assume Linux paths.
- **The test suite does not run on this machine yet.** `python -m pytest -q` fails at
  collection with `ModuleNotFoundError: No module named 'jwt'` and `No module named
  'pickleball_vision'` — deps are not installed and the package is not installed editable.
  Fix before trusting any "tests green" claim here: `pip install -e ".[dev]"` (see
  `docs/GETTING_STARTED.md`). The "52 pytest green" in `docs/STATUS.md` was measured on the
  Linux box, not this one. Backlog `M0-0`.
- `pyproject.toml` declares MIT but **there is no `LICENSE` file** — blocking for an
  open-source release (backlog `R1`).

## Open questions carried forward

Local LLM runtime (Ollama vs llama.cpp vs LM Studio) · does the VLM see frames or only the
stat table · skill-rating weights fixed vs learned · local retention defaults · whether
fine-tuned weights can be published given source datasets' CC BY 4.0 terms.

## How to resume

Read this, then `docs/BACKLOG.md`. For a feature, use the **ship-feature** skill. Verify
offline first — `pytest` for the control plane and `npm run build` in `web/` both run
without a GPU.
