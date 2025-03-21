#!/bin/bash
set -e

echo "====================================="
echo "Building Audio/Video Mixer Application"
echo "====================================="

# Create web directory if it doesn't exist
mkdir -p web

# Check Go version
GO_VERSION=$(go version | awk '{print $3}')
echo "🔍 Using Go version: $GO_VERSION"

# Copy wasm_exec.js from Go installation to web directory
echo "📂 Copying wasm_exec.js..."
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" web/

# Build the WASM module with explicit GOOS and GOARCH
echo "🔨 Building WASM module..."
GOOS=js GOARCH=wasm go build -o web/main.wasm ./wasm/

# Check if the build was successful
if [ $? -eq 0 ]; then
    echo "✅ WASM build successful!"
else
    echo "❌ WASM build failed!"
    exit 1
fi
# Download FFmpeg WASM libraries
echo "📥 Downloading FFmpeg WASM libraries..."
curl -L https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js -o web/ffmpeg.min.js
curl -L https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js -o web/ffmpeg-core.js
curl -L https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm -o web/ffmpeg-core.wasm
curl -L https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js -o web/ffmpeg-core.worker.js

# Check if all files were downloaded
if [ -f "web/ffmpeg.min.js" ] && [ -f "web/ffmpeg-core.js" ] && [ -f "web/ffmpeg-core.wasm" ] && [ -f "web/ffmpeg-core.worker.js" ]; then
    echo "✅ FFmpeg libraries downloaded successfully!"
else
    echo "❌ Failed to download some FFmpeg libraries!"
    exit 1
fi

# Copy JavaScript and CSS files
echo "📂 Copying web files..."
# No need to copy from web/ to web/ - they're already in the right place
# Just make sure the files exist
JS_FILES=("script.js" "ui.js" "settings.js" "wasm.js")
for file in "${JS_FILES[@]}"; do
    if [ ! -f "web/$file" ]; then
        echo "⚠️ Warning: $file not found in web directory!"
    fi
done

if [ ! -f "web/style.css" ]; then
    echo "⚠️ Warning: style.css not found in web directory!"
fi

if [ ! -f "web/index.html" ]; then
    echo "⚠️ Warning: index.html not found in web directory!"
fi

# Create a version file with timestamp for cache busting
echo "📝 Creating version file..."
echo "{\"buildTime\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\", \"version\": \"1.0.0\"}" > web/version.json

# Print directory contents for verification
echo "📁 Files in web directory:"
ls -la web/

echo "====================================="
echo "✨ Build completed successfully! ✨"
echo "====================================="
echo "The application is ready for deployment to Netlify."
echo "====================================="
