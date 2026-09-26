# Competitive Landscape — Commercial Pickleball Video Analysis

> Captured 2026-09-26 by web research. Confidence tagged per fact:
> **[VENDOR]** read on the vendor's own page · **[3RD]** secondary source ·
> **[UNSTATED]** not found · **[EST]** inferred, not stated.
> Companion to `docs/inspiration/pb-vision/` (deeper PB Vision metric capture).
> Verify pricing before quoting it anywhere — it moves.

## Why this file exists
Two questions drive it: which of their features are worth replicating, and which are
moats made of capital rather than code. The answer shapes the PRD's scope and the
backlog's order.

---

## 1. PB Vision — the closest competitor

**Metrics [VENDOR, help.pb.vision]**

| Group | What they compute |
|---|---|
| Shot types | dink, drive, drop, lob, serve (1st), return (2nd), 3rd/4th/5th, smash, speedup, reset, volley, forehand/backhand, passing shot, Erne, ATP, poach |
| Per shot | speed (mph), accuracy, depth from baseline, height above net, placement, 3D trajectory, `average_quality` score |
| Court | heat maps, court coverage (ft), kitchen-line arrival %, left/right-side-play %, stacking, zone breakdown (baseline/sideline/midline/kitchen/mid-court) |
| Rally | total + kitchen rallies, avg shots/rally, longest rally, win rate by rally length |
| Serve/return | avg serve mph + percentile vs peers, deep-serve %, shallow-return % |
| Errors | Out Fault %, Net Fault % — **no forced/unforced split** [UNSTATED] |
| Rating | overall 2.0–8.0 (capped ≈5.5 today) + 6 sub-scores: Kitchen Game, Ball Control, Defense, Offense, Court IQ, Targeting. Plus "Player Net Impact Score" |
| Query | **PBQL** — SQL-like language over shot data, to JSON/CSV or ffmpeg/EDL cut-lists |

Their rating measures *performance*, positioned against DUPR measuring *results*. v3.2
claimed "20% improvement in rating precision over v3.0" — **[VENDOR claim, unaudited]**.

**Pricing / limits [VENDOR]** — Starter $19.99/mo (100 min) or $99.99/yr (1,200 min);
Premium $49.99/mo (400 min) or $396/yr (4,800 min, 4K60, API). Minute packs $9.99/60min
to $99.99/1,200min. First video free (≤25 min, no card). Minimum charge 5 min/video,
per-second above. **Single full game only, 30-min hard cap.** Turnaround ~30 min. B2B
"Court Insight" at $5/hr wholesale.

**Capture [VENDOR]** — upload only. **YouTube import is roadmap-only, not shipped.**
Camera: ≥5 ft height, tripod (no handheld), all four corners plus all players in frame,
landscape, ≥1080p30, .mp4/H.264, stabilization and HDR off. Single camera only.

**Results UI [VENDOR]** — Overview / Team / Player toggle · Shot Explorer (filterable,
click-to-timestamp) · PBQL console · video overlay (exact style **[UNSTATED]**) · public
shareable link viewable without a subscription · JSON/CSV and clip-list export. No PDF
report found **[EST absent]**.

**Accuracy and its limits** — "95%+ accuracy on shot detection and scoring" with correct
setup **[VENDOR claim, unaudited]**. Their own disclosed failure modes: poor framing, low
ball/court contrast, camera shake, players leaving frame, identity swap on similar
uniforms. **Explicitly not designed for definitive line calls.** Only the final score is
user-editable — no per-shot correction. A third-party review documents a 27 mph-average
player's drive logged at 60 mph and calls the coaching features "underdeveloped"
([speakpickleball.com](https://www.speakpickleball.com/reviews/pbvision-review)). App
Store 4.7★/109: "needs fine-tuning on shot names", overlay bugs.

**Coaching layer — the opening.** Their "AI Coach" is templated cues plus a data bridge to
*the user's own* ChatGPT/Claude/Gemini (and an MCP server). **They run no in-house LLM.**
So their user's data leaves the device to a third-party LLM regardless.

## 2. SwingVision

Tennis-first, pickleball-capable. Shot speed, depth, spin (topspin/backspin/flat), shot
classification, automated scoring, point-by-point, highlights with overlays, weekly
goals. **100% on-device iPhone/iPad inference** (iOS 18+, A12+), tripod behind the
baseline, Apple Watch optional. Free 8 hrs/mo; Plus $14.99/mo; Pro $24.99/mo (scoring +
line calling); Max $39.99/mo family — tier-to-feature boundary conflicts between sources
**[UNSTATED precisely]**.

Accuracy: **97% on close calls (ball within 10 cm of the line) at 60fps vs ~90% human
eye**, tested in tournament play **[VENDOR, tennis-sourced]**. Pickleball-specific number
**[UNSTATED]**. Complaints (4.7★/4.9K): scoring errors, drop/drive confusion, wrong-player
attribution in doubles, hard to correct auto-scoring.

**Patent exposure — read before building line calling.** Defendant in *Infinity Cube Ltd.
v. Mangolytics, Inc.*, No. 3:22-cv-00547 (S.D. Cal., filed 2022, active through 2025),
alleging its single-camera AI line calling infringes **US 10,467,478**. Single-camera,
software-only line calling draws suits.

## 3. Other pickleball apps

| Product | What it is | Price | Note |
|---|---|---|---|
| Pickle IQ | manual scorekeeping + analytics, **no vision** [EST from listing] | free to $34.99/yr | not a real comparator |
| PICKANA / VIPR | upload video, get shot/rally/movement + "True Skill Rating" | $29.99/mo, $199.99/yr | priced above PB Vision; methodology undisclosed, no accuracy % |
| DinkAI | shot-**drill** analyzer (swing mechanics, paddle angle), not full match | $9.99–$79.99 | 3.7★/6; reports of hanging during analysis |
| Pickle AI: Coach GO | footwork/positioning tips from video | $14.99/mo | 5.0★ on one rating — meaningless |
| Pickles (picklesne.com) | **human coach in the loop**, in person | $125/session | benchmark for what a human adds |

"Pickleball Brain" and "PicklePro" **could not be confirmed to exist** in this category —
treat as defunct, rebranded, or misremembered rather than guessing at specs.

**The 2025–26 entrants are ratings-integration plays, not new CV.** DUPR partnered with
**both PB Vision (Jan 2026) and PlaySight (2026)** to feed video-derived stats into its
rating plus a "DUPRCoach". **VAIR/VAIR+** (the NCPA's official rating) added
upload-to-rating, first analysis free then $54/yr, vision partner unnamed **[UNSTATED,
likely white-labelled]**. **PlayerU** (Jun 2026) ships "PickleLogic™" coaching — and its
own press materials disclose collecting player data for *targeted advertising, audience
segmentation for sponsors, and licensing of aggregated datasets to third parties*. That is
the sharpest available contrast to a local-first pitch.

**Pattern worth exploiting:** the rating ecosystem is becoming a *consumer* of vision-AI
output. Exporting a DUPR/VAIR-compatible stat feed from local data — without handing them
the video — captures ecosystem value while keeping the local-first property.

## 4. Feature-expectation setters (not replication targets)

| Product | Reality |
|---|---|
| **Hudl Focus** | fixed panoramic camera, ball-follow crop. **No racket-sport algorithm** — football/soccer/lacrosse/basketball/volleyball/wrestling only. ~$3K hardware [3RD] plus mandatory subscription (bricks without it). Analytics are human-tagged. |
| **Dartfish** | software-only **manual** tagging. A tennis panel exists but is manual. €7–€180/mo. No AI anywhere in the materials. |
| **Veo** | fixed wide-4K plus AI crop-follow and auto highlights — **soccer/rugby/lacrosse only**, no racket mode. $119–$239/mo. "Analytics 2" (heatmaps) is soccer-only. Complaints of ~14 hr upload times blocking the next recording. |
| **PlaySight SmartCourt** | **fixed multi-camera install (up to 6)**, auto-scoreboard, replay, biomechanics. ≈$10K+ install [3RD]. B2B facility infrastructure. |
| **Hawk-Eye** | 10 calibrated cameras to 340fps, fixed install. **2.6–3.6 mm average error on a 67 mm ball** vs the ITF's 5 mm tolerance. Output is officiating, not coaching. |
| **Second Spectrum** | catwalk cameras in all 30 NBA arenas; the predecessor ran ≈$100K/yr/arena; league deal ≈6yr/$250M+. No consumer product. |

**What multi-camera tracking actually requires** — synchronized cameras at fixed known 3D
positions (the only way to get true depth and spin that a single moving phone cannot
triangulate), permanent installation, and $10K–$100K+/venue/yr that amortizes only across
many users. Structurally incompatible with free and local. Note also the bar difference:
**mm-level is an officiating requirement; coaching needs cm-level relative trends** — a
categorically easier target.

## 5. Replicate / skip / differentiate

| Feature | Verdict | Why |
|---|---|---|
| Shot-type classification | **Replicate** | pose + ball + contact-point features into a classifier head. The infrastructure already exists in `src/vision/`. |
| Shot speed / depth / placement | **Replicate** | geometry off the tracked ball plus court homography. Math, not research. |
| Rally / serve / return counts | **Replicate** | bookkeeping over the shot stream. No new CV. |
| Court heatmaps, positioning % | **Replicate** | the same court-plane projection that speed already needs. |
| Kitchen / NVZ stats | **Replicate** | a zone mask on that projection. |
| Skill rating | **Differentiate** | theirs is proprietary and unaudited. **Publish the formula.** Open beats matching their number. |
| Line / fault calling | **Skip, or ship as estimate only** | a live on-point suit against the nearest comparable product; PB Vision itself disclaims it. Label it "coach's estimate" and get FTO review before any officiating claim. |
| Multi-camera 3D tracking | **Skip — genuinely hard** | capital, not code. Wrong problem for single-camera local. |
| PBQL-style query and export | **Replicate, then beat** | a schema over stats already computed. A local SQLite/DuckDB file the user can query directly beats a cloud console. |
| Auto highlights | **Replicate** | an ffmpeg cut-list off tagged events. Standard tooling. |
| **In-house LLM coaching** | **Differentiate — the headline** | PB Vision runs no LLM; it exports to the user's third-party account. A local model over the same schema with zero egress is a category difference. |
| Local / offline inference | **Replicate selectively** | SwingVision proves consumer-hardware inference works. Desktop-local is the natural extension of the existing offline pipeline. |
| Unlimited length, no metering | **Differentiate — free to claim** | every competitor caps or meters because cloud compute costs per video. Local GPU time has no reason to cap. Business model, not engineering. |
| Facility camera hardware deals | **Skip** | capital-intensive partnership business. Out of scope. |
| DUPR / VAIR stat-feed export | **Differentiate, cheap** | ecosystem value without surrendering the video. |

## 6. Legal and ethical boundaries

**YouTube ToS.** Bars access "using any automated means (such as robots, botnets or
scrapers)" except public-search-engine crawling per robots.txt, and separately bars
downloading or reproducing content unless expressly authorized
([ToS](https://www.youtube.com/static?template=terms)). No AI-specific carve-out is
needed — the download ban already covers it. Pending 2026 suits allege DMCA §1201
circumvention to scrape video for model training (creators v. Meta/Snap/Runway; creators
v. Amazon; reports about Apple). YouTube let creators opt out of *third-party* AI training
in Dec 2024, implying Google reserves first-party rights while restricting others.

**Consequence for this project: never build a scrape-YouTube-for-training-data pipeline.
Training data comes from user-supplied footage only.** A user pulling one clip they have
rights to, locally, for their own analysis is a different act from building a corpus — and
the tool must not make the second easy. No batch/channel/playlist ingestion.

**Scraping precedent.** *hiQ v. LinkedIn* (9th Cir. 2022): scraping public data is not a
CFAA violation (hiQ still lost on contract grounds and settled for $500K). *Meta v. Bright
Data* (N.D. Cal., Jan 2024): scraping **logged-out** public content is defensible;
scraping behind a login or clickwrap, or around technical controls, is not.

**Filmed players.** Right of publicity is state law and targets *commercial* exploitation
of likeness, not incidental recording. Public-place filming is broadly protected, but
**private clubs can contractually ban recording on their property** regardless. Note the
gap: this product *names and scores individuals by design*, which is not the
incidental-bystander fact pattern the case law covers **[EST — no on-point case found]**.
GDPR: pose keypoints are **not** automatically biometric data under Art. 4(14) unless used
to re-identify a person across sessions. **So: no face recognition and no cross-session
identity matching.** Face-based auto-player-ID crosses into Art. 9 special category and US
state biometric statutes — Illinois BIPA has produced $35M–$650M settlements. A tool that
never uploads video and never re-identifies by face sits in the lowest-risk category **by
construction** — that is a design constraint, not a marketing line.

**Patents.** Live risk: *Infinity Cube v. Mangolytics* above — automated line calling is
the one feature with an on-point active suit against the nearest comparable product. Older
foundational line-call patents (US 4,432,058; US 5,908,361) are likely expired. FTO
references worth knowing: US 10,803,598 B2 (ball detection and tracking device), US
5,363,297 (camera-based sports tracking), US 2016/0212385 A1 (real-time advisory from
trajectory prediction), US 2008/0192116 A1 (multi-camera sports motion capture).
Hawk-Eye/Sony's early broad cricket-tracking filings reportedly did not grant. Genius
Sports (owner of Second Spectrum) enforces actively (sued SportsCastr). **Takeaway: stat
computation sits on well-trodden or expired art — low risk. Officiating-style calling is
the exception.**

## 7. Thin spots — do not fill these with guesses
- PB Vision's overlay *visual style* (box vs skeleton vs trajectory) is undocumented.
- SwingVision's exact tier-to-feature boundary conflicts between secondary sources.
- "Pickleball Brain" could not be confirmed to exist as a vision product.
- Veo / Hudl / PlaySight camera FOV and height specs were not on the pages fetched.
