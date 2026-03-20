@echo off
setlocal enabledelayedexpansion

echo ########################################
echo #      COMTPISHUN WEBSITE UPDATER      #
echo ########################################
echo.

:: Step 1: Add changes
echo [+] Adding all changes to Git...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo [!] ERROR: Failed to add changes. Is Git installed correctly?
    pause
    exit /b %ERRORLEVEL%
)

:: Step 2: Ask for a commit message
set "msg="
set /p msg="[?] Enter your commit message (or press ENTER for 'Update website'): "

if "!msg!"=="" (
    set msg=Update website content
)

echo [+] Committing changes with message: "!msg!"
git commit -m "!msg!"
if %ERRORLEVEL% NEQ 0 (
    echo [!] ERROR: Failed to commit. Maybe no changes to push?
    pause
    exit /b %ERRORLEVEL%
)

:: Step 3: Push to GitHub
echo [+] Pushing to GitHub (main)...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo [!] ERROR: Failed to push to GitHub. Check your internet connection or login.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ########################################
echo #           UPDATE SUCCESSFUL          #
echo #   Vercel will build in 30 seconds    #
echo ########################################
echo.
pause
