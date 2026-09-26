# OSS Prior Art — Racket-Sport Vision Pipelines

> Captured 2026-09-26 by web research. **[read]** = a number actually read on a fetched
> page; **[est.]** = inference, not read. Judged against this project's real target box:
> RTX 5070 Ti (16 GB, Blackwell `sm_120`), Python 3.12, Windows 11.
> Supersedes §5, §6 and §8 of `docs/specs/RESEARCH_NOTES.md`.

## The two findings that matter most

**1. Two projects are already building almost exactly this.**

| Project | Framing | Maturity |
|---|---|---|
| [`John5675/rallymetry`](https://github.com/John5675/rallymetry) | "local-first computer vision system for analyzing recorded doubles pickleball matches": court calibration → person detection → ByteTrack → ball detection → rally segmentation → contact/bounce detection → shot reconstruction → analytics. FastAPI + React/Vite + MongoDB Atlas, heavy analysis on a dev-machine worker. Ships a loopback-only browser editor for human-verified ground truth. Explicitly notes "audio alone creates no candidate" — vision-first, audio only as a confidence booster. | 44 commits, 0★, **no LLM/coaching layer** |
| [`AndrewL1698/pickleball-ai`](https://github.com/AndrewL1698/pickleball-ai) | Same pipeline shape; **uses WASB's tennis-trained MIT weights directly for the pickleball ball**; manual-click court calibration; homography to top-down. Postgres + Redis + Next.js. | 28 commits, 0★, **CV stage is still a placeholder** (file fingerprinting only) |

Two independent efforts converged on the pipeline shape this repo already has across
`src/vision/` → `src/fusion/`. That is validation of the layout, and neither has a
coaching LLM. Read their READMEs for rally-segmentation logic; do not import their code.

**2. Nobody has published a validated pickleball ball-tracking accuracy number.** Every
pickleball repo either fine-tunes on sub-150-image Roboflow sets or bootstraps off
tennis/badminton weights. Being first to publish a real measured number is available — and
is the most credible thing this project could contribute upstream.

## Hardware gate — applies to everything below

PyTorch gained native `sm_120` (Blackwell) support only in **2.7.0 with CUDA 12.8
wheels**. Per the open Ultralytics issue
[#21162](https://github.com/ultralytics/ultralytics/issues/21162), Ultralytics' default
install still pulls an older torch lacking `sm_120` kernels, failing with `no kernel image
is available for execution on the device`. So:

```
pip install torch --index-url https://download.pytorch.org/whl/cu128   # BEFORE ultralytics
```

And never `pip install -r` the TrackNet-lineage requirements verbatim — they pin torch
1.10 / Ubuntu 16.04. Windows itself is not the constraint; most of these repos are
OpenCV/PyTorch only. MMPose/MMDetection-based tools and WASB's stated env were verified on
Ubuntu and may want WSL2 for custom CUDA ops.

## Ball tracking — the hard problem

| Project | Stars / license | Reported accuracy | Notes |
|---|---|---|---|
| **[nttcom/WASB-SBDT](https://github.com/nttcom/WASB-SBDT)** | 193★, **MIT** | **[read, arXiv Table 2, τ=4px]** Tennis F1 **95.6** / Acc 91.8 / AP 94.2; badminton F1 93.1; soccer F1 88.2; volleyball F1 88.0; basketball F1 82.6. **Beats MonoTrack by 7.8–16.8% AP across five sports.** | BMVC 2023, sport-agnostic baseline. Authors trained on 4× V100/CUDA 11.3 — that was *training*; inference is a light CNN. **Already used as a pickleball bootstrap by `pickleball-ai`.** |
| [qaz812345/TrackNetV3](https://github.com/qaz812345/TrackNetV3) | 304★, **MIT** | **[read]** 97.51% accuracy, F1 98.56, 25.11 FPS — **on the badminton Shuttlecock dataset only** | Adds trajectory rectification. Verified on Ubuntu 16.04 / torch 1.10.0 — old stack, needs re-pinning |
| [TrackNetV4](https://github.com/TrackNetV4/TrackNetV4) | 101★, MIT | metrics live only in `docs/RESULT.md`, **not verified** | ICASSP 2025, motion attention maps. TensorFlow, 5 commits total. Treat as unproven |
| MonoTrack ([2204.01899](https://ar5iv.labs.arxiv.org/html/2204.01899)) | — | **[read, WASB Table 2]** best non-WASB baseline: tennis F1 92.1 | Dice/BCE loss for extreme class imbalance from tiny ball size |
| BlurBall ([2509.18387](https://arxiv.org/pdf/2509.18387)) | 2025 | not fetched | table tennis, joint ball + motion-blur estimation |

**Verdict: WASB-SBDT is the ball backend.** Widest cross-sport validation, MIT, and a
working pickleball precedent. TrackNetV3's headline number is badminton-only and its stack
is stale.

## Pickleball-specific repos and datasets

| Project | Stars | Notes |
|---|---|---|
| [arivsssss/PICKLEBALLL_VIDEO_ANALYSIS](https://github.com/arivsssss/PICKLEBALLL_VIDEO_ANALYSIS) | 14★ | YOLOv8x players, fine-tuned YOLOv5 ball, custom court-keypoint model, mini-court view + speed stats. **No accuracy numbers anywhere.** |
| [5urabhi/Pickle_ball_tracking](https://github.com/5urabhi/Pickle_ball_tracking) | — | bounce status + in/out vs court lines |
| [vinod-polinati rally splitter](https://medium.com/@vinodpolinati/how-i-built-an-automated-pickleball-rally-splitter-using-python-and-yolov8-b890a44650a4) | blog | YOLOv8 rally splitting by ball presence/motion |

Roboflow Universe pickleball datasets are **tiny**: Liberin "Pickleball Vision" **[est.
from snippet]** ~118 images / 4 classes (the page 403'd on fetch); pickleball-court
keypoint sets ~120 images; "Pickleball Paddle Detection" 101 images. One trained model
reports **[read from snippet]** 76.6% mAP@50 / 84.5% P / 77.3% R — source unverified.
Universe defaults to CC BY 4.0 unless the uploader restricts it **[est. — confirm
per-dataset]**. At 100–120 images, expect heavy augmentation or your own capture.

## Adjacent sports — pipelines worth mirroring

| Project | Sport | Stars | Why it matters |
|---|---|---|---|
| **[yastrebksv/TennisProject](https://github.com/yastrebksv/TennisProject)** | tennis | 232★ | **Most copy-pasteable full pipeline surveyed**: TrackNet ball → 14-keypoint court + homography → CatBoost bounce detection → player detection → stats. Modular scripts, documented, pretrained weights linked. Mirror its decomposition. |
| **[Joao-M-Silva/padel_analytics](https://github.com/Joao-M-Silva/padel_analytics)** | padel | 273★ | **Closest sport analog** — small enclosed court, doubles, volleys near a kitchen-like zone. Player track → 12-keypoint homography → 13-DOF pose → stroke classification (backhand/forehand volley, bandeja, topspin smash) → velocity/heatmaps/error rates. Ships a court-keypoint selection UI. **[est.]** needs 8 GB+ VRAM. |
| [wywyWang/CoachAI-Projects](https://github.com/wywyWang/CoachAI-Projects) | badminton | 278★, MIT | **Not** a video pipeline — a dataset + tactical-modeling suite over already-extracted stroke sequences. Valuable for the *tactics* layer, not the vision layer. |
| ShuttleSet (in CoachAI) | badminton | MIT | **[read]** 104 sets / 3,685 rallies / 36,492 strokes / 44 matches / 18 shot classes, human-annotated. Best available **schema reference** for structuring a pickleball shot dataset. |
| [TTNet](https://github.com/maudzung/TTNet-Real-time-Analysis-System-for-Table-Tennis-Pytorch) | table tennis | — | **[read]** 97.0% event-spotting accuracy, 2px ball RMSE, **<6 ms/frame on one consumer GPU** — fastest numbers surveyed. Copy the multi-task "one network, three heads" pattern for efficiency. Note its events are hit/bounce/net, not stroke *type*. |

## Court detection and homography

| Project | Stars | Accuracy | Weights |
|---|---|---|---|
| **[yastrebksv/TennisCourtDetector](https://github.com/yastrebksv/TennisCourtDetector)** | 275★ | **[read]** base 0.936 P / 2.83px median error; **with refinement + homography 0.963 P / 1.83px median** (7px threshold) | **yes**, Google Drive |
| TEXflip/tennis-court-detection, basemprince/court_detection | — | not fetched | Deep Hough Transform line priors |
| anushacodes/tennis-analysis-with-cv | — | **[read]** ~0.98 mAP@50 court keypoints | YOLO-based |

**The universal pattern:** regress N fixed court keypoints per frame (heatmap or direct) →
`cv2.findHomography()` against a canonical court in real-world units → re-run per frame to
absorb pan/tilt/zoom. TennisCourtDetector is the best-documented implementation of it;
retrain the same architecture on pickleball geometry.

## Player tracking, pose, re-ID

| Component | Pick | Evidence |
|---|---|---|
| Tracker library | **[roboflow/trackers](https://github.com/roboflow/trackers)** | **[read]** 3.8k★, **Apache 2.0**, implements SORT/ByteTrack/OC-SORT/BoT-SORT/C-BIoU/McByte, benchmarked on MOT17/SportsMOT/SoccerNet/DanceTrack, detector-agnostic, `supervision.Detections`-native |
| Association | ByteTrack default; **BoT-SORT + ReID only for the same-kit doubles case** | ByteTrack keeps low-confidence boxes in a second association pass, which is what survives occlusion. BoT-SORT is heavier and can still struggle on near-identical objects — the exact risk with two teammates in matching shirts |
| Pose | **ViTPose-L** (RTMPose as CPU fallback) | **[read]** ViTPose-S 75.8 / L **78.3** / H 80.9 AP on COCO test-dev; 30–60 FPS on A10/L4-class. **PadelTracker100 chose ViTPose-L after a SOTA comparison** — direct precedent on the closest sport. **[est.]** a 16 GB 5070 Ti clears this with margin |
| Reference architecture | `TrackID3x3` (3×3 basketball) | tracking + identification + pose on a small fast court |

## Shot / action classification

| Approach | Accuracy | Note |
|---|---|---|
| **BST** ([repo](https://github.com/Va6lue/BST-Badminton-Stroke-type-Transformer), [2502.21085](https://arxiv.org/abs/2502.21085)) | claims SOTA on ShuttleSet/BadmintonDB/TenniSet — **the numeric table was not extractable; do not cite a number without reading it** | Fuses **skeleton pose + ball trajectory + court position** — exactly the three streams this pipeline already produces. Best *architecture* reference surveyed |
| padel_analytics stroke classifier | not quantified | 13-DOF pose → volley/bandeja/smash classes |
| PadelTracker100 (Feb 2026) | dataset, not model | **[read]** 6 shot classes, 40,135 annotated frames, ViTPose-L |
| MediaEval table-tennis stroke task | **[read]** best 74.2% (Swin), 68.8% (ResNet-50) | **This is the realistic bar** for fine-grained stroke type from video |
| TTNet | **[read]** 97.0% | but on *events* (hit/bounce/net), not stroke type — do not conflate |

**Expectation to write into the PRD: fine-grained shot-type accuracy lands in the 70s–80s%,
not the 90s.** Multi-modal BST-style fusion is the lever if it needs to go higher.

## Local video-language models (16 GB budget)

| Model | VRAM | Note |
|---|---|---|
| **[Qwen3-VL-8B GGUF](https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct-GGUF)** | **[read]** Q4 ≈5 GB text backbone; **[est.]** 6–8 GB with the vision encoder | **Best fit.** Native video understanding, room left for long context |
| InternVL3-8B | **[read]** FP8-Dynamic 7.8 GB + context; high-res tiling adds 2–4 GB | solid fallback |
| Phi-4-Multimodal (5.6B) | **[read]** runs on 16 GB | smaller, **[est.]** weaker on sports reasoning |
| Qwen3-VL 35B-A3B MoE | **[read]** 16 GB only via llama.cpp RAM offload | not pure-GPU; batch use only |
| InternVL3-78B | **[est.]** 40 GB+ at 4-bit | out of reach |
| VideoLLaMA3 | **could not confirm a quantized 16 GB build** | verify on HF before choosing it |

**None is sports-fine-tuned.** Expect few-shot prompting to teach *dink*, *kitchen*,
*third-shot drop*.

## Platform libraries

[`roboflow/supervision`](https://github.com/roboflow/supervision) (annotators, zones,
tracker glue — what most surveyed repos build on), [`roboflow/sports`](https://github.com/roboflow/sports)
(5.4k★, MIT — court keypoints, perspective transform, jersey OCR; **no UI**),
[`roboflow/trackers`](https://github.com/roboflow/trackers) (3.8k★, Apache 2.0). Strong
libraries, zero product. Among sport-specific systems only `padel_analytics` and
`rallymetry` pair a real pipeline with a real UI.

## Top 8 to actually reuse, ranked

1. **`supervision` + `trackers`** (MIT / Apache 2.0) — never hand-roll tracker glue,
   annotators or zone logic. Detector-agnostic, so no lock-in to a YOLO version.
2. **WASB-SBDT weights as the ball bootstrap** (MIT) — strongest cross-sport baseline,
   with an existing pickleball precedent. Fine-tune from these, not from scratch.
3. **TennisCourtDetector's heatmap-keypoint + `findHomography` pattern** — retrain on
   pickleball geometry. 1.83px median error, weights published.
4. **TennisProject's pipeline decomposition** — the structural template to mirror.
5. **padel_analytics' pose → stroke classifier** — closest sport analog for the
   small-court doubles occlusion problem.
6. **ViTPose-L** for pose (RTMPose if CPU is ever needed).
7. **Qwen3-VL-8B Q4** for the local coaching/description layer.
8. **`rallymetry` and `pickleball-ai` as things to diff against, not import** — thin code,
   high validation value.

## Flagged risks
- No validated pickleball ball-tracking number exists publicly. Budget for your own
  labeled set and expect to be first to publish one.
- TrackNet-lineage repos pin torch 1.10 / Ubuntu 16.04 — re-pin to `torch>=2.7.0+cu128`.
- WASB's Dockerfile/env.yml was built for CUDA 11.3 on V100s; do not assume it runs
  unmodified on Blackwell.
- VideoLLaMA3's quantized footprint is unconfirmed.
