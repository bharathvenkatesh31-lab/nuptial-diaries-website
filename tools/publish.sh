#!/bin/bash
# Send whatever has changed on this Mac to the live site.
cd "$(dirname "$0")/.." || exit 1

if [ -z "$(git status --porcelain)" ] && [ -z "$(git log origin/main..HEAD --oneline 2>/dev/null)" ]; then
  echo "  Nothing has changed — the live site is already up to date."
  exit 0
fi

# Album Studio saves straight to GitHub, so anything edited in the browser has
# to come down before this Mac's work goes up, or one overwrites the other.
echo "  Checking for changes made in Album Studio…"
git fetch -q origin

if [ -n "$(git status --porcelain)" ]; then
  COUNT=$(git status --porcelain | wc -l | tr -d ' ')
  git add -A
  git commit -q -m "${1:-Update the website from the Mac}

$COUNT files changed.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
  echo "  Saved $COUNT changed files."
fi

BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
if [ "$BEHIND" -gt 0 ]; then
  echo "  Bringing down $BEHIND change(s) made in Album Studio…"
  if ! git rebase -q origin/main; then
    git rebase --abort 2>/dev/null
    echo ""
    echo "  ⚠  The same thing was changed here and in Album Studio."
    echo "     Nothing has been sent. Ask Claude to sort it out —"
    echo "     no work has been lost on either side."
    exit 1
  fi
fi

echo "  Sending to the live site…"
if git push -q origin main 2>/dev/null; then
  echo ""
  echo "  Done. The live site updates in about a minute:"
  echo "    https://nuptialdiaries.netlify.app"
else
  echo ""
  echo "  ⚠  Could not send. Nothing has been lost — everything is saved on this Mac."
  exit 1
fi
