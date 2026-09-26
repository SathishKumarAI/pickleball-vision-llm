# Docs Index

> Rewritten 2026-09-26. The previous version described a `src/pickleball_vision/` layout and
> `docs/architecture|development|prompts/` directories that do not exist — a map that lies
> costs more than no map. This one lists only files that are here.

## Question → document

| Question | Read |
|---|---|
| What are we building and for whom? | [`specs/PRD-pickleball-vision.md`](specs/PRD-pickleball-vision.md) (v2 — local-first + managed) |
| How does local mode work, and why dual mode? | [`specs/RFC-004-local-first-dual-mode.md`](specs/RFC-004-local-first-dual-mode.md) · [`adr/0008`](adr/0008-dual-mode-local-and-managed.md) |
| What is next, and what counts as done? | [`BACKLOG.md`](BACKLOG.md) |
| Where did we stop, what are the traps? | [`STATUS.md`](STATUS.md) |
| Which model for which pipeline stage? | [`MODELS_AND_REUSE.md`](MODELS_AND_REUSE.md) |
| What does the OSS field already solve? | [`inspiration/oss-prior-art-2026-09.md`](inspiration/oss-prior-art-2026-09.md) |
| What do the commercial products do, and what may we not copy? | [`inspiration/competitive-landscape-2026-09.md`](inspiration/competitive-landscape-2026-09.md) · [`inspiration/pb-vision/`](inspiration/pb-vision/) |
| Which UI components exist, which are missing? | [`UI_COMPONENTS.md`](UI_COMPONENTS.md) |
| How do I run this? | [`GETTING_STARTED.md`](GETTING_STARTED.md) · [`SETUP.md`](SETUP.md) |
| How is the system shaped? | [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`specs/RFC-001-video-analysis-pipeline.md`](specs/RFC-001-video-analysis-pipeline.md) |
| Why is it built this way? | [`adr/`](adr/README.md) — decisions 0001–0008 |
| What does it cost to run hosted? | [`BUDGET_PLAN.md`](BUDGET_PLAN.md) · [`INFRA_SCALING.md`](INFRA_SCALING.md) |
| Ball detection findings so far | [`ball_detection_phase1.md`](ball_detection_phase1.md) · [`ball_detection_testing.md`](ball_detection_testing.md) |

## Layout

| Directory | Holds |
|---|---|
| `specs/` | PRD, RFCs, research notes, templates |
| `adr/` | numbered decision records, one per decision |
| `inspiration/` | competitor and OSS prior-art captures |
| `thinking/` | dated working notes; superseded by the docs above when they disagree |
| `guides/` · `technical/` · `api/` · `docs_roboflow/` | topic references |
| `assets/` | rendered diagrams |

## Superseded, kept for history
`PLAN.md` · `DELIVERY_PLAN.md` (self-managed AWS — see [ADR-0005](adr/0005-managed-stack.md)) ·
`REMEDIATION_PLAN.md` · `reorganization_plan.md` · `thinking/2026-06-07-mini-features-backlog.md`
(superseded by [`BACKLOG.md`](BACKLOG.md)) · `specs/RFC-002-aws-infrastructure.md`.

## Doc rules
- A change that invalidates a doc fixes the doc **in the same commit**.
- `STATUS.md` is written when you stop; `BACKLOG.md` is the queue; `adr/` is why.
- Numbers in docs carry their measurement method, or they do not go in.

> **Note:** `pyproject.toml` declares `license = "MIT"` but **there is no `LICENSE` file in
> the repo.** Blocking for an open-source release — backlog item `R1`.
