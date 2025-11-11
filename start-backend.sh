#!/bin/bash
# Quick Start Script for Talash Backend (macOS/Linux)

echo ""
echo "========================================"
echo "  Talash Backend - Quick Start"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 not found. Please install Python 3.9+ first."
    exit 1
fi

# Navigate to backend directory
cd backend || {
    echo "[ERROR] backend folder not found. Run this script from project root."
    exit 1
}

echo "[1/4] Checking Python version..."
python3 --version

echo ""
echo "[2/4] Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created."
else
    echo "Virtual environment already exists."
fi

echo ""
echo "[3/4] Activating virtual environment and installing dependencies..."
source venv/bin/activate
pip install --upgrade pip > /dev/null
pip install -r requirements.txt

echo ""
echo "[4/4] Starting backend server..."
echo ""
echo "========================================"
echo "  Backend running on http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo "  Press Ctrl+C to stop"
echo "========================================"
echo ""

python main.py
