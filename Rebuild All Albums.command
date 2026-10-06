#!/bin/bash
# Double-click this to rebuild every album on the website from one folder.
#
# The folder must hold two folders, "Wedding" and "Pre Wedding", and inside each
# one folder per album named like "01 - Amrit & Melissa". The numbers set the
# order on the Photography page: 01 is the first a couple sees.
cd "$(dirname "$0")" || exit 1
clear
echo ""
echo "  ─────────────────────────────────────────────"
echo "   Rebuild every album from a folder"
echo "  ─────────────────────────────────────────────"
echo ""
echo "  This replaces the whole Photography page with what is in the folder."
echo "  Photographs are resized for the web automatically — put them in"
echo "  straight off the camera."
echo ""

# A folder dragged into Terminal arrives quoted or backslash-escaped.
read -r -p "  1. Drag the folder here, then press return:  " FOLDER
FOLDER="${FOLDER%\"}"; FOLDER="${FOLDER#\"}"
FOLDER="${FOLDER%\'}"; FOLDER="${FOLDER#\'}"
FOLDER="$(printf '%s' "$FOLDER" | sed 's/\\ / /g')"
FOLDER="${FOLDER%/}"

if [ ! -d "$FOLDER/Wedding" ] || [ ! -d "$FOLDER/Pre Wedding" ]; then
  echo ""
  echo "  That folder needs a \"Wedding\" folder and a \"Pre Wedding\" folder"
  echo "  inside it. Nothing has been changed."
  echo ""
  read -r -p "  Press return to close. " _; exit 1
fi

echo ""
echo "  2. Here is what I found:"
echo ""
python3 tools/import_folders.py --source "$FOLDER" --dry-run || {
  echo ""; read -r -p "  Press return to close. " _; exit 1; }

echo ""
read -r -p "  3. Build these albums? Type yes to go ahead:  " OK
if [ "$OK" != "yes" ]; then
  echo ""; echo "  Nothing has been changed."; echo ""
  read -r -p "  Press return to close. " _; exit 0
fi

echo ""
python3 tools/import_folders.py --source "$FOLDER" || {
  echo ""; read -r -p "  Press return to close. " _; exit 1; }

echo ""
echo "  Tidying away photographs no longer in any album ..."
python3 tools/prune_unused.py --delete

echo ""
echo "  Done. Check the site with \"Edit Website.command\", then publish it"
echo "  with \"Publish Changes.command\"."
echo ""
read -r -p "  Press return to close. " _
