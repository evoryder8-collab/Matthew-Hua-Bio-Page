# Matthew Hua Website Repair And Handoff Notes

Last updated: 2026-10-02, Europe/Zurich.

Read [roadmap.md](roadmap.md) for positioning, design constraints and prioritised future work. This file explains what is running, why earlier repairs failed, how the current implementation avoids those failures, and how to verify and publish safely. It is intended to let another chat or coding agent continue without reconstructing the entire conversation.

## 1. Start Here

| Item | Current State |
| --- | --- |
| Site | https://matthewhua.ch/ |
| Repository | `evoryder8-collab/Matthew-Hua-Bio-Page` |
| Local checkout used for `f811195` | `/Users/jaxoncorrey/Desktop/my-video/matthew-hua-site` |
| Local checkout for the working-tree release | `/Users/jaxoncorrey/Downloads/Matt Hua New Website` (same remote; path contains spaces) |
| Working branch at handoff | `codex/private-practice-experience` |
| Published branch / directory | `main` / repository root |
| Latest implementation commit | `8837e16` (experience release); previous `f8111957644496ce4d4d1278a0267243a0bb6c79` |
| Prior implementation commit | `dd600475edc05034b68a7089474c11a1cc55b038` |
| Pages result for implementation | `built`, no error; build updated 2026-10-02 09:03:42 UTC |
| Custom domain / HTTPS | `matthewhua.ch`; HTTPS enforced, verified through GitHub Pages settings |
| Runtime | Static HTML, CSS, vanilla JavaScript ES modules; no production npm dependencies |
| Build requirement | Node.js 20+; generated HTML committed |
| Default local preview | http://127.0.0.1:4178; override with `MATTHEW_PORT` |
| Current critical external prerequisite | FormSubmit activation and real receipt verification at `info@healwell.ch` |

**Important repository boundary:** the parent `my-video` checkout is an unrelated project. Always run Git commands from the nested `matthew-hua-site` repository and inspect the remote. Never push the parent repository as part of this website's release.

The latest user request authorises portrait motion/shine, better contact icons and detailed handoff documents. Earlier requests authorised website implementation and publication. Future work should follow the new user's scope; the roadmap is not a command to implement every idea automatically.

## 2. This Release (`8837e16`, published 2026-10-02)

Requested in one session by the user and published as `8837e16` (pushed to `main`; Pages reported `built` for that SHA). Live smoke on https://matthewhua.ch/ in WebKit iPhone 14 emulation and desktop: new markup, language pill, tears moment ran to completion, audio assets served (200), no page errors. Not checked on physical devices.

### What Changed And Why

| Request | Implementation | Main files |
| --- | --- | --- |
| Cheap-looking header language icon | Pill with the current flag as a lit orb, code and chevron; flag URL passed into `renderHeader` (build and runtime). | `templates.js`, `build.mjs`, `app.js`, `refinements.css` |
| Game pop-up needs an X, a slower lift with a "firing up" glow, and must not re-pop after finishing | X visible top-left from the start. 500ms in-slot ignition (traced conic ring on `#mindset-host::before`, glow, brightened field), then 900ms lift, eased `::backdrop`, launch glow. Auto-lift memory is document-scoped (`gameMemory`). **Root cause of re-pops found:** in-page hash links (Discover) fire `popstate`, which re-rendered the whole page and rebuilt the game and spotlight. Same-route/same-locale `popstate` now keeps the live page (still closing media and cancelling a pending arrival). | `game-spotlight.js`, `app.js`, `refinements.css` |
| Outline rectangle on "An experiment in attention" | Programmatic focus on the title/field no longer draws an outline; `showModal()` focus is moved to the title so the X's keyboard ring never flashes mid-lift. | `mindset.css`, `game-spotlight.js` |
| Smooth slides; recall question should glow/float | Synchronous state, visual crossfade: the outgoing slide is cloned into a **closed shadow root** (styles rebuilt from the page's own `mindset` rules) so no duplicate ids/buttons/headings exist; height glides; content rises. Leaving the memory phase removes the copy's signals so no blue lingers. Memory clock starts after the 420ms fade. Recall title floats and glows. No timers are scheduled during input phases (the Mindset suite enforces this). | `mindset.js`, `mindset.css` |
| Reveal the red spot | Answer slide always shows a crisp red marker above the blur (gold rim when found); narrow layouts top-align the text so it never overlaps. | `mindset.js`, `mindset.css` |
| Teaching slides like a torch whoosh | Reveal -> focus -> lesson -> integration -> final: outgoing copy streaks left with motion blur, a warm streak sweeps right to left, new content flies in from the right. | `mindset.js`, `mindset.css` |
| "A life across borders" belongs on About | Moved after the About lead; Home goes ribbon -> tears moment -> method. `#philosophy` id retained. | `templates.js`, `refinements.css` |
| Tears moment | Heading split into letters (intact `.tears-sr` copy, visual `aria-hidden`); a light wave reaches the full stop, which is measured from font metrics, swells with a neck, pinches off (satellite droplet), falls under gravity onto the paragraph's first line, splashes (crown droplets, Worthington jet, rings) and ripples nearby words; the stop re-forms. Canvas is allocated only while animating. Reduced motion: plain text. | `tears.js`, `templates.js`, `refinements.css` |
| German choice hard cut; prompts in general | Prompt darkness eases in/out; replacing one prompt with another swaps instantly under steady darkness (no duplicate controls); DE tile blooms into the two flags, which float in counterpoint and glow in turn. Tests click those flags with `force` because the float is intentional. | `app.js`, `refinements.css` |
| Black curtain hard cut | Curtain eases in (560ms) and out (620ms) on a quintic curve; sparkler keeps its original envelope. | `effects.js` |
| Ribbon runs out on the left | JS clones groups until the loop exceeds viewport + one group and travels exactly one measured group width at the original pace. | `app.js`, `identity.css` |
| Welcome flashes too briefly | 1s hold after the opening sparkle, then crossfade into the language stage. | `app.js` |
| Testers missed the six elements | Spring wave + sheen once the game is closed (yields to the lift), sideways peek on the mobile row, idle shimmer until a tab is opened, breathing dot on unopened elements. | `element-invite.js`, `app.js`, `refinements.css` |
| Sound effects and soundtrack | Web Audio, unlocked by the consent click. Effects: sizzle, tear drop, wink, recall note, twinkle, whoosh, conclusion pop. Soundtrack via `MediaElementSource` -> gain (S-curve glides; iOS ignores media volume): held only through the opening sequence, then continuous; claims by playing films duck it; effects never duck it. Films' own audio eases in where volume is settable. | `sound.js`, `app.js`, `tears.js`, `mindset.js` |
| Follow-up releases (`7f0f423`, `6523e40`, landing) | Mobile menu: WhatsApp/call/email/map icons pinned at the bottom (map opens Contact `#map`). Game: "Let's continue" walks into the light (HDR PQ white clip where supported) and lands on Hot / Cold; Magic Wink on game navigation; inline Try again only outside the pop-up. Release Cutter/Soleo breathing aura. Arrival link focus ring only after keyboard use. **Portrait landing** (`portrait-landing.js`): leaving the arrival film by choice or at its end dissolves it into warm light; Matthew and Tony fly in from behind the viewer (huge, blurred, overexposed) on a damped spring (zeta 0.5, omega 4.2, touchdown ~0.6s, rest ~2s), land with a ring of light, and the page gathers around them nearest-first; the one-shot shine follows. This implements roadmap P1-01. | `templates.js`, `app.js`, `game-spotlight.js`, `sun-journey.js`, `portrait-landing.js`, `mindset.*`, `refinements.css`, locales (`game.continueOn`) |
| Later follow-ups | Arrival Enter is a glowing pill; wheel/trackpad scroll, swipe-up or Down/PageDown also enter (page locked during the landing). Hero name reads MATTHEW HUA on one row. Element visuals rebuilt (`element-visuals.js`): Hot/Cold frost vs embers with steam at the seam around a calm breathing orb; Breathwork spring-driven membrane with inhale/hold/exhale guide and airflow; Body wave-equation surface pressed by two alternating hands; Movement light figure with verlet ribbons and range-of-motion arcs; Community arrivals welcomed into a circle with Kuramoto pulse sync. | `app.js`, `templates.js`, `refinements.css`, `portrait-landing.js`, `element-visuals.js` |
| Latest refinements (to `4ab9de6`) | Safari crash on the final game slide fixed (no CSS filter on the huge photo during its entrance); portrait now a 2400px same-framing copy everywhere (`assets/matthew-tony-game-2400.webp`, original kept). Game exit flies straight out of the screen (projected 2D scale, motion blur). Jug Pop Up only on Begin/Continue. Tears scroll brake engages on approach and holds the heading in view. Hot/Cold: arctic/amber sides, upright sparkler centre (Hot/Cold and Mindset are now user-approved; leave them). Breathwork lungs with bronchial tree; Body open hands on springs with 2 s holds, soft cupping fingers (curl scaled by distance from centre so they never cross), deeper shaded hollow; Movement ribbons removed, pose afterimages; Community guide light, sync and petal flower. Selected element tab glows and sprays sparks (`tab-sparks.js`). | `mindset.*`, `sun-journey.js`, `tears.js`, `element-visuals.js`, `tab-sparks.js`, `app.js`, `templates.js`, `refinements.css` |
| Breathwork anatomy | Anatomical lungs (cardiac notch, lobe fissures, ringed trachea, deep-pink bronchial tree) around a lub-dub beating heart. Inhale: arctic-blue star-like oxygen streams down the trachea and bronchi and blooms into a blue nebula in the tissue; exhale: the nebula turns red and crimson CO2 climbs back out of the windpipe. Hot/Cold and Mindset untouched. Checked on WebKit desktop and iPhone. | `element-visuals.js` |
| Tear brake hotfix | Brake arms with the section 70% into view but keeps full speed until the heading nears mid-screen, eases to heavy by 42%; the fall starts once the heading rises above the middle. Past the hold point the resistance is elastic (step / (1+overshoot/60)^2) instead of a hard clamp, so forcing through no longer jolts. | `tears.js` |
| Game X + lungs on phones | Closing the game early with X now also moves the elements on to Hot / Cold (and nudges the tabs), like "Let's continue". Breathwork lungs are centred in the space above the copy on tall (phone) panels; desktop placement unchanged. | `game-spotlight.js`, `app.js`, `element-visuals.js` |
| `/linkinbio/` | New native link-in-bio page (LUMA pattern, Matthew identity): framed self-playing arrival film with audible-then-muted autoplay and Tap for sound, tears moment, platform-tinted glass links with gleam/reveal/ripple, `matthew-hua.vcf`, spinning element wheel (spring to pointer, tab sparks, staged reveal of element visuals and the game with its cues), studio map and driving chooser, ten-language `bio` copy. Checked in WebKit at iPhone 17 Pro Max size and desktop; Instagram in-app behaviour unverified. | `linkinbio-template.js`, `linkinbio.js`, `linkinbio.css`, `build.mjs`, locales, `templates.js` (exports `whatsappMark`), `sitemap.xml` |
| `/linkinbio/` refinements | Element visuals draw immediately after a wheel tap (the reveal no longer animates opacity from 0, which stopped the visual's visibility check), wheel pointer removed, wheel moved directly under the tears moment, profile line now the homepage positioning (headline + high-profile/entrepreneur intro), Let's continue lands on Hot / Cold without a leftover focus ring, copy-address button beside Rüdigerstrasse 7 on the map. | `linkinbio-template.js`, `linkinbio.js`, `linkinbio.css` |
| `/linkinbio/` sound + cards | The website's sound prompt opens each visit (near-black blurred shade, drifting sparks, Yes with a larger Recommended label, No); Yes unlocks the effects and starts the film with sound inside the tap, No starts it muted; asked once per tab. Contact and site cards redesigned (no LUMA styling or icons): platform-toned photographs of Matthew (`assets/bio/`, 640x320 crops) under frosted glass, original glyphs on glossy platform-coloured chips (Facebook bright blue, LinkedIn deep blue, Instagram gradient, Threads graphite, YouTube red, WhatsApp green), a serif invitation, a light travelling round each frame and a chip pulse on tap. More air between the headline and the positioning line. | `linkinbio-template.js`, `linkinbio.js`, `linkinbio.css`, `assets/bio/` |
| `/linkinbio/` cache-safe cards | Reported on a phone: cards rendered as huge squares because Pages lets browsers keep CSS for 10 minutes and fresh markup met the old stylesheet. The bio stylesheet and module now carry a content version (`?v=`), the template loads with the same version, and every inline SVG has intrinsic width/height so nothing can balloon unstyled. Cards resized to 86 px (primary 100 px), about 10% above the original 78/92 px. | `build.mjs`, `linkinbio.js`, `linkinbio-template.js`, `linkinbio.css` |
| `/linkinbio/` film rests off screen | The film stops where it is once half its frame has scrolled away and continues from that point only when two thirds of the frame is back (hysteresis avoids flicker); a visitor's own pause and fullscreen are respected. | `linkinbio.js` |
| `/linkinbio/` modern marks | Card titles now use the site sans (Comfortaa 600, upright) instead of the italic serif; the glossy 3D icon squares are replaced by flat brand marks in each platform's colour (Instagram gradient stroke, Facebook blue, LinkedIn deep blue, Threads graphite, YouTube red, WhatsApp green, Maps red) on a faint glow, separated from the text by a hairline. Photos, glass and travelling edge unchanged. | `linkinbio-template.js`, `linkinbio.css` |
| `/linkinbio/` lighter profile | More space under the welcome line; the name is smaller (clamp 30-42 px) so it no longer reaches the screen edges; order is now name, "Transformational Therapist · Zurich", then "A private space for people with demanding lives."; the long intro sentence is removed. | `linkinbio-template.js`, `linkinbio.css` |
| `/linkinbio/` wheel affordance | Mindset is selected from the start (its game waits below) while the wheel keeps cruising, without snapping. Element labels sit on frosted pills; until the first tap or key press, a ring pings from each unselected element in turn every 1.5 s and its sector glows (not under reduced motion); pills press in on tap. | `linkinbio.js`, `linkinbio.css` |
| `/linkinbio/` wheel hint, no pills | Label pills and outline rings removed (labels plain again). The invitation is now a soft bloom of each element's own light behind its label plus the sector glow. Above the wheel, "Tap each element to learn more" (all ten locales, `bio.wheelHint`) breathes and shimmers between two pink hairlines until the first tap, then settles. | `linkinbio-template.js`, `linkinbio.js`, `linkinbio.css`, locales |
| `/linkinbio/` wheel introduction | On first arrival (once per visit) the wheel waits blurred, dimmed and set back while "Tap each element to learn more" assembles letter by letter in light over its centre (up to 1.45x, never wider than the wheel); the line then glides up to its place above the wheel, crossfading from light to ink, as the wheel sharpens and steps forward and the hairlines draw out; the pings start afterwards. Skipped under reduced motion; a tap on the wheel ends it at once. | `linkinbio.js`, `linkinbio.css`, `linkinbio-template.js` |
| `/linkinbio/` call first | The phone call is now the highlighted card (dark glass, Matthew's portrait sending out calling waves, a green call button that rings in bursts with a pulsing glow, a slide-to-unlock style shine across "Call Matthew", and an arrival burst when first reached). The socials and Google Maps follow; WhatsApp, Save contact and Email fold away behind "More ways to reach Matthew" (inert while folded, eased unfold). New `bio.moreContact` in all ten locales; `assets/bio/avatar.webp` cropped from about-matthew. | `linkinbio-template.js`, `linkinbio.js`, `linkinbio.css`, locales, `assets/bio/avatar.webp` |
| `/linkinbio/` call chooser | Tapping the call card (its `tel:` stays for no-JS) opens an in-page sheet: dark green glass rising from the bottom over a blurred page, Matthew's portrait with calling waves, "How would you like to call?" and two choices, Phone call (`tel:`) and WhatsApp call (opens the WhatsApp chat, where the call button is one tap away). Closes by X, the backdrop, Escape, or after a choice. New `bio.callTitle/callPhone/callWhatsapp` in all ten locales. Intentional business reason (carrier vs data) is not stated on the page. | `linkinbio.js`, `linkinbio.css`, `linkinbio-template.js`, locales |
| `/linkinbio/` intro timing, radiating arrow | The wheel introduction now waits until the wheel's centre reaches the middle of the screen (the wheel stays sharp until then; the hint line waits hidden) and then blurs, assembles and lands. The "More ways" chevron points left, turns down when open, and radiates soft rings with a glow pulse until it is opened. | `linkinbio.js`, `linkinbio.css`, `linkinbio-template.js` |
| `/linkinbio/` call spotlight | When the call card first reaches mid-screen (once per visit, not under reduced motion), the page dims and blurs behind a veil, the other link cards blur and fade, and the card grows to about a quarter of the screen (bigger portrait, title and ringing button, green glow) for ~3.6 s; a tap, scrolling on or the veil ends it. New invitation line `bio.callInvite` ("Let's start with a call. I'm here to listen." in all ten locales) speaks word by word: each word rises and gleams in turn while the card is visible. | `linkinbio.js`, `linkinbio.css`, `linkinbio-template.js`, locales |
| `/linkinbio/` living call chooser | The call chooser now opens centred (scale-up spring) on darker graphite; Matthew's portrait is larger (104 px) with a halo and ring split green (left) and pink (right), and gradient calling waves kept inside the panel. Both choices are alive: a light travelling round each frame, a passing gleam, breathing icon glow and a drifting chevron, staggered between the two. | `linkinbio.js`, `linkinbio.css` |
| `/linkinbio/` number only in the chooser | The phone number no longer appears on the Call Matthew card (no eyebrow there) or under the two choices (no subtitles); it remains only under Matthew's portrait in the chooser. No handle line on the centred chooser. | `linkinbio-template.js`, `linkinbio.js`, `linkinbio.css` |
| `/linkinbio/` call-first order | New order: profile, call card, six-element wheel and stage, tears moment, film, contact and links, website, studio. The film no longer autoplays (play button waits; the sound prompt now only sets sound). The call card stays calm on first paint and comes alive about 2.6 s after the page settles (after the sound choice); if it sits partly below the fold the page glides just enough, then the spotlight plays; later arrivals still trigger at mid-screen. | `linkinbio-template.js`, `linkinbio.js`, `linkinbio.css` |
| Dev server 404 in a path with spaces | `serve.mjs` uses `fileURLToPath`; serves `.mp3`/`.m4a` types. | `serve.mjs` |

### Verification For This Release

| Check | Result |
| --- | --- |
| `npm run build`, `npm run check`, `npm test` | Passed (60 localized renders). |
| `scripts/test-moments.mjs` (new) | 116 assertions passed in Chromium and WebKit before the final audio/whoosh additions: order, pill, ribbon at 390/2560 at end of loop, tears geometry and re-formed stop at 1440/390, reduced motion, ignition, X, no outline, no duplicate controls, recall glow, red reveal clear of text, no re-lift, element invitation, sound/no-sound, soundtrack ducking for gallery film, dialect bloom, eased curtain. |
| Existing suites after the soundtrack (before the last five effects) | experience 124, returning-portal 124, language-family 88, popup-lifecycle 22, mindset desktop+mobile, refinements 92, portrait-contact 144: all passed. |
| Last additions (welcome hold, five effects, torch slides, soundtrack rule) | At the user's request only one Chromium probe: grid after 1s hold; soundtrack 0.3 after intro, stays up through a later sparkle, 0 under a replayed film; every cue fired once as expected. Suites were not rerun after these. |
| `scripts/test-layout.mjs` | Full run: 110/132. All 22 failures were the test clicking behind the homepage game dialog (the legitimate first auto-lift during its image scroll, or the game it plays); no layout/overflow issue was reported. After the first test fix a homepage rerun passed the gallery stage in all 10 cases, leaving 12 mobile menu taps blocked by the same dialog. The test now returns the lifted game before both steps; **not rerun after that final fix** at the user's request. |

### Remaining

Device listening (iOS silent switch, autoplay, Bluetooth delay, levels on phone speakers); audio rights confirmed by the user (own work); native review of the tears heading wrap in long locales; rerun of the corrected layout matrix.

## 2A. Previous Release (`f811195`)

### Portrait: Shine Was Consumed Too Early

Symptom: a returning visitor could load Home and consume the one-shot portrait shine before opening language selection and the introduction film. After the visitor closed that film, there was no new shine. The float/glow were also too understated for the requested feeling of life.

Root cause: `revealPortrait()` previously set the document-scoped `portraitGleamed` flag as soon as a session-entered homepage became visible. That was not tied to film dismissal.

Repair in `static/app.js`:

- Add `portraitGleamPending` alongside `portraitGleamed`.
- A visible arrival dialog's first dismissal marks a reveal pending. Cancelling a prepared but never-opened player does not consume the shine.
- `revealPortrait()` waits for Home, no portal, no arrival player, no navigation in progress and an entered session.
- It always enables the subtle float for an eligible homepage, but adds `.portrait-arrived` only when a reveal is pending and has not already played.
- The pending flag allows a covered/interrupted homepage to defer the shine until the foreground is genuinely clear.
- One-shot means once per loaded document after intro dismissal, not once per lifetime of the visitor's device. Reopening the portal/film within that document must not repeat it.

Visual implementation in `static/templates.js` and `static/refinements.css`:

- Three aligned copies of the same cached transparent image: decorative aura behind, original colour image, decorative masked gleam above.
- Only the original image has meaningful alt text. Decorative copies use empty alt and `aria-hidden`.
- The whole figure has `pointer-events:none` and moves as one unit. Text and button layout do not move with it.
- Aura uses the image's alpha silhouette, not a rectangular white glow around its transparent bounds. Filters are fixed; opacity supplies the slow breathing effect.
- Shine is a moving diagonal mask over a white version of the cutout. It fades out completely and has one iteration.
- Reduced motion disables float, breathing and shine; the portrait and restrained static aura remain.
- The About portrait retains its previous 5px float in a separate keyframe. The homepage change is not a reason to retune every photo.

Current tuning, all in `static/refinements.css`:

| Control | Current Setting |
| --- | --- |
| `--portrait-lift` | 8px |
| `--portrait-cycle` | 6.8s |
| `--portrait-shine-duration` | 2.6s |
| Figure rotation | -0.15deg to +0.15deg |
| Aura opacity | 0.24 to 0.5; static fallback 0.32 |
| Aura colour | White / warm white, not neon |
| Gleam delay | 0.3s after `.portrait-arrived` |
| Gleam mask | 128deg; transparent 47%, opaque centre 50%, transparent 53%; 180% mask size |
| Gleam maximum opacity | 0.62, then fully transparent |

The sweep crosses the people briefly within the total 2.6-second envelope. Visual inspection included intermediate frames, not just the already-finished animation. Source artwork and responsive framing were not edited.

### Contact: Icons Were In The Wrong Grid Cells

Symptom: email/message/phone symbols looked off-centre, muted and poorly positioned; labels could sit below the badge rather than alongside it.

Root cause: old selectors in `static/style.css` still applied to the new nested contact markup. In particular:

```css
.contact-channels > a:not(.phone-link) { grid-template-columns: 1fr 32px; }
.contact-channels > a > span { grid-column: 1; margin-bottom: 8px; }
.contact-channels svg { grid-column: 2; grid-row: 2; }
```

The newer broad selectors had insufficient specificity. The last rule also assigned an inner SVG to an implicit second grid row/column inside its small icon badge. Merely changing stroke width or replacing the icon asset would not fix that layout bug.

Repair in `static/refinements.css`:

- Scope the three-column row with `.contact-details .contact-channels > a`.
- Explicitly place badge in row 1/column 1, copy in row 1/column 2 and trailing arrow in row 1/column 3.
- Reset inherited badge/copy margins and explicitly centre the inner SVG in its own row 1/column 1.
- Keep text in `minmax(0,1fr)` so longer translations cannot push arrows outside the container.
- Use the existing Lucide envelope, message-circle and phone shapes, 22px with 1.75 stroke width, plus 18px trailing arrows.
- Badge dimensions: 50px desktop and 42px mobile. Use restrained pink line colour, translucent white/mint fill, a fine border and small hover/focus lift. Reduced motion removes the lift.

Before the repair, a 22px icon in a 42px badge was offset 14.5px instead of the centred 10px. The new test checks actual rectangle centres and row alignment, not just the existence of three SVGs.

### Files Changed For The Implementation

| File | Change |
| --- | --- |
| `static/app.js` | Dismissal-triggered, deferred one-shot portrait state. |
| `static/templates.js` | Decorative silhouette aura and explicit main portrait class. |
| `static/refinements.css` | Portrait tuning, isolated About float, contact grid/icon repair, reduced-motion rules. |
| `index.html` | Rebuilt English homepage from the template. |
| `scripts/test-portrait-contact.mjs` | Behavioural and geometric checks in Chromium and WebKit. |

This documentation release adds `roadmap.md`, `repair-notes.md` and a short `AGENTS.md`, and links them from README. It does not introduce another page redesign.

## 3. Verification Record

### Fresh Checks For `f811195`

| Check | Result / Scope |
| --- | --- |
| `npm run build` | Passed; six generated pages. |
| `npm run check` | Passed; syntax checks for the listed application modules. |
| `npm test` | Passed; 60 localised page renders, ten dictionary structures, media and static metadata checks. |
| `scripts/test-portrait-contact.mjs` | Passed; 144 assertions in Chromium and WebKit. Fresh/returning arrival, one-shot shine, repeat entrance, reduced motion, live float, correct contact URLs, centres/hit testing/overflow at 320, 390 and 1440px. |
| `scripts/test-experience.mjs` | Passed; 124 assertions in Chromium and WebKit. Explicit sound, silent/automatic Swiss-German arrival, film playback, media, repository-prefix paths, reduced motion, menu transition and direct history navigation. |
| Regression baseline | The new test failed against the preceding published implementation at "direct homepage does not consume the reveal" after waiting for initialization. It passes with the repair. |
| Visual inspection | Mobile WebKit portrait during its shine; 320px German and 390px contact rows; desktop portrait before/during/after the sweep. |
| `git diff --check` | Passed before the implementation commit. |
| GitHub Pages | Implementation SHA above reported built with no error. |
| Production browser smoke | HTTPS homepage returned 200; returning arrival flow played the film; no premature shine; closing applied portrait reveal; contact icons centred; no 390px horizontal overflow; no page runtime errors during that flow. |

Screenshots are under ignored `output/qa/`, including `portrait-webkit-390.png`, `contact-icons-webkit-320.png`, `contact-icons-after.png`, intermediate `portrait-shine-*.png` and `contact-production-390.png`. They are local evidence, not files a new clone will automatically contain.

An early production test attempt stopped on a test-only missing browser-runner `URL` global; the smoke check was corrected and rerun. That was not a website console error. The first baseline test attempt also stopped on a new-only selector; it was improved to wait for initialization and then verified against the actual premature-shine regression.

### Earlier Coverage, Not Rerun In Full For This Narrow Repair

- Returning-language workflow: 124 assertions at `dd60047`, including cancel/back/focus recovery and preservation of subpage routes.
- German-family choice: 88 assertions in the earlier language work.
- Popup interruption/lifecycle: 22 assertions in the earlier repair work.
- Full Mindset flow: 306 assertions previously recorded.
- Shared refinements: 88 assertions previously recorded, including intercepted contact-form submission and dialog cleanup.
- Layout: earlier six-route/ten-language matrix covered 132 cases; later scoped Contact run covered 22 cases.

The scripts remain available. These prior counts are historical evidence, not a claim that every suite ran again for `f811195`. Run the relevant suite when touching its behaviour.

### Limits Of The Evidence

Chromium/WebKit browser automation is not the same as physical iPhone/Android verification. No real inbox delivery was tested. No field Core Web Vitals results, medical efficacy claims, native-speaker approval or complete accessibility-conformance audit are claimed. Automated page-error checks cover the exercised workflows, not every possible visitor/device/network condition.

## 4. Architecture And Edit Locations

| File / Directory | Responsibility |
| --- | --- |
| `scripts/build.mjs` | Generates six English HTML pages with metadata, canonical URLs, JSON-LD, CSS order and shared shell. |
| `static/templates.js` | Shared markup, routes, page sections, language metadata, media registry and gallery order. |
| `static/locales/*.json` | Ten complete dictionaries. English is also the build-time source. |
| `static/language.js` | Supported codes, browser/explicit/saved preference resolution and interpolation. |
| `static/app.js` | Client routing, render/cleanup, portal/countdown/sound, arrival player, gallery, map, form redirect and portrait reveal. |
| `static/style.css` | Base layout and older component rules; inspect specificity before adding overrides. |
| `static/identity.css` | Retained pink/mint visual identity, original typography, shapes, hero framing and responsive identity overrides. |
| `static/refinements.css` | Later scoped improvements: mh, portrait, flags/countdown, contact/map and dialog styling. |
| `static/mindset.js`, `static/mindset.css` | Game phases, timed encoding, choices, reflective slides and layout. |
| `static/game-spotlight.js` | Lift/retract the same Home game into a native dialog; preserve state and placeholder geometry. |
| `static/effects.js` | Canvas 2D entrance/menu transition, desktop cursor and ambient spark effects. |
| `static/dialog-atmosphere.js` | Dark layered dialog atmosphere and cleanup. |
| `static/technology.js`, `static/technology.css` | Visual demonstrations for the electrical equipment. |
| `static/element-visuals.js`, `static/element-visuals.css` | Non-Mindset element demonstrations. |
| `static/studio-route.json` | Illustrative Zurich HB route; not live user-location routing. |
| `static/vendor/` | Locally vendored Leaflet 1.9.4 and Lucide 0.468.0. |
| `static/flags/`, `assets/brands/` | Local flag thumbnails and map-provider marks. |
| `assets/films/`, `assets/editorial/` | Compatible video derivatives and selected documentary photographs. |
| `static/favicon.svg` | Lowercase mh site mark. |
| `CNAME`, `.nojekyll`, `robots.txt`, `sitemap.xml` | Domain, Pages serving and search-discovery files. |

CSS order matters: Leaflet, base styles, Mindset, technology, element visuals, identity, refinements. Later source order alone does not beat a more specific earlier selector. Inspect computed styles and actual boxes before adding another override.

Generated outputs: root `index.html`, plus `method/index.html`, `private-practice/index.html`, `about/index.html`, `archive/index.html`, `contact/index.html`. Change the templates/dictionaries/build script, then rebuild. Do not repair generated HTML alone and let the next build erase the change.

Base paths derive from the ES module URL and relative build prefixes. The site supports both the custom-domain root and `/Matthew-Hua-Bio-Page/`. Avoid introducing root-absolute asset/module links that only work on one host.

## 5. Lifecycle Contracts

### Portal And Sound

Fresh tab:

```text
opening sparkler -> language flags / five-second timer
                 -> optional German dialect choice
                 -> sound yes/no
                 -> two-second black sparkler curtain
                 -> European Championship arrival film on Home
                 -> homepage after dismissal
```

Returning tab: direct page load skips the entrance. Explicitly pressing the header language button opens language selection with its automatic timer paused, then still asks for sound and plays the transition. On Home it presents the arrival film; on a subpage it returns to that subpage. Do not restore the removed "settings-only" shortcut.

Storage keys: `sessionStorage['matthew-entered']` and `localStorage['matthew-language']`. Audio consent is only runtime state. Locale precedence is explicit URL, saved preference, ordered browser language preferences, English fallback.

`showPortal()` owns the dialog, `portalCleanup`, locale-request generation, countdown animation frame and visibility listeners. `focusPrompt()` replaces the choice stage with a focused dark/blurred prompt and returns cleanup for its ambient canvas. Changing language rerenders the page/header; refresh the focus-return target after that rerender, otherwise Escape tries to focus a detached button.

`leavePortal()` awaits the full transition before starting the film. The video is gesture-authorised by a play/pause attempt when consent is clicked, but must remain paused under the curtain. Capture/check the prepared player identity before showing it. A stale callback after navigation must not call `showModal()` on a removed dialog.

The transition canvas is temporarily moved into the active top-layer dialog. On disposal it must return to `document.body`; otherwise a later transition can disappear or remain attached to a removed tree. Always clear `shell.inert` when the portal closes.

### Navigation

The document click handler only enables the signature transition for a different destination inside `.desktop-nav` or `.mobile-nav`. `navigate()` serializes navigation and services a pending request afterward. Popstate uses `push:false`, no signature animation. Same-route requests close the menu without replaying an effect.

Page cleanup destroys game/spotlight, element and technology animation, map, reveal observer, card-tilt listeners and any legacy hero-video instance. Do not leave old observers or frame loops attached when rerendering a locale or navigating.

### Arrival / Gallery / Map Dialogs

Use native `dialog` semantics. Ambient decorative layers must not intercept pointer input or cover the actual media. The arrival film has a separate controls-reveal target; hidden controls must still have keyboard-safe behaviour. Pause video before removing its dialog. Dispose atmosphere, timers and document-specific listeners. Restore focus to a connected useful target.

`prepareArrival().dismiss()` is idempotent. It stops the film, stops ambience, restores the transition canvas, removes the dialog and asks `revealPortrait()` to reveal only when the page is ready. The portrait class is not the source of one-shot truth; the document-scoped flags are.

### Game Spotlight

The homepage spotlight reparents `#mindset-host`; it must not create a second game or reconstruct an in-progress round. Preserve slot height while the game is in the dialog. Current lift is 650ms, return 520ms, with spatial movement skipped for reduced motion.

Automatic opening requires intersection and no portal, arrival player, media/modal, navigation, open mobile menu or hidden document. If intersection occurred while blocked, retry when the blocker clears. An IntersectionObserver callback alone is insufficient because the element can remain intersecting without a new event.

The same game is suspended during lift/retract and when closed. Completion controls appear only at `finalPhoto`, but outside tap/Escape work before completion. Replay resets game state, not the entire website. Destroy cancels animation and returns/removes DOM safely even during an interrupted lift.

### Game Phases

```text
intro -> memorize3seconds -> recall3positions -> red-signal question
      -> answer reveal -> focus -> life lesson -> integration -> finalPhoto
```

The exact internal phase identifiers are in `static/mindset.js`. The invariant is more important than the names: memory encoding is timed; choices and reading are not. Labels/paragraphs must not occlude the signal coordinates during play. Meaning slides may blur the completed visual field only after the answers. Test every low/bottom signal with hit testing, not only screenshots.

## 6. Media And Factual Integrity

### Matthew / Tony V3 Cutout

Canonical file: `assets/v3 mat x tonyPHOTO-2026-03-16-21-22-09-2.webp`. Although the user often calls it a PNG, the deployed transparent source is WebP. It is 6696 x 6696 with substantial empty transparent padding; the visible people occupy the middle.

The hero has purpose-tuned image width/top values in `static/identity.css`, ending in responsive overrides. Typical widths are 900px desktop, 850px intermediate, 740px mobile and 650px narrow mobile, with additional wide/short-screen rules. These deliberately exceed the figure's width to compensate for the transparent source. Do not replace them with a naive `width:100%` or `object-fit:contain` and shrink the people again.

All three hero layers must retain identical positioning and source. Keep the final Mindset photograph and About cutout present. Only derive optimised artwork in a separately scoped change with visual comparisons; do not overwrite originals or modify the depicted people.

### Films And Posters

| Gallery Title | Delivery Film | Poster |
| --- | --- | --- |
| European Championship | `assets/films/european-championship.mp4` | `assets/European Championship.webp` |
| Champ of the Champs | `assets/films/champ-of-champs.mp4` | `assets/Champ of the Champs.webp` |
| Advice as a judge | `assets/films/advice-as-judge.mp4` | `assets/Advice as a judge.webp` |
| Reignite your inner fire | `assets/films/inner-fire.mp4` | `assets/Reignite your inner fire.webp` |

The H.264/AAC, 720 x 1280, faststart derivatives support more browsers than the original HEVC uploads. Original files remain unchanged, including duplicates at the repository root and under `videos/`. Use the registry in `static/templates.js`, not a guessed duplicate. The European film is about 28.35 seconds and is the entrance film.

Gallery order is controlled by `mediaOrder`. Photo entries Champ of the Champs and On the podium, Switzerland lead the grid. The film named Champ of the Champs is a separate item. Never reorder one by changing captions on another.

Four documentary JPEGs were extracted from the supplied biography: `hero-bodywork.jpg`, `about-matthew.jpg`, `workshop.jpg`, `stillness.jpg`. Keep the workshop's New Massage Association and iConstantine Photography marks visible. Source pages, export details, hashes, audio/decode checks and original-integrity records are in `MEDIA-NOTES.md`.

Social preview: `assets/matthew-hua-tony-share-v1.jpg`, 1200 x 634, used through absolute HTTPS Open Graph/Twitter URLs in the build script. It is an already-created cover; there is no need to regenerate it for this portrait effect. WhatsApp/social caches may retain a previous image and do not guarantee an immediate refresh of existing messages.

## 7. Regression History And Lessons

| Issue / Reference | What Went Wrong | Current Protection |
| --- | --- | --- |
| V3 transparent framing, `004027e`, `ba9172b` | Large transparent bounds made the actual people appear too small or misplaced. | Preserve explicit visible-subject framing, use the correct V3 everywhere it belongs. |
| Game pacing, `29bc883` | Paragraphs changed before visitors could finish reading. | Explicit Next on reading/reflection slides; no auto-advance to the final Tony image. |
| Lesson readability, `c86e10c`, `57fc0f8`, `ca69621`, `ff4a484` | Broad readability panels/blur covered important blue/red signals and could block selection. A local text fix affected the whole active game. | Separate field and copy during play; blur only completed-game reflection; verify bottom-row hit targets. |
| Insurance ribbon, `2f5f887` and earlier | Diagonal badge collided with the header or Tony's head on mobile. | Historical layout repair; later brand positioning removes its headline role. Do not reintroduce the collision or superseded emphasis. |
| Contact email/technology labels, `7c3c825` | Wrong email and detached label placement on small screens. | Official email everywhere; bounded column layout and responsive screenshots. |
| Gallery media layering | A dark panel hid the playing video. | Native video stays visible above its local surface; atmosphere remains behind; test decoded pixels/playback rather than a video element count. |
| Redesign reversal, `0e6fe25` | New palette/components replaced the preferred design and moved attractions off Home. | Retained identity stylesheet and required homepage sections; new pages are additive. |
| Portal appearance, `ee55efd` | Prompt background too bright; oversized/less realistic spark core; rushed transition. | Near-black prompt backdrop, fine warm sparks, compact core, two-second intentional curtain. |
| Navigation effects, `ee55efd` | Back/Forward or incidental actions replayed the signature transition. | Only menu destination changes and entrance/language confirmation animate; history remains direct. |
| Game/dialog refinements, `b95dc28` | Needed a lifted game, consistent ambient layers, usable contact/map presentation and lowercase identity. | Shared atmosphere lifecycle, same-instance spotlight, Lucide/real map controls, mh without dot. |
| Focus styling, `94f2571` | Programmatic heading/video-entry focus produced oversized framing. | Scope visual suppression to noninteractive heading focus; preserve useful keyboard focus on interactive controls. |
| Reopened portal, `dd60047` | Header language change skipped sound confirmation/arrival workflow. | Same sound stage and entrance sequence, with subpage route preservation. |
| Detached callbacks/focus, `dd60047` work | Navigation during portal transition could leave stale player callbacks; rerender could invalidate focus-return targets. | Connected/closing/player-identity guards, cleanup in finalization, current header focus reference. |
| Missed game auto-lift, prior lifecycle repair | Intersection happened while menu/modal blocked opening and was not retried. | Refresh after menu close, visibility, navigation and modal/arrival disposal. |
| Contact icon alignment, `f811195` | Old grid specificity displaced both badges and their inner SVGs; counting icons did not catch it. | Explicit grid areas and geometry/hit-target regression assertions. |
| Premature portrait shine, `f811195` | Returning Home consumed a one-time effect before the intro film was dismissed. | Pending reveal set by visible intro dismissal; one-shot document flag and workflow test. |
| Game re-popped / lost progress (working tree) | Hash links such as Discover fire `popstate`; the handler re-rendered the whole page, rebuilding the game and its spotlight. | Same-route, same-locale `popstate` keeps the live page; auto-lift memory is document-scoped. |
| Outline rectangle on the game (working tree) | Programmatic focus on the `tabindex=-1` title/field drew `:focus-visible`; `showModal()` focused the X. | Outline removed for programmatic targets; dialog focus rests on the title. |
| Ribbon ran out on wide screens (working tree) | Two fixed copies travelling -50% leave a gap when one copy is narrower than the viewport. | Measured clones, one-group travel, ResizeObserver refill. |
| Layout test blocked (working tree) | `test-layout.mjs` predates the lifted game; it never closed the dialog it opened before clicking the gallery/menu. | The test returns the game before continuing. |

Do not fix an isolated screenshot by placing a new high-z-index panel over a shared interactive surface. First identify the phase, owner and layout region. Test adjacent phases immediately afterward.

## 8. Contact And Map Operations

The enquiry form is a native POST to `https://formsubmit.co/info@healwell.ch`. Name, email, message and consent are required; phone is optional. Native validation, honeypot and provider CAPTCHA/spam protection are retained. The UI explicitly names FormSubmit and asks users not to send medical or sensitive information.

**Not completed:** destination inbox activation and real receipt verification. According to [FormSubmit's setup instructions](https://formsubmit.co/), the first genuine submission requires destination confirmation. An authenticated mailbox owner must complete the activation and check delivery/reply behaviour. Do not claim an enquiry was delivered because the local form submitted or the `?enquiry=received` page loaded. That parameter is an acknowledgement display, not cryptographic evidence of delivery.

Automated tests must intercept `https://formsubmit.co/**`; never send a batch of browser tests into Matthew's inbox. A live delivery check should be a single clearly identified test with authorised mailbox access, no sensitive content and a recorded outcome. Do not publish SMTP passwords, tokens or mailbox credentials in this static repository. See the provider's [privacy notice](https://formsubmit.co/privacy.pdf) when reviewing the service arrangement.

The `_next` redirect is computed at runtime so it preserves the current deployment prefix and language. Form inputs are at least 16px to avoid small-input zoom on iOS. Email links use `mailto:info@healwell.ch`; phone uses `tel:+41765067488`; WhatsApp uses the international digits without spaces.

The map uses local Leaflet code and external OpenStreetMap tiles with visible attribution. The destination coordinates came from swisstopo address search in the preceding work. `static/studio-route.json` is an illustrative Zurich HB-to-studio route; do not describe it as the visitor's live route or current traffic.

Driving links:

- Google: `/maps/dir/` with `api=1`, the destination address, `travelmode=driving`, `dir_action=navigate`.
- Apple: `maps.apple.com` with `daddr` and `dirflg=d`.

Use those universal links; the operating system decides whether to open an installed app or a website and whether additional confirmation is necessary. The website cannot honestly promise an automatic app launch on every device. The visual map remains useful if route loading fails, and external links remain available if tiles fail.

## 9. Verification Recipes

### Local Build And Preview

```sh
cd /Users/jaxoncorrey/Desktop/my-video/matthew-hua-site
git status --short --branch
git remote -v
npm run build
npm run check
npm test
npm run dev
```

If 4178 is occupied, use another port, for example `MATTHEW_PORT=4180 npm run dev`. Do not terminate an unrelated server. This release used 4180 for isolated checks; it is not a permanent production dependency.

Playwright can be installed for development or supplied through `PLAYWRIGHT_MODULE`. The machine used for this release has a bundled runtime at `/Users/jaxoncorrey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js`. That path is local-machine convenience, not a portable dependency guarantee.

```sh
export PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.js
TEST_URL=http://127.0.0.1:4180 node scripts/test-portrait-contact.mjs
TEST_URL=http://127.0.0.1:4180 node scripts/test-experience.mjs
TEST_URL=http://127.0.0.1:4180 node scripts/test-returning-portal.mjs
TEST_URL=http://127.0.0.1:4180 node scripts/test-language-family.mjs
TEST_URL=http://127.0.0.1:4180 node scripts/test-popup-lifecycle.mjs
MINDSET_BASE_URL=http://127.0.0.1:4180 node scripts/test-mindset.mjs
TEST_URL=http://127.0.0.1:4180 node scripts/test-refinements.mjs
LAYOUT_BASE_URL=http://127.0.0.1:4180 node scripts/test-layout.mjs
```

The Mindset suite uses **`MINDSET_BASE_URL`**, and the layout suite uses **`LAYOUT_BASE_URL`**, not `TEST_URL`. `LAYOUT_ROUTES=contact` restricts layout checks to Contact; `LAYOUT_SCREENSHOTS_ONLY=1` limits cases according to its screenshot selector. Read the script before changing its environment filters. Do not misreport a filtered run as full coverage.

### Reproduce Fresh And Returning Visitors

Use a separate browser context, not the user's active browser session. For fresh entry, clear the two site-specific storage keys. For a returning English tab, seed before navigation:

```js
sessionStorage.setItem('matthew-entered', '1');
localStorage.setItem('matthew-language', 'en');
```

Wait for application initialization, not just the initial HTML response. For the returning portrait test, `#hero.portrait-alive` marks the relevant setup. The test originally needed this wait to avoid observing server-rendered markup before the runtime completed.

### Focused Suite Selection

| Change | Minimum Relevant Browser Checks |
| --- | --- |
| Portrait/arrival dismissal | Portrait-contact + experience; inspect a frame during the sweep. |
| Portal, language or sound | Experience + returning-portal + language-family + popup-lifecycle. |
| Game logic or layout | Mindset + refinements + popup-lifecycle; manually check bottom signals on mobile. |
| Contact/map/form | Refinements + portrait-contact + scoped contact layout; intercept form submissions. |
| Broad CSS/templates/locales | Content tests plus affected routes/locales; broaden to full layout matrix when shared layout is touched. |
| Effects ownership or routing | Experience + popup-lifecycle, with rapid navigation/cancellation and reduced motion. |

Use screenshots and bounding rectangles together. A screenshot can hide a blocked hit target; a passing DOM count can hide visibly poor alignment. Record engine, viewport, motion setting, locale, state and actual assertion count.

### Release Checklist

1. Confirm the correct nested repository, current remote and user scope. Read existing uncommitted changes; preserve unrelated work.
2. Make focused source edits; rebuild generated HTML when templates, English copy or metadata change.
3. Run syntax/content and relevant browser checks. Inspect desktop/mobile visuals and a reduced-motion flow. Check console/runtime errors and important media.
4. Run `git diff --check`, inspect the complete diff and verify CNAME/base paths/official contact values were not unintentionally changed.
5. Fetch `origin main`; verify it is an ancestor of the proposed release. If the remote has newer work, integrate it deliberately. Never force-push over unknown changes.
6. Stage only intended files, commit, then publish with `git push origin HEAD:main` when release authorisation applies. A local `codex/` branch does not publish merely because it exists.
7. Verify Pages latest build reports `built` for the intended commit, not an older successful build.
8. Exercise the real HTTPS site in a fresh isolated browser context. Confirm the new assets/code are served and the affected flow works. A Git push alone is not proof of production behaviour.
9. Update this release record and roadmap statuses. State which checks were fresh and what remains externally unverified. Finish or stop only the temporary processes you started.

Useful read-only deployment commands:

```sh
gh api repos/evoryder8-collab/Matthew-Hua-Bio-Page/pages
gh api repos/evoryder8-collab/Matthew-Hua-Bio-Page/pages/builds/latest
git log --oneline -12
git diff --check
```

## 10. Known Open Work And Boundaries

- FormSubmit activation/receipt: not verified. Highest-priority operational prerequisite.
- Physical-device media/autoplay and app-link handoff: still requires iPhone/Android checks; automation does not override device policy.
- Native-language review: dictionaries are structurally complete, not natively certified. German Contact currently includes the English country name "Switzerland"; review all locales consistently.
- Large V3 transparent image: unchanged original is 6696px square. Browser caching avoids duplicate transfers, but decode/compositing cost should be measured before increasing effect complexity.
- Film dismissal: currently immediate. A more choreographed exit is proposed in the roadmap, not falsely described as already implemented.
- Existing CSS has layered legacy overrides. Scoped fixes are safer than broad restyling; a measured consolidation is future work.
- Search localisation: generated HTML is English, with runtime language dictionaries. A more complete multilingual indexing strategy is future work.
- External dependencies: Google Fonts, OpenStreetMap tiles, FormSubmit and external navigation/messaging destinations can fail independently. Vendored libraries/flags are local; their provenance remains documented.
- Public biography, insurance and credential wording depend on supplied information. Reconfirm time-sensitive claims and avoid adding unsupported treatment guarantees or client endorsements.
- Domain/DNS/mail: current website HTTPS works. The domain was configured through the user's Infomaniak account. This release made no DNS or mailbox changes; do not delete MX/TXT records while adjusting a website record in future.
- Global quality: no claim of universal zero errors, full WCAG conformance, real-world performance targets or verified business conversion metrics has been made.

## 11. Handoff Maintenance

When continuing, read the roadmap's guardrails, inspect the actual source and current Git state, then choose one scoped improvement. Do not treat an old screenshot, commit message or proposed item as newer than the user's current request.

For each release, append or replace the current release record with date, actual commit, files, reason, verification and remaining limitations. Mark completed roadmap items as implemented only when they exist, and verified only when evidence is recorded. Keep speculative creative ideas separate from bug fixes and operational prerequisites.

Never erase the history explaining the game overlay failure, the preferred-design restoration, or the missing sound-prompt regression. Those are the main reasons this project needs a durable handoff.
