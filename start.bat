@echo off
title SprintBoard — Setup & Launch
color 0B
echo.
echo  =====================================================
echo   SprintBoard — PostgreSQL Backend Setup ^& Launch
echo  =====================================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found!
    echo  Download from: https://nodejs.org
    pause & exit /b 1
)
echo  [OK] Node.js found: & node --version

:: Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] npm not found!
    pause & exit /b 1
)
echo  [OK] npm found: & npm --version

:: Install dependencies
echo.
echo  Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo  [ERROR] npm install failed!
    pause & exit /b 1
)
echo  [OK] Dependencies installed.

:: Run DB setup
echo.
echo  Setting up PostgreSQL database...
echo  (Make sure PostgreSQL is running and credentials in .env are correct)
echo.
call node db/setup.js
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Database setup failed!
    echo  Check your .env file and ensure PostgreSQL is running.
    echo  Default credentials: postgres / postgres on localhost:5432
    echo.
    pause & exit /b 1
)

:: Start the server
echo.
echo  Starting SprintBoard server...
echo.
start "" http://localhost:3000
node server.js
pause
