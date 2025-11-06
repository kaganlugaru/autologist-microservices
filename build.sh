#!/bin/bash
echo "Build script for Render deployment"

echo "Installing Node.js dependencies..."
npm install

echo "Checking Python versions..."
which python3
python3 --version
which python
python --version 2>/dev/null || echo "python not found"

echo "Using python3 for pip install..."
python3 -m pip install --upgrade pip

echo "Installing Python dependencies..."
python3 -m pip install telethon==1.35.0
python3 -m pip install python-dotenv==1.0.0

echo "Verifying installation..."
python3 -c "import telethon; print('telethon installed:', telethon.__version__)"
python3 -c "import dotenv; print('python-dotenv installed')"

echo "All dependencies installed successfully!"