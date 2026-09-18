#!/bin/bash
# Double-click this to add a new wedding album to the website.
cd "$(dirname "$0")" || exit 1
clear
echo ""
echo "  ─────────────────────────────────────────────"
echo "   Add an album to Nuptial Diaries"
echo "  ─────────────────────────────────────────────"
echo ""
echo "  Photographs are resized for the web automatically."
echo "  Put them off the camera — they do not need preparing."
echo ""

# A folder dragged into Terminal arrives quoted or backslash-escaped.
read -r -p "  1. Drag the folder of photographs here, then press return:  " FOLDER
FOLDER="${FOLDER%\"}"; FOLDER="${FOLDER#\"}"
FOLDER="${FOLDER%\'}"; FOLDER="${FOLDER#\'}"
FOLDER="$(printf '%s' "$FOLDER" | sed 's/\\ / /g')"
FOLDER="${FOLDER%/}"

if [ ! -d "$FOLDER" ]; then
  echo ""; echo "  I cannot find that folder. Nothing has been changed."; echo ""
  read -r -p "  Press return to close." _; exit 1
fi

COUNT=$(find "$FOLDER" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.heic' \) | wc -l | tr -d ' ')
echo "     Found $COUNT photographs."
echo ""

read -r -p "  2. The couple, as it should appear (e.g. Riya & Arjun):  " COUPLE
[ -z "$COUPLE" ] && { echo "  No name given. Nothing has been changed."; read -r _; exit 1; }

echo ""
echo "  3. Which shoot is this?"
echo "       1) The wedding"
echo "       2) The pre-wedding shoot"
read -r -p "     Type 1 or 2, then press return:  " WHICH
if [ "$WHICH" = "2" ]; then KIND="Pre-Wedding"; else KIND="Wedding"; fi

echo ""
read -r -p "  4. City (press return to leave blank):  " CITY
read -r -p "  5. Month and year, e.g. March 2026 (press return to leave blank):  " WHEN

echo ""
echo "  Working. This takes a moment per photograph…"
echo ""

RESULT=$(python3 tools/add_album.py "$FOLDER" "$COUPLE" "$KIND" "$CITY" "$WHEN")

python3 - "$RESULT" <<'PY'
import json, sys
r = json.loads(sys.argv[1])
print("")
if "error" in r:
    print("  " + r["error"])
    print("  Nothing has been changed.")
else:
    print("  ─────────────────────────────────────────────")
    print(f"   Added {r['count']} photographs.")
    print(f"   {r['from_mb']:.0f} MB of originals became {r['to_mb']:.0f} MB on the site.")
    if r["failed"]:
        print(f"   {len(r['failed'])} could not be read: {', '.join(r['failed'][:4])}")
    print("  ─────────────────────────────────────────────")
    print("")
    print(f"   See it:  http://localhost:4173/album.html?w={r['slug']}")
    print("")
    print("   It is on your Mac now. To put it on the live site,")
    print("   double-click  Publish Changes.command")
PY
echo ""
read -r -p "  Press return to close. " _
