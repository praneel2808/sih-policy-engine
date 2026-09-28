@echo off
title Unified Industrial Approval System (UIAS) Launcher
cd /d "%~dp0"

:: Strip trailing backslash from %~dp0 for safe path concat without backslash-quote escaping issues
set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

echo ====================================================================
echo  Starting Unified Industrial Approval System (UIAS)
echo  Government of Maharashtra Single Window Portal
echo ====================================================================

:: 0. Resolve Node.js / npm executable location if not currently in PATH
where npm >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\Programs\nodejs" (
        set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    ) else if exist "%ProgramFiles%\nodejs" (
        set "PATH=%ProgramFiles%\nodejs;%PATH%"
    ) else if exist "%ProgramFiles(x86)%\nodejs" (
        set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    )
)

:: Set PYTHONPATH to root directory so python imports src cleanly
set "PYTHONPATH=%ROOT_DIR%;%PYTHONPATH%"

:: 1. Resolve Python executable (or create .venv if missing)
if exist "%ROOT_DIR%\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%ROOT_DIR%\.venv\Scripts\python.exe"
) else if exist "%ROOT_DIR%\.venv-win\Scripts\python.exe" (
    set "PYTHON_EXE=%ROOT_DIR%\.venv-win\Scripts\python.exe"
) else (
    echo.
    echo [*] No local virtual environment found. Creating .venv...
    where py >nul 2>&1
    if %errorlevel% equ 0 (
        py -m venv "%ROOT_DIR%\.venv"
    ) else (
        python -m venv "%ROOT_DIR%\.venv"
    )
    if exist "%ROOT_DIR%\.venv\Scripts\python.exe" (
        set "PYTHON_EXE=%ROOT_DIR%\.venv\Scripts\python.exe"
        echo [*] Installing backend dependencies from requirements.txt...
        "%ROOT_DIR%\.venv\Scripts\python.exe" -m pip install -r "%ROOT_DIR%\requirements.txt"
    ) else (
        echo [WARNING] Could not create virtual environment. Falling back to system python.
        set "PYTHON_EXE=python"
    )
)

:: 2. Check frontend dependencies (run npm install if missing)
if not exist "%ROOT_DIR%\frontend\node_modules" (
    echo.
    echo [*] Frontend dependencies not found. Installing via npm...
    pushd "%ROOT_DIR%\frontend"
    call npm install
    popd
)

echo Using Python: "%PYTHON_EXE%"

echo.
echo [1/3] Launching Backend API on http://127.0.0.1:8000 ...
start "UIAS - Backend API (Port 8000)" cmd /k "cd /d "%ROOT_DIR%" && set "PATH=%PATH%" && set "PYTHONPATH=%ROOT_DIR%" && "%PYTHON_EXE%" -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting for backend API to initialize...
ping 127.0.0.1 -n 4 >nul

echo.
echo [2/3] Launching Citizen Frontend Portal on http://localhost:3000 ...
start "UIAS - Citizen Portal (Port 3000)" cmd /k "cd /d "%ROOT_DIR%\frontend" && set "PATH=%PATH%" && npm run dev"

echo.
echo [3/3] Launching Government Officer Station on http://localhost:3001 ...
start "UIAS - Officer Console (Port 3001)" cmd /k "cd /d "%ROOT_DIR%" && set "PATH=%PATH%" && "%PYTHON_EXE%" officer_portal/server.py"

echo.
echo ====================================================================
echo  Unified Industrial Approval System is now running!
echo ====================================================================
echo  - Citizen Portal:       http://localhost:3000
echo  - Officer Station:      http://localhost:3001
echo  - Backend API:          http://127.0.0.1:8000
echo  - API Swagger Docs:     http://127.0.0.1:8000/docs
echo ====================================================================
echo.
echo (Do not close the backend, citizen, and officer command windows.)
pause
