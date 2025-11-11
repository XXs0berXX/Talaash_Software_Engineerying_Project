#!/bin/bash
# Quick Start Script for Talash Frontend (macOS/Linux)

echo ""
echo "========================================"
echo "  Talash Frontend - Quick Start"
echo "========================================"
echo ""

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found. Please install Node 16+ first."
    exit 1
fi

# Navigate to frontend directory
cd frontend || {
    echo "[ERROR] frontend folder not found. Run this script from project root."
    exit 1
}

echo "[1/3] Checking Node.js version..."
node --version

echo ""
echo "[2/3] Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Dependencies already installed."
fi

echo ""
echo "[3/3] Starting development server..."
echo ""
echo "========================================"
echo "  Frontend running on http://localhost:3000"
echo "  Press Ctrl+C to stop"
echo "========================================"
echo ""

npm run dev
