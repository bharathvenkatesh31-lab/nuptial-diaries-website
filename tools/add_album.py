#!/usr/bin/env python3
"""Build a new album from a folder of photographs."""
import json, os, re, sys, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from resize import process

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(SITE, "content/weddings.json")
EXT = (".jpg", ".jpeg", ".png", ".heic", ".tif", ".tiff")


def slugify(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = text.replace("&", " ").lower()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def run(source, couple, kind, city, date):
    photos = sorted(f for f in os.listdir(source)
                    if f.lower().endswith(EXT) and not f.startswith("."))
    if not photos:
        return {"error": "There are no photographs in that folder."}

    slug = slugify(couple) + ("-pre-wedding" if kind == "Pre-Wedding" else "")
    data = json.load(open(DATA))
    if any(w["slug"] == slug for w in data["weddings"]):
        return {"error": f'An album called "{slug}" already exists.'}

    folder = os.path.join(SITE, "images/weddings", slug)
    saved = written = 0
    names, failed = [], []
    for i, f in enumerate(photos, 1):
        name = f"{i:02d}.jpg"                       # numbered, so the order is the order
        ok, before, after = process(os.path.join(source, f), folder, name)
        if ok:
            names.append(name); saved += before; written += after
        else:
            failed.append(f)
        print(f"   {i}/{len(photos)}  {f}", flush=True)

    if not names:
        return {"error": "None of those photographs could be read."}

    # Paths start at the site root. Without the leading slash they resolve
    # against /admin/ inside the editor, where every thumbnail then 404s.
    album = {"slug": slug, "name": couple, "kind": kind, "city": city, "date": date,
             "excerpt": "", "story": "",
             "cover": f"/images/weddings/{slug}/{names[0]}",
             "photos": [f"/images/weddings/{slug}/{n}" for n in names]}
    data["weddings"].insert(0, album)                # newest first, as the grid reads
    json.dump(data, open(DATA, "w"), indent=2, ensure_ascii=False)
    return {"slug": slug, "count": len(names), "failed": failed,
            "from_mb": saved / 1048576, "to_mb": written / 1048576}


if __name__ == "__main__":
    print(json.dumps(run(*sys.argv[1:6])))
