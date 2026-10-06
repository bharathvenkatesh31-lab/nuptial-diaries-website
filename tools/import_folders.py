#!/usr/bin/env python3
"""
Imports a folder of albums into the website.

Expects a source folder holding two folders, "Wedding" and "Pre Wedding", each
holding one folder per album named like "01 - Amrit & Melissa". The numbers set
the order galleries appear in on the Photography page: 01 is the first a couple
sees, the last number sits at the bottom of the pile. Inside an album, the
photographs keep the order the folder shows them in.

Each photograph is saved as a master 2800 pixels on its long edge, which is
what a retina screen needs to show one full width without softening it, plus a
small copy used where a page names a photograph itself and when the site is run
off this Mac. Everywhere else the website asks Netlify for the exact size the
slot needs, so a visitor downloads around 60 KB for a grid picture rather than
the whole master.

Photographs are converted to sRGB first. A camera set to Display P3 writes
colours that a browser reads as duller than they are unless they are converted.

  python3 tools/import_folders.py --source ~/Desktop/Website
  python3 tools/import_folders.py --source ~/Desktop/Website --dry-run
"""

import argparse, io, json, os, re, shutil, sys, unicodedata
from collections import defaultdict, Counter
from multiprocessing import Pool, cpu_count

from PIL import Image, ImageCms, ImageOps

# 2800 covers the widest a photograph is ever drawn (1360 CSS pixels) on a
# retina screen, which is two device pixels for every one of those.
MASTER_EDGE, MASTER_Q = 2800, 90
SMALL_EDGE,  SMALL_Q  = 900,  86
EXT = ".webp"

# Changing any of these means every photograph has to be written again, so it
# is recorded next to them and compared on the next run.
RECIPE = f"webp m{MASTER_EDGE}q{MASTER_Q} s{SMALL_EDGE}q{SMALL_Q} srgb v2"

ROOT  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST  = os.path.join(ROOT, "images", "weddings")
JSON  = os.path.join(ROOT, "content", "weddings.json")

KINDS = [("Wedding", "Wedding"), ("Pre Wedding", "Pre-Wedding")]


# ---------------------------------------------------------------- names, slugs

def album_name(folder, kind):
    """'05 - Spandana & Nuthan PW' -> 'Spandana & Nuthan'."""
    n = re.sub(r"^\s*\d+\s*-\s*", "", folder).strip()
    n = re.sub(r"\bEngagemengt\b", "Engagement", n)          # his typo
    if kind == "Pre-Wedding":
        n = re.sub(r"\s+PW$", "", n).strip()
    else:
        # The folder says "Wedding" only to tell it from the same couple's
        # engagement album; the page already says which kind it is.
        n = re.sub(r"\s+Wedding$", "", n).strip()
    return n


def kebab(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"&", " ", s)
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower()
    return s


def couple_key(name):
    """A couple, regardless of which name he wrote first."""
    base = re.sub(r"\s+(Engagement)$", "", name, flags=re.I)
    parts = (p.strip() for p in re.split(r"[&,]| and ", base.lower()))
    return frozenset(p for p in parts if p)


def safe_filename(f):
    """'23 - Picsee-512.jpg' -> 'Picsee-512.jpg', and nothing a URL dislikes."""
    f = re.sub(r"^\s*\d+\s*-\s*", "", f)
    stem, _ = os.path.splitext(f)
    stem = re.sub(r"[^A-Za-z0-9._-]+", "-", stem).strip("-._") or "photo"
    return stem + EXT


# ------------------------------------------------------------------- the photos

def photos_in(album_dir):
    """
    The album's photographs, in the order the folder shows them.

    Where the same photograph sits in the folder twice - once as a small web
    copy with an order number, once as the camera original - it takes the
    numbered position, and the original is what gets read.
    """
    files = sorted(f for f in os.listdir(album_dir) if f.lower().endswith((".jpg", ".jpeg")))
    groups, order = defaultdict(list), []
    for f in files:
        key = safe_filename(f)
        if key not in groups:
            order.append(key)
        groups[key].append(f)
    out = []
    for key in order:
        best = max(groups[key], key=lambda f: os.path.getsize(os.path.join(album_dir, f)))
        out.append((key, os.path.join(album_dir, best)))
    return out


SRGB = ImageCms.createProfile("sRGB")


def load_srgb(path):
    """Opens a photograph upright, in sRGB, whatever the camera recorded."""
    with Image.open(path) as im:
        im.load()
        im = ImageOps.exif_transpose(im)
        icc = im.info.get("icc_profile")
        if icc:
            try:
                src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
                if "srgb" not in ImageCms.getProfileDescription(src).strip().lower():
                    im = ImageCms.profileToProfile(im, src, SRGB, outputMode="RGB")
            except Exception:
                pass                      # an unreadable profile is not worth losing the photograph over
        return im.convert("RGB")


def _resized(im, long_edge):
    w, h = im.size
    if max(w, h) <= long_edge:
        return im                         # never invent detail that was not photographed
    s = long_edge / max(w, h)
    return im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)


def job(args):
    src, out_master, out_small, done = args
    try:
        if done and os.path.exists(out_master) and os.path.exists(out_small):
            return (None, os.path.getsize(out_master) + os.path.getsize(out_small), "kept")

        im = load_srgb(src)
        total = 0
        for dst, edge, q in ((out_master, MASTER_EDGE, MASTER_Q), (out_small, SMALL_EDGE, SMALL_Q)):
            tmp = dst + ".tmp"
            _resized(im, edge).save(tmp, "WEBP", quality=q, method=5)
            os.replace(tmp, dst)
            total += os.path.getsize(dst)
        return (None, total, "written")
    except Exception as e:                # a single bad file must not stop the import
        return (f"{src}: {type(e).__name__}: {e}", 0, "failed")


# ------------------------------------------------------------------------ build

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--jobs", type=int, default=max(2, min(8, cpu_count())))
    args = ap.parse_args()
    source = os.path.expanduser(args.source)

    old = {w["slug"]: w for w in json.load(open(JSON))["weddings"]}
    # Which slug a couple already lives at, so links already on the site keep working.
    by_couple = {(w.get("kind", "Wedding"), couple_key(w["name"])): w["slug"] for w in old.values()}

    albums, taken = [], set()
    for folder_name, kind in KINDS:
        base = os.path.join(source, folder_name)
        if not os.path.isdir(base):
            sys.exit(f"Could not find {base}")
        subs = sorted(
            (d for d in os.listdir(base) if os.path.isdir(os.path.join(base, d))),
            key=lambda d: (int(m.group(1)) if (m := re.match(r"\s*(\d+)", d)) else 9999, d),
        )
        for d in subs:
            name = album_name(d, kind)
            pics = photos_in(os.path.join(base, d))
            if not pics:
                print(f"  ! {folder_name}/{d} holds no photographs - skipped")
                continue
            slug = by_couple.get((kind, couple_key(name))) or kebab(name)
            if slug in taken:
                slug = f"{slug}-pre-wedding" if kind == "Pre-Wedding" else f"{slug}-{len(taken)}"
            taken.add(slug)
            albums.append(dict(slug=slug, name=name, kind=kind, folder=f"{folder_name}/{d}", pics=pics))

    print(f"{len(albums)} albums, {sum(len(a['pics']) for a in albums)} photographs")
    dupes = [s for s, n in Counter(a["slug"] for a in albums).items() if n > 1]
    assert not dupes, f"duplicate slugs: {dupes}"

    # Pre-wedding shoots join their wedding album when the names match exactly.
    wed_names = {a["name"] for a in albums if a["kind"] == "Wedding"}
    paired = sum(1 for a in albums if a["kind"] == "Pre-Wedding" and a["name"] in wed_names)
    print(f"{paired} pre-wedding shoots pair with a wedding, "
          f"{sum(1 for a in albums if a['kind']=='Pre-Wedding') - paired} stand alone")

    if args.dry_run:
        for a in albums:
            print(f"  {a['kind']:11} {a['slug']:34} {a['name']:32} {len(a['pics']):3} <- {a['folder']}")
        return

    # What was built last time, and with which recipe, so a second run only
    # does the photographs that actually changed.
    index_path = os.path.join(DEST, ".build.json")
    try:
        built = json.load(open(index_path))
    except (OSError, ValueError):
        built = {}

    tasks, entries, fresh = [], [], {}
    for a in albums:
        d = os.path.join(DEST, a["slug"])
        os.makedirs(os.path.join(d, "thumb"), exist_ok=True)
        rel = []
        for out_name, src in a["pics"]:
            key = f"{a['slug']}/{out_name}"
            stamp = [os.path.getsize(src), int(os.path.getmtime(src)), RECIPE]
            fresh[key] = stamp
            tasks.append((src, os.path.join(d, out_name), os.path.join(d, "thumb", out_name),
                          built.get(key) == stamp))
            rel.append(f"/images/weddings/{a['slug']}/{out_name}")

        prev = old.get(a["slug"], {})
        keep = [p for p in (prev.get("previews") or []) if p in rel][:2]
        # A cover chosen by hand stays chosen, as long as that photograph is
        # still in the album; otherwise the first photograph opens it.
        cover = prev.get("cover") if prev.get("cover") in rel else rel[0]
        entries.append({
            "slug": a["slug"], "name": a["name"],
            "city": prev.get("city", ""), "date": prev.get("date", ""),
            "events": prev.get("events") or ("Engagement" if a["name"].endswith("Engagement") else ""),
            "excerpt": prev.get("excerpt", ""), "story": prev.get("story", ""),
            "pull": prev.get("pull", ""), "kind": a["kind"],
            "cover": cover,
            "previews": keep if len(keep) == 2 else rel[1:3],
            "photos": rel,
        })

    print(f"Writing {len(tasks)} photographs with {args.jobs} workers ...")
    total, errs, how = 0, [], Counter()
    with Pool(args.jobs) as pool:
        for i, (err, nb, kind_done) in enumerate(pool.imap_unordered(job, tasks, chunksize=4), 1):
            total += nb
            how[kind_done] += 1
            if err:
                errs.append(err)
            if i % 200 == 0 or i == len(tasks):
                print(f"  {i}/{len(tasks)}   {total/1e6:,.0f} MB so far")

    json.dump({"weddings": entries}, open(JSON, "w"), indent=2, ensure_ascii=False)
    open(JSON, "a").write("\n")
    json.dump(fresh, open(index_path, "w"))

    print(f"\n{dict(how)}")
    print(f"content/weddings.json: {len(entries)} albums, {sum(len(e['photos']) for e in entries)} photographs")
    print(f"images written: {total/1e6:,.0f} MB")

    # Where the folder held a web copy rather than the original, nothing can
    # make that photograph sharp again. Say so by name, rather than let it sit
    # on the site looking soft for no visible reason.
    print("\nSharpness, measured from what was actually built:")
    limited = []
    for e in entries:
        edges = []
        for rp in e["photos"]:
            try:
                with Image.open(os.path.join(ROOT, rp.lstrip("/"))) as im:
                    edges.append(max(im.size))
            except OSError:
                pass
        if not edges:
            continue
        soft = sum(1 for x in edges if x < 1400)
        if soft:
            limited.append((e["name"], e["kind"], soft, len(edges)))
    full = len(entries) - len(limited)
    print(f"  {full} albums are at full resolution ({MASTER_EDGE}px)")
    if limited:
        print(f"  {len(limited)} albums are limited by their source files "
              f"({sum(l[2] for l in limited)} photographs are web copies, not originals):")
        for name, kind, soft, n in limited:
            print(f"      {soft:3}/{n:3}  {name} ({kind})")
        print("  Replacing those folders with the camera originals is the only way")
        print("  to make them sharp. Nothing else here will change them.")
    if errs:
        print(f"\n{len(errs)} FAILED:")
        for e in errs[:20]:
            print("  " + e)
        sys.exit(1)


if __name__ == "__main__":
    main()
