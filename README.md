# Matthew Hua

Live: [matthewhua.ch](https://matthewhua.ch/)

Static GitHub Pages website. The original pink/mint identity, Comfortaa/Fraunces typography, rounded controls and Matthew/Tony hero are retained. The attention game, animated element and machine demonstrations, gallery, philosophy and contact remain on the homepage. New pages add detail without removing the interactive homepage.

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
- `static/mindset.js` and `static/mindset.css`: attention game with isolated state and timers.
- `static/effects.js`: Canvas 2D sparkler transitions and desktop cursor. `SPARK_TUNING` exposes size, particle budget, lifetime, opacity, gravity, fade speed and colours.
- `assets/films/`: H.264/AAC derivatives for Safari/Chrome. Original uploads remain unchanged.
- `assets/editorial/`: real photographs from the supplied biography; see `MEDIA-NOTES.md` for provenance and retained credits.
- `static/studio-route.json`: illustrative Zurich HB driving route, not live traffic or user-location routing.

## Behaviour

The first visit in a tab runs the portal. A valid URL language takes precedence, then a saved choice, then the browser language. Swiss German preferences map to Zurich Swiss German. Five seconds selects the highlighted language automatically; keyboard interaction or "Take your time" pauses it. The split Swiss/German flag opens a separate dialect choice and also pauses the timer. This choice and the sound prompt have softly blurred, continuously sparkling backgrounds. Returning visits in the same tab skip the portal. The language button always allows changing it.

Sound is never assumed or persisted. The European Championship arrival film starts after the transition. Its upper field uses 70% of the viewport; tapping the actual darkened homepage below dismisses it. Tap the film to reveal controls. Escape and keyboard navigation also work. Autoplay-blocking browsers retain a play control.

Only memory encoding is timed. Active game choices are never blurred or obscured. Reflection appears above the blurred completed game and requires Next. Reduced-motion users receive a short fade instead of moving particles. Touch devices have no custom cursor.

## Browser Checks

Install Playwright for development, or set `PLAYWRIGHT_MODULE` to an existing runtime module path. Start the preview server first.

```sh
node scripts/test-experience.mjs
node scripts/test-language-family.mjs
node scripts/test-mindset.mjs
node scripts/test-layout.mjs
```

The experience suite uses Chromium and WebKit. Layout tests cover six routes in ten languages at desktop/mobile sizes, plus narrow-screen German/Japanese. Screenshots are saved under ignored `output/qa/`.

## Publication

Repository: `evoryder8-collab/Matthew-Hua-Bio-Page`. Pages publishes `main` from `/`. Keep `.nojekyll` and `CNAME` unchanged. The domain is `matthewhua.ch`; relative paths also support the GitHub Pages repository prefix.

The existing social cover and absolute Open Graph image URL remain in place. Messaging platforms can cache older previews for previously shared links.

## External Services

Comfortaa and Fraunces load from Google Fonts. Contact-map tiles load from OpenStreetMap with visible attribution. Leaflet 1.9.4 and Lucide 0.468.0 are vendored locally. Flag thumbnails are from FlagCDN; map-provider marks are from Simple Icons. Driving links use the providers' universal URLs; app handling and navigation start depend on the visitor's device.
