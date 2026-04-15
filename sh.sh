#!/bin/bash

# Navigate to the script's directory so it works from anywhere
cd "$(dirname "$0")"

echo "====================================="
echo "1. Installing required tools (npm)..."
echo "====================================="
npm install

echo "====================================="
echo "2. Packaging the theme (vsce)..."
echo "====================================="
npx vsce package

echo "====================================="
echo "3. Installing theme into VS Code..."
echo "====================================="
code --install-extension royal-velvet-antigravity-1.0.0.vsix

echo "====================================="
echo "✅ Finished! The theme is installed."
echo "Press Cmd+K then Cmd+T in VS Code to select 'Royal Velvet Dark'."
echo "====================================="
