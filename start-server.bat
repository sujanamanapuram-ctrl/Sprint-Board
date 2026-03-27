@echo off
title SprintBoard Server
color 1F
echo ================================================
echo   Neutara SprintBoard - Server Starting...
echo ================================================
echo.

:start
echo [%time%] Starting server...
node "%~dp0server.js"
echo.
echo [%time%] Server stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto start
