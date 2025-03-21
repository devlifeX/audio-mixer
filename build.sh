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
# Compile all .go files in the wasm directory
GOOS=js GOARCH=wasm go build -o web/main.wasm wasm/*.go

# Check if the build was successful
if [ $? -eq 0 ]; then
    echo "✅ WASM build successful!"
else
    echo "❌ WASM build failed!"
    exit 1
fi

# Download FFmpeg WASM libraries if they don't exist
echo "📥 Checking FFmpeg WASM libraries..."

# Using FFmpeg version 0.11.6 which is more stable with this project
FFMPEG_FILES=(
    "ffmpeg.min.js:https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js"
    "ffmpeg-core.js:https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js"
    "ffmpeg-core.wasm:https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm"
    "ffmpeg-core.worker.js:https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js"
)

for file_info in "${FFMPEG_FILES[@]}"; do
    filename="${file_info%%:*}"
    url="${file_info#*:}"
    
    if [ ! -f "web/$filename" ]; then
        echo "  Downloading $filename..."
        curl -L "$url" -o "web/$filename"
        if [ $? -eq 0 ]; then
            echo "  ✅ Downloaded $filename successfully"
        else
            echo "  ❌ Failed to download $filename"
            echo "  Trying alternative CDN..."
            
            # Try an alternative CDN if the first one fails
            alt_url="https://unpkg.com/@ffmpeg/${filename%.*}@${filename#*@}/dist/${filename##*/}"
            curl -L "$alt_url" -o "web/$filename"
            
            if [ $? -eq 0 ]; then
                echo "  ✅ Downloaded $filename from alternative CDN"
            else
                echo "  ❌ Failed to download $filename from both CDNs"
                exit 1
        fi
    fi
    else
        echo "  ✓ $filename already exists, skipping download"
    fi
done

echo "✅ All FFmpeg libraries are available"

# Copy JavaScript and CSS files
echo "📂 Copying web files..."
JS_FILES=("script.js" "ui.js" "settings.js" "wasm.js" "video-ui.js")
OTHER_FILES=("style.css" "index.html")

# First check if the files exist in the current directory
for file in "${JS_FILES[@]}" "${OTHER_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" web/
        echo "  Copied $file to web/"
    elif [ ! -f "web/$file" ]; then
        # Only warn if the file doesn't exist in web/ either
        echo "⚠️ Warning: $file not found in current directory or web/"
    fi
done

# Create a version file with timestamp for cache busting
echo "📝 Creating version file..."
echo "{\"buildTime\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\", \"version\": \"1.0.0\"}" > web/version.json

# Generate a unique build hash for cache busting
echo "🔄 Generating build hash for cache busting..."
BUILD_HASH=$(date +%s%N | md5sum | head -c 8)
echo "  Build hash: $BUILD_HASH"

# Update index.html with the build hash
echo "🔧 Updating build hash in index.html..."

# Update the existing BUILD_HASH value in index.html
if grep -q "const BUILD_HASH" web/index.html; then
    # Replace the existing BUILD_HASH value with the new one
    sed -i "s/const BUILD_HASH = \"[^\"]*\"/const BUILD_HASH = \"$BUILD_HASH\"/g" web/index.html
    echo "  ✅ Successfully updated BUILD_HASH value in index.html"
else
    echo "  ⚠️ BUILD_HASH variable not found in index.html"
    echo "  ℹ️ Adding BUILD_HASH variable to head section..."
    
    # Add the BUILD_HASH variable to the head section
    sed -i '/<\/head>/i \
    <script>\
      const BUILD_HASH = "'$BUILD_HASH'";\
    </script>' web/index.html
    
    echo "  ✅ Added BUILD_HASH variable to index.html"
fi

# Print directory contents for verification
echo "📁 Files in web directory:"
ls -la web/

echo "====================================="
echo "✨ Build completed successfully! ✨"
echo "====================================="
echo "The application is ready for deployment."
echo "====================================="
