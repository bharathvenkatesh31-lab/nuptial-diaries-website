#!/bin/bash
# Double-click this to put the photographs in an album into the order you want.
cd "$(dirname "$0")" || exit 1
clear
echo ""
echo "  ─────────────────────────────────────────────"
echo "   Arrange the photographs in an album"
echo "  ─────────────────────────────────────────────"
echo ""
echo "  A page will open in your browser. Pick an album on the left, then"
echo "  drag the photographs into the order you want them. You can also set"
echo "  the cover and the two small pictures that sit under it."
echo ""
echo "  Changes are saved to this Mac when you press \"Save this album\"."
echo "  They reach the website when you run \"Publish Changes.command\"."
echo ""
echo "  Leave this window open while you work. Close it when you are done."
echo ""
python3 tools/arrange.py --open
