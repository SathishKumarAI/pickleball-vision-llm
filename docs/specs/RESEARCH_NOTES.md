# 📚 Research Notes & Reference Dossier

> Web research backing the PRD/RFC, organized by topic with source links for
> future reading. Captured 2026-06-07. Findings are summaries — follow links for
> detail; verify pricing/SOTA before committing.
>
> **⚠️ Partially superseded 2026-09-26.** §5 (ball tracking), §6 (pretrained detectors) and
> §8 (market / prior art) are out of date — a fresh survey moved the ball backend to
> WASB-SBDT and the tracker to `roboflow/trackers`, and found two projects already building
> a local-first pickleball analyzer. Read these instead:
> - `docs/inspiration/oss-prior-art-2026-09.md` — models, repos, datasets, measured numbers
> - `docs/inspiration/competitive-landscape-2026-09.md` — commercial products, feature
>   matrix, legal boundaries
>
> §1–§4 and §7 (doc templates, homography, action recognition, tracking theory, AWS async)
> still hold.

---

## 1. Doc templates (PRD / RFC / design docs)
- RFCs/design docs clarify assumptions early; teams that write + review them ship
  more maintainable architecture. Keep ≤5–7 pages, use diagrams, name 3–5 reviewers,
  ~2-week deadline.
- Common RFC structure (Tanya Reilly / *Staff Engineer's Path*): Status/Author/Dates ·
  Goals (+ "why") · Background · **Alternatives considered** · Trade-offs/disadvantages.
  Omitting alternatives = signal the problem wasn't thought through.
- PRD sections: Problem/Opportunity · Personas · **Goals + Non-Goals** · Success
  metrics (KPIs, launch criteria) · Features (**MoSCoW**) · Non-functional reqs.
- Failure mode: too much detail better suited to code than doc review → keep concise.

**Links:** [Pragmatic Engineer — RFCs & Design Docs](https://blog.pragmaticengineer.com/rfcs-and-design-docs/) ·
[Pragmatic Engineer — RFC/Design Doc examples & templates](https://newsletter.pragmaticengineer.com/p/software-engineering-rfc-and-design) ·
[Fuchsia — RFC best practices](https://fuchsia.dev/fuchsia-src/contribute/governance/rfcs/best_practices) ·
[Product School — PRD template](https://productschool.com/blog/product-strategy/product-template-requirements-document-prd) ·
[Perforce — How to write a PRD](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd) ·
[Atlassian — PRD template](https://www.atlassian.com/software/confluence/templates/product-requirements)

## 2. Pickleball / sports court detection & homography
- Pipelines combine **YOLO detection + keypoint detection + homography**. YOLOv8 for
  players/ball; a fine-tuned **ResNet50** improves court keypoint precision.
- Detected court keypoints → **3×3 homography matrix H** maps image points `p` to a
  top-down "mini-court" `p'` (`p' = H·p`), giving real court-relative positions.
- Court detection: classic **Hough-line** + homography, or modern ResNet50 keypoint
  model (robust across court types/angles).
- Outputs analytics: heatmaps, rally tempo, kitchen-zone usage.

**Links:** [Roboflow — Camera calibration in sports with keypoints](https://blog.roboflow.com/camera-calibration-sports-computer-vision/) ·
[HawkEye tennis tracking + court keypoints (arXiv 2511.04126)](https://arxiv.org/pdf/2511.04126) ·
[Pickleball Analytics — Ryan Tolone](https://ryan-tolone.com/projects/pickleball/) ·
[kpp91302/Pickleball-Analytics](https://github.com/kpp91302/Pickleball-Analytics) ·
[Ultralytics forum — pickleball court keypoints](https://community.ultralytics.com/t/detecting-court-keypoints-from-a-pickleball-video/1703/11)

## 3. Action recognition (shot/event classification)
- Core challenge: fuse **spatial + temporal** features; sports events are brief
  (frame-level precision), with occlusion + rapid motion.
- Tasks: **Temporal Action Localization (TAL)** (segments), **Action Spotting (AS)**
  (representative timestamp), **Precise Event Spotting (PES)** (exact frame).
- Model families: 2D, 3D (e.g. I3D), two/multi-stream, **skeleton-based** (pose).
  Football example: I3D + TSN + pose estimation.
- 2025 SOTA threads: Evolved Parallel Recurrent Net (EPRN) + wavelets; Adaptive
  Spatio-Temporal Refinement (ASTRM).

**Links:** [Deep Learning for Sports Video Event Detection (arXiv 2505.03991)](https://arxiv.org/abs/2505.03991) ·
[Spatiotemporal action recognition: I3D+TSN+pose](https://www.sciencedirect.com/science/article/abs/pii/S1746809425008675) ·
[Survey: video action recognition (deep learning)](https://www.sciencedirect.com/science/article/pii/S0950705125006409) ·
[High-precision sports motion recognition (Sci Reports)](https://www.nature.com/articles/s41598-025-22701-z)

## 4. Tracking — ByteTrack, ID switches, ReID
- **ByteTrack**: associates *every* detection box (incl. low-confidence) in a 2nd
  stage → robust to occlusion/appearance dips. Fast, IoU + motion based.
- **Limitation:** ID switches in crowded/overlapping scenes (IoU can't disambiguate
  close tracklets); IDs swap when players cross.
- **Fixes:** add **ReID** (appearance embeddings) — BoT-SORT / DeepSORT; **EIoU** in
  ByteTrack's 2nd association; occlusion recovery (e.g. SAM appearance). Sport priors
  (fixed 2/4 players, court halves) further disambiguate.

**Links:** [Datature — Intro to ByteTrack](https://datature.io/blog/introduction-to-bytetrack-multi-object-tracking-by-associating-every-detection-box) ·
[soccer-multi-object-tracking (ByteTrack+DeepSORT+BoT-SORT+ReID)](https://github.com/Anudeep007-hub/soccer-multi-object-tracking) ·
[ByteTrack ID-switch issue thread](https://github.com/ifzhang/ByteTrack/issues/434) ·
[supervision — track objects (ByteTrack)](https://supervision.roboflow.com/how_to/track_objects/) ·
[LearnOpenCV — Roboflow trackers + OpenCV](https://learnopencv.com/multi-object-tracking-with-roboflow-trackers-and-opencv/)

## 5. Ball tracking (small/fast object) — TrackNet
- IoU/nearest fails on fast small ball. **TrackNet** outputs a per-frame heatmap from
  a 3-frame window (VGG16-style encoder + DeconvNet upsampling). V3 adds trajectory
  rectification; pretrained weights exist; pickleball transfer demonstrated.

**Links:** [qaz812345/TrackNetV3](https://github.com/qaz812345/TrackNetV3) ·
[yastrebksv/TrackNet (PyTorch, pretrained)](https://github.com/yastrebksv/TrackNet) ·
[TrackNetV2 pickleball transfer — hudsong.dev](https://www.hudsong.dev/pickleball)

## 6. Pretrained pickleball detectors (Roboflow Universe)
- GameChangerv1 (YOLOv8; classes PB/Paddle/ball/player), ak-zcxgt (YOLOv11, mAP 65.4),
  Liberin pickleball-vision (hosted API). Drop into Ultralytics via `DETECTOR_MODEL`
  or use Roboflow `inference` SDK.

**Links:** [GameChangerv1 pickleball detection](https://universe.roboflow.com/gamechangerv1/pickleball-detection-1oqlw) ·
[ak-zcxgt pickleball](https://universe.roboflow.com/ak-zcxgt/pickleball-uninu-suhi2/model/1) ·
[Liberin pickleball-vision](https://universe.roboflow.com/liberin-technologies/pickleball-vision) ·
[roboflow/sports](https://github.com/roboflow/sports)

## 7. AWS — async LLM + GPU video architecture
- Standard async-ingest: **S3 → SQS → Lambda/worker** buffers requests; reliable
  decoupling. **Bedrock batch inference** is the cost-efficient path for large async
  volumes (CreateModelInvocationJob, JSONL).
- **Model routing:** switch Claude **Sonnet ↔ Haiku** to optimize cost/latency per
  call type. Invoke via `invoke_model` (+ streaming variant).
- Bedrock has no GPU video step — pair with **EC2 GPU / SageMaker** for frame
  processing, then send structured results/captions to Claude.

**Links:** [Build production-scale inference on Bedrock](https://builder.aws.com/content/30wiaBCETvReEyrrPSROi0FkaUG/build-production-scale-ai-inference-systems-on-amazon-bedrock) ·
[Bedrock batch inference (S3→SQS→Lambda)](https://aws.amazon.com/blogs/machine-learning/classify-call-center-conversations-with-amazon-bedrock-batch-inference/) ·
[Anthropic Claude params on Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-claude.html) ·
[Invoke Claude on Bedrock (streaming)](https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-runtime_example_bedrock-runtime_InvokeModelWithResponseStream_AnthropicClaude_section.html) ·
[Claude on Bedrock cost (CloudZero)](https://www.cloudzero.com/blog/claude-on-aws-bedrock/)

## 8. Market / prior art
- Commercial: [PB Vision](https://pb.vision/), [SwingVision](https://swing.vision/).
- Open pickleball/sports pipelines (reference patterns): [vinod-polinati/pickleball-rally-detection](https://github.com/vinod-polinati/pickleball-rally-detection) ·
  [AndrewDettor/TrackNet-Pickleball](https://github.com/AndrewDettor/TrackNet-Pickleball) ·
  [yastrebksv/TennisProject](https://github.com/yastrebksv/TennisProject)

---

## How these informed the design
- **Court homography** → RFC-001 fusion stage (real-unit positions; fixes pixel-space
  coaching gap). Plan: YOLO/ResNet50 keypoints + 3×3 H.
- **Action TAL/AS/PES + skeleton models** → action-classifier design (v1 heuristic stub).
- **ByteTrack ID-switch + ReID/EIoU** → tracking risk + mitigation in RFC-001.
- **TrackNet** → ball-every-frame backend (don't hold-last the ball).
- **AWS S3→SQS + Bedrock Haiku routing** → DELIVERY_PLAN AWS topology + cost controls.
