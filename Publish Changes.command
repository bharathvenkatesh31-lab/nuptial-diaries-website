#!/bin/bash
cd "$(dirname "$0")" || exit 1
clear
echo ""
echo "  ─────────────────────────────────────────────"
echo "   Publishing to the live site"
echo "  ─────────────────────────────────────────────"
echo ""
bash tools/publish.sh
echo ""
read -r -p "  Press return to close. " _
