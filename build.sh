#!/bin/bash
set -e

echo "Building Audio Mixer WASM application..."

# Create directories if they don't exist
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

# Build the server
echo "Building server..."
go build -o audio-mixer ./cmd/main.go

# Download FFmpeg WASM if needed
echo "Checking for FFmpeg WASM libraries..."
if [ ! -f "web/ffmpeg.min.js" ]; then
    echo "Downloading FFmpeg WASM..."
    curl -L https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js -o web/ffmpeg.min.js
    curl -L https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.11.0/dist/index.min.js -o web/ffmpeg.util.min.js
    echo "FFmpeg WASM downloaded."
fi

echo "Build completed successfully!"
echo "Run ./audio-mixer to start the server, then visit http://localhost:8080"
