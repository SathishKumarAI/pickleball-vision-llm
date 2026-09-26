# UI Components

> Created 2026-09-26. What exists, what is missing, and which backlog item unblocks each
> missing piece. Visual language is fixed by [`DESIGN.md`](../DESIGN.md) and
> [`PRODUCT.md`](../PRODUCT.md) — **this document adds no new design system.** Register
> rule: landing is brand (loud), app is product (quiet).

## Change → file

| Change | File |
|---|---|
| Any colour, spacing, type token | `web/app/globals.css` (`@layer components`) |
| Shared primitives (header, skeleton, empty state) | `web/components/ui.tsx` |
| A page's layout | `web/app/(app)/<route>/page.tsx` |
| Nav and mode-awareness | `web/components/Nav.tsx` |
| New analysis widget | new file in `web/components/`, one concern per file |

## Existing inventory

**CSS component classes** (`web/app/globals.css`): `card` · `card-hover` · `btn-primary` ·
`btn-ghost` · `input` · `badge` · `panel` · `panel-2` · `pill` · `pill-dot` · `skeleton` ·
`eyebrow`. Hard 2px ink borders and offset shadows; press collapses the shadow.

**React components** (`web/components/`)

| Component | Owns |
|---|---|
| `ui.tsx` → `PageHeader`, `SkeletonRows`, `EmptyState` | product-register primitives |
| `Nav.tsx` | app navigation |
| `StatusPill.tsx` | job state (queued / running / done / error) |
| `JobProgress.tsx` | progress for a running job |
| `UploadDropzone.tsx` | file selection + direct-to-storage upload |
| `CoachingReport.tsx` | renders the coaching narrative |
| `QuotaMeter.tsx` | managed-mode usage against quota |

**Pages** (8): `/` landing (brand) · `/login` · `/dashboard` · `/upload` · `/history` ·
`/jobs/[id]` · `/analyses/[id]` · `/billing` · `/settings` · `/admin`.

## Missing components

Each is a new file in `web/components/`. Backlog ids are from `docs/BACKLOG.md`.

| Component | What it owns | Notes | Item |
|---|---|---|---|
| `IngestPanel` | source selector (file \| YouTube URL), URL field, start/end timestamps, lane selector, estimated duration before submit | sits beside `UploadDropzone`, does not replace it. Validation messages inline, not a toast | U1 |
| `StageProgress` | per-stage progress: download → detect → track → court → analyze → coach | replaces a single bar. Each stage shows elapsed; the running stage is the only animated element | U3 |
| `ShotTable` | sortable, filterable shot rows (type, speed, depth, placement, rally #), click-to-seek | the Shot Explorer equivalent. Mono type for numbers per `DESIGN.md`. Must scroll inside its own container, never widen the page | U4 |
| `RallyTimeline` | horizontal scrubber over video duration: rally spans vs dead time, click to seek | the one component that makes a 60-min analysis navigable. Lime fill = rally, paper-2 = dead time | U5 |
| `CourtHeatmap` | top-down court with coverage density, kitchen-line arrival, zone breakdown | SVG, not canvas — themeable with tokens and inspectable. Court geometry from one shared constant, never redrawn per component | U6 |
| `TrajectoryOverlay` | ball path drawn over a paused frame | absolute-positioned SVG over the video element; needs the video's intrinsic dimensions, not its rendered size | U7 |
| `ShotDistribution` | shot-type counts, per player | a bar set, not a pie. Follow the `dataviz` colour rules if loading a chart lib — otherwise plain SVG bars | U4 |
| `CoachingInsight` | one weakness: the claim, the stat that justifies it, the clip that shows it, one drill | **the product's differentiator.** A claim without its stat is a bug, not a styling choice | U8 |
| `SkillRatingCard` | overall score, sub-scores, **and the formula, expanded on demand** | the auditability is the feature. Competitors' ratings are black boxes | U9 |
| `ModeBanner` | states local mode and that nothing leaves the machine | quiet, one line, dismissible. This is the product promise — it belongs on screen once, not everywhere | U2 |
| `LocalErrorState` | no GPU / yt-dlp missing / ffmpeg missing / VRAM exhausted | each variant names the fix. A stack trace is not an error state | U10 |

## Changes to existing components

| Component | Change | Item |
|---|---|---|
| `Nav.tsx` | read mode from the API; hide billing, quota and admin in local mode. **No dead links** | U2 |
| `QuotaMeter.tsx` | managed-mode only; unmounted rather than zeroed in local mode | U2 |
| `UploadDropzone.tsx` | becomes one source inside `IngestPanel` | U1 |
| `JobProgress.tsx` | delegates to `StageProgress`; keeps the polling logic | U3 |
| `CoachingReport.tsx` | composes `CoachingInsight` items instead of rendering one prose block | U8 |
| `/analyses/[id]` | grows into the real results page: video + overlay, timeline, shot table, heatmap, report, rating | U4–U9 |
| `/upload` | hosts `IngestPanel` | U1 |

## Rules for these components

1. **A number on screen traces to a computed stat.** No placeholder values, ever — a
   fabricated stat in a coaching product is a correctness bug.
2. **One concern per file**, named for the concern. Past ~300 lines, split by concern.
3. **Court geometry lives in one constants module**, imported by heatmap, overlay and
   minimap. Three copies of a court outline will disagree within a month.
4. **Wide content scrolls inside its own container.** The page body never scrolls
   horizontally — shot tables are the likely offender.
5. **WCAG AA**: body ≥4.5:1. Lime and flame are accent fills behind ink text or bold
   ≥14px labels only — flame-on-paper is ≈3.3:1 and fails as body text.
6. **`prefers-reduced-motion`**: every animation has an instant alternative. The stage
   progress indicator is the one to get this wrong.
7. **Keyboard**: shot table rows, timeline segments and seek targets are focusable with
   visible focus. Click-to-seek that only works with a mouse excludes people.
8. **Empty and error states are designed, not defaulted** — the local mode's failures
   (missing ffmpeg, no GPU) are the first thing a self-hoster sees.

## Not building

A second frontend for local mode · a standalone HTML report renderer · charting libraries
where plain SVG suffices · a component library dependency (`DESIGN.md` primitives already
cover it) · dark theme (the design system commits to light).
