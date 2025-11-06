#!/bin/bash
# Render build script

echo "🔧 Installing Node.js dependencies..."
npm install

echo "🐍 Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ All dependencies installed successfully!"