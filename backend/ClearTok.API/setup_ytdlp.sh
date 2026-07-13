#!/bin/bash
# ─── ClearTok — Deploy Prep Script ───────────────────────────────────────────
# Run AFTER `dotnet publish`, BEFORE zipping.
#
# WHAT CHANGED (and why):
#   Previously this script downloaded the 38MB yt-dlp binary into publish/,
#   which made the deploy zip ~46MB — too large to upload through Azure Cloud
#   Shell (it consistently timed out at ~90-100%).
#
#   Now: the binary is NOT bundled. Instead, startup.sh (which Azure runs on
#   every container start) downloads yt-dlp server-side from GitHub in ~4s.
#   This keeps the deploy zip small (~10MB) and requires no manual SSH step.
#
# This script's only job now is to copy startup.sh into publish/ so it ships
# with the deployment and lands at /home/site/wwwroot/startup.sh.
#
# Usage: bash setup_ytdlp.sh
# Run from: backend/ClearTok.API

set -e

PUBLISH_DIR="./publish"

echo "─── ClearTok deploy prep ───────────────────────────────────────"
echo ""

# ── Verify publish folder exists ────────────────────────────────────────────
if [ ! -d "$PUBLISH_DIR" ]; then
  echo "ERROR: publish/ folder not found."
  echo "Run 'dotnet publish -c Release -o ./publish' first."
  exit 1
fi
echo "✓ publish/ folder found"

# ── Copy startup script into the deployment ─────────────────────────────────
if [ ! -f "./startup.sh" ]; then
  echo "ERROR: startup.sh not found in $(pwd)"
  echo "It should live alongside this script in backend/ClearTok.API/"
  exit 1
fi

cp ./startup.sh "$PUBLISH_DIR/startup.sh"
chmod +x "$PUBLISH_DIR/startup.sh"
echo "✓ startup.sh copied to publish/ and made executable"

# ── Verify ──────────────────────────────────────────────────────────────────
echo ""
if [ -x "$PUBLISH_DIR/startup.sh" ]; then
  echo "✓ startup.sh: present and executable"
else
  echo "✗ startup.sh: MISSING or not executable"
  exit 1
fi

# Sanity check: the binary should NOT be here (that's the point)
if [ -f "$PUBLISH_DIR/yt-dlp" ]; then
  echo "⚠ WARNING: yt-dlp binary found in publish/ — this will bloat the zip."
  echo "  Remove it: rm -f $PUBLISH_DIR/yt-dlp"
fi

echo ""
echo "─── Ready to zip ───────────────────────────────────────────────"
echo ""
echo "Next:"
echo "  1. cd publish && zip -r ../cleartok-api.zip . && cd .."
echo "  2. Check size — should be ~10MB, not 46MB"
echo "  3. Upload to Cloud Shell and deploy"
echo "  4. Azure's startup.sh fetches yt-dlp automatically — no SSH needed"
echo ""