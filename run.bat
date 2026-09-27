@echo off
title Unified Industrial Approval System (UIAS) Launcher
cd /d "%~dp0"

echo ====================================================================
echo  Starting Unified Industrial Approval System (UIAS)
echo  Government of Maharashtra Single Window Portal
echo ====================================================================

:: Set PYTHONPATH to current directory so python imports src cleanly
set "PYTHONPATH=%~dp0;%PYTHONPATH%"

:: 1. Resolve Python executable (or create .venv if missing)
if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
) else if exist "%~dp0.venv-win\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0.venv-win\Scripts\python.exe"
) else (
    echo.
    echo [*] No local virtual environment found. Creating .venv...
    where py >nul 2>&1
    if %errorlevel% equ 0 (
        py -m venv "%~dp0.venv"
    ) else (
        python -m venv "%~dp0.venv"
    )
    if exist "%~dp0.venv\Scripts\python.exe" (
        set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
        echo [*] Installing backend dependencies from requirements.txt...
        "%~dp0.venv\Scripts\python.exe" -m pip install -r "%~dp0requirements.txt"
    ) else (
        echo [WARNING] Could not create virtual environment. Falling back to system python.
        set "PYTHON_EXE=python"
    )
)

:: 2. Check frontend dependencies (run npm install if missing)
if not exist "%~dp0frontend\node_modules" (
    echo.
    echo [*] Frontend dependencies not found. Installing via npm...
    pushd "%~dp0frontend"
    call npm install
    popd
)

echo Using Python: "%PYTHON_EXE%"

echo.
echo [1/2] Launching Backend API on http://127.0.0.1:8000 ...
start "UIAS - Backend API (Port 8000)" cmd /k "cd /d "%~dp0" && set "PYTHONPATH=%~dp0" && "%PYTHON_EXE%" -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000"

echo Waiting for backend API to initialize...
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Launching Frontend Web App on http://localhost:3000 ...
start "UIAS - Frontend Portal (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ====================================================================
echo  Unified Industrial Approval System is now running!
echo ====================================================================
echo  - Frontend Portal:  http://localhost:3000
echo  - Backend API:      http://127.0.0.1:8000
echo  - API Swagger Docs: http://127.0.0.1:8000/docs
echo ====================================================================
echo.
echo (Do not close the backend and frontend command windows while using the portal.)
pause
