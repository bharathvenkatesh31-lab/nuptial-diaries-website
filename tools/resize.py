#!/usr/bin/env python3
"""Turn a photograph straight off the camera into the two sizes the site uses.

There is one recipe for every photograph on this website, and it lives in
tools/import_folders.py. This file just hands single photographs to it, so an
album added one folder at a time comes out identical to one built by
"Rebuild All Albums" — same size, same quality, same colour handling.

  master  - 2800px on the long edge, what a photograph is stored as
  small   - 900px, used where a page names a photograph itself and when the
            site is run off this Mac
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from import_folders import load_srgb, _resized, MASTER_EDGE, MASTER_Q, SMALL_EDGE, SMALL_Q, EXT


def web_name(stem):
    """The name a photograph is saved under, whatever it arrived as."""
    return os.path.splitext(str(stem))[0] + EXT


def process(src, folder, name):
    """Write both sizes for one photograph. Returns (ok, bytes_before, bytes_after)."""
    before = os.path.getsize(src)
    name = web_name(name)
    big = os.path.join(folder, name)
    small = os.path.join(folder, "thumb", name)
    try:
        im = load_srgb(src)
        for dest, edge, q in ((big, MASTER_EDGE, MASTER_Q), (small, SMALL_EDGE, SMALL_Q)):
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            _resized(im, edge).save(dest, "WEBP", quality=q, method=5)
    except Exception as e:
        print(f"   {os.path.basename(src)}: {type(e).__name__}: {e}", file=sys.stderr)
        return False, before, 0
    after = os.path.getsize(big) + os.path.getsize(small)
    return True, before, after


if __name__ == "__main__":
    ok, b, a = process(sys.argv[1], sys.argv[2], sys.argv[3])
    print("ok" if ok else "failed", b, a)
