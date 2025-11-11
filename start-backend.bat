@echo off
REM Quick Start Script for Talash Backend (Windows)
REM This script sets up and runs the backend server

echo.
echo ========================================
echo   Talash Backend - Quick Start (Windows)
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.9+ first.
    pause
    exit /b 1
)

REM Navigate to backend directory
cd backend 2>nul
if errorlevel 1 (
    echo [ERROR] backend folder not found. Run this script from project root.
    pause
    exit /b 1
)

echo [1/4] Checking Python version...
python --version

echo.
echo [2/4] Creating virtual environment...
if not exist venv (
    python -m venv venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

echo.
echo [3/4] Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip >nul
pip install -r requirements.txt

echo.
echo [4/4] Starting backend server...
echo.
echo ========================================
echo   Backend running on http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Press Ctrl+C to stop
echo ========================================
echo.

python main.py

pause
