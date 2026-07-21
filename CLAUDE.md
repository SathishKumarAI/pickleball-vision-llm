# Pickleball Vision LLM

Multi-modal AI system combining computer vision (YOLO, MediaPipe) and LLMs for real-time pickleball game analysis and coaching.

## Architecture
```
src/
├── vision/     YOLO object detection + tracking (ball, players, court)
├── llm/        LLM integration (prompt templates, embeddings, CLIP)
├── fusion/     Vision + LLM data fusion
├── core/       Config, logging, shared utils
├── integration/ Analytics + streaming pipelines
├── web/        FastAPI web app
└── main.py     Entry point
```

## Stack
- Python 3.12 (mise), FastAPI + uvicorn
- YOLO v8 (ultralytics) for detection
- MediaPipe for pose estimation
- LangChain + sentence-transformers for LLM
- OpenCV for video processing
- PyTorch (CUDA when available)

## Commands
```bash
python src/main.py                    # run app
pip install -r deployment/requirements.txt  # install deps
docker compose -f deployment/docker-compose.yml up  # docker
```

## Key Files
- `src/vision/detection/detector.py` — ObjectDetector class (YOLO)
- `src/llm/src/prompt_templates.py` — PromptTemplates for coaching
- `src/core/config/settings.py` — All config/env vars
- `deployment/requirements.txt` — Dependencies
