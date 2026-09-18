#!/usr/bin/env python3
"""Shrink photographs that are genuinely too big for the web.

Only looks at images/uploads — where Album Studio puts what you upload. The
photographs brought over from WordPress, and the ones chosen for the pages, are
already the right size and are left alone.

Two rules learned the hard way:

  * Only touch a file that is actually oversized. An earlier version resized
    anything over 1800px and re-encoded 37 photographs that were perfectly
    fine, costing a generation of quality for no gain.
  * Never keep a result that is bigger than what went in. Re-compressing an
    already-compressed JPEG can inflate it — one file grew instead of shrinking.
"""
import os, subprocess, sys, shutil, tempfile

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOLDER = os.path.join(SITE, "images/uploads")

TOO_WIDE_PX = 2600          # a camera file; anything under this is web-sized already
TOO_HEAVY_BYTES = 1_500_000
TARGET_EDGE, TARGET_Q = 2200, 76


def dimensions(path):
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", path],
                         capture_output=True, text=True).stdout
    v = [int(l.split(":")[1]) for l in out.splitlines() if "pixel" in l]
    return (v[0], v[1]) if len(v) == 2 else (0, 0)


def tidy():
    fixed, skipped, saved = [], 0, 0
    if not os.path.isdir(FOLDER):
        return fixed, skipped, saved
    for f in sorted(os.listdir(FOLDER)):
        if not f.lower().endswith((".jpg", ".jpeg", ".png")) or f.startswith("."):
            continue
        path = os.path.join(FOLDER, f)
        before = os.path.getsize(path)
        w, h = dimensions(path)
        if not w or (max(w, h) <= TOO_WIDE_PX and before <= TOO_HEAVY_BYTES):
            continue
        tmp = os.path.join(tempfile.gettempdir(), "nd_" + f)
        r = subprocess.run(["sips", "-Z", str(TARGET_EDGE), "-s", "format", "jpeg",
                            "-s", "formatOptions", str(TARGET_Q), path, "--out", tmp],
                           capture_output=True)
        if r.returncode != 0 or not os.path.exists(tmp):
            continue
        after = os.path.getsize(tmp)
        if after >= before:                     # no gain — leave the original alone
            os.remove(tmp); skipped += 1
            continue
        shutil.move(tmp, path)
        saved += before - after
        fixed.append((f, w, h, before, after))
    return fixed, skipped, saved


if __name__ == "__main__":
    fixed, skipped, saved = tidy()
    if not fixed and not skipped:
        print("  Nothing needed shrinking — every uploaded photograph is a sensible size.")
    for name, w, h, b, a in fixed:
        print(f"  {name}\n      {w}x{h}  {b/1024:.0f} KB  ->  {a/1024:.0f} KB")
    if fixed:
        print(f"\n  {len(fixed)} shrunk, {saved/1048576:.1f} MB saved.")
    if skipped:
        print(f"  {skipped} left alone — shrinking them would not have helped.")
