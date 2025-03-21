#!/bin/bash
set -e

echo "Building Audio Mixer WASM application for Netlify..."

# Create web directory if it doesn't exist
mkdir -p web

# Check Go version
GO_VERSION=$(go version | awk '{print $3}')
echo "Using Go version: $GO_VERSION"

# Copy wasm_exec.js from Go installation to web directory
echo "Copying wasm_exec.js..."
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" web/

# Build the WASM module with explicit GOOS and GOARCH
echo "Building WASM module..."
GOOS=js GOARCH=wasm go build -o web/main.wasm ./wasm/main.go

# Download FFmpeg WASM
echo "Downloading FFmpeg WASM libraries..."
curl -L https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js -o web/ffmpeg.min.js
curl -L https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js -o web/ffmpeg-core.js
curl -L https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm -o web/ffmpeg-core.wasm
curl -L https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js -o web/ffmpeg-core.worker.js

echo "Build completed successfully for Netlify deployment!"
