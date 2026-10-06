#!/usr/bin/env python3
"""
Replaces the photographs in the wall on the front page.

Give it a folder; the photographs go up in the order the folder shows them,
left to right, with the white card sitting in the middle as it always does.
They are saved the same way the albums are - 2800 pixels on the long edge, in
sRGB - so Netlify can send each visitor the size their screen needs.

  python3 tools/home_wall.py ~/Desktop/Website/"Home Page"
"""

import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from import_folders import load_srgb, _resized, MASTER_EDGE, MASTER_Q, SMALL_EDGE, SMALL_Q, EXT

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "content", "site.json")
DEST = os.path.join(ROOT, "images", "site")


def main(source):
    source = os.path.expanduser(source)
    photos = sorted(f for f in os.listdir(source)
                    if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"))
                    and not f.startswith("."))
    if not photos:
        sys.exit(f"No photographs in {source}")

    data = json.load(open(SITE))
    was = data.get("wall", {}).get("photos", [])
    os.makedirs(os.path.join(DEST, "thumb"), exist_ok=True)

    out = []
    for i, f in enumerate(photos, 1):
        name = os.path.splitext(f)[0] + EXT
        im = load_srgb(os.path.join(source, f))
        for folder, edge, q in ((DEST, MASTER_EDGE, MASTER_Q),
                                (os.path.join(DEST, "thumb"), SMALL_EDGE, SMALL_Q)):
            _resized(im, edge).save(os.path.join(folder, name), "WEBP", quality=q, method=5)
        # Black and white is a look applied by the page, not baked into the
        # file, so it stays off until someone chooses it in the editor. Where a
        # photograph is already on the wall, how it was framed is kept.
        path = f"/images/site/{name}"
        before = next((p for p in was if p.get("image") == path), {})
        out.append({"image": path,
                    "blackAndWhite": before.get("blackAndWhite", False),
                    "focusX": before.get("focusX", 50),
                    "focusY": before.get("focusY", 50)})
        print(f"  {i:2}/{len(photos)}  {f}  ->  {name}", flush=True)

    data.setdefault("wall", {})["photos"] = out
    json.dump(data, open(SITE, "w"), indent=2, ensure_ascii=False)
    open(SITE, "a").write("\n")

    print(f"\nThe wall now holds {len(out)} photographs (it held {len(was)}).")
    still = {p["image"] for p in out}
    gone = [p["image"] for p in was if p["image"] not in still]
    if gone:
        print(f"{len(gone)} photographs are no longer on the wall; their files are left in place:")
        for g in gone:
            print("   " + g)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else sys.exit(__doc__))
