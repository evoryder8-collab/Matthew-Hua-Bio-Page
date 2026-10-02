# Matthew Hua Website Roadmap

Last updated: 2026-10-02, Europe/Zurich.

This is the product and creative handoff for [matthewhua.ch](https://matthewhua.ch/). Read it with [repair-notes.md](repair-notes.md), which contains implementation details, regression history, verification and release procedures. [README.md](README.md) is the short operational guide; [MEDIA-NOTES.md](MEDIA-NOTES.md) records media provenance and encoding.

The latest implementation release is `8837e16` (published 2026-10-02): tears moment, game ignition/X/crossfades/torch slides/red reveal, element invitation, language pill, dialect bloom, welcome hold, eased curtain, endless ribbon, consent-gated sound effects and soundtrack. It follows `f811195`. See "This Release" in the repair notes.

## 1. Product Purpose

Build a distinctive, emotionally attentive website for Matthew Hua's transformational therapy practice in Zurich. It should communicate the quality of his craft before asking a visitor to enquire, and then make that enquiry straightforward. The site is an experience, but its practical information must remain easy to reach.

The intended audience includes high-profile individuals, entrepreneurs, people with demanding responsibilities and Zurich professionals. The brand should feel discreet, personal and assured, not status-obsessed or exclusionary. The visitor should feel welcome as a person, not evaluated by wealth. Do not publish claims that particular celebrities or wealthy individuals are clients unless Matthew supplies permission and substantiation.

The user's aspiration is an unusually refined, bespoke experience with the perceived care of a major design investment. That is a quality direction, not a claim about actual expenditure or a reason to add unnecessary spectacle. Better pacing, reliable interactions, legible information, precise typography and considered transitions matter more than more animation.

### Positioning And Voice

- Primary category: transformational therapist in Zurich.
- Practice: personalised bodywork, breathwork, attention, movement, temperature and selected precision technology, shaped around the individual.
- Signature: "Transformation starts in the body."
- Supporting positioning: "A private space for people with demanding lives."
- Existing introduction: "Personalised bodywork, breathwork and precision technology for high-profile individuals, entrepreneurs and professionals."
- Tone: warm, assured, unhurried, human and specific. Avoid generic spa language, grandiose luxury claims and clinical promises the source material cannot support.
- Insurance recognition is practical reassurance near Contact and in the FAQ. It is not the headline or the main signal of quality.
- The emotional policy is expressed as "No need to wipe the tears away." Tears are welcome; the visitor is not pressured to explain, suppress emotion or compose themselves. Preserve the companion line: "Your pace. Your comfort. Your choice."
- The site must not imply that emotional release is compulsory, a guaranteed treatment result, or a replacement for appropriate medical or mental-health care.
- The personal monogram is exactly `mh`: lowercase, no full stop. The business name is `healwell`. Do not revert to `Mh.`, `MH` or a dotted mark.
- The existing large homepage name treatment is part of the retained design. Lowercase preferences do not authorise another wholesale typography redesign.

### Intended Outcomes

1. Visitors understand who Matthew is and why the approach is personal.
2. The attention experiment and authentic media create interest without obstructing reading or navigation.
3. Visitors can find the address, contact Matthew, ask a question and open driving directions with little effort.
4. Mobile visitors receive the same care as desktop visitors, with no inaccessible choices, clipped text or hidden video.
5. The site remains understandable without motion, without audio, and when an external service is unavailable.

## 2. Design And Behaviour Guardrails

These requirements reflect explicit corrections from the user. They outrank speculative redesign ideas in this roadmap.

| Preserve | Why / Practical Rule |
| --- | --- |
| Original pink/mint palette, luminous background, Comfortaa and Fraunces | A later redesign was rejected. Do not substitute a dark/gold, beige, purple or generic "luxury" theme. |
| Existing rounded/pill button vocabulary and gradients | Polish interaction, spacing and consistency without changing the established shapes across the site. |
| Matthew + Tony cutout at the top of Home | It is an important identity element. Keep the actual people visible at the established scale. |
| Game, Six Elements, machine demonstrations and gallery on Home | Detail pages add depth; they must not remove the homepage's main attractions. |
| Language choice, sound prompt, two-second sparkle transition, then arrival film | Preserving the old appearance must never mean deleting the requested workflow. |
| Manual Next controls for every reading/reflection stage of the game | Visitors must not be rushed through paragraphs. Only the memory-encoding phase is timed. |
| Unobstructed active game field | No text panel, gradient, blur or modal may cover an active blue/red signal or choice. |
| Meaning slides over the completed game | Blur is appropriate only after active answers are complete, to focus attention on reflection. |
| Real-world warm sparkler character | Tiny bright core, fine warm sparks against black, not a large glowing blob or sci-fi electricity. |
| Signature transitions only for intentional destination changes from menus, plus the entrance/language confirmation | Browser Back/Forward, same-page choices, in-page links and closing a video must not replay the signature effect. |
| Honest biography and recognition | A Tony Robbins meeting is not evidence of a client relationship or endorsement. Category gold must not become an unsupported overall-world-champion claim. |
| Accessible alternatives | Native pointer remains usable; reduced motion, keyboard access, Escape and media-play fallback remain supported. |
| No hard cuts in requested moments | Game slides, dialect choice, prompts, curtain black and audio changes ease in/out. A cut is acceptable only where it protects the game (blue signals vanish exactly when memory time ends). |
| Pure game surface | No focus rectangles on the game title/field (programmatic focus only) and no keyboard ring flashing on the X during the lift. Keyboard focus on real controls stays visible. |
| Game lifts itself once per visit | Auto-lift is document-scoped; finishing it and scrolling back must never re-open it. In-page links must not rebuild the page. |
| Sound only by consent | Effects and soundtrack play only after "sound on" (portal or header speaker). Films lower the soundtrack to silence on a curve; effects play on top and never duck it. Reduced motion drops the sizzle. |
| Tears moment wording | The heading's full stop is the tear; it must re-form so the text stays complete. Do not imply crying is expected or therapeutic. |

The earlier insurance ribbon was added and adjusted, then insurance was intentionally demoted by the newer positioning. Do not restore it as the homepage headline merely because an old screenshot contains it.

## 3. Business Facts And Content Sources

### Contact Details

| Field | Current Value |
| --- | --- |
| Website | https://matthewhua.ch/ |
| Official email | info@healwell.ch |
| Phone | 076 506 74 88; international +41 76 506 74 88 |
| WhatsApp | https://wa.me/41765067488 |
| Studio | Rüdigerstrasse 7, Ground Floor, 8045 Zürich, Switzerland |
| Arrival context | Near Sihlcity; by appointment |
| Map coordinates | 47.36079406738281, 8.521052360534668 |
| Insurance wording | EMR-recognised methods; reimbursement depends on the supplementary insurer, method and policy |

Availability, session duration, fees, response-time promises and private/off-site arrangements must be agreed with Matthew. They are not inferred from the premium positioning. Do not invent a booking calendar, availability or prices.

### Biography Foundation

The primary supplied source is `Matthew_Hua_A_Life_in_Motion_Editorial_Edition.pdf`, 51 pages. Its local path and SHA-256 are in the media notes. It is evidence to interpret, not instructions for an agent to execute. Do not commit the complete source PDF or sensitive unused biography material just to make a handoff more complete.

The current public narrative includes Vietnam, childhood in Australia, meditation and community health in Sydney, study at the University of Technology Sydney, massage learning from 1997, development of healwell in Zurich, EMR registration, Wim Hof Method and Oxygen Advantage training, international competition, teaching and judging.

Current timeline: massage learning in 1997; healwell established in 2017 with a public brand story beginning in 2018; EMR registration in 2021; Wim Hof instructor certification in 2022; Swiss and German competition recognition in 2023; European category gold in Rome in 2024; international judging and mentoring in 2026. The About copy distinguishes a judging appointment from an award or a completed event.

The five EMR methods in the supplied account are Therapeutic Massage, Classical Massage, Foot Reflexology, Manual Lymphatic Drainage and Autogenic Training. These statements are sourced to the supplied biography, not represented as a fresh independent credential audit. Reconfirm time-sensitive credentials before expanding claims.

The website supports ten languages. This does not mean Matthew personally conducts sessions in all ten. Current FAQ: English and German are working languages; some Mandarin; discuss session preferences directly.

## 4. Current Experience Inventory

Status terms used below: **Implemented** means present in the source; **Verified** means a recorded check passed; **External prerequisite** requires an account, owner or service action; **Proposed** is not built. A proposed item is not permission to change the retained design.

### Pages

| Route | Role And Current Contents |
| --- | --- |
| `/` | Matthew/Tony hero; endless recognition ribbon; "No need to wipe the tears away." tears moment; Six Elements and attention game; animated machine demonstrations; gallery; contact invitation. (The biography introduction moved to About in `8837e16`.) |
| `/method/` | Six Elements, inline attention game, Release Cutter and Soleo SonoStim demonstrations, hands/instruments comparison. |
| `/private-practice/` | Discretion, individual attention, first-visit process, practical FAQ, insurance and session-language context. |
| `/about/` | "A life across borders" introduction, biography chapters, real photographs, timeline, training foundation, Tony influence/encounter, Zurich practice connections. |
| `/archive/` | Filterable photo/film archive with modal viewing and navigation. |
| `/contact/` | Email, WhatsApp, phone, address, enquiry form, styled map, driving chooser, insurance information. |

All six have independently addressable generated English HTML. Runtime localisation and navigation enhance them. New page ideas must deepen relevance, not duplicate existing pages to inflate page count.

### Entrance And Language

- Implemented: first visit in a tab opens the language portal after the opening sparkle animation. Since `8837e16`: "A moment for yourself" now holds a deliberate 1s after the sparkle and crossfades into the language choice (previously it could flash for under 200ms).
- Locale priority: valid `?lang=` selection, then saved language, then browser language, then English. `de-CH` and `gsw` map to Zurich Swiss German.
- Languages: English (`en`), Swiss German (`gsw`), High German (`de`), Spanish (`es`), Portuguese (`pt`), French (`fr`), Italian (`it`), Mandarin (`zh`), Vietnamese (`vi`), Japanese (`ja`).
- Nine main flag tiles represent ten languages. The German-family tile is a diagonally split Swiss/German flag. It opens "Deutsch oder Schwiizertüütsch?" with two full-bleed flag choices.
- Detected/saved selection is highlighted with an animated progress treatment and active five-second countdown. Opening the dialect choice, choosing a language, navigating by keyboard or pressing Pause stops automatic commitment. Hidden-page time does not silently consume the choice.
- Both the dialect choice and sound confirmation use a very dark blurred background with continuous warm sparks behind the focused content. Since `8837e16`: the darkness eases in/out; the DE tile blooms into the two flags, which float in counterpoint and glow in turn. The header language control is a pill with the current flag orb and code.
- Sound is a separate explicit choice, not an assumption based on language, previous visits or autoplay capability.
- Reopening language selection from the header retains the entire sound-and-transition workflow. On Home it introduces the film again; on a subpage it preserves the current page.
- First-entry state is tab-session scoped. Language is saved locally. Sound consent is not persisted.

### Film, Portrait And Motion

- Implemented: after the full two-second entrance curtain, the European Championship film starts, with audio only when chosen. The film is not the Inner Fire clip.
- The latest requested almost-full-screen treatment uses an 82%-height upper stage with a contained portrait frame. This supersedes the earlier approximate 70% request.
- Rounded frame, warm edge glow, darkened/blurred homepage and ambient sparks remain. Tap the film to reveal controls. The lower typography area, empty outside area, X after controls are revealed, and Escape dismiss it.
- Autoplay restrictions have a usable play fallback. Low Power Mode and actual device policies still require physical-device checks.
- Implemented in `f811195`: soft white/warm-white silhouette aura, slow 8px float, tiny rotation, and a diagonal one-shot shine after the first visible intro-film dismissal in that document. Reopening the intro or returning to Home does not repeat the shine. A fresh document can show it again after its intro.
- A returning visitor who lands directly on Home gets the float/glow without prematurely using up the shine. Reduced-motion visitors get a static portrait and no sweep.
- Portrait source, likeness, transparent bounds and established responsive positioning are unchanged. About retains its prior subtle 5px float.
- Desktop sparkler cursor is a lightweight visual layer only. No old circle cursor, native-pointer suppression or input-blocking overlay.

### Attention Experiment

- Twelve stable signal positions; three blue signals are memorised during a three-second phase, then selected from memory. A red-signal question follows. Since `8837e16`: the memory clock starts after the 420ms slide fade; the recall question glows and floats; the answer slide always reveals the real red signal crisply above the blur (gold rim when found).
- Active field and instructions occupy separate layout regions. Every signal, including the lowest ones, remains visible and selectable.
- Answer reveal, focus reflection, life lesson, integration and final Matthew/Tony image each wait for deliberate progression.
- Reflection is framed as an invitation, not a diagnosis, test of intelligence or proof of a treatment outcome.
- On Home, reaching the game lifts its existing live instance into a near-full-screen dialog over a dark, sparkling background. No reset or duplicate game is created. Since `8837e16`: a 500ms in-place ignition (ring of light, brightening field) precedes a 900ms lift with an eased backdrop; it lifts itself at most once per document; slides crossfade and teaching slides pass right to left like a torch; no focus rectangles.
- A top-left X is available from the start (since `8837e16`; previously completion only) and a small replay control appears at completion. Outside tap and Escape can close at any stage. Retraction returns the same instance to its homepage position.
- Since `8837e16`: the six element tabs show they open (spring wave and sheen once the game is closed, sideways peek on mobile, quiet shimmer until one is opened, breathing dot on unopened elements).
- The memory timer pauses while the game is closed/hidden. The Method page retains the inline version.

### Sound (since `8837e16`)

- Only after explicit consent (portal or header speaker); consent is never persisted. Declining loads no soundtrack and plays nothing.
- Effects: sparkle sizzle, tear drop (plus softer beads), element-tab wink, recall-tap note, missed-red twinkle, teaching-slide fire whoosh, conclusion pop. Effects mix on top of the soundtrack.
- Soundtrack ("Effortless Prestige", gain 0.3): silent only through the opening sequence, then continuous; any playing film lowers it to silence on an S-curve and returns it afterwards. Hidden tabs fade and pause it.
- External prerequisite: confirm web-use licences for the supplied audio (see MEDIA-NOTES). Physical iPhone/Android checks (silent switch, Low Power Mode, Bluetooth latency) are not yet done.

### Gallery, Technology And Contact

- Gallery begins with the Champ of the Champs photo, then "On the podium, Switzerland". Matthew/Tony is not duplicated as an archive card.
- Four films have matching posters. "Reel 9" remains only in the original upload filename, not the displayed title.
- Gallery backgrounds alone are muted charcoal. Gallery tilt is restrained; machine tilt is even smaller. Device image scale/placement remains protected.
- Technology comparison columns use contained text. Do not reintroduce the old detached bottom labels or unsupported precision/outcome claims.
- Gallery photo/video and driving-choice dialogs share the dark blurred spark atmosphere and dispose it when closed.
- Contact links use Lucide envelope, message and phone icons, now centred beside their labels in explicit three-column rows. The map remains a real Leaflet/OSM map, not an invented navigation display.
- "Drive here" opens Google/Apple driving options. The illustrated route is Zurich HB to the studio, not live routing from the visitor's current position. Device settings control app handoff.
- The contact form posts to FormSubmit for `info@healwell.ch`, with validation, consent, honeypot and provider spam screening. **Mailbox activation and a real delivered-message check remain external prerequisites.** No production message has been sent by automated QA.

## 5. Completed Milestones

| Milestone | State / Relevant Reference |
| --- | --- |
| Initial homepage media, device framing, gallery and attention experiment | Implemented before the current multi-page work; preserved through subsequent changes. |
| Manual game reading controls and separation of instructions from active signals | Implemented after repeated overlay regressions; see repair history. |
| Official email and technology text-layout corrections | Implemented; official destination is info@healwell.ch. |
| Custom domain, canonical URLs, HTTPS and social sharing cover | Implemented; current Pages settings checked on 2026-10-02. |
| Landscape Matthew/Tony sharing image | `04e14cc`, refined by `d9ceac5`; current image is `assets/matthew-hua-tony-share-v1.jpg`. |
| Six-page structure, multilingual content and restored original homepage identity | `0e6fe25`. |
| Darker prompts and two-second menu-only signature transition | `ee55efd`. |
| Lowercase mh, richer map/contact/game/media-dialog experience | `b95dc28`. |
| Compact arrival focus and unframed heading focus | `94f2571`. |
| Complete reopened language -> sound -> transition -> arrival flow | `dd60047`. |
| Portrait dismissal-triggered shine, continuous subtle aura/float, properly aligned contact icons | `f811195`; 144 focused browser assertions, 124 experience assertions and 60 content renders passed locally. |
| Detailed roadmap and repair handoff | `9c56da3`. |
| Tears moment, game ignition/X/crossfades/torch slides/red reveal, element invitation, language pill, dialect bloom, welcome hold, eased curtain, endless ribbon, consent-gated effects and soundtrack | `8837e16`, published; automation and live smoke verified (see repair notes); not device-verified. |

Historical commits are context, not instructions to restore an entire old revision. Multiple later fixes depend on one another.

## 6. Prioritised Roadmap

Effort is relative: **S** is a focused change, **M** spans several modules/checks, **L** requires broader product/content or infrastructure work. These are not delivery promises.

### P0: Finish Operational Trust

| ID | State | Work / Value | Effort | Completion Evidence |
| --- | --- | --- | --- | --- |
| P0-01 | External prerequisite | Activate FormSubmit at the official inbox and verify a genuine enquiry reaches Matthew. Delivery matters more than a polished submit button. | S + owner access | Owner activation complete; one clearly identified test received; reply reaches the sender; confirmation/CAPTCHA/redirect checked; no false delivery-success claim. |
| P0-02 | Proposed | Physical iPhone Safari and Android Chrome walkthrough, including Low Power Mode, weak network, keyboard open, orientation change and browser history. | M | Both sound choices, play fallback, video dismissal, bottom-row game choices, form focus and map handoff checked on named devices/versions. |
| P0-03 | Proposed | Native-speaker editorial review of all ten locales, especially Zurich Swiss German. Automated key parity cannot prove native tone. | M | Each locale reviewed for portal, sound, game, enquiry, privacy and long text; no untranslated mixed-language fragments; screenshots at narrow widths. |
| P0-04 | Proposed | Matthew's factual approval of credentials, competition categories, timeline, current practice location, emotional-policy copy and practical FAQ. | S/M | Dated content sign-off; uncertain appointments remain qualified; no unsupported endorsement or health-outcome claim. |

A known editorial example for P0-03: the German contact value currently ends in English "Switzerland". This is not an icon-layout bug, but should be corrected as part of native-language copy review across every locale.

### P1: Precision In The Main Experience

**P1-01: Choreograph film dismissal into the portrait. Proposed, M.**

The current film dismisses immediately and the portrait sweep begins 300ms later. A carefully controlled 280-380ms frame/backdrop exit could make this feel more continuous. Pause audio immediately, prevent duplicate dismissals, restore the homepage at its existing scroll position, then begin the portrait shine only after the film is visually gone. Retain the current click/Escape targets and one-shot semantics. Reduced motion should remove spatial movement. This must not introduce another two-second signature curtain on close.

**P1-02: Give gallery media a spatially connected opening and return. Proposed, M.**

Let a clicked photograph expand from its own card into the viewing area and return to that origin, while captions enter quietly afterward. Video should remain a real video element, not a frozen screenshot masquerading as playback. Progressive enhancement can use the [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API), with a modest transform/fade fallback where unsuitable. Keep focus, gallery sequence, page scroll, reduced motion and rapid close/reopen safe. This is local dialog movement, not a replay of the menu sparkler.

**P1-03: Establish a small shared motion system. Proposed, M.**

Create named timing/easing tokens only where they eliminate real inconsistency. Suggested starting ranges: control feedback 160-220ms, simple dialog transitions 280-420ms, existing game lift 650ms/retract 520ms, signature transition exactly about 2000ms. Test by feel and on devices. Buttons should acknowledge press without moving their hit target, changing width or bouncing extravagantly. Hover must never be the only way to discover an action. Preserve current button shapes.

**P1-04: Audit the complete game as a teaching moment. Proposed, M.**

Recheck all answer paths, keyboard-only play, interrupted memory phases, completed/reflection phases, replay, menu cancellation and orientation changes. Tighten pacing and focus continuity without timing reading slides. Ensure the final thought and Matthew/Tony image remain visible together. Any stronger effect should direct attention to meaning after the answers, never make the challenge harder by hiding information.

**P1-05: Treat performance as part of the visual design. Proposed, M.**

Measure the large transparent V3 portrait, its three CSS layers, ambient canvases, background animation and video decoding on representative phones. Consider separately named responsive derivatives with tighter alpha bounds, but only after matching current visible framing and keeping the original untouched. Do not casually crop/reposition the people again. Stop offscreen work, cap canvas resolution/particles sensibly, and avoid preloading every film. Respect reduced motion and reduced-data preferences where available; media still needs an immediate poster and clear play fallback.

**P1-06: Make enquiry feel personal and trustworthy. Proposed, M after P0-01.**

Refine form validation, submission progress, failure recovery and success wording so a visitor never wonders whether the message was accepted. Do not display "delivered" based only on a query parameter. Keep typed content recoverable during a recoverable error without persisting sensitive messages in browser storage. Offer direct email/WhatsApp alternatives. Any backend replacement needs privacy, spam prevention, credential storage and operational ownership defined first.

### P2: Useful Depth And Editorial Finish

| ID | Proposed Work | Dependencies / Acceptance |
| --- | --- | --- |
| P2-01 | An elegant first-visit guide within Private Practice: preparation, clothing, arrival/accessibility and what a session feels like. | Matthew supplies accurate practical details. Clear sections, no unnecessary new navigation destination. |
| P2-02 | Selective About timeline reveals with real photographs and concise captions. | Preserve documentary credits, readable chronology and static/reduced-motion presentation. Never auto-advance biography text. |
| P2-03 | Useful arrival information: verified entrance photo, step-free access, parking/public-transport details and copy-address confirmation. | Verify facts with Matthew and current transport/location sources. Do not invent parking or accessibility. |
| P2-04 | Carefully edited workshop/teaching page when there are real dates or a meaningful enquiry offer. | Confirm actual programme and availability; no empty calendar, fabricated scarcity or fake booking inventory. |
| P2-05 | Permissioned testimonials or an editorial recognition dossier. | Written publication consent and accurate award/event provenance; no implied Tony endorsement. Keep client discretion central. |
| P2-06 | Stronger film accessibility: accurate captions/transcripts and thoughtful poster variants. | Review every spoken language, embedded text and media rights. Text remains useful when audio is declined. |
| P2-07 | Search and sharing refinement: route-specific descriptions, verified structured data and a deliberate multilingual indexing strategy. | Current server-rendered HTML is English; runtime dictionaries alone are not static translated pages. Decide canonical/hreflang generation together rather than adding inconsistent tags. |
| P2-08 | Implemented in `8837e16` at the user's request: consent-based effects and a soundtrack. Remaining: licence confirmation, device listening tests and level tuning on phone speakers. | No surprise audio; nothing before consent; no re-enabling audio after mute. |
| P2-09 | CSS cascade consolidation in small, visually tested sections. | Capture baselines first. Preserve specificity/layout contracts. Do not turn cleanup into a palette or component redesign. |
| P2-10 | Privacy-aware performance/error monitoring and a lightweight release dashboard. | Define data minimisation, owner access, service costs and alert usefulness. Never record enquiry bodies or sensitive visitor input. |

## 7. Proposed Quality Gates

These are targets for future measurement, not claims that the current site already meets every threshold.

- Performance: field 75th-percentile LCP at or below 2.5s, INP at or below 200ms, CLS at or below 0.1, following the [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds). Record mobile and desktop evidence separately. Also measure the entrance sequence specifically; a nominal page-load score does not describe whether the portal/film feels responsive.
- Motion: no ongoing animation in a dismissed dialog; no hidden video audio; primary interactions remain smooth on a representative phone. Measure frame time rather than claiming 60fps from a desktop screenshot.
- Layout: no horizontal overflow at 320px; no overlapping labels or clipped controls at 200% text zoom; reserved media/control dimensions prevent jumping.
- Interaction: keyboard access and visible focus for controls, coherent focus return after every modal, Escape/cancel, reliable touch hit areas, no pointer interception by decorative layers.
- Accessibility: aim for 44px practical touch targets, readable contrast and meaningful icon labels. Carry out a full manual accessibility review before claiming conformance; automated checks are not a certification.
- Localisation: all dictionary keys match, interpolation tokens survive translation, and actual native-language review supplements automated rendering checks.
- Media: correct image/video for each title, preserved credits, working posters, compatible codecs, visible playback and consent-respecting sound.
- Operations: a verified enquiry-delivery path, valid HTTPS, preserved domain and mail configuration, and documented release evidence.

## 8. Next Recommended Sequence

1. Complete the owner-dependent enquiry activation and physical-device checks.
2. Obtain factual and native-language review, correcting small copy issues without changing the design.
3. Prototype only P1-01, the film-to-portrait exit choreography, against the current visual baseline.
4. Add gallery shared-element movement and coherent micro-interaction timings in separate, testable releases.
5. Optimise large media and offscreen animation using measured bottlenecks.
6. Add practical editorial depth from verified information, not speculative pages.

Do not implement this entire roadmap as one redesign. A premium experience improves through controlled, observable refinements. After each release, update the completed inventory, remaining issues and verification record in both handoff documents.
