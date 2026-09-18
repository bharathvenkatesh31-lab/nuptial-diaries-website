/* ==========================================================================
   Nuptial Diaries — site behaviour
   --------------------------------------------------------------------------
   BHARATH: everything you'd normally want to change lives in SITE below.
   Edit those values once and they update across every page.
   ========================================================================== */

const SITE = {
  // ---- CHANGE THESE FOUR ----------------------------------------------
  // WhatsApp number in international format: 91 = India, then the 10 digits.
  // No plus sign, no spaces. Example: "919876543210"
  whatsapp: "919876543210",
  phoneDisplay: "+91 98765 43210",   // how the number is shown on the page
  email: "hello@nuptialdiaries.in",
  city: "Bangalore, India",
  // ---------------------------------------------------------------------

  instagram: "https://www.instagram.com/nuptialdiariesstudio/",
  facebook:  "https://www.facebook.com/profile.php?id=100076185429717",
  youtube:   "https://youtube.com/@nuptialdairies3567",
  pinterest: "https://pin.it/5DtgCrv0K"
};

/* ---------------------------------------------------------------- helpers */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* --------------------------------------------------- fill contact details */
function applySiteDetails() {
  /* Anything set in the editor (content/site.json) wins over the values in
     this file, which are only a fallback if that file cannot be read. */
  const live = Object.assign({}, SITE, window.SITE_CONTENT || {});

  $$("[data-site]").forEach((el) => {
    const key = el.dataset.site;
    const value = live[key];
    if (!value) return;

    if (key === "email") {
      el.textContent = value;
      if (el.tagName === "A") el.href = "mailto:" + value;
    } else if (key === "phoneDisplay") {
      el.textContent = value;
      if (el.tagName === "A") el.href = "tel:+" + SITE.whatsapp;
    } else if (key === "whatsapp") {
      el.href = "https://wa.me/" + value;
    } else {
      el.textContent = value;
    }
  });

  $$("[data-social]").forEach((el) => {
    const url = live[el.dataset.social];
    if (url) el.href = url;
  });

  const year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
}

/* ------------------------------------------------------------ header/menu */
function initHeader() {
  const header = $(".site-header");
  if (!header) return;

  // Pages without a hero keep a solid header at all times.
  const overHero = header.classList.contains("over-hero");

  if (overHero) {
    const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  } else {
    header.classList.add("is-static");
  }

  const toggle = $(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    $$(".nav a").forEach((a) =>
      a.addEventListener("click", () => {
        document.body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }
}

/* ---------------------------------------------------------- scroll reveal */
function initReveal() {
  const items = $$(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    /* threshold must stay at 0: a section taller than the window can never be
       "12% visible", so any fraction here would leave long pages — the album
       grid, above all — permanently blank. The negative bottom margin is what
       holds the reveal back until the section has properly entered the view. */
    { threshold: 0, rootMargin: "0px 0px -12% 0px" }
  );

  items.forEach((el) => io.observe(el));
}

/* ------------------------------------------ the contact sheet as a roll */
/* Deals the frames into two rows that run in opposite directions, endlessly.
   Left untouched — a plain five-column grid — if motion is unwanted or if this
   never runs, which is why the grid, not the roll, is the CSS default. */
function initRoll() {
  const sheet = $(".frames");
  if (!sheet || sheet.classList.contains("is-gate")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const frames = $$(".frame", sheet);
  if (frames.length < 4) return;

  /* The beat of the thing. One frame is brought up to size and looked at,
     then the roll moves on. */
  const GROW = 1200;      /* the frame coming up to full size */
  const HOLD = 1000;      /* how long it stays there */
  const SHRINK = 450;     /* settling back into the strip */
  const ADVANCE = 1000;   /* the roll pulling the next frame into the gate */
  const SWAP = 420;       /* the strip re-parting around a frame under the pointer */

  const count = frames.length;
  sheet.classList.add("is-gate");
  sheet.textContent = "";

  const window_ = document.createElement("div");
  window_.className = "gate-window";
  const track = document.createElement("div");
  track.className = "gate-track";

  /* Three sets: one either side of the set being shown, so the gate always has
     frames arriving from the right and leaving to the left, never a bare edge. */
  for (let set = 0; set < 3; set++) {
    frames.forEach((el) => {
      const node = set === 1 ? el : el.cloneNode(true);
      if (set !== 1) {
        node.setAttribute("aria-hidden", "true");
        node.setAttribute("tabindex", "-1");
      }
      /* Every frame gets its turn at full size, so the frames marked by hand as
         picks — ringed and ticked — no longer mean anything here. */
      node.classList.remove("pick");
      const ring = node.querySelector(".ring");
      if (ring) ring.remove();
      const tick = node.querySelector(".tick");
      if (tick) tick.remove();
      track.appendChild(node);
    });
  }

  window_.appendChild(track);
  sheet.appendChild(window_);

  const kids = Array.prototype.slice.call(track.children);
  let index = count;            /* start in the middle set */
  let timer = null;
  let paused = false;
  let restoreX = null;    /* where the track sat before a pointer took the gate */

  /* How far the strip parts on each side of the frame in the gate. This mirrors
     the margin the stylesheet puts on .in-gate; it has to be worked out rather
     than read back, because the moment the class goes on, the margin is still
     animating from nothing and the layout would report the old position. */
  function partWidth(box) {
    const cs = getComputedStyle(track);
    const big = parseFloat(cs.getPropertyValue("--big")) || 1;
    const gap = parseFloat(cs.columnGap) || 0;
    return ((big - 1) * box.offsetWidth) / 2 - gap + 6;
  }

  /* Where the track must sit for frame i to be centred in the gate. Growing the
     frame widens its own left margin, pushing it along the strip, so that shift
     is taken off the track by the same amount, over the same time and with the
     same easing. The two cancel and the frame appears to stay perfectly still
     while its neighbours move aside. */
  function xFor(i, opened) {
    const box = kids[i];
    const gateLeft = Math.round((window_.clientWidth - box.offsetWidth) / 2);
    return gateLeft - box.offsetLeft - (opened ? partWidth(box) : 0);
  }

  let trackX = 0;

  /* Where the track actually is, which during a transition is not where it is
     heading. A pointer can arrive mid-slide, and compensating from the target
     would hand back the rest of that slide all at once. */
  function liveX() {
    const m = getComputedStyle(track).transform;
    if (!m || m === "none") return trackX;
    const parts = m.slice(m.indexOf("(") + 1, -1).split(",");
    const v = parseFloat(parts[parts.length - 2]);
    return isNaN(v) ? trackX : v;
  }

  function slide(x, ms) {
    trackX = x;
    track.style.transitionDuration = (ms || 0) + "ms";
    track.style.transform = "translate3d(" + Math.round(x) + "px, 0, 0)";
  }

  function place(i, ms) {
    slide(xFor(i, kids[i].classList.contains("in-gate")), ms);
  }

  /* Two different things want to decide which frame is enlarged: the running
     order, and the pointer. cycleGate is what the order wants; gateEl is what
     is actually enlarged. The pointer wins while it is over the strip. */
  let cycleGate = null;
  let gateEl = null;

  function showGate(el) {
    if (gateEl === el) return;
    if (gateEl) gateEl.classList.remove("in-gate");
    gateEl = el;
    if (el) el.classList.add("in-gate");
  }

  function mark(i, on) {
    cycleGate = on ? kids[i] : null;
    if (restoreX === null) showGate(cycleGate);   /* only if no pointer in charge */
  }

  function after(ms, fn) {
    timer = setTimeout(function () {
      if (paused) { timer = setTimeout(function () { after(0, fn); }, 200); return; }
      fn();
    }, ms);
  }

  /* bring it up to size -> hold -> let it settle -> pull the next one in */
  function cycle() {
    /* Both targets are worked out before the class changes anything. */
    const opened = xFor(index, true);
    const closed = xFor(index, false);

    mark(index, true);
    slide(opened, GROW);           /* hold it centred as the strip parts */
    after(GROW + HOLD, function () {
      mark(index, false);
      slide(closed, SHRINK);       /* and as the strip closes back up */
      after(SHRINK, function () {
        index += 1;
        /* Back to the middle set once a full pass is done. The frames either
           side are identical, so the jump cannot be seen. */
        if (index >= count * 2) {
          place(index, ADVANCE);
          after(ADVANCE, function () {
            index = count;
            place(index, 0);
            cycle();
          });
          return;
        }
        place(index, ADVANCE);
        after(ADVANCE, cycle);
      });
    });
  }

  function reset() { place(index, 0); }

  window.addEventListener("resize", reset, { passive: true });
  $$("img", sheet).forEach(function (img) {
    if (!img.complete) img.addEventListener("load", reset, { once: true });
  });

  /* ---------------------------------------------------------------- hover
     A pointer outranks the running order: whichever frame is under it takes
     the gate, wherever it sits on the strip, and the order resumes from where
     it left off once the pointer leaves. */
  function giveGate(el) {
    if (!el || el === gateEl) return;

    /* Moving the gate moves the parting with it, which shifts the strip, so the
       track is nudged the other way by the same amount over the same time —
       leaving the frame under the pointer exactly where the pointer found it.

       The margins in play are read as they stand rather than assumed to be
       fully open: a pointer often arrives while a frame is still growing, and
       taking the finished width on trust threw the strip sideways by 87px. */
    const part = partWidth(el);
    const openNow = parseFloat(getComputedStyle(el).marginLeft) || 0;
    let shift = -(part - openNow);            /* this frame's own margin opening */

    if (gateEl) {
      const from = kids.indexOf(gateEl);
      const to = kids.indexOf(el);
      /* Only a frame earlier in the strip drags this one along as it closes. */
      if (from < to) {
        shift += 2 * (parseFloat(getComputedStyle(gateEl).marginLeft) || 0);
      }
    }

    if (restoreX === null) restoreX = trackX;   /* the order's own position */
    const base = liveX();                       /* but move from where it is */
    track.style.setProperty("--swap", SWAP + "ms");
    showGate(el);
    slide(base + shift, SWAP);
  }

  function releaseGate() {
    if (restoreX === null) return;          /* the pointer never took over */
    showGate(cycleGate);
    slide(restoreX, SWAP);
    restoreX = null;
    setTimeout(function () {
      if (restoreX === null) track.style.removeProperty("--swap");
    }, SWAP + 40);
  }

  kids.forEach(function (el) {
    el.addEventListener("mouseenter", function () { giveGate(el); });
  });

  /* Hold everything while someone is reading a frame, so it can be clicked. */
  window_.addEventListener("mouseenter", function () { paused = true; });
  window_.addEventListener("mouseleave", function () { paused = false; releaseGate(); });
  window_.addEventListener("focusin", function () { paused = true; });
  window_.addEventListener("focusout", function () { paused = false; releaseGate(); });

  place(index, 0);
  after(600, cycle);
}

/* ------------------------------------------------- slow drift on the photos */
/* Marked-up as data-drift="<rate>" on the frame. A positive rate rises as you
   scroll down, a negative one sinks, so a pair given opposite rates pulls gently
   apart. The frames already clip their contents, which is what makes this work. */
function initDrift() {
  const frames = $$("[data-drift]");
  if (!frames.length) return;

  /* Anyone who has asked their device for less motion gets none of this. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const items = frames
    .map((el) => ({ el, img: $("img", el), rate: parseFloat(el.dataset.drift) || 0, room: 0 }))
    .filter((it) => it.img && it.rate);
  if (!items.length) return;

  /* How far each photograph may move is not guessed — it is measured. The photo
     is scaled up slightly, so it overhangs its frame; half of that overhang,
     top and bottom, is the whole travel available. Nine tenths of it is used,
     leaving a margin so a frame can never show an edge at any screen size. */
  function measure() {
    items.forEach((it) => {
      const frame = it.el.getBoundingClientRect().height;
      const photo = it.img.getBoundingClientRect().height;   /* scale included */
      it.room = Math.max(0, (photo - frame) / 2) * 0.9;
    });
  }

  let ticking = false;

  function place() {
    ticking = false;
    const mid = window.innerHeight / 2;
    items.forEach(({ el, img, rate, room }) => {
      const box = el.getBoundingClientRect();
      if (box.bottom < -200 || box.top > window.innerHeight + 200) return;  /* off-screen */

      /* -1 while the frame is still below the fold, +1 once it has risen past. */
      const progress = (mid - (box.top + box.height / 2)) / (mid + box.height / 2);
      const clamped = Math.max(-1, Math.min(1, progress));
      img.style.setProperty("--drift", (clamped * room * rate).toFixed(2) + "px");
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(place);
  }

  function onResize() {
    measure();
    onScroll();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  /* Photographs arrive after the HTML does; re-measure once each has loaded,
     or the travel would be worked out from a frame that was still empty. */
  items.forEach((it) => {
    if (!it.img.complete) it.img.addEventListener("load", onResize, { once: true });
  });

  measure();
  place();
}

/* -------------------------------------------------------------- lightbox */
function initLightbox() {
  const figures = $$("[data-lightbox]");
  if (!figures.length) return;

  const box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Photograph viewer");
  box.innerHTML = `
    <button class="lb-btn lb-close" aria-label="Close">Close</button>
    <button class="lb-btn lb-prev" aria-label="Previous photograph">&#8249;</button>
    <img alt="">
    <button class="lb-btn lb-next" aria-label="Next photograph">&#8250;</button>
    <span class="lb-count"></span>`;
  document.body.appendChild(box);

  const img   = $("img", box);
  const count = $(".lb-count", box);
  let index = 0;

  const visible = () => figures.filter((f) => f.offsetParent !== null);

  function show(i) {
    const list = visible();
    if (!list.length) return;
    index = (i + list.length) % list.length;
    const source = $("img", list[index]);
    img.src = source.dataset.full || source.src;
    img.alt = source.alt || "Wedding photograph by Nuptial Diaries";
    count.textContent = `${index + 1} / ${list.length}`;
  }

  function open(fig) {
    show(visible().indexOf(fig));
    box.classList.add("is-open");
    document.body.classList.add("lb-open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    box.classList.remove("is-open");
    document.body.classList.remove("lb-open");
    document.body.style.overflow = "";
  }

  figures.forEach((fig) => fig.addEventListener("click", () => open(fig)));
  $(".lb-close", box).addEventListener("click", close);
  $(".lb-prev", box).addEventListener("click", () => show(index - 1));
  $(".lb-next", box).addEventListener("click", () => show(index + 1));
  box.addEventListener("click", (e) => { if (e.target === box) close(); });

  document.addEventListener("keydown", (e) => {
    if (!box.classList.contains("is-open")) return;
    if (e.key === "Escape")     close();
    if (e.key === "ArrowLeft")  show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
}

/* ------------------------------------------------ horizontal film strips */
function initReels() {
  $$(".reels").forEach(setUpStrip);
}

/* Each strip owns its own arrows and rail, found within its own block, so a
   page can carry several of them without them driving each other. */
function setUpStrip(strip) {
  const block = strip.closest(".strip-block") || document;
  const prev = $(".reel-prev", block);
  const next = $(".reel-next", block);
  const rail = $(".reel-rail i", block);
  const first = $(".reel", strip);
  if (!first) return;

  /* One film plus its gap — the distance a single press should travel. */
  const step = () =>
    first.getBoundingClientRect().width + parseFloat(getComputedStyle(strip).gap || 0);

  function update() {
    const max = strip.scrollWidth - strip.clientWidth;
    if (prev) prev.disabled = strip.scrollLeft <= 2;
    if (next) next.disabled = strip.scrollLeft >= max - 2;

    if (rail) {
      const visible = Math.min(1, strip.clientWidth / strip.scrollWidth);
      const progress = max > 0 ? strip.scrollLeft / max : 0;
      rail.style.width = visible * 100 + "%";
      rail.style.left = progress * (100 - visible * 100) + "%";
    }
  }

  const go = (dir) => strip.scrollBy({ left: dir * step(), behavior: "smooth" });

  if (prev) prev.addEventListener("click", () => go(-1));
  if (next) next.addEventListener("click", () => go(1));

  strip.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);

  /* Arrow keys move the strip once it has focus. */
  strip.setAttribute("tabindex", "0");
  strip.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); go(-1); }
  });

  update();
}

/* ------------------------------------------------------ testimonial slider */
function initQuotes() {
  const slider = $(".quote-slider");
  if (!slider) return;

  const quotes = $$(".quote", slider);
  const dotsBar = $(".quote-dots");
  if (quotes.length < 2) return;

  let current = 0;
  let timer;

  quotes.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Show testimonial ${i + 1}`);
    dot.addEventListener("click", () => { go(i); restart(); });
    dotsBar.appendChild(dot);
  });

  const dots = $$("button", dotsBar);

  function go(i) {
    current = (i + quotes.length) % quotes.length;
    quotes.forEach((q, n) => q.classList.toggle("is-active", n === current));
    dots.forEach((d, n) => d.classList.toggle("is-active", n === current));
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(() => go(current + 1), 6500);
  }

  go(0);
  restart();
}

/* ---------------------------------------------------- film poster → embed */
function initFilms() {
  // Only posters that have a YouTube ID play in place; the rest keep their normal link.
  $$("[data-video]").filter((el) => el.dataset.video.trim()).forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const id = el.dataset.video;
      const wrap = document.createElement("div");
      wrap.className = "embed-wrap";
      wrap.innerHTML =
        `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0"
                 title="Wedding film by Nuptial Diaries"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 allowfullscreen></iframe>`;
      el.replaceWith(wrap);
    });
  });
}

/* ------------------------------------------------------------ enquiry form */
function initEnquiryForm() {
  const form = $("#enquiry-form");
  if (!form) return;

  const status = $("#form-status");

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.add("is-visible");
    status.classList.toggle("is-error", Boolean(isError));
    status.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function fieldError(input, message) {
    const field = input.closest(".field");
    field.classList.toggle("has-error", Boolean(message));
    $(".err", field).textContent = message || "";
  }

  // Clear a field's error as soon as the person starts fixing it.
  $$("input, select, textarea", form).forEach((input) =>
    input.addEventListener("input", () => fieldError(input, ""))
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = {};
    let firstBad = null;

    $$("input, select, textarea", form).forEach((input) => {
      data[input.name] = input.value.trim();

      let problem = "";
      if (input.required && !input.value.trim()) {
        problem = "Please fill this in.";
      } else if (input.type === "email" && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        problem = "That email address doesn't look right.";
      } else if (input.name === "phone" && input.value && input.value.replace(/\D/g, "").length < 10) {
        problem = "Please enter a full phone number.";
      }

      fieldError(input, problem);
      if (problem && !firstBad) firstBad = input;
    });

    if (firstBad) {
      firstBad.focus();
      setStatus("A couple of details are missing — they're marked in red just above.", true);
      return;
    }

    const message = [
      "New enquiry from the Nuptial Diaries website",
      "",
      `Name: ${data.name}`,
      `Phone: ${data.phone}`,
      `Email: ${data.email}`,
      `Wedding date: ${data.date || "Not decided yet"}`,
      `Location: ${data.location || "Not mentioned"}`,
      `Looking for: ${data.service || "Not mentioned"}`,
      "",
      `About us: ${data.message || "—"}`
    ].join("\n");

    const live = Object.assign({}, SITE, window.SITE_CONTENT || {});
    const url = `https://wa.me/${live.whatsapp}?text=${encodeURIComponent(message)}`;
    const opened = window.open(url, "_blank", "noopener");

    if (opened) {
      setStatus(
        `Thank you, ${data.name.split(" ")[0]} — your enquiry is ready in WhatsApp in a new tab. ` +
        `Press send there and it reaches us straight away. If the tab didn't open, write to ${SITE.email}.`,
        false
      );
      form.reset();
    } else {
      const mail =
        `mailto:${live.email}?subject=${encodeURIComponent("Wedding enquiry — " + data.name)}` +
        `&body=${encodeURIComponent(message)}`;
      window.location.href = mail;
      setStatus(
        `Your browser blocked the WhatsApp tab, so we've opened your email app instead. ` +
        `If nothing happened, please write to ${live.email} or call ${live.phoneDisplay}.`,
        true
      );
    }
  });
}

/* ------------------------------------------------------------------- boot */
function startUp() {
  applySiteDetails();
  initHeader();
  initReveal();
  initDrift();
  initRoll();
  initLightbox();
  initReels();
  initQuotes();
  initFilms();
  initEnquiryForm();
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.CONTENT_READY) {
    window.CONTENT_READY.then(startUp);
  } else {
    startUp();
  }
});
