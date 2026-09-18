/* ==========================================================================
   Builds the Photography grid and every album page from js/weddings.js.
   BHARATH: you should not need to touch this file — edit weddings.js instead.
   ========================================================================== */

/* Waits for js/content.js to fetch the wedding list, then draws. */
function renderAlbums() {
  const list = typeof WEDDINGS !== "undefined" ? WEDDINGS : null;

  /* Nothing should ever fail silently — say what went wrong, in plain words. */
  function problem(target, message) {
    if (!target) return;
    target.innerHTML =
      '<p class="load-error">' + message +
      ' <a href="index.html">Back to the home page</a></p>';
  }

  const esc = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* Photographs can be given two ways:
       photos: 28                     -> images/weddings/<slug>/01.jpg … 28.jpg
       photos: ["...", "..."]         -> exactly these addresses
     The number form is what makes eighty weddings possible: drop the files in a
     folder named after the wedding, number them, and write down how many. */
  const PHOTO_DIR = "images/weddings/";
  const EXT = ".jpg";

  function photosOf(w) {
    if (Array.isArray(w.photos)) return w.photos;
    const n = parseInt(w.photos, 10);
    if (!n || n < 1) return [];
    const out = [];
    for (let i = 1; i <= n; i++) {
      out.push(PHOTO_DIR + w.slug + "/" + String(i).padStart(2, "0") + EXT);
    }
    return out;
  }

  function coverOf(w) {
    if (w.cover) return w.cover;              // an explicit cover always wins
    const all = photosOf(w);
    return all.length ? all[0] : "";
  }

  /* Every photograph is saved twice: the display copy, and a small copy in a
     "thumb" folder beside it. Grids show the small one and only load the big
     one when a photograph is opened, so an album of eighty opens quickly. */
  function thumbOf(src) {
    return String(src).replace(/\/([^/]+)$/, "/thumb/$1");
  }

  /* ------------------------------------------------ the Photography grid */
  const grid = document.querySelector("[data-albums]");
  if (grid) {
    if (!list || !list.length) {
      problem(grid, "The wedding list could not be loaded.");
    } else {
      let html = '<div class="album-grid">';
      list.forEach((w) => {
        /* City and date are shown once Bharath has written them in; until then
           the line states the one thing we do know — how many photographs. */
        /* A couple can have two albums — the wedding and the pre-wedding shoot.
           Naming which is which is what keeps the pair apart on the grid. */
        const place = [w.kind, w.city, w.date].filter(Boolean).join(" \u00b7 ");
        const count = [w.kind, photosOf(w).length + " photographs"].filter(Boolean).join(" \u00b7 ");
        html +=
          '<a class="album-card" href="album.html?w=' + encodeURIComponent(w.slug) + '">' +
            '<span class="shot"><img src="' + esc(thumbOf(coverOf(w))) + '" alt="' + esc(w.name) +
              ', photographed by Nuptial Diaries" loading="lazy"></span>' +
            '<span class="cap">' +
              '<span class="nm">' + esc(w.name) + '</span>' +
              '<span class="wh">' + esc(place || count) + '</span>' +
              (w.excerpt ? '<span class="ex">' + esc(w.excerpt) + '</span>' : '') +
              '<span class="more">Read more<i aria-hidden="true"></i></span>' +
            '</span>' +
          '</a>';
      });
      html += "</div>";
      grid.innerHTML = html;

      /* Running totals in the intro. */
      const tally = document.querySelector("[data-tally]");
      if (tally) {
        const shots = list.reduce((n, w) => n + photosOf(w).length, 0);
        /* Pre-wedding shoots are counted separately — calling them weddings
           would inflate the number of weddings shown here. */
        const pre = list.filter((w) => w.kind === "Pre-Wedding").length;
        const parts = [(list.length - pre) + " weddings"];
        if (pre) parts.push(pre + " pre-wedding shoots");
        parts.push(shots + " photographs");
        tally.textContent = parts.join(" · ");
      }
    }
  }

  /* ------------------------------------------------------- an album page */
  const album = document.querySelector("[data-album]");
  if (album) {
    const slug = new URLSearchParams(location.search).get("w");
    const i = list ? list.findIndex((w) => w.slug === slug) : -1;

    if (!list || !list.length) {
      problem(album, "The wedding list could not be loaded.");
    } else if (!slug) {
      problem(album, "No wedding was chosen.");
    } else if (i === -1) {
      problem(album, "We could not find that wedding — it may have been renamed.");
    } else {
      const w = list[i];
      const prev = list[i - 1];
      const next = list[i + 1];
      document.title = w.name + " — Nuptial Diaries";

      const pics = photosOf(w);
      /* The small copy is what loads; data-full is what the viewer opens. */
      const shots = pics
        .map((src) =>
          '<figure data-lightbox><img src="' + esc(thumbOf(src)) +
          '" data-full="' + esc(src) +
          '" alt="Photograph from the wedding of ' + esc(w.name) +
          '" loading="lazy"></figure>')
        .join("");

      const side = (item, dir, cls) =>
        item
          ? '<a class="' + cls + '" href="album.html?w=' + encodeURIComponent(item.slug) + '">' +
            '<span class="dir">' + dir + '</span><span class="ttl">' + esc(item.name) + "</span></a>"
          : '<span class="none ' + cls + '"><span class="dir">' + dir +
            '</span><span class="ttl">&mdash;</span></span>';

      /* Only the facts we actually have get printed. */
      const meta = [w.kind, w.city, w.date, pics.length + " photographs"]
        .filter(Boolean)
        .map((x) => "<span>" + esc(x) + "</span>")
        .join("");

      /* Where the couple wrote to Bharath, their own words open the album. */
      const words = w.story
        ? '<p class="album-story">' + esc(w.story) + "</p>"
        : w.quote
          ? '<blockquote class="album-story album-quote">&ldquo;' + esc(w.quote) +
            '&rdquo;<cite>' + esc(w.quoteBy || w.name) + "</cite></blockquote>"
          : "";

      album.innerHTML =
        '<div class="wrap-narrow reveal">' +
          '<p class="folio"><span class="no">No. ' + String(i + 1).padStart(2, "0") + "</span> A Wedding Diary</p>" +
          '<h1 class="album-title">' + esc(w.name) + "</h1>" +
          '<p class="album-meta">' + meta + "</p>" +
          words +
        "</div>" +
        '<div class="wrap" style="margin-top:clamp(2.5rem,6vw,4.5rem);">' +
          '<figure class="album-cover reveal" style="margin-top:0;">' +
            '<img src="' + esc(coverOf(w)) + '" alt="' + esc(w.name) + ', photographed by Nuptial Diaries">' +
          "</figure>" +
          '<div class="gallery reveal" style="margin-top:clamp(2rem,4vw,3rem);">' + shots + "</div>" +
          '<div class="album-nav" style="margin-top:clamp(2.5rem,5vw,4rem);">' +
            side(prev, "&#8592; Previous", "prev") + side(next, "Next &#8594;", "next") +
          "</div>" +
        "</div>";
    }
  }
}

if (window.CONTENT_READY) {
  window.CONTENT_READY.then(renderAlbums);
} else {
  renderAlbums();          // content.js absent — fall back to whatever is loaded
}
