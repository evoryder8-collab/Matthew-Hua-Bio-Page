# Matthew Hua

Live: [matthewhua.ch](https://matthewhua.ch/)

Static GitHub Pages website. The original pink/mint identity, Comfortaa/Fraunces typography, rounded controls and Matthew/Tony hero are retained. The attention game, animated element and machine demonstrations, gallery, philosophy and contact remain on the homepage. New pages add detail without removing the interactive homepage.

## Project Handoff

Read [roadmap.md](roadmap.md) for brand positioning, protected design decisions, the implemented experience and prioritised future refinements. Read [repair-notes.md](repair-notes.md) for the current release, regression history, architecture, verification evidence and deployment procedure. [AGENTS.md](AGENTS.md) provides a short entry point for future coding agents.

## Development

Node.js 20 or later. No production npm dependencies.

```sh
npm run build
npm run check
npm test
npm run dev
```

Preview: `http://127.0.0.1:4178`. Set `MATTHEW_PORT` to use another port. The server supports video byte ranges and the `/Matthew-Hua-Bio-Page/` prefix for path checks.

Generated `index.html` files are committed, so GitHub Pages does not need a build service. Run the build after changing templates or English copy.

## Main Files

- `static/templates.js`: page structure, shared homepage sections, media and gallery ordering.
- `static/locales/*.json`: ten complete language dictionaries.
- `static/app.js`: navigation, five-second language countdown, sound consent, arrival video, gallery and map.
- `static/identity.css`: original visual identity applied to layouts in `static/style.css`.
- `static/refinements.css`: lowercase gleaming `mh` mark, portrait effects, countdown ring, contact/map styling and shared dialog frames.
- `static/game-spotlight.js`: lifts the same live homepage game into a native dialog and animates it back without resetting selections.
- `static/dialog-atmosphere.js`: dark, blurred, continuously sparkling dialog backgrounds with lifecycle cleanup.
- `static/mindset.js` and `static/mindset.css`: attention game with isolated state and timers.
- `static/effects.js`: Canvas 2D sparkler transitions and desktop cursor. `SPARK_TUNING` exposes size, particle budget, lifetime, opacity, gravity, fade speed and colours. The black curtain eases in/out (`CURTAIN_IN`, `CURTAIN_OUT`); the sparkler keeps its own envelope.
- `static/tears.js`: the homepage "No need to wipe the tears away." moment: letter wave, canvas teardrop physics, splash and word ripple.
- `static/sound.js`: consent-gated Web Audio effects (sizzle, tear drop) and the background soundtrack, which glides to silence under films.
- `static/element-invite.js`: spring wave, sideways peek and idle shimmer that show the six element tabs open.
- `static/tab-sparks.js`: sparkler sparks around the selected element tab.
- `static/portrait-landing.js`, `static/sun-journey.js`: the portrait's arrival after the film and the game's closing light.
- `static/element-visuals.js`: the five element animations (Hot/Cold, Breathwork, Body, Movement, Community).
- `assets/sfx/`, `assets/audio/`: web derivatives of the supplied sound effects and soundtrack; provenance in `MEDIA-NOTES.md`.
- `assets/films/`: H.264/AAC derivatives for Safari/Chrome. Original uploads remain unchanged.
- `assets/editorial/`: real photographs from the supplied biography; see `MEDIA-NOTES.md` for provenance and retained credits.
- `static/studio-route.json`: illustrative Zurich HB driving route, not live traffic or user-location routing.
- `static/linkinbio-template.js`, `static/linkinbio.js`, `static/linkinbio.css`: the native link-in-bio page at `/linkinbio/` (built into `linkinbio/index.html`; copy in each locale's `bio` block). `matthew-hua.vcf` is its downloadable contact card.

## Behaviour

The first visit in a tab runs the portal: after the opening sparkle, "A moment for yourself" holds for a deliberate second, then crossfades into the language choice. A valid URL language takes precedence, then a saved choice, then the browser language. Swiss German preferences map to Zurich Swiss German. The detected tile has a filling progress ring and a live five-second countdown; keyboard interaction or the pause icon stops auto-selection. The split Swiss/German flag opens a separate dialect choice with full-bleed flags and also pauses the timer. This choice and the sound prompt have dark, blurred, continuously sparkling backgrounds. Returning visits in the same tab skip the portal. The language button always allows changing it.

Explicitly choosing a language from the header runs the same sound prompt and entrance transition, not a settings-only shortcut. On the homepage it also introduces the European Championship film; on another page it preserves that page after the transition. The existing portal design is shared by both paths.

Sound is never assumed or persisted. The European Championship arrival film starts after the full entrance transition. Its upper stage uses 82% of the viewport; the portrait film stays contained inside a rounded, warm-glowing frame. Tap the film to reveal controls; tapping outside or the typography below dismisses it. Escape and keyboard navigation also work. Autoplay-blocking browsers retain a play control. Its darkened, blurred backdrop shares the continuous sparks used by gallery and map dialogs.

The signature sparkler runs for two seconds against black, with a compact white-hot core and fine warm trails. The black eases in and out on a smooth curve rather than cutting. Beyond the entrance or confirming a language choice, it runs only when selecting a different page from the navigation menu. Back/Forward, same-page selections and closing the arrival film do not replay it. Both portal prompts use a very dark blurred background, with the sparks above the darkening layer.

Only memory encoding is timed. Active game choices are never blurred or obscured. Reflection appears above the blurred completed game and requires Next. Reduced-motion users receive a short fade instead of moving particles. Touch devices have no custom cursor.

On the homepage, reaching the game first "fires it up" in place (a 500ms traced ring of light and brightening field), then lifts the same instance over 900ms into a near-full-screen native dialog. It lifts by itself at most once per loaded document, so finishing it and scrolling back up never re-opens it; in-page links such as Discover no longer rebuild the page. A small X sits at the top left from the start; the completion slide adds a replay control. Clicking outside or pressing Escape retracts it to the same homepage slot; an interrupted memory countdown pauses until reopened. The expand icon or interacting with the inline game reopens it. The Method page keeps the inline presentation. Slides crossfade (the outgoing slide is an input-free copy in a closed shadow root) and the teaching slides after the answer pass right to left like a torch, the recall question glows and floats, and the answer slide always reveals the real red signal. The title and field receive programmatic focus without an outline.

The six element tabs invite a tap once the game is closed: a spring wave with a sheen, a sideways peek on the scrolling mobile row, then a quiet shimmer until one is opened. Unopened elements keep a small breathing dot.

Directly after the award ribbon, "No need to wipe the tears away." plays once in view: a wave of light runs to the full stop, which gathers, pinches off, falls and splashes onto "Tears are welcome here", rippling its words before the full stop re-forms. Reduced motion shows the plain text. The award ribbon clones itself to cover any viewport width. "A life across borders" now lives on About.

`/linkinbio/` is the destination for social profiles. It follows the visitor's saved, URL or browser language, with its own flag menu. The page leads with a call card (a spotlight moment after the visitor has read the name, then an in-page chooser between a phone call and WhatsApp), then the six-element wheel, the tears moment and the European Championship film, which waits for a tap inside its 9:16 frame of about 60% of a phone's height with a breathing pink/mint glow and rests while scrolled away. The tears moment sits beneath it with the same scroll brake. WhatsApp leads the platform-tinted glass links (contact card, phone, email, Instagram, Facebook, Threads, YouTube, LinkedIn, Google Maps), followed by the six elements on a slowly turning wheel: tapping a segment springs it to the pointer, sprays the selected label with sparks and blooms that element's visual open below (Mindset opens the game with all its sounds; its closing light lands on Hot / Cold). Website links, the studio map with the Google/Apple driving chooser, and the footer follow. Effects sound only once sound is on.

Choosing sound also enables a quiet soundtrack and interface sounds: the sparkle sizzle, the tear's drop, a wink on each element tab, a note for every recall tap, a twinkle when a missed red signal is revealed, a fire whoosh for each teaching slide and a positive pop for the conclusion. The soundtrack waits only through the opening sequence (first sparkle and arrival film), then glides in and stays, sparkle transitions included; any film that actually plays (a replayed arrival film or a gallery film) lowers it to silence on an eased curve and hands it back when it stops. Effects always play on top. Declining sound keeps everything silent and the soundtrack is never loaded.

## Contact Form

The native form posts to `https://formsubmit.co/info@healwell.ch`. Required name, reply email, message and consent fields use browser validation; a honeypot and the provider's CAPTCHA remain enabled. FormSubmit delivers replies to the official inbox without publishing SMTP credentials or requiring a backend on GitHub Pages. The provider's confirmation redirect preserves the current base path and language. Privacy copy identifies the service and asks visitors not to send medical or sensitive information.

**Activation is required at the destination inbox.** The first real submission triggers a FormSubmit confirmation email; the owner of `info@healwell.ch` must click it before delivery is active. Do not call delivery verified until this step and a real inbox receipt have been checked. Automated QA intercepts all POSTs to prevent test messages reaching Matthew.

## Browser Checks

Install Playwright for development, or set `PLAYWRIGHT_MODULE` to an existing runtime module path. Start the preview server first.

```sh
node scripts/test-experience.mjs
node scripts/test-returning-portal.mjs
node scripts/test-language-family.mjs
node scripts/test-mindset.mjs
node scripts/test-refinements.mjs
node scripts/test-portrait-contact.mjs
node scripts/test-popup-lifecycle.mjs
node scripts/test-layout.mjs
node scripts/test-moments.mjs
```

The experience suite uses Chromium and WebKit. Layout tests cover six routes in ten languages at desktop/mobile sizes, plus narrow-screen German/Japanese. Screenshots are saved under ignored `output/qa/`.

## Publication

Repository: `evoryder8-collab/Matthew-Hua-Bio-Page`. Pages publishes `main` from `/`. Keep `.nojekyll` and `CNAME` unchanged. The domain is `matthewhua.ch`; relative paths also support the GitHub Pages repository prefix.

The existing social cover and absolute Open Graph image URL remain in place. Messaging platforms can cache older previews for previously shared links.

## External Services

Comfortaa and Fraunces load from Google Fonts. Contact-map tiles load from OpenStreetMap with visible attribution. Leaflet 1.9.4 and Lucide 0.468.0 are vendored locally. Flag thumbnails are from FlagCDN; map-provider marks are from Simple Icons. Driving links use the providers' universal URLs; app handling and navigation start depend on the visitor's device.

Contact enquiries use [FormSubmit](https://formsubmit.co/) and its CAPTCHA/spam screening. No SMTP password, access token or mailbox credential is stored in this repository.
