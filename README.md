# Matthew Hua — Transformational Therapist

A cinematic, editorial biography site for **Matthew Hua** — Zurich-based transformational therapist and founder of *healwell*.

> **Transformation starts in the body.**

Live preview (GitHub Pages): **https://evoryder8-collab.github.io/Matthew-Hua-Bio-Page/**

---

## What this is

A self-contained, **static** single-page site. No build step, no framework, no toolchain — GitHub Pages serves `index.html` directly, so the preview is always online as long as the files are in the repo.

It implements the full creative brief:

1. **Cinematic hero** — fullscreen WebGL shader backdrop (warm/cold flowing gradient + grain), with an optional looping film and a graceful fallback.
2. **Recognition strip** — awards + certifications marquee.
3. **Editorial biography** — typographic, pull-quote driven.
4. **Cinematic awards archive** — the centerpiece: an intelligent video gallery with parallax depth, scroll reveal, hover preview, an accessible lightbox, lazy-loaded video and offscreen pausing.
5. **The Method** — bodywork, breathwork, contrast therapy, cold, heat, mindset.
6. **The Philosophy** — emotional, memorable.
7. **Experience / booking CTA.**
8. **Footer** — Zurich · healwell · social + legal placeholders.

## Tech

- Hand-authored HTML + CSS (design-token system; no build needed)
- **GSAP + ScrollTrigger** — scroll-based cinematic sequences (CDN)
- **Lenis** — smooth scrolling (CDN)
- **Three.js (r128)** — single-draw-call hero shader (CDN)
- Progressive enhancement: the page is fully readable with JavaScript disabled.

## File structure

```
.
├── index.html            # the entire site (markup, styles, scripts, gallery data)
├── README.md
├── .nojekyll             # tells GitHub Pages to serve files as-is
├── assets/
│   └── og-image.jpg      # 1200×630 social card  (ADD THIS — see below)
└── videos/               # your media (ADD THESE — see videos/README.md)
    ├── hero-loop.webm / .mp4
    ├── awards/
    ├── stage/
    └── practice/
```

## Add the real media

The gallery is driven by a **typed data array** near the bottom of `index.html`
(look for `var galleryItems = [ … ]`). Each item defines:

| field | meaning |
|------|---------|
| `title`, `year`, `location` | card labels |
| `role` | `winner` · `judge` · `awarding` · `demonstration` · `practice` (controls accent) |
| `award` | e.g. `Gold` |
| `description` | shown in the lightbox |
| `sources.webm` / `sources.mp4` | video paths in `/videos/…` |
| `poster` | optional poster image; an elegant gradient is generated until you add one |
| `ratio` | `r45` `r169` `r11` `r219` (card aspect) |
| `span` | `w4` `w5` `w6` `w7` `w8` (grid width) |
| `mood`, `tags` | gradient placeholder + lightbox chips |

To activate videos: drop optimized files in `/videos/` (see `videos/README.md`),
add both `.webm` and `.mp4`, and optionally a poster in `/videos/posters/`.
Until then, cards show tasteful gradient posters — the site looks intentional with no media at all.

Replace-me spots are marked with `TODO` comments in `index.html`
(booking link, social links, OG image).

## Performance

- Static-first; minimal JS; libraries deferred.
- Videos use `preload="none"`, **posters first**, lazy hover playback, and are **paused offscreen** via `IntersectionObserver`.
- WebM + MP4 fallbacks. Keep hero loop short (6–12s) and small (≤ ~3 MB); see `videos/README.md`.
- Hero shader is a single fullscreen quad and pauses when the tab is hidden.
- Target: Lighthouse 90+ on desktop. Biggest lever is video weight — compress aggressively.

## Accessibility

- Semantic landmarks, skip link, visible focus states.
- Gallery + lightbox are keyboard operable (`Enter`/`Space` to open, `←`/`→` to navigate, `Esc` to close) with a focus trap.
- `prefers-reduced-motion` disables smooth scroll, the shader, parallax and reveals.
- Video is **muted, no autoplay audio**. Add `<track kind="captions">` when you ship real footage.

## Local preview

It's just static files — open `index.html`, or:

```bash
python3 -m http.server 8080      # then visit http://localhost:8080
```

## Deployment (GitHub Pages)

Settings → **Pages** → Source: **Deploy from a branch** → Branch: **main** / **/(root)** → Save.
Pages rebuilds automatically on every push to `main`.

---

*Built as a first production-ready version. Copy is cinematic placeholder, ready to refine — swap in real footage and photography to push it toward award-level.*
