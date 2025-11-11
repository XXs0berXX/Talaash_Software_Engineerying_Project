@echo off
REM Quick Start Script for Talash Frontend (Windows)

echo.
echo ========================================
echo   Talash Frontend - Quick Start (Windows)
echo ========================================
echo.

REM Check if Node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node 16+ first.
    pause
    exit /b 1
)

REM Navigate to frontend directory
cd frontend 2>nul
if errorlevel 1 (
    echo [ERROR] frontend folder not found. Run this script from project root.
    pause
    exit /b 1
)

echo [1/3] Checking Node.js version...
node --version

echo.
echo [2/3] Installing dependencies...
if not exist node_modules (
    call npm install
) else (
    echo Dependencies already installed.
)

echo.
echo [3/3] Starting development server...
echo.
echo ========================================
echo   Frontend running on http://localhost:3000
echo   Press Ctrl+C to stop
echo ========================================
echo.

call npm run dev

pause
