@echo off
title SprintBoard — Deploy to Production
color 0A

echo ==================================================
echo   SprintBoard Production Deploy
echo   Server: 208.70.248.68
echo ==================================================
echo.

:: ── Step 1: Push latest code to GitHub ────────────────────────────────────────
echo [1/3] Pushing latest code to GitHub...
cd /d "%~dp0"
git add -A
git diff --cached --quiet && (
  echo   No local changes to commit.
) || (
  git commit -m "Auto-deploy: update from deploy.bat"
  if errorlevel 1 (
    echo   ERROR: git commit failed.
    pause & exit /b 1
  )
)
git push
if errorlevel 1 (
  echo   ERROR: git push failed. Check your internet / credentials.
  pause & exit /b 1
)
echo   Done.
echo.

:: ── Step 2: SSH into server and pull latest + restart ─────────────────────────
echo [2/3] Connecting to production server and updating...
echo   (You may be prompted for the server password)
echo.

ssh -o StrictHostKeyChecking=no root@208.70.248.68 "^
  echo '--- Navigating to project ---' ^& ^
  cd /root/Sprint-Board ^& ^
  echo '--- Pulling latest code ---' ^& ^
  git pull ^& ^
  echo '--- Installing dependencies ---' ^& ^
  npm install --production ^& ^
  echo '--- Restarting server ---' ^& ^
  (pm2 restart sprintboard 2>/dev/null ^|^| pm2 restart all 2>/dev/null ^|^| ^
   (pkill -f 'node server.js' ; sleep 2 ; nohup node server.js ^> /root/Sprint-Board/server.log 2^>^&1 ^& echo 'Server started')) ^& ^
  echo '--- Done ---'"

if errorlevel 1 (
  echo.
  echo   WARNING: SSH command returned an error.
  echo   Check if the server path is correct: /root/Sprint-Board
) else (
  echo.
  echo [3/3] Deploy complete!
  echo   Production: https://sprintboard.cftools.live
)

echo.
pause
