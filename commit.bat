@echo off
title Safe Git Commit & Push Helper
cd /d "%~dp0"

echo ====================================================================
echo  Safe Git Commit & Push Helper
echo  Unified Industrial Approval System (UIAS)
echo ====================================================================
echo.

:: 1. Verify Git is installed and available
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in PATH.
    echo Please install Git from https://git-scm.com/
    goto end
)

:: 2. Safety unstage: Ensure virtual environments and node_modules are never staged
git reset HEAD .venv .venv* .venv-win .venv-win* venv* env* .env* node_modules frontend\node_modules frontend\.next >nul 2>&1

:: 3. Check for modified or untracked files
git status --porcelain > "%TEMP%\git_status_check.tmp" 2>nul
set HAS_CHANGES=0
for /f "usebackq" %%A in ("%TEMP%\git_status_check.tmp") do set HAS_CHANGES=1
del "%TEMP%\git_status_check.tmp" >nul 2>&1

if %HAS_CHANGES% equ 0 (
    echo [INFO] No new changes detected in your project files.
    goto check_unpushed
)

:: 4. Display changed project files
echo Detected the following updated project files:
echo --------------------------------------------------------------------
git status -s
echo --------------------------------------------------------------------
echo.

:: 5. Prompt for commit message
set /p COMMIT_MSG="Enter commit message (press Enter for default): "
if "%COMMIT_MSG%"=="" (
    set "COMMIT_MSG=Update project files"
)

:: 6. Stage all project changes (respecting .gitignore)
echo.
echo [1/3] Staging project files...
git add .

:: Rigorous safety check: Guarantee zero environment/dependency/cache files are staged
git reset HEAD .venv .venv* .venv-win .venv-win* venv* env* .env* node_modules frontend\node_modules frontend\.next __pycache__ .pytest_cache >nul 2>&1

:: 7. Commit
echo [2/3] Committing changes: "%COMMIT_MSG%"...
git commit -m "%COMMIT_MSG%"
if %errorlevel% neq 0 (
    echo [ERROR] Git commit failed.
    goto end
)

:: 8. Push to GitHub
echo [3/3] Pushing to remote repository (main)...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Direct push failed.
    echo Attempting to pull latest changes with rebase...
    git pull --rebase origin main
    if %errorlevel% equ 0 (
        echo Rebase successful. Retrying push...
        git push origin main
    ) else (
        echo [ERROR] Push failed. Please check your network connection or GitHub permissions.
        goto end
    )
)

echo.
echo ====================================================================
echo  Successfully committed and pushed your project updates to GitHub!
echo ====================================================================
goto end

:check_unpushed
git log origin/main..HEAD --oneline > "%TEMP%\git_unpushed.tmp" 2>nul
set HAS_UNPUSHED=0
for /f "usebackq" %%A in ("%TEMP%\git_unpushed.tmp") do set HAS_UNPUSHED=1
del "%TEMP%\git_unpushed.tmp" >nul 2>&1

if %HAS_UNPUSHED% equ 1 (
    echo [INFO] You have local commits that haven't been pushed yet.
    echo Pushing pending commits to remote...
    git push origin main
    if %errorlevel% equ 0 (
        echo [OK] Pushed pending commits successfully!
    )
)

:end
echo.
echo Press any key to close...
pause >nul
