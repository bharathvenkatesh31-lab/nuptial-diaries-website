/* ==========================================================================
   "Framing" — drag a photograph inside its tile, the way you would in Canva.

   The wall's tiles are square and most photographs are not, so part of every
   photograph is cut off. This shows the tile exactly as the website draws it
   and lets Bharath drag the photograph around inside it until the right part
   shows. What it saves is two numbers, 0 to 100, which become the picture's
   object-position on the page.

   The photograph it shows is the one the "Photograph" field above it is
   holding: the editor has already drawn that picture inside this same row, so
   this reads it from there rather than trying to guess which row it is in.
   ========================================================================== */
(function () {
  var FRAME = 230;                     // how big the square preview is, in pixels

  function clamp(n) { return Math.min(100, Math.max(0, n)); }

  function numbers(value) {
    var v = value && value.toJS ? value.toJS() : value;
    v = v || {};
    var x = Number(v.x), y = Number(v.y);
    return { x: isFinite(x) ? clamp(x) : 50, y: isFinite(y) ? clamp(y) : 50 };
  }

  CMS.registerWidget("framepicker", createClass({
    getInitialState: function () {
      return { src: "", natural: null, dragging: false };
    },

    componentDidMount: function () {
      this.findPhotograph();
      /* The photograph can be swapped in the field above at any time; checking
         now and then is simpler than watching the editor's own markup. */
      this._watch = setInterval(this.findPhotograph, 800);
    },

    componentWillUnmount: function () {
      clearInterval(this._watch);
      this.release();
    },

    /* The editor has already drawn this row's photograph; borrow it. */
    findPhotograph: function () {
      if (!this._root) return;
      var row = this._root.closest('[class*="ListItem"]');
      var img = row && row.querySelector("img");
      var src = img ? img.getAttribute("src") : "";
      if (src && src !== this.state.src) this.setState({ src: src, natural: null });
    },

    measure: function (e) {
      var img = e.target;
      this.setState({ natural: { w: img.naturalWidth, h: img.naturalHeight } });
    },

    /* How far the photograph can travel inside the tile, in pixels. A
       photograph wider than it is tall can only move sideways, and the other
       way round, so one of these is usually nought. */
    travel: function () {
      var n = this.state.natural;
      if (!n || !n.w || !n.h) return { x: 0, y: 0 };
      var scale = Math.max(FRAME / n.w, FRAME / n.h);
      return { x: n.w * scale - FRAME, y: n.h * scale - FRAME };
    },

    point: function (e) {
      var t = e.touches && e.touches[0];
      return { x: t ? t.clientX : e.clientX, y: t ? t.clientY : e.clientY };
    },

    grab: function (e) {
      if (this.props.isDisabled) return;
      e.preventDefault();
      var p = this.point(e);
      this._from = { at: p, was: numbers(this.props.value) };
      this.setState({ dragging: true });
      window.addEventListener("mousemove", this.move);
      window.addEventListener("touchmove", this.move, { passive: false });
      window.addEventListener("mouseup", this.release);
      window.addEventListener("touchend", this.release);
    },

    move: function (e) {
      if (!this._from) return;
      e.preventDefault();
      var p = this.point(e), room = this.travel(), was = this._from.was;
      /* Dragging the photograph to the right shows more of its left side. */
      var x = room.x > 0 ? was.x - ((p.x - this._from.at.x) / room.x) * 100 : was.x;
      var y = room.y > 0 ? was.y - ((p.y - this._from.at.y) / room.y) * 100 : was.y;
      this.props.onChange({ x: Math.round(clamp(x)), y: Math.round(clamp(y)) });
    },

    release: function () {
      this._from = null;
      if (this.state.dragging) this.setState({ dragging: false });
      window.removeEventListener("mousemove", this.move);
      window.removeEventListener("touchmove", this.move);
      window.removeEventListener("mouseup", this.release);
      window.removeEventListener("touchend", this.release);
    },

    /* Arrow keys for a nudge, which a mouse cannot do precisely. */
    nudge: function (e) {
      var step = e.shiftKey ? 10 : 2, v = numbers(this.props.value), moved = true;
      if (e.key === "ArrowLeft") v.x = clamp(v.x - step);
      else if (e.key === "ArrowRight") v.x = clamp(v.x + step);
      else if (e.key === "ArrowUp") v.y = clamp(v.y - step);
      else if (e.key === "ArrowDown") v.y = clamp(v.y + step);
      else moved = false;
      if (moved) { e.preventDefault(); this.props.onChange({ x: Math.round(v.x), y: Math.round(v.y) }); }
    },

    centre: function () { this.props.onChange({ x: 50, y: 50 }); },

    render: function () {
      var self = this, v = numbers(this.props.value), s = this.state, room = this.travel();
      var canMove = room.x > 1 || room.y > 1;

      var frame = h("div", {
        onMouseDown: this.grab,
        onTouchStart: this.grab,
        onKeyDown: this.nudge,
        tabIndex: 0,
        title: canMove ? "Drag the photograph to choose what shows" : "",
        style: {
          width: FRAME + "px", height: FRAME + "px", overflow: "hidden",
          borderRadius: "2px", background: "#eceae6", position: "relative",
          cursor: !canMove ? "default" : (s.dragging ? "grabbing" : "grab"),
          outline: "none", flex: "0 0 auto",
          boxShadow: s.dragging ? "0 0 0 2px #a98a57" : "0 0 0 1px rgba(0,0,0,.12)"
        }
      }, s.src
        ? h("img", {
            src: s.src, onLoad: this.measure, draggable: false, alt: "",
            style: {
              width: "100%", height: "100%", objectFit: "cover",
              objectPosition: v.x + "% " + v.y + "%",
              display: "block", pointerEvents: "none", userSelect: "none"
            }
          })
        : h("span", {
            style: { position: "absolute", inset: 0, display: "flex", alignItems: "center",
                     justifyContent: "center", fontSize: "12px", padding: "12px",
                     textAlign: "center", color: "#8a847c" }
          }, "Choose a photograph above, then drag it here."));

      var words = h("div", { style: { fontSize: "12px", lineHeight: 1.6, color: "#6d675f", maxWidth: "260px" } },
        h("p", { style: { margin: "0 0 .5rem" } },
          canMove
            ? "Drag the photograph to choose which part shows on the front page. Arrow keys nudge it; hold shift to move further."
            : (s.src ? "This photograph fits the tile exactly, so there is nothing to move."
                     : "The square is the tile as the website draws it.")),
        h("p", { style: { margin: "0 0 .6rem", color: "#8a847c" } },
          "Across " + v.x + " · Down " + v.y),
        h("button", {
          type: "button", onClick: this.centre,
          style: {
            border: "1px solid rgba(0,0,0,.18)", background: "#fff", borderRadius: "2px",
            padding: ".35rem .8rem", fontSize: "12px", cursor: "pointer", letterSpacing: ".04em"
          }
        }, "Centre it"));

      return h("div", {
        ref: function (n) { self._root = n; },
        className: this.props.classNameWrapper,
        style: { display: "flex", gap: "16px", alignItems: "flex-start",
                 padding: "10px 0", border: "0", background: "transparent", boxShadow: "none" }
      }, frame, words);
    }
  }));
})();
