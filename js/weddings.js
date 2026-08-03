/* ==========================================================================
   THE WEDDING LIST
   --------------------------------------------------------------------------
   BHARATH: this is the only file you edit to add a wedding. The Photography
   page and every album page are built from this list automatically — you do
   not create a new HTML file, and you never have to fix "previous / next"
   links, because they work themselves out from the order below.

   TO ADD A WEDDING
   ----------------
   1. Put the photographs in  images/weddings/<slug>/  numbered 01.jpg upwards.
      (Mac: select them all, right-click, Rename, "Name and Index".)
   2. Copy one block below, paste it at the TOP of the list, fill it in.

   Newest first is the order the Photography page shows.

     slug     the folder name, and the web address: album.html?w=riya-arjun
              lowercase, hyphens, no spaces. Must match the folder exactly.
     name     the couple, e.g. "Riya & Arjun"
     city     e.g. "Bangalore"
     date     "Month Year", e.g. "March 2026"
     excerpt  one line for the Photography page
     story    the paragraph at the top of their album page
     photos   HOW MANY photographs are in the folder — just the number.
              The site works out the filenames. The first is the cover.

     cover    (optional) a different cover, e.g.
              cover: "images/weddings/riya-arjun/07.jpg",

   The five below still point at the old WordPress photographs, using a list
   of web addresses instead of a number. That still works — but as you replace
   them, switch each one over to the folder-and-number way.
   ========================================================================== */

const WEDDINGS = [

  /* ---- WHAT A NEW WEDDING LOOKS LIKE. Copy this block, do not delete it. ----
  {
    slug:    "riya-arjun",
    name:    "Riya & Arjun",
    city:    "Bangalore",
    date:    "March 2026",
    excerpt: "A palace morning, and a baraat that took two hours to arrive.",
    story:   "Two short paragraphs about the day, written the way you would " +
             "tell a friend about it.",
    photos:  28
  },
  -------------------------------------------------------------------------- */

  {
    slug:    "wedding-01",
    name:    "[ Couple's Names ]",
    city:    "[ City ]",
    date:    "[ Month Year ]",
    excerpt: "A palace staircase, a long gallery, and a bride who took her time coming down it.",
    story:   "[ Replace this with the story of the wedding — two short paragraphs is plenty. " +
             "Write it the way you would tell a friend about the day: where it was, what the " +
             "families were like, and the one moment you keep coming back to. ]",
    cover:   "https://nuptialdiaries.in/wp-content/uploads/2024/09/Picsee-202-2.jpg",
    photos: [
      "https://nuptialdiaries.in/wp-content/uploads/2024/09/Picsee-202-2.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/09/Picsee-370-1.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/Picsee-252.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/Picsee-222.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/Picsee-196.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/Picsee-133.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/Picsee-32.jpg"
    ]
  },

  {
    slug:    "wedding-02",
    name:    "[ Couple's Names ]",
    city:    "[ City ]",
    date:    "[ Month Year ]",
    excerpt: "A South Indian morning, photographed close enough to hear the mantras.",
    story:   "[ Replace this with the story of the wedding. ]",
    cover:   "https://nuptialdiaries.in/wp-content/uploads/2024/09/RS-ND-45-2.jpg",
    photos: [
      "https://nuptialdiaries.in/wp-content/uploads/2024/09/RS-ND-45-2.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/RS-ND-336.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/RS-ND-504.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/09/RS-ND-506.jpg"
    ]
  },

  {
    slug:    "wedding-03",
    name:    "[ Couple's Names ]",
    city:    "[ City ]",
    date:    "[ Month Year ]",
    excerpt: "Three days of rituals under a borrowed umbrella, and not one of them rushed.",
    story:   "[ Replace this with the story of the wedding. ]",
    cover:   "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR03361.jpg",
    photos: [
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR03361.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR03167.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR03515.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR03723.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR04224.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR04351.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/09/BAR04364.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/09/BAR04444-2.jpg"
    ]
  },

  {
    slug:    "wedding-04",
    name:    "[ Couple's Names ]",
    city:    "[ City ]",
    date:    "[ Month Year ]",
    excerpt: "A baraat that arrived on horseback, and a night that refused to end.",
    story:   "[ Replace this with the story of the wedding. ]",
    cover:   "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR08530.jpg",
    photos: [
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR08530.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR00041.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR06272.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR07691.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR07852.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR08860.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR09680.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/09/BAR00480-2.jpg"
    ]
  },

  {
    slug:    "wedding-05",
    name:    "[ Couple's Names ]",
    city:    "[ City ]",
    date:    "[ Month Year ]",
    excerpt: "Made months before the wedding, when nobody was nervous yet.",
    story:   "[ Replace this with the story of the wedding. ]",
    cover:   "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR08234.jpg",
    photos: [
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR08234.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/BAR05815.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/09/DSC1557.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/09/DSC0618-2.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/DSC07573.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/DSC07919.jpg",
      "https://nuptialdiaries.in/wp-content/uploads/2024/10/DSC08598.jpg"
    ]
  }

];
