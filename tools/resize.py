#!/usr/bin/env python3
"""Turn a photograph straight off the camera into the two sizes the site uses.

  display copy  - 1800px on the long edge, for when a photograph is opened
  thumbnail     - 800px, what a gallery or grid actually loads

A photograph already small enough is copied rather than re-encoded, because
re-compressing an already-compressed JPEG only loses quality and can make the
file bigger.
"""
import os, shutil, subprocess, sys

DISPLAY_EDGE, DISPLAY_Q = 1800, 70
THUMB_EDGE,   THUMB_Q   = 800, 62
COPY_IF_UNDER_BYTES     = 700_000


def dimensions(path):
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", path],
                         capture_output=True, text=True).stdout
    vals = [int(l.split(":")[1]) for l in out.splitlines() if "pixel" in l]
    return (vals[0], vals[1]) if len(vals) == 2 else (0, 0)


def make(src, dest, edge, quality, allow_copy):
    w, h = dimensions(src)
    if not w:
        return False
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if allow_copy and max(w, h) <= edge and os.path.getsize(src) <= COPY_IF_UNDER_BYTES:
        shutil.copy2(src, dest)
        return True
    r = subprocess.run(["sips", "-Z", str(edge), "-s", "format", "jpeg",
                        "-s", "formatOptions", str(quality), src, "--out", dest],
                       capture_output=True)
    return r.returncode == 0 and os.path.exists(dest)


def process(src, folder, name):
    """Write both sizes for one photograph. Returns (ok, bytes_before, bytes_after)."""
    before = os.path.getsize(src)
    big = os.path.join(folder, name)
    small = os.path.join(folder, "thumb", name)
    ok = make(src, big, DISPLAY_EDGE, DISPLAY_Q, allow_copy=True)
    ok = make(src, small, THUMB_EDGE, THUMB_Q, allow_copy=False) and ok
    after = (os.path.getsize(big) if os.path.exists(big) else 0) + \
            (os.path.getsize(small) if os.path.exists(small) else 0)
    return ok, before, after


if __name__ == "__main__":
    ok, b, a = process(sys.argv[1], sys.argv[2], sys.argv[3])
    print("ok" if ok else "failed", b, a)
