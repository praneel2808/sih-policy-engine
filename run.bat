@echo off
title SMSWS Policy Engine Launcher
cd /d "%~dp0"

set "PATH=%LOCALAPPDATA%\Programs\nodejs;%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%PATH%"

echo ==================================================
echo  Starting SMSWS Policy Engine Backend and Frontend
echo ==================================================

:: Check for virtual environment python
if exist ".venv-win\Scripts\python.exe" (
    set "PYTHON_EXE=.venv-win\Scripts\python.exe"
) else if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

echo Starting Backend API on http://127.0.0.1:8000 in a new window...
start "SMSWS - Backend API (Port 8000)" cmd /k ""%PYTHON_EXE%" -m uvicorn src.api.main:app --port 8000"

echo Waiting 2 seconds for backend to start...
timeout /t 2 /nobreak >nul

echo Starting Frontend UI on http://localhost:3000 in a new window...
start "SMSWS - Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers have been launched!
echo - Backend:  http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)
echo - Frontend: http://localhost:3000
echo.
echo (You can close this window now. The servers will continue running in their own windows.)
pause
