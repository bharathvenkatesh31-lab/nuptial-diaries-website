#!/usr/bin/env python3
"""
Turns photographs uploaded through Album Studio into web copies.

The editor's upload button puts the file in images/uploads exactly as it came
off the camera — fifteen megabytes, no small copy beside it. Every other
photograph on this website is 2800px WebP in sRGB with a small copy in a thumb
folder, and the pages and tools assume that, so an upload shows up as a hole
where a thumbnail should be.

This converts them the same way and repoints content/site.json and
content/weddings.json at the new files. The originals are left alone unless
--remove-originals is given.

  python3 tools/tidy_uploads.py                     # says what it would do
  python3 tools/tidy_uploads.py --go
  python3 tools/tidy_uploads.py --go --remove-originals
"""

import json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from import_folders import load_srgb, _resized, MASTER_EDGE, MASTER_Q, SMALL_EDGE, SMALL_Q, EXT

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOADS = os.path.join(ROOT, "images", "uploads")
FILES = [os.path.join(ROOT, "content", "site.json"),
         os.path.join(ROOT, "content", "weddings.json")]

go = "--go" in sys.argv
remove = "--remove-originals" in sys.argv


def referenced():
    """Every upload any content file points at, however it spells the path."""
    found = {}
    for f in FILES:
        text = open(f, encoding="utf-8").read()
        for ref in set(re.findall(r"/?images/uploads/[A-Za-z0-9._-]+\.(?:jpe?g|png|tiff?|webp)", text, re.I)):
            found.setdefault(os.path.basename(ref), set()).add(ref)
    return found


def main():
    refs = referenced()
    if not refs:
        print("Nothing in images/uploads is being used.")
        return

    os.makedirs(os.path.join(UPLOADS, "thumb"), exist_ok=True)
    done, saved = [], 0

    for name, spellings in sorted(refs.items()):
        src = os.path.join(UPLOADS, name)
        if not os.path.isfile(src):
            print(f"  ! {name} is referenced but not here — left alone")
            continue
        out = os.path.splitext(name)[0] + EXT
        before = os.path.getsize(src)

        if name == out and os.path.isfile(os.path.join(UPLOADS, "thumb", out)):
            continue                                   # already done
        if not go:
            print(f"  {before/1e6:6.1f} MB  {name}  ->  {out} (+ a small copy)")
            done.append((name, out, spellings, before, 0))
            continue

        im = load_srgb(src)
        for folder, edge, q in ((UPLOADS, MASTER_EDGE, MASTER_Q),
                                (os.path.join(UPLOADS, "thumb"), SMALL_EDGE, SMALL_Q)):
            _resized(im, edge).save(os.path.join(folder, out), "WEBP", quality=q, method=5)
        after = os.path.getsize(os.path.join(UPLOADS, out))
        saved += before - after
        done.append((name, out, spellings, before, after))
        print(f"  {before/1e6:6.1f} MB  ->  {after/1e6:5.2f} MB   {name}  ->  {out}")

    if not done:
        print("Every upload already has a web copy.")
        return
    if not go:
        print("\nNothing has been changed. Add --go to do it.")
        return

    # Repoint the content files, and give every path a leading slash so it
    # means the same thing on a page, in the editor, and in the resizer.
    for f in FILES:
        text = open(f, encoding="utf-8").read()
        for name, out, spellings, _, _ in done:
            for ref in spellings:
                text = text.replace('"%s"' % ref, '"/images/uploads/%s"' % out)
        open(f, "w", encoding="utf-8").write(text)

    print(f"\n{len(done)} photographs converted, {saved/1e6:,.0f} MB lighter.")
    print("content/site.json and content/weddings.json now point at them.")

    if remove:
        for name, out, _, _, _ in done:
            if name != out:
                os.remove(os.path.join(UPLOADS, name))
        print("The original uploads have been deleted.")
    else:
        leftover = sum(os.path.getsize(os.path.join(UPLOADS, n)) for n, o, _, _, _ in done if n != o)
        print(f"The originals are still in images/uploads ({leftover/1e6:,.0f} MB). "
              f"Add --remove-originals to delete them.")


if __name__ == "__main__":
    main()
