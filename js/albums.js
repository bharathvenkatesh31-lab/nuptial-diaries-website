/* ==========================================================================
   Builds the Photography page and every album page from content/weddings.json.
   BHARATH: you should not need to touch this file. Edit the albums in /admin instead;
   the order there is the order on the page, strongest first.
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

  /* How wide each photograph is actually drawn, so nothing is downloaded
     larger than the slot it goes into — or smaller, which is what made the
     grids look soft. These follow the layout: .wrap is 1360px, the wedding
     grid and an album's gallery are two columns of it, pre-wedding is four. */
  const DRAWN = { card: 650, pre: 330, mini: 320, tile: 665, cover: 1360 };

  /* Attributes for a photograph: the right size for this slot, twice that for
     a retina screen, and the copy on disk if a resize ever fails. */
  const pic = (src, width, q) =>
    typeof window.photoAttrs === "function"
      ? window.photoAttrs(src, width, q)
      : 'src="' + esc(String(src).replace(/\/([^/]+)$/, "/thumb/$1")) + '"';
  const full = (src) =>
    typeof window.photoFull === "function" ? window.photoFull(src) : src;

  /* ------------------------------------------------ the Photography grid */
  /* A pre-wedding shoot belongs to the couple's wedding when the names match.
     The wedding album then carries both, so a couple sees the whole story. */
  const isPre = (w) => w.kind === "Pre-Wedding";
  const preOf = (w) => list.find((p) => isPre(p) && p.name === w.name);

  /* Order on the page is the order in the editor: the strongest first. Only
     the first few weddings show until the visitor asks for the rest. */
  const FIRST_SHOWN = 8;

  function card(w, n, small) {
    const pre = !isPre(w) && preOf(w);
    const where = [w.city, w.events || w.date].filter(Boolean).join(" · ");
    /* Inside the pre-wedding section the heading already says what these are. */
    const what = small ? "" : pre ? "Wedding & pre-wedding shoot" : "Wedding";
    /* Two more moments under the cover, so the day shows without opening it. */
    const minis = !small && Array.isArray(w.previews) && w.previews.length >= 2
      ? '<span class="minis">' + w.previews.slice(0, 2).map((src) =>
          '<span><img ' + pic(src, DRAWN.mini) + ' alt="" loading="lazy"></span>').join("") + "</span>"
      : "";
    const line = where || what;
    return (
      '<a class="wcard' + (small ? " small" : "") + '" href="album.html?w=' + encodeURIComponent(w.slug) + '">' +
        '<span class="shot"><img ' + pic(coverOf(w), small ? DRAWN.pre : DRAWN.card) +
          ' alt="' + esc(w.name) + ', photographed by Nuptial Diaries" loading="lazy"></span>' +
        minis +
        '<span class="cap">' +
          (small ? "" : '<span class="no">No. ' + String(n).padStart(2, "0") + "</span>") +
          '<span class="nm">' + esc(w.name) + "</span>" +
          (line ? '<span class="wh">' + esc(line) + "</span>" : "") +
          (w.excerpt ? '<span class="ex">' + esc(w.excerpt) + "</span>" : "") +
          (w.pull && !small ? '<span class="pull">&ldquo;' + esc(w.pull) + "&rdquo;</span>" : "") +
          '<span class="more">View the album<i aria-hidden="true"></i></span>' +
        "</span>" +
      "</a>"
    );
  }

  /* After a few weddings, a quiet invitation: the moment a couple has seen
     enough is the moment to make it easy to ask. */
  const ASK_AFTER = 4;
  function ask() {
    const live = Object.assign({}, typeof SITE !== "undefined" ? SITE : {}, window.SITE_CONTENT || {});
    const digits = String(live.whatsapp || "").replace(/\D/g, "");
    const wa = digits
      ? '<a class="ask-wa" href="https://wa.me/' + digits + "?text=" +
        encodeURIComponent("Hi Nuptial Diaries! I'd like to check your availability for our wedding.") +
        '" target="_blank" rel="noopener">or message us on WhatsApp</a>'
      : "";
    return (
      '<div class="wask">' +
        '<p class="eyebrow">Picturing your own day?</p>' +
        '<p class="wask-line">Dates fill up quickly through wedding season. Tell us yours and we’ll come back to you personally.</p>' +
        '<a class="btn-gold" href="contact.html">Check your date<span class="arw" aria-hidden="true"></span></a>' +
        wa +
      "</div>"
    );
  }

  const grid = document.querySelector("[data-albums]");
  if (grid) {
    if (!list || !list.length) {
      problem(grid, "The wedding list could not be loaded.");
    } else {
      const weds = list.filter((w) => !isPre(w));
      const pres = list.filter(isPre);
      let html =
        '<div class="wrap"><div class="wgrid">' +
        weds.map((w, i) =>
          card(w, i + 1).replace('class="wcard', 'class="wcard' + (i >= FIRST_SHOWN ? " later" : "")) +
          (i === ASK_AFTER - 1 && weds.length > ASK_AFTER ? ask() : "")
        ).join("") +
        "</div>";
      if (weds.length > FIRST_SHOWN) {
        html += '<div class="center wmore"><button class="btn-line" type="button" data-show-all>' +
          "See all the weddings</button></div>";
      }
      html += "</div>";
      if (pres.length) {
        html +=
          '<div class="wrap pre-block">' +
            '<p class="folio"><span class="no">No. 02</span> Before The Wedding</p>' +
            '<h2 class="display-s">Pre-wedding shoots</h2>' +
            '<p class="body-copy pre-intro">A relaxed day with just the two of you, somewhere that means something.</p>' +
            '<div class="wgrid pre">' +
              pres.map((w, i) =>
                card(w, 0, true).replace('class="wcard', 'class="wcard' + (i >= FIRST_SHOWN ? " later" : ""))
              ).join("") +
            "</div>" +
            (pres.length > FIRST_SHOWN
              ? '<div class="center wmore"><button class="btn-line" type="button" data-show-all>' +
                "See all the pre-wedding shoots</button></div>"
              : "") +
          "</div>";
      }
      grid.innerHTML = html;

      /* Weddings and pre-wedding shoots each open on their own, so asking to
         see all of one does not quietly unfold the other. */
      grid.querySelectorAll("[data-show-all]").forEach((more) => {
        more.addEventListener("click", () => {
          const row = more.closest(".wmore");
          const cards = row && row.previousElementSibling;
          if (cards) cards.querySelectorAll(".wcard.later").forEach((c) => c.classList.remove("later"));
          if (row) row.remove();
        });
      });
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
      const same = list.filter((x) => (x.kind === "Pre-Wedding") === (list[i].kind === "Pre-Wedding"));
      const j = same.indexOf(list[i]);
      const prev = same[j - 1];
      const next = same[j + 1];
      document.title = w.name + " — Nuptial Diaries";

      const pics = photosOf(w);
      /* The cover is already shown full width above the grid, so the grid
         starts after it — the same photograph twice reads like a mistake. */
      const tiles = pics.filter((src) => src !== coverOf(w));
      /* The small copy is what loads; data-full is what the viewer opens. */
      const shotHtml = (src) =>
          '<figure data-lightbox><img ' + pic(src, DRAWN.tile) +
          ' data-full="' + esc(full(src)) +
          '" alt="Photograph from the wedding of ' + esc(w.name) +
          '" loading="lazy"></figure>';
      /* Halfway through a long album, a quiet invitation: it is the moment a
         couple is most sure they want this for their own wedding. */
      const half = tiles.length > 12 ? Math.ceil(tiles.length / 2) : tiles.length;
      const shotsA = tiles.slice(0, half).map(shotHtml).join("");
      const shotsB = tiles.slice(half).map(shotHtml).join("");
      const live = Object.assign({}, typeof SITE !== "undefined" ? SITE : {}, window.SITE_CONTENT || {});
      const digits = String(live.whatsapp || "").replace(/\D/g, "");
      const midAsk = shotsB
        ? '<div class="wask album-ask reveal">' +
            '<p class="eyebrow">Picturing your own day?</p>' +
            '<p class="wask-line">Dates fill up quickly through wedding season. Tell us yours and we\u2019ll come back to you personally.</p>' +
            '<a class="btn-gold" href="contact.html">Check your date<span class="arw" aria-hidden="true"></span></a>' +
            (digits ? '<a class="ask-wa" href="https://wa.me/' + digits + "?text=" + encodeURIComponent("Hi Nuptial Diaries! I saw " + w.name + "\u2019s album and I\u2019d like to check your availability for our wedding.") + '" target="_blank" rel="noopener">or message us on WhatsApp</a>' : "") +
          "</div>"
        : "";

      const side = (item, dir, cls) =>
        item
          ? '<a class="' + cls + '" href="album.html?w=' + encodeURIComponent(item.slug) + '">' +
            '<span class="dir">' + dir + '</span><span class="ttl">' + esc(item.name) + "</span></a>"
          : '<span class="none ' + cls + '"><span class="dir">' + dir +
            '</span><span class="ttl">&mdash;</span></span>';

      /* Only the facts we actually have get printed. */
      const meta = [w.kind, w.city, w.events, w.date, pics.length + " photographs"]
        .filter(Boolean)
        .map((x) => "<span>" + esc(x) + "</span>")
        .join("");

      /* Where the couple wrote to Bharath, their own words open the album. */
      /* A long review would push the photographs off the first screen, so
         only its opening shows, with the rest a tap away. */
      function shortened(text) {
        const t = String(text).trim();
        if (t.length <= 220) return esc(t);
        const cut = t.slice(0, 200).replace(/\s+\S*$/, "");
        return esc(cut) + '<span class="rest" hidden>' + esc(t.slice(cut.length)) + "</span>" +
          '<button type="button" class="read-on" data-read-on>&hellip; read on</button>';
      }
      const words = w.story
        ? '<p class="album-story">' + shortened(w.story) + "</p>"
        : w.quote
          ? '<blockquote class="album-story album-quote">&ldquo;' + shortened(w.quote) +
            '&rdquo;<cite>' + esc(w.quoteBy || w.name) + "</cite></blockquote>"
          : "";

      const pre = w.kind !== "Pre-Wedding" && list.find((p) => p.kind === "Pre-Wedding" && p.name === w.name);
      const preShots = pre
        ? '<div class="pre-in-album reveal"><p class="folio"><span class="no">Before</span> The Pre-Wedding Shoot</p>' +
          '<div class="gallery">' + photosOf(pre).map((src) =>
            '<figure data-lightbox><img ' + pic(src, DRAWN.tile) + ' data-full="' + esc(full(src)) +
            '" alt="Pre-wedding photograph of ' + esc(w.name) + '" loading="lazy"></figure>').join("") +
          "</div></div>"
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
            '<img ' + pic(coverOf(w), DRAWN.cover, 84) + ' alt="' + esc(w.name) + ', photographed by Nuptial Diaries">' +
          "</figure>" +
          '<div class="gallery reveal" style="margin-top:clamp(2rem,4vw,3rem);">' + shotsA + "</div>" +
          midAsk +
          (shotsB ? '<div class="gallery reveal">' + shotsB + "</div>" : "") +
          preShots +
          '<div class="album-nav" style="margin-top:clamp(2.5rem,5vw,4rem);">' +
            side(prev, "&#8592; Previous", "prev") + side(next, "Next &#8594;", "next") +
          "</div>" +
        "</div>";

      const readOn = album.querySelector("[data-read-on]");
      if (readOn) {
        readOn.addEventListener("click", () => {
          readOn.previousElementSibling.hidden = false;
          readOn.remove();
        });
      }
    }
  }
}

if (window.CONTENT_READY) {
  window.CONTENT_READY.then(renderAlbums);
} else {
  renderAlbums();          // content.js absent — fall back to whatever is loaded
}
