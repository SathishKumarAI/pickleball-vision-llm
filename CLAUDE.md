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

<!-- plane-agent-rules:v2 -->
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
   about to do. Duplicates are worse than nothing because they split the history
   of a decision. **Two ways to look, and both have a trap** — see "Finding an
   existing item" below. An empty result from a search you got wrong reads
   exactly like an empty board, which is how duplicates get filed.
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

### Finding an existing item

This Plane is the **Community edition**. `workitem list` with a `pql` or any
structured filter fails outright:

> PQL and structured filters are not supported on this Plane edition.

So **there is no server-side way to filter by the `repo:` label.** Filter in your
own head instead — list, then read:

```
workitem list  project_id=<COD uuid>  per_page=100
               fields=sequence_id,name,state,labels
```

and keep only the rows whose `labels` contain this repo's label UUID. Get that
UUID once from `label list` (the API returns UUIDs everywhere and accepts nothing
else). The board is small enough that one unfiltered list is cheaper than the
round-trips to avoid it.

`workitem search` also works, but **it matches a contiguous substring of the
title, not a set of words.** Searching `"LM Studio local model"` returns nothing
while `"LM Studio"` returns two items — the first phrase appears in no title.
**Search one distinctive token** (`local_model`, `vault.yaml`, `8787`), never a
sentence, and treat a miss as "my query was too long", not as "no such ticket".

### Useful UUIDs

Every repo shares one project and one set of states, so these are fixed. Only the
`repo:` label differs — look yours up with `label list`.

| Thing | UUID |
|---|---|
| project `Coding` (COD) | `384bb763-72eb-497f-8ddb-142f7c178668` |
| state `Backlog` | `c1497bfa-8446-49f0-aa45-976b0311b82f` |
| state `Todo` | `c074ade8-4a34-4a89-8de3-e7ab61caedf6` |
| state `In Progress` | `824d6862-acf5-4562-82d3-fc1ee7eaadd9` |
| state `In Review` | `25021b28-b089-490e-9628-d4c0fd1a5253` |
| state `Done` | `ede567e7-3e57-405e-ac93-fb04db6bcfff` |
| state `Cancelled` | `85b6f97d-30e3-4cf4-ae58-063a0e239b4f` |

Plane does not replace `STATUS.md`. `STATUS.md` is re-entry context — where you
stopped, the next action, the traps. Plane is the queue. Both, in the same commit
as the work.

<!-- /plane-agent-rules -->
