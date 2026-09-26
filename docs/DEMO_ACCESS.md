# 🔑 Demo Access & Troubleshooting

> Demo accounts and how to view app logs. **Demo only — rotate or disable before real
> launch.** Created by `scripts/seed_demo_users.py`.

## Running locally with no account at all

The frontend runs without Supabase. With `NEXT_PUBLIC_SUPABASE_*` unset, `npm run dev`
in `web/` signs you in as a stand-in local user — no login page, no credentials. That is
the intended local-mode behaviour (`docs/specs/RFC-004-local-first-dual-mode.md`, L5).
Everything below is only for the **managed** path.

## Demo logins

| Role | Email | Plan | Sees |
|------|-------|------|------|
| **Admin** | `admin@pvdemo.app` | pro | everything + **Admin** (logs + all jobs) |
| Coach | `coach@pvdemo.app` | pro | own jobs, 500/mo quota |
| Player | `player@pvdemo.app` | free | own jobs, 3/mo quota |

**Passwords are not in this file, by design.** They are generated per run by the seed
script and written to `.demo-credentials.txt` at the repo root, which is gitignored.

> ⚠️ Earlier revisions of this file listed three demo passwords in plaintext. They were
> committed, so they remain in git history and must be treated as burned — if those
> accounts are ever created in a real Supabase project, do not reuse those values.
> Rewriting history was not done here because it breaks every existing clone; the seed
> script now generates fresh passwords instead.

## Seed them (server-side, once Supabase is provisioned)
```bash
export SUPABASE_URL=https://YOUR.supabase.co
export SUPABASE_SERVICE_KEY=service-role-key
python scripts/seed_demo_users.py     # Ansible-style recap
cat .demo-credentials.txt             # the generated passwords
```
Re-running the script does not rotate an existing user's password — it skips users that
already exist. Reset those from the Supabase dashboard.
The admin role is set via `app_metadata.role = "admin"` — the API reads it from the
JWT (`app/security/jwt.py:claims_to_user`) and `require_admin` gates admin routes.

## Viewing logs (troubleshooting)
**In-app (admin UI):** sign in as admin → **Admin** tab → live application logs
(terminal-style, color by level, 3s auto-refresh, level filter) + all jobs.
Backed by `GET /admin/logs` (in-memory ring buffer, newest first).

**Server console:** Ansible/CLI-style colored logs by default
(`ok:` / `warn:` / `failed:` per level, `key=value` context, `req=<id>` correlation).
```
12:16:53     ok: [pvllm.jobs] job created  user=u1 job=9f3a tracker=supervision (req=a1b2c3d4)
12:16:53   warn: [pvllm.jobs] quota exceeded  user=u2 plan=free used=3 (req=a1b2c3d4)
12:16:53 failed: [pvllm.jobs] worker crashed  job=9f3a (req=a1b2c3d4)
```

**Production (aggregated):** set `LOG_JSON=true` for JSON logs (one object/line) and
ship to your log platform; set `SENTRY_DSN` for error tracking. Every response
carries `X-Request-ID` + `X-Response-Time-ms` for correlation.

## Log config (env)
| Var | Effect |
|-----|--------|
| `LOG_LEVEL` | `DEBUG`/`INFO`/`WARNING`/… (default INFO) |
| `LOG_JSON` | `true` → JSON logs (prod); else CLI/ansible console |
| `NO_COLOR` | disable ANSI color |
| `SENTRY_DSN` | enable Sentry error reporting |

## Where it lives
- Logging: `app/logging_config.py` (formatters + ring buffer), `app/observability.py`
  (correlation middleware).
- Admin API: `app/routers/admin.py` (`/admin/logs`, `/admin/jobs`).
- Admin UI: `web/app/(app)/admin/page.tsx`; Nav link shows for admins only.
