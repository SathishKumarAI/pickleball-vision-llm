#!/usr/bin/env bash
# Start the whole app locally: FastAPI control plane + Next.js frontend.
#
# No cloud account, no login, no quota (PVL_MODE=local, see
# docs/specs/RFC-004-local-first-dual-mode.md). Ctrl-C stops both.
#
# Works in Git Bash on Windows and in any POSIX shell. For PowerShell, run the two
# commands in the "Manual" section of docs/GETTING_STARTED.md instead.

set -euo pipefail

API_PORT="${API_PORT:-8000}"
WEB_PORT="${WEB_PORT:-3000}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"

die() { printf '\033[31mfailed:\033[0m %s\n' "$1" >&2; exit 1; }
note() { printf '\033[32mok:\033[0m %s\n' "$1"; }

# --- preflight: fail with the fix, not a traceback --------------------------------
command -v python >/dev/null 2>&1 || die "python not found on PATH"
python -c "import fastapi" 2>/dev/null \
  || die "control-plane deps missing. Run: pip install -e ."
[ -d web/node_modules ] \
  || die "frontend deps missing. Run: cd web && npm install"

port_busy() {
  # netstat is the portable option here; ss/lsof are absent on Windows.
  netstat -ano 2>/dev/null | grep -E "[:.]$1[[:space:]]" | grep -qi LISTENING
}
for p in "$API_PORT" "$WEB_PORT"; do
  port_busy "$p" && die "port $p is already in use. Stop that process, or set API_PORT/WEB_PORT."
done

# --- run -------------------------------------------------------------------------
API_PID=""
cleanup() {
  [ -n "$API_PID" ] && kill "$API_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

note "starting API on http://127.0.0.1:$API_PORT (PVL_MODE=local, auth off)"
PVL_MODE=local python -m uvicorn app.main:app --host 127.0.0.1 --port "$API_PORT" &
API_PID=$!

# Wait for the API to answer before starting the frontend, so the first page load
# does not race it and render an empty dashboard.
for _ in $(seq 1 40); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$API_PORT/health" 2>/dev/null; then
    note "API healthy"
    break
  fi
  kill -0 "$API_PID" 2>/dev/null || die "API exited on startup — scroll up for the traceback"
  sleep 0.5
done

note "starting frontend on http://localhost:$WEB_PORT"
echo
echo "    Open http://localhost:$WEB_PORT  — no login needed."
echo "    Ctrl-C stops both."
echo

cd web
NEXT_PUBLIC_API_URL="http://127.0.0.1:$API_PORT" exec ./node_modules/.bin/next dev -p "$WEB_PORT"
