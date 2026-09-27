# STATUS — where this stopped, what to do next

> Written 2026-09-27 (session 2026-09-26 → 09-27). Re-entry context. Session narrative:
> [`docs/WORKLOG.md`](docs/WORKLOG.md). Earlier build-state handoff:
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

The spec is still awaiting review. Code written since, in three commits, all narrower than
the RFC: restoring the frontend files `.gitignore` had swallowed, the `PVL_MODE=local`
auth/quota bypass needed to view the UI at all, and a one-command start script. Plus the
demo-password fix. Five commits total on `docs/local-first-dual-mode-prd`, unmerged.

## What runs on this machine today

```bash
bash scripts/dev-local.sh      # starts both; Ctrl-C stops both
```

Frontend on `:3000`, API on `:8000` with `PVL_MODE=local`. First time only:
`pip install -e .` and `cd web && npm install`. Details and troubleshooting in
[`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) §2a.

Local mode (`PVL_MODE=local`) is partially real as of 2026-09-26: auth is bypassed,
quota is exempt, and the frontend runs with no Supabase project. Still **not** built:
`SqliteRepo`, `LocalStorage`, `LocalDispatcher` (backlog L2–L4), so jobs are held in
memory and nothing reaches a GPU.

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
- **Run `pytest tests`, not bare `pytest`.** `scripts/tests` imports
  `pickleball_vision`, a package the reorg deleted, and kills collection for the whole
  run. `python -m pytest tests -q` gives 61 passed, 1 failed, 1 skipped — the failure is
  `test_sklearn_model_head`, which needs scikit-learn from the `[vision]` extra.
- **Control-plane deps are installed now** (`pip install -e .`), and the API runs here.
  The frontend's `npm install` is done too.
- `pyproject.toml` declares MIT but **there is no `LICENSE` file** — blocking for an
  open-source release (backlog `R1`).

## Open questions carried forward

Local LLM runtime (Ollama vs llama.cpp vs LM Studio) · does the VLM see frames or only the
stat table · skill-rating weights fixed vs learned · local retention defaults · whether
fine-tuned weights can be published given source datasets' CC BY 4.0 terms.

## How to resume

Read this, then `docs/BACKLOG.md`, then `docs/WORKLOG.md` for why things are the way they
are. For a feature, use the **ship-feature** skill. Verify offline first — `python -m
pytest tests` (not bare `pytest`, see the trap above) and `npx tsc --noEmit` in `web/`
both run without a GPU.
