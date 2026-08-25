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

<!-- plane-agent-rules:v1 -->
## Issue tracking (Plane, local)

All work across `~/Documents/coding` is tracked in one Plane board.
The `plane` MCP server is registered at user scope, so its tools are available
in every session — no setup needed per repo.

- Workspace `coding`, project `Coding` (identifier `COD`), at <http://localhost:8080/coding/>
- **This repo is the label `repo:pickleball-vision-llm`.** Every work item you create must carry it.
- Also add one `type:` label matching the conventional-commit type you intend to
  use: `type:feat` `type:fix` `type:refactor` `type:perf` `type:docs` `type:test`
  `type:build` `type:chore`.

States, and what each one means here:

| State | Means |
|---|---|
| `Backlog` | Captured, not committed to. Default for anything you file mid-task. |
| `Todo` | Pulled into the current cycle. This week's list. |
| `In Progress` | A branch exists. |
| `In Review` | A PR is open, waiting on CI or a read. |
| `Done` | Squash-merged, branch deleted. |
| `Cancelled` | Decided against. Say why in a comment — that reasoning is the value. |

Rules:

1. **Before starting work, check for an existing work item** for what you are
   about to do. Search the board by `repo:pickleball-vision-llm` first. Duplicates are worse
   than nothing because they split the history of a decision.
2. **A found bug outside the current task's scope gets filed, not silently left.**
   File it in `Backlog` with `repo:pickleball-vision-llm`, say in your reply that you filed it.
   This is the mechanism the global CLAUDE.md rule refers to.
3. **Move the item as the branch moves**: `In Progress` when the branch is cut,
   `In Review` when the PR opens, `Done` on squash-merge.
4. **Put the work item id in the PR body** (`COD-12`), not only in the branch name.
5. Do not create Plane *projects*. One project is deliberate — repos are labels
   so a repo can move between `now/`, `shelf/` and `live/` without its tickets
   being migrated.
6. Cycles are weeks. If the user asks "what am I doing this week", read the
   current cycle, not the whole backlog.

Plane does not replace `STATUS.md`. `STATUS.md` is re-entry context — where you
stopped, the next action, the traps. Plane is the queue. Both, in the same commit
as the work.
