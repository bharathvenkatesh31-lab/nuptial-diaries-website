#!/usr/bin/env python3
"""
A small tool for putting an album's photographs in the order you want them.

It runs on this Mac only, serves one page, and writes straight into
content/weddings.json. Nothing goes to the website until you publish.

  python3 tools/arrange.py          then open http://localhost:8787
"""

import json, os, posixpath, re, sys, threading, webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "content", "weddings.json")
PAGE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "arrange.html")
PORT = 8787

TYPES = {".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
         ".json": "application/json", ".webp": "image/webp", ".jpg": "image/jpeg",
         ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml",
         ".woff2": "font/woff2", ".ico": "image/x-icon"}

lock = threading.Lock()


def albums():
    return json.load(open(DATA))["weddings"]


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass                                   # the page says what happened; the terminal need not

    def send_json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    # ----------------------------------------------------------------- read
    def do_GET(self):
        url = urlparse(self.path)
        path = url.path

        if path in ("/", "/index.html"):
            return self.send_file(PAGE)

        if path == "/api/albums":
            return self.send_json([
                {"slug": w["slug"], "name": w["name"], "kind": w.get("kind", ""),
                 "count": len(w.get("photos", [])), "cover": w.get("cover", "")}
                for w in albums()
            ])

        if path == "/api/album":
            slug = (parse_qs(url.query).get("slug") or [""])[0]
            w = next((x for x in albums() if x["slug"] == slug), None)
            if not w:
                return self.send_json({"error": "No album called " + slug}, 404)
            return self.send_json({
                "slug": w["slug"], "name": w["name"], "kind": w.get("kind", ""),
                "photos": w.get("photos", []), "cover": w.get("cover", ""),
                "previews": w.get("previews") or [],
            })

        # anything else is a file from the website itself - the photographs
        safe = posixpath.normpath(path).lstrip("/")
        full = os.path.join(ROOT, safe)
        if not os.path.abspath(full).startswith(ROOT) or not os.path.isfile(full):
            return self.send_error(404)
        return self.send_file(full)

    def send_file(self, full):
        ext = os.path.splitext(full)[1].lower()
        with open(full, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", TYPES.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    # ---------------------------------------------------------------- write
    def do_POST(self):
        if urlparse(self.path).path != "/api/album":
            return self.send_error(404)
        try:
            n = int(self.headers.get("Content-Length", 0))
            sent = json.loads(self.rfile.read(n) or b"{}")
        except Exception as e:
            return self.send_json({"error": "That did not arrive as readable data: %s" % e}, 400)

        with lock:
            data = json.load(open(DATA))
            w = next((x for x in data["weddings"] if x["slug"] == sent.get("slug")), None)
            if not w:
                return self.send_json({"error": "No album called %s" % sent.get("slug")}, 404)

            photos = sent.get("photos") or []
            cover = sent.get("cover") or ""
            previews = sent.get("previews") or []

            # The order may change; which photographs are in the album may not.
            # Anything else means something went wrong, and saving it would
            # quietly lose pictures.
            if sorted(photos) != sorted(w.get("photos", [])):
                missing = len(set(w.get("photos", [])) - set(photos))
                return self.send_json({"error":
                    "This would change which photographs are in the album (%d would be lost). "
                    "Nothing has been saved." % missing}, 400)
            # A cover, and the two small photographs beside it, do not have to come
            # from inside the album — one uploaded through Album Studio is a
            # perfectly good choice. All that matters is that the file is really
            # there, so the page cannot end up pointing at nothing.
            def here(path):
                full = os.path.normpath(os.path.join(ROOT, path.lstrip("/")))
                return full.startswith(ROOT) and os.path.isfile(full)

            if cover and not here(cover):
                return self.send_json({"error":
                    "That cover is not a photograph on this site: %s" % cover}, 400)
            missing = [p for p in previews if not here(p)]
            if missing:
                return self.send_json({"error":
                    "These are not photographs on this site: %s" % ", ".join(missing)}, 400)
            if len(previews) not in (0, 2):
                return self.send_json({"error": "Pick exactly two small photographs, or none at all."}, 400)

            w["photos"] = photos
            w["cover"] = cover or photos[0]
            w["previews"] = previews

            tmp = DATA + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")
            os.replace(tmp, DATA)

        return self.send_json({"ok": True, "name": w["name"], "count": len(photos),
                               "cover": w["cover"], "previews": w["previews"]})


if __name__ == "__main__":
    if not os.path.isfile(PAGE):
        sys.exit("tools/arrange.html is missing.")
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print("Arranging photographs at http://localhost:%d  (close this window to stop)" % PORT, flush=True)
    if "--open" in sys.argv:
        threading.Timer(1.0, lambda: webbrowser.open("http://localhost:%d" % PORT)).start()
    server.serve_forever()
