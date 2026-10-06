#!/usr/bin/env python3
"""
Deletes photographs under images/weddings that no longer belong to any album.

Importing a fresh set of albums leaves the previous selection behind. Anything
still named in content/weddings.json is kept, and so is anything a page points
at by hand, so nothing on the website can break. Everything else is dead weight
in the repository and goes.

  python3 tools/prune_unused.py            # lists what it would delete
  python3 tools/prune_unused.py --delete
"""

import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(ROOT, "images", "weddings")

keep = set()


def note(path):
    """Keeps a photograph and its small copy."""
    p = path.lstrip("/")
    keep.add(p)
    keep.add(re.sub(r"/([^/]+)$", r"/thumb/\1", p))


for w in json.load(open(os.path.join(ROOT, "content", "weddings.json")))["weddings"]:
    for p in w.get("photos", []):
        note(p)
    for k in ("cover",):
        if w.get(k):
            note(w[k])
    for p in w.get("previews") or []:
        note(p)

# Photographs a page names itself - the home page, Kind Words, The Studio.
by_hand = set()
in_albums = set(keep)
for d, _, fs in os.walk(ROOT):
    if ".git" in d or "/images" in d or "/content" in d:
        continue
    for f in fs:
        if f.endswith((".html", ".js", ".css", ".json")):
            try:
                text = open(os.path.join(d, f), encoding="utf-8").read()
            except (UnicodeDecodeError, OSError):
                continue
            for m in re.findall(r"images/weddings/[A-Za-z0-9._/-]+?\.(?:jpe?g|webp|png)", text):
                if m not in in_albums:
                    by_hand.add(m)
                keep.add(m)

# The record of how the photographs were built belongs with them.
keep.add(os.path.join("images", "weddings", ".build.json"))

dead, freed = [], 0
for d, _, fs in os.walk(DEST):
    for f in fs:
        full = os.path.join(d, f)
        rel = os.path.relpath(full, ROOT)
        if rel not in keep:
            dead.append(rel)
            freed += os.path.getsize(full)

print(f"{len(keep):,} photographs kept ({len(by_hand)} of them named by a page directly)")
print(f"{len(dead):,} no longer used, {freed/1e6:,.0f} MB")

if "--delete" in sys.argv:
    for rel in dead:
        os.remove(os.path.join(ROOT, rel))
    for d, subs, fs in os.walk(DEST, topdown=False):
        if not os.listdir(d):
            os.rmdir(d)
    print("deleted")
else:
    for rel in dead[:25]:
        print("  " + rel)
    if len(dead) > 25:
        print(f"  ... and {len(dead)-25} more")
    print("\nNothing deleted. Add --delete to go ahead.")
