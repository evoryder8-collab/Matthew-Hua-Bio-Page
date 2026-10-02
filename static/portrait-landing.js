// After the arrival film: Matthew and Tony arrive from behind the viewer's head, huge,
// close and overexposed, then descend forward into the hero on a damped spring. The
// light adapts like an eye leaving the sun, the landing sends a ring of light outward,
// and the homepage gathers around them, nearest elements first.

const DURATION = 2000;              // whole flight, including the settle
const ZETA = 0.5;                   // damping: one soft overshoot, then rest
const OMEGA = 4.2;                  // natural frequency (rad/s): touchdown ~0.6s, rest by ~2s
const SAMPLES = 100;

function spring(t) {
  const damped = OMEGA * Math.sqrt(1 - ZETA * ZETA);
  return 1 - Math.exp(-ZETA * OMEGA * t) * (Math.cos(damped * t) + (ZETA * OMEGA / damped) * Math.sin(damped * t));
}

/** Prepare while the film is still fading: hides the page and raises the light. */
export function preparePortraitLanding(hero) {
  const doc = hero.ownerDocument;
  const win = doc.defaultView;
  const figure = hero.querySelector('.heritage-figure');
  const inner = hero.querySelector('.heritage-inner');
  if (!figure || !inner) return null;
  win.scrollTo({ top: 0, behavior: 'instant' });
  doc.body.classList.add('is-landing');
  // Hold the page still while they land (trackpad momentum would otherwise scroll it).
  doc.documentElement.classList.add('landing-lock');
  const part = (name) => { const node = doc.createElement('div'); node.className = name; return node; };
  const stage = part('landing-stage');
  stage.setAttribute('aria-hidden', 'true');
  const exposure = part('landing-exposure');
  const flare = part('landing-flare');
  const ring = part('landing-ring');
  stage.append(exposure, flare, ring);
  inner.prepend(stage);
  const rect = figure.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height * 0.45;
  stage.style.setProperty('--land-x', `${cx}px`);
  stage.style.setProperty('--land-y', `${cy}px`);
  Object.assign(ring.style, { left: `${cx}px`, top: `${rect.bottom - 8}px` });
  const animations = [];   // flight and light: cancelled at the end so CSS takes over again
  const timers = [];
  let finished = false;
  const run = (node, frames, options) => { if (!node?.animate) return null; const a = node.animate(frames, options); animations.push(a); return a; };
  const later = (fn, ms) => timers.push(win.setTimeout(fn, ms));

  function cleanup() {
    if (finished) return;
    finished = true;
    timers.forEach((id) => win.clearTimeout(id));
    animations.forEach((animation) => animation.cancel());
    stage.remove();
    doc.body.classList.remove('is-landing');
    doc.documentElement.classList.remove('landing-lock');
  }

  // The page appears around the portrait: each element starts pulled toward it, small,
  // soft and light-struck, and settles outward in order of distance.
  function summon() {
    const near = [
      doc.querySelector('.site-header'),
      ...hero.querySelectorAll('.heritage-inner > .eyebrow, .heritage-hero h1 > span, .heritage-tag, .heritage-sub, .heritage-actions > *, .heritage-film'),
      doc.querySelector('.heritage-recognition'),
    ].filter(Boolean);
    for (const node of near) {
      const box = node.getBoundingClientRect();
      const dx = box.left + box.width / 2 - cx;
      const dy = box.top + box.height / 2 - cy;
      const distance = Math.hypot(dx, dy);
      // fill:'backwards' only, so these end by themselves without touching later styles.
      node.animate?.([
        { opacity: 0, transform: `translate(${(-dx * 0.16).toFixed(1)}px, ${(-dy * 0.16).toFixed(1)}px) scale(.9)`, filter: 'blur(8px) brightness(1.9)' },
        { opacity: 1, transform: 'none', filter: 'blur(0) brightness(1)' },
      ], { duration: 1100, delay: 40 + distance * 0.45, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    }
    for (const node of doc.querySelectorAll('#main > :not(#hero):not(.heritage-recognition), .site-footer')) {
      node.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 700, easing: 'ease-out', fill: 'backwards' });
    }
    doc.body.classList.remove('is-landing');
  }

  function start(onDone = () => {}) {
    if (finished) return;
    const height = win.innerHeight;
    const frames = [];
    let impact = DURATION / 1000;
    for (let index = 0; index <= SAMPLES; index++) {
      const t = (index / SAMPLES) * DURATION / 1000;
      const progress = spring(t);
      if (progress >= 1 && impact === DURATION / 1000) impact = t;
      const rest = 1 - progress;                 // > 0 still arriving, < 0 overshooting
      const approach = Math.max(0, rest);
      const over = Math.min(0, rest);
      // Passing over the viewer's head: high, huge and tipped toward us, then down and away.
      const scale = 1 + approach * 4.6 + over * 0.3;
      const y = -approach * height * 0.34 - over * height * 0.035;
      const tilt = -approach * 16 + over * 3;
      const blur = approach * 13;
      const bright = 1 + Math.pow(approach, 1.15) * 2.5;
      frames.push({
        offset: index / SAMPLES,
        opacity: Math.min(1, t / 0.14),
        transform: `perspective(1300px) translate3d(0, ${y.toFixed(1)}px, 0) rotateX(${tilt.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
        filter: `blur(${blur.toFixed(2)}px) brightness(${bright.toFixed(3)}) saturate(${(1 - approach * 0.35).toFixed(3)})`,
      });
    }
    run(figure, frames, { duration: DURATION, easing: 'linear', fill: 'both' });
    // Exposure adapts: blinding warm white that falls away as they come into focus.
    run(exposure, [{ opacity: 1 }, { opacity: 1, offset: 0.1 }, { opacity: 0.35, offset: 0.38 }, { opacity: 0, offset: 0.62 }], { duration: DURATION, easing: 'ease-out', fill: 'forwards' });
    run(flare, [{ opacity: 1, transform: 'scale(2.4)' }, { opacity: 0.55, transform: 'scale(1.3)', offset: 0.3 }, { opacity: 0, transform: 'scale(.8)' }], { duration: DURATION * 0.62, easing: 'cubic-bezier(.3,0,.5,1)', fill: 'forwards' });
    const impactMs = impact * 1000;
    later(() => {
      // Touchdown: a ring of light spreads from beneath them and their aura flares once.
      run(ring, [{ opacity: 0.95, transform: 'scale(.25)' }, { opacity: 0.5, transform: 'scale(1.6)', offset: 0.45 }, { opacity: 0, transform: 'scale(3.2)' }], { duration: 1100, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
      run(hero.querySelector('.portrait-aura'), [{ opacity: 0.32 }, { opacity: 0.9, offset: 0.25 }, { opacity: 0.32 }], { duration: 1000, easing: 'ease-out' });
      summon();
    }, impactMs);
    later(() => { cleanup(); onDone(); }, Math.max(DURATION, impactMs + 1100) + 120);
  }

  return { start, cancel: cleanup };
}
