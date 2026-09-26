# 🧭 Architecture Decision Records (ADRs)

Short, immutable records of significant decisions — **context**, **decision**,
**consequences** (Michael Nygard format). Append-only: to change a decision, add a
new ADR that supersedes the old one (don't rewrite history).

## Index
| ADR | Decision | Status |
|---|---|---|
| [0001](0001-flask-over-fastapi.md) | Flask over FastAPI for the API | **Superseded by 0006** |
| [0002](0002-rule-default-llm-fallback.md) | `rule` is the default LLM backend + fallback | Accepted |
| [0003](0003-cloud-llm-bedrock-not-openai.md) | Managed cloud LLM (AWS Bedrock), not OpenAI | Accepted |
| [0004](0004-reuse-oss-not-reinvent.md) | Reuse OSS (supervision/Roboflow/TrackNet) | Accepted |
| [0005](0005-managed-stack.md) | Managed stack (Modal + Supabase + Next.js) over self-managed AWS | Accepted |
| [0006](0006-fastapi-over-flask.md) | FastAPI for the API (supersedes 0001) | Accepted |
| [0007](0007-direct-to-storage-upload.md) | Browser uploads direct to Supabase Storage | Accepted |
| [0008](0008-dual-mode-local-and-managed.md) | Dual mode — local-first open source alongside the managed stack (amends 0005, extends 0007) | Accepted |

## Conventions
- File: `NNNN-kebab-title.md`. Status: Proposed / Accepted / Superseded / Deprecated.
- A new decision that changes an old one → new ADR; mark the old one Superseded.

## References / Further reading
- [adr.github.io](https://adr.github.io/) · [Nygard — Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) · [joelparkerhenderson/architecture-decision-record](https://github.com/joelparkerhenderson/architecture-decision-record)
- Specs: `docs/specs/RFC-001` (pipeline), `docs/specs/RFC-003` (managed stack)
