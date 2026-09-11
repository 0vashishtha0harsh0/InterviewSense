#!/usr/bin/env bash
# =============================================================================
# InterviewSense — local development launcher
#
#   ./run.sh              start the API + the web app (installs deps if needed)
#   ./run.sh install      install backend + frontend dependencies only
#   ./run.sh backend      start only the FastAPI backend
#   ./run.sh frontend     start only the Vite frontend
#   ./run.sh --help       show this help
#
# Environment overrides:
#   PYTHON=python3.11     interpreter used to create backend/.venv
#   SKIP_INSTALL=1        never run pip/npm install
#   BACKEND_PORT=8000     API port (must match frontend proxy)
#   FRONTEND_PORT=5173    web app port
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
LOG_DIR="$ROOT/logs"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
PYTHON="${PYTHON:-python3}"
SKIP_INSTALL="${SKIP_INSTALL:-0}"

if [ -t 1 ]; then
  C_RESET=$'\033[0m'; C_DIM=$'\033[2m'; C_BOLD=$'\033[1m'
  C_BLUE=$'\033[38;5;69m'; C_CYAN=$'\033[38;5;80m'
  C_GREEN=$'\033[38;5;78m'; C_YELLOW=$'\033[38;5;214m'; C_RED=$'\033[38;5;203m'
else
  C_RESET=''; C_DIM=''; C_BOLD=''; C_BLUE=''; C_CYAN=''; C_GREEN=''; C_YELLOW=''; C_RED=''
fi

step() { printf '%s▸%s %s\n' "$C_BLUE" "$C_RESET" "$1"; }
ok()   { printf '%s✓%s %s\n' "$C_GREEN" "$C_RESET" "$1"; }
warn() { printf '%s!%s %s\n' "$C_YELLOW" "$C_RESET" "$1"; }
fail() { printf '%s✗%s %s\n' "$C_RED" "$C_RESET" "$1" >&2; }
hr()   { printf '%s────────────────────────────────────────────────────────────%s\n' "$C_DIM" "$C_RESET"; }

banner() {
  printf '\n%s' "$C_BLUE"
  printf '  InterviewSense%s — AI mock interview & performance analyzer\n' "$C_RESET"
  printf '%s  backend :%s  frontend :%s\n\n' "$C_DIM" "$BACKEND_PORT" "$FRONTEND_PORT" "$C_RESET"
}

usage() {
  sed -n '3,14p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
  exit 0
}

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------
require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "$1 is required but was not found on PATH."
    exit 1
  fi
}

check_prereqs() {
  step "Checking prerequisites"
  require_cmd "$PYTHON"
  require_cmd node
  require_cmd npm
  ok "$("$PYTHON" --version 2>&1) · node $(node -v) · npm $(npm -v)"
}

# ---------------------------------------------------------------------------
# Environment files
# ---------------------------------------------------------------------------
prepare_env() {
  step "Preparing environment files"

  if [ ! -f "$BACKEND_DIR/.env" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    # Strip the template marker line so the file is valid dotenv input.
    sed -i.bak '/^\[TEMPLATE\]/d' "$BACKEND_DIR/.env" 2>/dev/null || \
      sed -i '' '/^\[TEMPLATE\]/d' "$BACKEND_DIR/.env"
    rm -f "$BACKEND_DIR/.env.bak"
    ok "Created backend/.env from .env.example"
    warn "Set a stronger JWT_SECRET before sharing this deployment."
  else
    ok "backend/.env already exists"
  fi
}

# ---------------------------------------------------------------------------
# Backend dependencies
# ---------------------------------------------------------------------------
VENV_DIR="$BACKEND_DIR/.venv"
VENV_PY="$VENV_DIR/bin/python"

backend_ready() {
  [ -x "$VENV_PY" ] && "$VENV_PY" -c "import uvicorn, fastapi" >/dev/null 2>&1
}

install_backend() {
  if [ "$SKIP_INSTALL" = "1" ]; then
    warn "SKIP_INSTALL=1 — not touching backend dependencies"
    return
  fi

  if [ ! -d "$VENV_DIR" ]; then
    step "Creating Python virtual environment at backend/.venv"
    "$PYTHON" -m venv "$VENV_DIR"
    ok "Virtual environment created"
  fi

  if backend_ready; then
    ok "Backend dependencies already installed"
    return
  fi

  step "Installing backend dependencies ${C_DIM}(Whisper, OpenCV and MediaPipe are large — this can take a few minutes)${C_RESET}"
  "$VENV_PY" -m pip install --upgrade pip --quiet
  "$VENV_PY" -m pip install -r "$BACKEND_DIR/requirements.txt"
  ok "Backend dependencies installed"
}

# ---------------------------------------------------------------------------
# Frontend dependencies
# ---------------------------------------------------------------------------
install_frontend() {
  if [ "$SKIP_INSTALL" = "1" ]; then
    warn "SKIP_INSTALL=1 — not touching frontend dependencies"
    return
  fi

  if [ -d "$FRONTEND_DIR/node_modules" ]; then
    ok "Frontend dependencies already installed"
    return
  fi

  step "Installing frontend dependencies"
  (cd "$FRONTEND_DIR" && npm install)
  ok "Frontend dependencies installed"
}

# ---------------------------------------------------------------------------
# MongoDB
# ---------------------------------------------------------------------------
check_mongo() {
  step "Checking MongoDB"

  local url
  url="$(grep -E '^MONGODB_URL=' "$BACKEND_DIR/.env" 2>/dev/null | head -1 | cut -d= -f2- || true)"
  url="${url:-mongodb://127.0.0.1:27017}"

  if command -v mongosh >/dev/null 2>&1; then
    if mongosh "$url" --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1; then
      ok "MongoDB reachable at $url"
      return
    fi
  elif command -v pgrep >/dev/null 2>&1 && pgrep -x mongod >/dev/null 2>&1; then
    ok "mongod process detected at $url"
    return
  fi

  warn "Could not confirm MongoDB at $url"
  warn "Start it (e.g. 'sudo systemctl start mongod' or 'brew services start mongodb-community')"
  warn "The API still boots without it, but login and interviews need the database."
}

# ---------------------------------------------------------------------------
# Processes
# ---------------------------------------------------------------------------
BACKEND_PID=""

wait_for_api() {
  local tries=0
  printf '%s  … waiting for %s/api/health%s' "$C_DIM" "$C_RESET$C_CYAN" "$C_RESET"
  while [ "$tries" -lt 60 ]; do
    if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/health" >/dev/null 2>&1; then
      printf '\r%s✓%s API is healthy on http://127.0.0.1:%s%s\n' "$C_GREEN" "$C_RESET" "$BACKEND_PORT" "          "
      return 0
    fi
    # Give up early if the process already died.
    if [ -n "$BACKEND_PID" ] && ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      printf '\r'
      fail "Backend exited during startup — see logs/backend.log"
      return 1
    fi
    printf '.'
    sleep 1
    tries=$((tries + 1))
  done
  printf '\r'
  warn "API did not report healthy within 60s — check logs/backend.log"
  return 1
}

start_backend() {
  mkdir -p "$LOG_DIR"
  step "Starting FastAPI on http://127.0.0.1:${BACKEND_PORT}"

  (
    cd "$BACKEND_DIR"
    exec "$VENV_PY" -m uvicorn app.main:app \
      --host 127.0.0.1 \
      --port "$BACKEND_PORT" \
      --reload
  ) >"$LOG_DIR/backend.log" 2>&1 &
  BACKEND_PID=$!

  wait_for_api || true
  printf '%s  backend log: %slogs/backend.log%s\n' "$C_DIM" "$C_RESET$C_DIM" "$C_RESET"
}

SHUTTING_DOWN=0
stop_all() {
  [ "$SHUTTING_DOWN" = "1" ] && return
  SHUTTING_DOWN=1
  hr
  step "Shutting down"
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
    # uvicorn --reload spawns a child; make sure it goes too.
    pkill -P "$BACKEND_PID" 2>/dev/null || true
    ok "Backend stopped"
  fi
}

start_frontend() {
  step "Starting Vite dev server on http://127.0.0.1:${FRONTEND_PORT}"
  hr
  printf '  %sOpen:%s  http://127.0.0.1:%s\n' "$C_BOLD" "$C_RESET" "$FRONTEND_PORT"
  printf '  %sAPI docs:%s http://127.0.0.1:%s/docs\n' "$C_BOLD" "$C_RESET" "$BACKEND_PORT"
  printf '  %sDemo:%s  candidate@example.com / candidate123\n' "$C_BOLD" "$C_RESET"
  printf '         admin@interviewsense.com / admin123\n'
  printf '  %sStop:%s  Ctrl+C\n' "$C_BOLD" "$C_RESET"
  hr
  printf '\n'
  (cd "$FRONTEND_DIR" && npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT")
}

start_all() {
  check_prereqs
  prepare_env
  install_backend
  install_frontend
  check_mongo

  if [ ! -x "$VENV_PY" ]; then
    fail "Backend virtual environment is missing. Run './run.sh install' first."
    exit 1
  fi

  trap stop_all EXIT INT TERM

  start_backend
  start_frontend
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
case "${1:-all}" in
  --help|-h|help) usage ;;
  all|"")         banner; start_all ;;
  install)
    banner
    check_prereqs
    prepare_env
    install_backend
    install_frontend
    ok "Setup complete — run './run.sh' to start the project."
    ;;
  backend)
    banner
    check_prereqs
    prepare_env
    install_backend
    check_mongo
    if [ ! -x "$VENV_PY" ]; then
      fail "Backend virtual environment is missing. Run './run.sh install' first."
      exit 1
    fi
    trap stop_all EXIT INT TERM
    start_backend
    hr
    printf '\n  %sPress Ctrl+C to stop the API.%s\n\n' "$C_DIM" "$C_RESET"
    wait "$BACKEND_PID"
    ;;
  frontend)
    banner
    require_cmd node
    require_cmd npm
    install_frontend
    trap stop_all EXIT INT TERM
    start_frontend
    ;;
  *)
    fail "Unknown command: $1"
    printf 'Run ./run.sh --help for usage.\n'
    exit 1
    ;;
esac
