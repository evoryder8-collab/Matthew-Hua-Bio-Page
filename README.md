# Matthew Hua — Transformational Therapist

A cinematic, editorial biography site for **Matthew Hua** — Zurich-based transformational therapist and founder of *healwell*.

> **Transformation starts in the body.**

**Live:** https://evoryder8-collab.github.io/Matthew-Hua-Bio-Page/

---

## What this is

A self-contained, **static** single page. No build step — GitHub Pages serves `index.html` directly, so the preview is always online as long as the files are in the repo. Designed to feel like a private cinematic exhibition: beautiful, guided, calm, and effortless on every screen.

## Experience route

`Hero → Recognition → Journey → Six Elements → Technology → Archive → Philosophy → Studio`

A premium digital business card and legacy profile, not a booking funnel. Refined actions only (Discover the Six Elements, View the Technology, Enter the Archive, Private Inquiry). Each block has its own motion logic; calm pauses between intense moments; a single signature WebGL moment (the hero).

## Signature sections

- **The Six Elements** — an accessible tablist "control room" with the exact six forces in order: Hot / Cold, Breathwork, Mindset, Body, Movement, Community. Each has its own atmosphere and signature motion (thermal shift, breathing, alignment, pressure, kinetic arcs, network), animated only while active and in view.
- **The Instruments Behind the Method** — split-screen Technology section: Release Cutter (Pro Labo Japan, copper, spiral current) and Zimmer Soleo Series (Zimmer, ice blue, ultrasound waves + sensor-verified dose readout). Pointer-aware lighting, progressive-disclosure spec drawers, comparison block, and a reputation close back to Matthew.

### Compliance (Technology)

Supportive language only — no diagnosis, cure, or guaranteed-outcome claims. Device names are manufacturer marks. **Values to verify before public publishing** (flagged with `VERIFY` HTML comments in `index.html`): SonoSwing simultaneous 0.8 / 2.4 MHz, vacuum suction range, and pulsed-suction cycle. A visible note states figures are indicative and being verified. Confirm device indications and advertising compliance for Switzerland / EU before final publication.

## Tech (core stack)

- Hand-authored HTML + CSS (design-token system, no build)
- **GSAP + ScrollTrigger** — scroll reveals + gentle desktop-only parallax
- **Lenis** — smooth scrolling (desktop, disabled under reduced-motion)
- **Three.js (r128)** — a single-draw-call "breathing" hero shader, **lazy-loaded desktop-only**
- Progressive enhancement: fully readable and navigable with JavaScript disabled.

## Mobile & accessibility

- Mobile has its own choreography — no shader, no parallax, no scroll-hijack; large touch targets (≥44px), tap to open, swipe to navigate the archive.
- Every gallery interaction works with **touch, mouse, and keyboard** (`Enter`/`Space` open, `←`/`→` navigate, `Esc` close, focus trap, swipe).
- `prefers-reduced-motion` disables smooth scroll, the shader, parallax, the grain and reveals.
- Dimmed label color raised for ~4.7:1 contrast; visible focus rings; semantic landmarks + skip link.
- Video is **muted, never autoplays sound**.

## File structure

```
.
├── index.html            # the whole site (markup, styles, scripts, archive data)
├── README.md
├── .nojekyll             # serve files as-is on Pages
├── assets/
│   └── og-image.jpg      # 1200×630 social card  (ADD THIS)
└── videos/               # your media (ADD THESE — see below)
    ├── hero-loop.webm / .mp4
    ├── awards/   stage/   practice/
    └── posters/
```

## Video strategy — preview vs. full

The system is designed for **compressed cinematic clips**, never raw footage. Each archive item references two qualities:

- **`preview`** — a small, low-res, short loop (used on the gallery card; plays on hover on desktop)
- **`full`** — a higher-quality version (used only inside the immersive lightbox)
- **`poster`** — a still for every clip (an elegant gradient placeholder shows until you add one)

Naming is clean and content-driven, e.g.:

```
videos/awards/european-championship-2024-preview.webm   (+ .mp4)   ← card
videos/awards/european-championship-2024.webm           (+ .mp4)   ← lightbox
videos/posters/european-championship-2024.jpg                      ← still
```

Rules of thumb: loops **4–12s**, **WebM primary + MP4 fallback**, **muted**, preview ≤ ~1.5 MB, full ≤ ~5 MB, poster ~1280px. Non-hero videos are lazy (`preload="none"`), play only when needed, and **pause when offscreen**.

### ffmpeg

```bash
# PREVIEW — small, low-res loop for the card (≈640px wide, no audio)
ffmpeg -i source.mov -an -t 8 -c:v libvpx-vp9 -b:v 0 -crf 38 -vf "scale=-2:640" european-championship-2024-preview.webm
ffmpeg -i source.mov -an -t 8 -c:v libx264 -crf 30 -preset slow -movflags +faststart -vf "scale=-2:640" european-championship-2024-preview.mp4

# FULL — higher quality for the lightbox (≈1080p, no audio)
ffmpeg -i source.mov -an -c:v libvpx-vp9 -b:v 0 -crf 32 -vf "scale=-2:1080" european-championship-2024.webm
ffmpeg -i source.mov -an -c:v libx264 -crf 22 -preset slow -movflags +faststart -vf "scale=-2:1080" european-championship-2024.mp4

# POSTER — grab a strong frame
ffmpeg -i source.mov -ss 00:00:02 -frames:v 1 -vf "scale=1280:-2" posters/european-championship-2024.jpg
```

After adding files, optionally set the `poster:` path in the `items` array (near the bottom of `index.html`). Replace-me spots are marked with `TODO`.

## Archive data model (typed)

Edit the `items` array in `index.html`:

| field | meaning |
|------|---------|
| `title`, `year`, `location` | card + lightbox labels |
| `role` / `group` | `winner`·`judge`·`awarding`·`practice` / filter group (`wins`·`stage`·`practice`) |
| `award` | e.g. `Gold` |
| `description` | lightbox copy |
| `preview` / `full` | `{webm, mp4}` low-res card loop / hi-res lightbox |
| `poster` | optional still (gradient fallback otherwise) |
| `ratio` / `span` | card aspect (`r45`·`r169`·`r11`) / grid width (`w4`–`w8`) |
| `mood` / `tags` | gradient placeholder + lightbox chips |

## Performance

- Static-first; tiny JS; GSAP/Lenis deferred; **Three.js lazy-loaded desktop-only**.
- `transform`/`opacity` animations only; reveals via `ScrollTrigger`; hero shader is one draw call and **pauses offscreen / when the tab is hidden**.
- Videos: posters first, `preload="none"`, low-res previews, hi-res only in the lightbox, paused offscreen via `IntersectionObserver`.
- Target Lighthouse 90+ desktop; the dominant lever is video weight — compress per the commands above.

## Local preview

```bash
python3 -m http.server 8080   # http://localhost:8080
```

## Deployment (GitHub Pages)

Settings → **Pages** → Source **Deploy from a branch** → **main** / **/(root)**. Rebuilds on every push to `main`.

---

*First production-ready version. Copy is cinematic placeholder, ready to refine — drop in real footage and photography to push it toward award level.*
