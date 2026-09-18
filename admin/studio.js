/* ==========================================================================
   Album Studio — cover photographs on the album rows

   Decap's list rows can only show text, so a collapsed album reads
   "Rachita & Akash · Wedding" and nothing more. Laid out as a grid that would
   be worse than a list. This puts each album's own cover behind its row.

   The label is built from the summary in config.yml — "{{fields.name}} ·
   {{fields.kind}}" — so matching a row to its album is exact rather than
   guesswork. If this script fails, the rows simply stay plain: the editor
   does not depend on it.
   ========================================================================== */
(function () {
  var covers = null;

  function load() {
    fetch("/content/weddings.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        covers = {};
        (d.weddings || []).forEach(function (w) {
          var label = (w.name || "") + (w.kind ? " · " + w.kind : "");
          if (w.cover) covers[label.trim()] = w.cover;
        });
        paint();
      })
      .catch(function () { /* rows stay plain */ });
  }

  /* An album row is a list item that is not inside another list item — the
     ones nested inside are the photographs. */
  function albumRows() {
    return [].slice.call(document.querySelectorAll('[class*="-ListItem"]'))
      .filter(function (el) {
        var p = el.parentElement;
        return !(p && p.closest('[class*="-ListItem"]'));
      });
  }

  function paint() {
    albumRows().forEach(function (row) {
      /* An open album and a closed one are identical in the page — same
         classes, same attributes — and differ only in whether their fields
         are visible, which a stylesheet cannot ask about. So it is marked
         here, and the stylesheet lets an open album go full width. */
      var control = row.querySelector('[class*="ControlContainer"]');
      if (control && control.offsetParent) row.setAttribute("data-open", "");
      else row.removeAttribute("data-open");

      if (!covers) return;
      var label = row.querySelector('[class*="NestedObjectLabel"]');
      if (!label) return;
      var src = covers[label.textContent.trim()];
      if (!src) { row.removeAttribute("data-cover"); return; }
      if (row.getAttribute("data-cover") === src) return;   /* already done */
      row.setAttribute("data-cover", src);
      row.style.setProperty("--cover", 'url("' + src + '")');
    });
  }

  /* Rows come and go as albums are opened, closed, reordered and searched. */
  function watch() {
    var root = document.getElementById("nc-root") || document.body;
    new MutationObserver(function () {
      clearTimeout(watch.t);
      watch.t = setTimeout(paint, 120);
    }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });

    /* Opening an album may change nothing the observer is watching, so a
       click is treated as a reason to look again. */
    root.addEventListener("click", function () { setTimeout(paint, 150); }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { load(); watch(); });
  } else {
    load(); watch();
  }
})();
