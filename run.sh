#!/usr/bin/env bash

# Navigate to the repository root directory
cd "$(dirname "$0")" || exit 1

echo "=================================================="
echo " Starting SMSWS Policy Engine Backend & Frontend "
echo "=================================================="

# Function to stop background processes on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill "$BACKEND_PID" 2>/dev/null
    kill "$FRONTEND_PID" 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Determine python executable (prefer .venv-win, fallback to .venv or python)
if [ -f "./.venv-win/Scripts/python.exe" ]; then
    PYTHON_CMD="./.venv-win/Scripts/python.exe"
elif [ -f "./.venv/Scripts/python.exe" ]; then
    PYTHON_CMD="./.venv/Scripts/python.exe"
elif [ -f "./.venv/bin/python" ]; then
    PYTHON_CMD="./.venv/bin/python"
else
    PYTHON_CMD="python"
fi

# 1. Start Backend API
echo "Starting backend API on http://127.0.0.1:8000..."
"$PYTHON_CMD" -m uvicorn src.api.main:app --port 8000 &
BACKEND_PID=$!

# Wait 2 seconds for backend initialization
sleep 2

# 2. Start Frontend Dev Server
echo "Starting frontend UI on http://localhost:3000..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "Servers are running!"
echo " - Backend API: http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)"
echo " - Frontend UI: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers."

wait
