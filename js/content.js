/* ==========================================================================
   Reads content/site.json and content/weddings.json and puts them on the page.

   BHARATH: you never edit this file. It is what makes the /admin editor
   actually change the website.
   ========================================================================== */

(function () {
  /* A word wrapped in *stars* becomes gold italic. */
  function gold(text) {
    const safe = String(text || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return safe.replace(/\*(.+?)\*/g, "<em>$1</em>");
  }

  function fail(message) {
    console.warn("[content] " + message);
    const banner = document.createElement("p");
    banner.setAttribute("role", "status");
    banner.style.cssText =
      "position:fixed;left:0;right:0;bottom:0;z-index:999;margin:0;padding:.9rem 1.2rem;" +
      "background:#b4453c;color:#fff;font:300 14px/1.5 system-ui,sans-serif;text-align:center";
    banner.textContent = message;
    document.body.appendChild(banner);
  }

  /* ------------------------------------------------- photographs, right-sized */
  /* Every photograph is stored once, 2800 pixels on its long edge. Netlify
     resizes it on the way out, so a picture in a grid weighs around 60 KB
     rather than the whole master, and a retina screen gets twice the pixels
     of an ordinary one.

     Run off this Mac there is no Netlify, so the small copies on disk are
     used instead; and if a resize ever fails anywhere, the browser quietly
     falls back to those same files rather than showing a broken picture. */
  const NO_RESIZER =
    location.protocol === "file:" ||
    /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  function smallCopy(src) { return String(src).replace(/\/([^/]+)$/, "/thumb/$1"); }

  function sized(src, width, quality) {
    if (NO_RESIZER) return width <= 900 ? smallCopy(src) : src;
    return "/.netlify/images?url=" + encodeURIComponent(src) +
           "&w=" + Math.round(width) + "&q=" + quality;
  }
  function attr(v) { return String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;"); }

  /* Returns the img attributes for a photograph drawn `cssWidth` wide. */
  window.photoAttrs = function (src, cssWidth, quality) {
    if (!src) return "";
    const q = quality || 78;
    const one = sized(src, cssWidth, q);
    const two = sized(src, cssWidth * 2, q);
    return 'src="' + attr(one) + '" srcset="' + attr(one) + ' 1x, ' + attr(two) + ' 2x"' +
           ' data-fallback="' + attr(smallCopy(src)) + '"';
  };

  /* The full-size address, for when a photograph is opened in the viewer. */
  window.photoFull = function (src) { return sized(src, 2800, 86); };

  /* A picture that will not load falls back to the copy on disk. The error
     event does not bubble, so this listens on the way down. */
  document.addEventListener("error", function (e) {
    const img = e.target;
    if (img && img.tagName === "IMG" && img.dataset.fallback) {
      const back = img.dataset.fallback;
      delete img.dataset.fallback;
      img.removeAttribute("srcset");
      img.src = back;
    }
  }, true);

  const get = (url) =>
    fetch(url, { cache: "no-store" }).then((r) => {
      if (!r.ok) throw new Error(url + " could not be read (" + r.status + ")");
      return r.json();
    });

  /* ------------------------------------------------------------- settings */
  const site = get("content/site.json").then((s) => {
    window.SITE_CONTENT = s;

    const hero = document.querySelector(".hero");
    if (hero && s.hero) {
      const img = hero.querySelector(".hero-media img");
      if (img && s.hero.image) img.src = s.hero.image;
      const h1 = hero.querySelector("h1");
      if (h1 && s.hero.headline) h1.innerHTML = gold(s.hero.headline);
      const sub = hero.querySelector(".hero-inner p");
      if (sub && s.hero.subline) sub.textContent = s.hero.subline;
    }

    const st = document.querySelector(".statement");
    if (st && s.statement) {
      const l1 = st.querySelector(".l1 i");
      const l2 = st.querySelector(".l2 i");
      if (l1 && s.statement.line1) l1.innerHTML = gold(s.statement.line1);
      if (l2 && s.statement.line2) l2.innerHTML = gold(s.statement.line2);
      const left = st.querySelector(".st-left img");
      const right = st.querySelector(".st-right img");
      if (left && s.statement.leftImage) left.src = s.statement.leftImage;
      if (right && s.statement.rightImage) right.src = s.statement.rightImage;
      const body = st.querySelector(".st-text");
      if (body && s.statement.body) {
        body.innerHTML = s.statement.body
          .split(/\n{2,}/)
          .map((p) => "<p>" + gold(p.trim()) + "</p>")
          .join("");
      }
    }
    /* The photo wall. The white card is always the 8th cell so it lands in the
       middle of the five-across grid — the same rule as before, applied here. */
    const wall = document.querySelector(".mosaic");
    if (wall && s.wall && Array.isArray(s.wall.photos) && s.wall.photos.length) {
      const TILE_AT = 7;
      const cells = [];
      s.wall.photos.forEach((p, i) => {
        if (i === TILE_AT) cells.push(tileHtml(s.wall));
        cells.push(
          '<figure' + (p.blackAndWhite ? ' class="bw"' : "") + " data-lightbox>" +
          /* the wall loads an 800px thumbnail; the full photo opens in the viewer.
             A photo added in the editor has no thumbnail yet, so it falls back to the full one. */
          '<img src="' + esc(thumbPath(p.image)) + '" data-full="' + esc(p.image) +
          '" onerror="this.onerror=null;this.src=this.dataset.full"' +
          ' alt="Wedding photograph by Nuptial Diaries" loading="lazy"></figure>'
        );
      });
      if (s.wall.photos.length <= TILE_AT) cells.push(tileHtml(s.wall));
      wall.innerHTML = cells.join("");
    }

    return s;
  });

  function esc(v) { return String(v).replace(/"/g, "&quot;"); }
  function thumbPath(src) { return /^\/?images\/site\//.test(src) ? String(src).replace(/\/([^/]+)$/, "/thumb/$1") : src; }

  function tileHtml(w) {
    /* An empty number would still leave its bottom margin behind, so the span
       is left out altogether unless there is something to put in it. */
    return '<h2 class="mosaic-tile">' +
      (w.tileNumber ? '<span class="no">' + gold(w.tileNumber) + "</span>" : "") +
      '<span class="line">' + gold(w.tileLine || "") + "</span>" +
      '<span class="rule"></span></h2>';
  }

  /* ------------------------------------------------------------- weddings */
  const needsWeddings =
    document.querySelector("[data-albums]") ||
    document.querySelector("[data-album]") ||
    document.querySelector("[data-stat]");

  const weddings = needsWeddings
    ? get("content/weddings.json").then((d) => {
        window.WEDDINGS = d.weddings || [];
        fillStats(window.WEDDINGS);
        return window.WEDDINGS;
      })
    : Promise.resolve([]);

  /* The home page's first two figures are counted from the albums themselves,
     so they can never drift out of date as weddings are added. */
  /* Nuptial Diaries has been photographing weddings since 2013. Working the
     years out from that, rather than writing a number in, means the figure is
     still right every January without anyone remembering to change it. */
  const FIRST_YEAR = 2013;

  function fillStats(list) {
    const n = {
      years: new Date().getFullYear() - FIRST_YEAR,
      weddings: list.length,
      photographs: list.reduce(
        (t, w) => t + (Array.isArray(w.photos) ? w.photos.length : parseInt(w.photos, 10) || 0),
        0
      ),
    };
    document.querySelectorAll("[data-stat]").forEach((el) => {
      const v = n[el.getAttribute("data-stat")];
      if (typeof v === "number") el.textContent = v;
    });
  }

  /* Everything else waits for these, so nothing renders half-built. */
  window.CONTENT_READY = Promise.all([site, weddings]).catch((e) => {
    fail("Some of the site's content could not be loaded. " + e.message);
    window.WEDDINGS = window.WEDDINGS || [];
  });
})();
