# 🔁 Reuse Map — OSS Models & Repos (don't reinvent)

> Curated 2026-06-07, **stage choices revised 2026-09-26** after a fresh survey
> (`docs/inspiration/oss-prior-art-2026-09.md`). Pretrained models + libraries to plug into
> each pipeline stage instead of writing from scratch.

## Current choice per stage (this table wins if anything below disagrees)

| Stage | Choice | Licence | Why, with the number |
|---|---|---|---|
| Detector | Ultralytics YOLO + pickleball weights | AGPL (Ultralytics) / per-dataset | existing `get_detector()` factory; Roboflow pickleball sets are 100–120 images, so expect fine-tuning |
| **Ball** | **[WASB-SBDT](https://github.com/nttcom/WASB-SBDT)** | **MIT** | tennis F1 **95.6** / badminton 93.1 (τ=4px), validated across 5 sports; beats MonoTrack by 7.8–16.8% AP. TrackNetV3's 97.5% is badminton-only on a torch-1.10 stack. `pickleball-ai` already bootstraps pickleball from these weights |
| **Tracking** | **[roboflow/trackers](https://github.com/roboflow/trackers)** ByteTrack | **Apache 2.0** | maintained, benchmarked on SportsMOT/SoccerNet, detector-agnostic, `supervision`-native. BoT-SORT + ReID kept **only** for the same-kit doubles case |
| **Court** | **[TennisCourtDetector](https://github.com/yastrebksv/TennisCourtDetector)** pattern, retrained on pickleball geometry | check repo | **1.83px** median keypoint error with refinement + homography; weights published |
| **Pose** | **ViTPose-L** (RTMPose as CPU fallback) | per-model | 78.3 AP COCO; chosen by PadelTracker100 after a SOTA comparison on padel — the closest sport analog |
| **Coach LLM** | **Qwen3-VL-8B Q4** local, as a 4th adapter beside `rule`/`hf`/`cloud` | Apache 2.0 | ~6–8 GB VRAM, fits 16 GB beside the vision stack |
| Glue | [supervision](https://github.com/roboflow/supervision), [roboflow/sports](https://github.com/roboflow/sports) | MIT | annotators, zones, perspective transform. Don't hand-roll these |

**Before installing anything on a Blackwell card (RTX 50-series, `sm_120`):**

```
pip install torch --index-url https://download.pytorch.org/whl/cu128   # BEFORE ultralytics
```

Ultralytics' default install pulls an older torch without `sm_120` kernels and fails with
`no kernel image is available for execution on the device`
([ultralytics#21162](https://github.com/ultralytics/ultralytics/issues/21162)). Never
`pip install -r` the TrackNet-lineage requirements verbatim — they pin torch 1.10.

**VRAM:** detector + pose + ball + an 8B VLM do not comfortably co-reside in 16 GB. Stages
load, run and release in sequence, LLM last. Measure this at M0 (`docs/BACKLOG.md` M0-4).

---

## Background detail (2026-06-07 survey — superseded where it conflicts with the table above)

## Detection — pretrained pickleball weights (Ultralytics-compatible)

The detector (`src/vision/detection/detector.py`) is plain Ultralytics YOLO, so
any `.pt` weights or Roboflow model drops in via `Config.DETECTOR_MODEL`.

| Model | Classes | Notes |
|-------|---------|-------|
| [Roboflow — GameChangerv1 PickleBall Detection](https://universe.roboflow.com/gamechangerv1/pickleball-detection-1oqlw) | PB, Paddle, ball, player | YOLOv8, 338 imgs — closest to our 4-class need |
| [Roboflow — ak-zcxgt Pickleball](https://universe.roboflow.com/ak-zcxgt/pickleball-uninu-suhi2/model/1) | pickleball | YOLOv11, mAP 65.4 / P 84.2 / R 65.0 |
| [Roboflow — Liberin pickleball-vision](https://universe.roboflow.com/liberin-technologies/pickleball-vision) | court/ball/player | Hosted inference API available |

**Plug in (local weights):** download the `.pt`, set `DETECTOR_MODEL=/path/best.pt`.

**Plug in (Roboflow hosted/edge):** `pip install -e ".[vision]"` (pulls
`inference`), then use Roboflow's `inference` SDK to fetch predictions and map to
our detection schema (`bbox/confidence/class_id/class_name`). A thin
`RoboflowDetector` adapter can wrap this — interface-compatible with
`ObjectDetector.detect()`.

## Ball trajectory — TrackNet family (small/fast ball)

IoU/nearest tracking struggles with a fast pickleball. TrackNet outputs a
heatmap per frame — far better for the ball specifically.

| Repo | Use |
|------|-----|
| [qaz812345/TrackNetV3](https://github.com/qaz812345/TrackNetV3) | SOTA shuttlecock/ball tracking + trajectory rectification |
| [yastrebksv/TrackNet (PyTorch)](https://github.com/yastrebksv/TrackNet) | Clean impl **with pretrained weights** |
| [hudsong.dev — TrackNetV2 pickleball transfer](https://www.hudsong.dev/pickleball) | Worked example of transfer-learning TrackNet to pickleball |

Integrate as an optional ball backend feeding `GameStateBuilder` (ball centroid).

## Multi-object tracking — Roboflow Supervision (wired ✅)

| Lib | Use |
|-----|-----|
| [roboflow/supervision](https://supervision.roboflow.com/how_to/track_objects/) | **ByteTrack** stable track IDs, `DetectionsSmoother`, annotators, polygon zones |

Already wired: `src/vision/tracking/tracker.py` → `get_tracker("supervision")`
returns a ByteTrack-backed tracker (lazy import; `simple` is the zero-dep
fallback). Set the Pipeline `tracker_backend="supervision"`.

## Court / sports utilities & reference pipelines

| Repo | Use |
|------|-----|
| [roboflow/sports](https://github.com/roboflow/sports) | Court keypoints, perspective transform, sports CV recipes |
| [yastrebksv/TennisProject](https://github.com/yastrebksv/TennisProject) | Full court+ball+player analysis to mirror for fusion |
| [vinod-polinati/pickleball-rally-detection](https://github.com/vinod-polinati/pickleball-rally-detection) | YOLOv8 rally segmentation (physics-based cuts) — pattern for action labels |
| [kpp91302/Pickleball-Analytics](https://github.com/kpp91302/Pickleball-Analytics) | Heatmaps, rally tempo, kitchen-zone usage — analytics ideas |

## Captioning / LLM (already OSS)

- BLIP-2 / LLaVA via `lavis` + HuggingFace `transformers` (in `[llm]`); OpenAI as
  hosted option. See `src/llm/clip_integration.py`, `generate_feedback.py`.

---

### Quick decision for the GPU box
1. `pip install -e ".[vision,llm]"`.
2. Set `DETECTOR_MODEL` to a Roboflow pickleball weight (GameChangerv1 first).
3. `Pipeline(tracker_backend="supervision")` (or `"botsort"` for ReID).
4. Optionally add TrackNet for the ball channel.

## Wired adapters (lazy; run on GPU box)
All wrap OSS — interface-compatible, selected by a factory:
- **Detection:** `src/vision/detection/roboflow_detector.py` → `get_detector("roboflow"|"ultralytics")` (Roboflow `inference` SDK / Ultralytics YOLO).
- **Tracking:** `src/vision/tracking/tracker.py` → `get_tracker("simple"|"supervision"|"botsort")` — **BoT-SORT + ReID via `boxmot`** for occlusion (fixes ID-switch).
- **Ball:** `src/vision/tracking/tracknet_ball.py` → `TrackNetBall` (heatmap; vendor TrackNetV3 / yastrebksv weights).

## Analytics (no GPU — pure scipy/sklearn)
`src/vision/analysis/` — trajectory (scipy savgol), shot classifier (sklearn-pluggable
head), rally segmentation. Feeds `pipeline` → `result["intelligence"]`. Target metric
set: `docs/inspiration/pb-vision/`.
