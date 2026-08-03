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

  instagram: "https://www.instagram.com/nuptial.diaries/",
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
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  items.forEach((el) => io.observe(el));
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
