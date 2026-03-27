@echo off
title Setup SprintBoard AutoStart
set PROJ=C:\Users\Neutara\Claude Test
set NODE=C:\Program Files\nodejs\node.exe

echo ================================================
echo   Neutara SprintBoard - AutoStart Setup
echo ================================================
echo.
echo This will register SprintBoard to start automatically
echo on Windows login (no terminal window needed).
echo.

REM Remove existing task if present
schtasks /delete /tn "SprintBoard" /f >nul 2>&1

REM Create scheduled task: run on login, highest privileges, hidden
schtasks /create /tn "SprintBoard" /tr "\"%NODE%\" \"%PROJ%\server.js\"" /sc ONLOGON /ru "%USERNAME%" /f /rl HIGHEST

if %errorlevel%==0 (
  echo [OK] AutoStart registered successfully!
  echo.
  echo SprintBoard will now start automatically every time you log in.
  echo Server will run at: http://localhost:3000
  echo.
  echo Starting server now...
  start "" /B "%NODE%" "%PROJ%\server.js"
  echo [OK] Server started at http://localhost:3000
) else (
  echo [ERROR] Failed to register. Try right-clicking and "Run as Administrator".
)

echo.
pause
