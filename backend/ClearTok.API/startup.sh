#!/bin/bash
# ─── ClearTok — Azure App Service Startup Script ─────────────────────────────
# Runs automatically every time the Azure container starts.
#
# Purpose: ensure the yt-dlp binary exists before the .NET app starts.
# This replaces the old approach of bundling the 38MB binary into the deploy zip
# (which made the zip too large to upload through Cloud Shell).
#
# Azure downloads the binary directly from GitHub server-side — takes ~4 seconds.
#
# Configured via: Azure Portal → cleartok-api → Configuration → General settings
#                 → Startup Command: /home/site/wwwroot/startup.sh

set -e  # exit on error

YTDLP_PATH="/home/site/wwwroot/yt-dlp"
YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux"

echo "─── ClearTok startup ───────────────────────────────────────────"

# ── Ensure yt-dlp exists and is executable ──────────────────────────────────
# We check for existence AND that it actually runs. A zero-byte or corrupted
# download would pass a simple -f check but fail at runtime, so we verify it
# can report its version before trusting it.
if [ -f "$YTDLP_PATH" ] && "$YTDLP_PATH" --version > /dev/null 2>&1; then
    echo "✓ yt-dlp present: $("$YTDLP_PATH" --version)"
else
    echo "yt-dlp missing or broken — downloading..."
    rm -f "$YTDLP_PATH"
    curl -L "$YTDLP_URL" -o "$YTDLP_PATH"
    chmod +x "$YTDLP_PATH"
    echo "✓ yt-dlp installed: $("$YTDLP_PATH" --version)"
fi

echo "─── Starting ClearTok API ──────────────────────────────────────"

# ── Start the .NET app ──────────────────────────────────────────────────────
# This must be the last line — it hands control to the app and keeps the
# container alive. Without it, the container would exit immediately.
exec dotnet /home/site/wwwroot/ClearTok.API.dll