#!/bin/bash
# ─── ClearTok — yt-dlp Setup Script ──────────────────────────────────────────
# Run this ONCE before building the deployment zip.
# Downloads yt-dlp binary and installs curl_cffi into the publish folder
# so they survive Azure container restarts.
#
# Usage: bash setup_ytdlp.sh
# Run from: /Users/shelan/Desktop/Watermark/ClearTok/backend/ClearTok.API

set -e  # Exit on any error

PUBLISH_DIR="./publish"
YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux"

echo "─── ClearTok yt-dlp Setup ───────────────────────────────────────"
echo ""

# Step 1 — Make sure publish folder exists
if [ ! -d "$PUBLISH_DIR" ]; then
  echo "ERROR: publish/ folder not found."
  echo "Run 'dotnet publish -c Release -o ./publish' first."
  exit 1
fi

echo "✓ publish/ folder found"

# Step 2 — Download yt-dlp binary
echo ""
echo "Downloading yt-dlp binary..."
rm -f "$PUBLISH_DIR/yt-dlp"
curl -L "$YTDLP_URL" -o "$PUBLISH_DIR/yt-dlp"
chmod +x "$PUBLISH_DIR/yt-dlp"
echo "✓ yt-dlp downloaded and made executable"

# Step 3 — Install curl_cffi into publish folder
echo ""
echo "Installing curl_cffi into publish folder..."
pip3 install curl_cffi==0.10.0 \
  --target "$PUBLISH_DIR/python-packages" \
  --break-system-packages \
  --quiet
echo "✓ curl_cffi installed to publish/python-packages"

# Step 4 — Verify
echo ""
echo "Verifying..."
if [ -f "$PUBLISH_DIR/yt-dlp" ]; then
  echo "✓ yt-dlp binary: present"
else
  echo "✗ yt-dlp binary: MISSING"
  exit 1
fi

if [ -d "$PUBLISH_DIR/python-packages/curl_cffi" ]; then
  echo "✓ curl_cffi: present"
else
  echo "✗ curl_cffi: MISSING"
  exit 1
fi

echo ""
echo "─── Setup complete ──────────────────────────────────────────────"
echo ""
echo "Next steps:"
echo "  1. cd publish"
echo "  2. zip -r ../cleartok-api.zip ."
echo "  3. cd .."
echo "  4. Upload zip to Cloud Shell and deploy"
echo "  5. NO SSH reinstall needed — everything is bundled!"
echo ""