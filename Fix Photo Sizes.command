#!/bin/bash
# Double-click after uploading photographs in Album Studio.
cd "$(dirname "$0")" || exit 1
clear
echo ""
echo "  ─────────────────────────────────────────────"
echo "   Checking every photograph on the site"
echo "  ─────────────────────────────────────────────"
echo ""
python3 tools/tidy_uploads.py
echo ""
read -r -p "  Press return to close. " _
