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
          '<img src="' + String(p.image).replace(/"/g, "&quot;") +
          '" alt="Wedding photograph by Nuptial Diaries" loading="lazy"></figure>'
        );
      });
      if (s.wall.photos.length <= TILE_AT) cells.push(tileHtml(s.wall));
      wall.innerHTML = cells.join("");
    }

    return s;
  });

  function tileHtml(w) {
    return '<h2 class="mosaic-tile">' +
      '<span class="no">' + gold(w.tileNumber || "") + "</span>" +
      '<span class="line">' + gold(w.tileLine || "") + "</span>" +
      '<span class="rule"></span></h2>';
  }

  /* ------------------------------------------------------------- weddings */
  const needsWeddings =
    document.querySelector("[data-albums]") || document.querySelector("[data-album]");

  const weddings = needsWeddings
    ? get("content/weddings.json").then((d) => (window.WEDDINGS = d.weddings || []))
    : Promise.resolve([]);

  /* Everything else waits for these, so nothing renders half-built. */
  window.CONTENT_READY = Promise.all([site, weddings]).catch((e) => {
    fail("Some of the site's content could not be loaded. " + e.message);
    window.WEDDINGS = window.WEDDINGS || [];
  });
})();
