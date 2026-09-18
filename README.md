# Nuptial Diaries — new website

A complete, working website in the editorial style of House On The Clouds:
full-bleed black-and-white photographs, fine serif headlines, a gold accent, and a
film-grain texture over everything.

## How to look at it

Open the folder and **double-click `index.html`**. It opens in your browser. That's it —
nothing to install, no server to start.

Six pages, all linked together:

| File | Page |
|---|---|
| `index.html` | Home |
| `about.html` | The Studio |
| `portfolio.html` | Photography — the grid of wedding albums |
| `album.html` | The album page. **One file serves every wedding** |
| `js/weddings.js` | **The wedding list — the only file you edit to add work** |
| `films.html` | Films |
| `testimonials.html` | Kind Words |
| `contact.html` | Get In Touch (enquiry form) |

---

## Before you put this online — 3 things to fix

### 1. Your contact details (2 minutes)

Open `js/main.js`. The very top of the file looks like this:

```js
const SITE = {
  whatsapp: "919876543210",           // 91 = India, then your 10 digits. No + and no spaces.
  phoneDisplay: "+91 98765 43210",    // how the number is shown on the page
  email: "hello@nuptialdiaries.in",
  city: "Bangalore, India",
```

Those are placeholders — I didn't have your real ones. Change those four lines and every
page updates automatically. Your Instagram, Facebook, YouTube and Pinterest links are
already correct (taken from your current site).

**Why this matters:** the enquiry form on the contact page writes the couple's details into
a ready-made WhatsApp message and opens it for them. If the number is wrong, enquiries go
nowhere.

### 2. The testimonials

`testimonials.html` and the quotes on the home page are **written placeholders**, not real
reviews — I had no way to read your actual client feedback. They say things like
"Paste a real review from one of your couples here" so nobody mistakes them for genuine
reviews. Replace them with real words (and real names, with permission) before you go live.

### 3. The wedding films

`films.html` is a dark screening room with **three programmes**, each running sideways:

| | Shape | Why |
|---|---|---|
| **No. 01 Films** | Cinemascope, 2.39:1 | Full-length wedding films |
| **No. 02 Teasers** | Broadcast, 16:9 | The short cut released within a week |
| **No. 03 Reels** | Vertical, 9:16 | The crop they were actually cut in for Instagram |

Drag or swipe each strip, use its own two arrows, or press the left and right arrow keys.
Each strip has its own gold rail showing how far along it is, and the three move
independently. Right now every film links out to your YouTube channel.

The couple names on all three are placeholders — change each `<h3>` to the real name and
each `.meta` to the real length.

To make a film **play on the page instead of sending people away**, find its line:

```html
<a class="plate" data-video="" href="https://youtube.com/@nuptialdairies3567" ...>
```

and put the video's ID between the quotes:

```html
<a class="plate" data-video="dQw4w9WgXcQ" ...>
```

The ID is the bit after `watch?v=` in a YouTube link. The still is then replaced by the
playing film in place, and the title line underneath stays put. Any plate you leave empty
keeps working as a link to your channel, so you can do them one at a time.

---

## About the photographs

Every photograph on this site is **your own work, and the site now carries its own
copies**. Nothing is loaded from the old WordPress site any more, so you can take that
site down, rebuild it or change hosts without breaking anything here.

All 970 photographs were brought over from your 31 WordPress portfolio entries, which
merged into **26 weddings** (five couples had their album split across two entries).
They live in `images/weddings/<couple>/`.

Each photograph is saved twice:

- `images/weddings/<couple>/name.jpg` — up to 1800px, what opens when a photo is clicked
- `images/weddings/<couple>/thumb/name.jpg` — up to 800px, what the grids show

Grids load only the small copy, so an album of a hundred photographs still opens quickly.
Your full-resolution originals were not touched — they are still on WordPress, and several
are 10–16 MB, far too heavy to put on a web page.

The page backgrounds and banners live separately in `images/site/`.

---

## Other things worth knowing

- **The mosaic.** The home page's wall of 14 photographs is one grid with a white
  typographic tile set into the middle of it. The tile lands dead centre because it is the
  **eighth** item in the list — if you add or remove photos, keep it eighth or it will drift
  off centre. Click any photo to open it large.
- **Black and white frames.** Four photos in the mosaic carry `class="bw"`, which shows them
  in monochrome and returns them to colour on hover. Add or remove that class on any frame
  to change the rhythm of the wall.
## Editing the website

Double-click **`Edit Website.command`**. Two things open:

- **The editor** — `localhost:4173/admin/`
- **The website** — `localhost:4173/`

Press **Login** (there's no password — it's your own Mac). You get two sections:

**Site settings** — your WhatsApp number, phone, email, and the words and photographs on
the front page. Change the hero photograph by pressing *Choose different image*, and the
headline by typing in the box. To make a word gold, put stars around it:
`A Symphony of *Love* & Light`.

**Front page — the photo wall.** The big grid of photographs on the home page. Each row is
one photograph: press **Choose different image** to swap it, tick **Show in black and white**
to drain the colour out of it, and drag the rows to reorder. **+** adds a photograph, the
bin removes one. You can also change the number and the words on the white card.

> The white card always sits in the middle of the wall on its own — you don't place it.
> Fourteen photographs fills the grid exactly; more or fewer still works, it just makes the
> wall taller or shorter.

**Weddings** — every album. Press **+** to add one, fill in the couple, city, month, their
story, the cover, and then add photographs one by one. Drag the weddings to reorder them;
the top one shows first on the Photography page.

Press **Publish** when you're done, then look at `localhost:4173/` to see it.

Leave the black window open while you work, and close it when you're finished.

> This is running entirely on your Mac. Nothing is online and nothing can be seen by anyone
> else yet. When we move it to the real site, this same editor appears at
> `nuptialdiaries.in/admin` with a login, and works identically.

### Wedding albums — read this before you go live

The Photography page is now an **index of albums**. Each card opens that couple's own page,
which has their name, their story, and only their photographs, with Previous / Next links
running along the series.

**The five albums are scaffolding, not finished work.** Two things in them are not real:

1. **The names.** Every album is titled `[ Couple's Names ]` with `[ City ]` and
   `[ Month, Year ]` underneath, and the story paragraph is a bracketed instruction. Those
   brackets are deliberate — nobody could mistake them for a real couple. Replace them.
2. **The groupings.** I had no record of which photograph belongs to which wedding, so I
   grouped them by their camera filename series — all the `Picsee-` frames together, all the
   `RS-ND-` frames together, and so on. That is a decent guess and nothing more. **Check
   every album before publishing.** A photograph of the wrong couple sitting under someone's
   name is the one mistake this site could make that really matters.

**To add a wedding:** open `js/weddings.js`, copy one block, paste it at the **top** of the
list, and change the details. That's the whole job. The Photography grid, the album page,
the year headings, the counts and the Previous / Next links all rebuild themselves.

**To remove one:** delete its block from the same file.

You never create a new HTML page for a wedding. `album.html` serves all of them — the link
`album.html?w=riya-arjun` tells it which one to show. This matters at your volume: with
eighty weddings as separate files, inserting one in the middle would mean hand-editing the
Previous / Next links on both sides every single time, and sooner or later the chain breaks.

**One thing to keep right in that file:** **`slug`** must be unique and contain no spaces —
it becomes the web address. Everything else is free text.

The grid runs newest-first in whatever order the list is in, so a new wedding goes at the
top. The couples are shown four across on a desktop, three on a tablet and two on a phone,
each on its own block inside a white panel that lifts the whole grid off the page.

If the list ever has a mistake in it that stops it loading, the page says so in plain English
with a way back, rather than showing an empty screen.
- **The contact sheet.** Ten frames from a wedding, shown the way you'd actually review
  them. Three are ringed in gold as the selects, and those rings **draw themselves on** when
  the section scrolls into view. To change which frames are ringed, add or remove
  `class="frame pick"` on any frame — and update "Ten frames, three chosen" to match, or the
  line will contradict what's on screen.
- **The film cards.** The title is set large and centred across the photograph, with a gold
  rule and folio number above it. Swap `.sc-name` for the couple's name and `.sc-place` for
  the city as you publish films. **Keep names to two or three words** — they are set large
  on purpose, and a long one will shrink awkwardly to fit.
- **The album band.** A full-width photograph with the copy laid over the left side. If you
  swap the photo, pick one that is *dark on the left*, or the white text stops being readable.

### The look, and why it isn't a copy

The ivory ground, the Didone headlines, the serif body copy and the gold accent are the
shared language of high-end wedding studios — everyone in this bracket uses them. What
makes this site yours rather than anyone else's is a small set of rules, kept consistently:

- **Folio marks.** `No. 01`, `No. 02`, `No. 03` in gold italic head every section, and each
  film card carries its own. Your studio is called *Diaries* — so the site is numbered like
  one. Add new sections in sequence.
- **Sentences, not slogans.** Headlines are complete sentences in sentence case, with one
  word in gold italic. The genre standard is a two-word ALL-CAPS slogan; avoiding that is
  most of what keeps this from looking like a template.
- **Your mark above the title, not your name.** On the film cards a gold `No. 01` sits over
  the title. The genre convention is to put the studio's own name in that slot; the folio
  is ours and does the same job without borrowing theirs.
- **Mounted plates.** Big photographs are inset with a margin and given a caption line
  underneath ("Plate II · Wedding Films"), like a plate tipped into a book, instead of
  bleeding edge-to-edge with a shaped cut.
- **Ruled links, not filled buttons.** Section calls-to-action are serif text on a gold
  rule with a small arrow. The only filled gold button on the site is *Get In Touch*.

If you add a section later, follow those five rules and it will sit with the rest.
- **The numbers.** The home page shows "200+ weddings, 25+ cities, 8 years, 100%". Those are
  reasonable-sounding figures, not verified ones. Correct them to your real numbers.
- **The services line.** Under the opening statement there's a row reading
  "Photography — Films — Albums — Pre-Wedding — Destination". House On The Clouds puts press
  logos (Vogue, Cosmopolitan, Hello!) in that spot. If you're ever featured anywhere, that's
  the place for it. I used services instead because I can't verify any press mentions for you.
- **Everything is editable.** All the text sits in plain HTML files. Nothing is generated,
  nothing is hidden, nothing needs a build step.
- **If a change doesn't show up.** Browsers hold on to old copies of the styling and script
  files. Every page asks for them as `style.css?v=1` and `main.js?v=1`. If you edit those two
  files and the site looks unchanged, change every `?v=1` to `?v=2` and it will refresh for
  everyone. (You never need to do this for text or photograph changes.)
- **The ivory colour.** The warm background behind "A Quiet Lens" is one line at the top of
  `css/style.css`: `--ivory: #f8f3e6;`. Change that value and both the statement section and
  the band under the photo wall update together. A higher last pair of digits makes it
  paler (`#faf7ee`), a lower pair makes it richer and more like parchment (`#f2ead6`).

---

## Putting it online

### Step 1 — See it on a real web address first (10 minutes, nothing at risk)

Go to **app.netlify.com/drop** and drag this whole folder onto the page. You get a live link
like `nuptial-diaries.netlify.app` in about ten seconds. Nothing about nuptialdiaries.in is
touched. Open it on your phone, send it to a friend, live with it for a day.

### Step 2 — Replace the real site

Your hosting runs **Apache with WordPress**, so it will have a control panel (cPanel or
similar) with a **File Manager**. The site lives in a folder called `public_html`.

1. **Back up first.** In the control panel, compress `public_html` into a zip and download
   it. If anything goes wrong you can put it straight back.
2. Upload every file in this folder into `public_html`.
3. You can leave `wp-content` where it is — the new site does not need it, but it holds
   your full-resolution originals, so back it up before ever removing it.

### About the photographs

The site carries its own photographs now — all 970 of them, in `images/`. Upload that
folder along with everything else and the site is complete on its own.

Because of that, nothing here depends on `wp-content` any more. You can leave the old
WordPress files in place or clear them out; either way this site keeps working. If you
do clear them, **download a backup of `wp-content` first** — those are your
full-resolution originals, and the copies here are web-sized.

You can also send me better versions from your own originals. The ones on the site now
average 643 KB each, which is heavier than it needs to be — around 250 KB would look
identical and load much faster on a phone.

### Before you point the domain at it

Fix the things listed at the top of this file — especially the WhatsApp number, or every
enquiry goes to a number that isn't yours.
