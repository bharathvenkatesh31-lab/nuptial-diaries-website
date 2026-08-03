#!/bin/bash
# Double-click this to edit the website.
cd "$(dirname "$0")" || exit 1
clear
echo ""
echo "  Starting the editor…"
echo ""

# The part that lets the editor save to your Mac.
npx --yes decap-server > /tmp/nd-editor.log 2>&1 &
EDITOR_PID=$!

# The part that shows the website.
python3 -m http.server 4173 > /dev/null 2>&1 &
SITE_PID=$!

cleanup() {
  kill $EDITOR_PID $SITE_PID 2>/dev/null
  echo ""
  echo "  Editor closed."
  echo ""
}
trap cleanup EXIT INT TERM

sleep 6
open "http://localhost:4173/admin/"

echo "  The editor is open in your browser."
echo ""
echo "    Edit the website:   http://localhost:4173/admin/"
echo "    See the website:    http://localhost:4173/"
echo ""
echo "  Leave this window open while you work."
echo "  Close it when you are finished."
echo ""
wait
