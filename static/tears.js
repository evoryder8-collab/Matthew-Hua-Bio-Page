// "No need to wipe the tears away." A wave of light travels through the heading to
// its full stop, which gathers into a tear, pinches free, falls and splashes onto the
// paragraph below. Decorative only: the heading keeps an intact accessible copy, the
// remaining full stop re-forms, and reduced-motion visitors receive the static text.

const TAU = Math.PI * 2;
const STOPS = new Set(['.', '。', '｡', '．']);
const GRAVITY = 1700;            // px/s², a little dreamier than a real drop at this scale
const WAVE_MS = 1150;            // one letter's rise and settle
const GATHER_MS = 780;           // the full stop swells and sags before letting go
const PINCH_MS = 120;            // the neck thins to nothing while the drop starts to fall
const INK = [200, 29, 119];      // #c81d77, the heading colour
const GLOW = [228, 88, 159];     // the wave's brightened ink
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (a, b, t) => a + (b - a) * t;
const mixRGB = (a, b, t) => a.map((value, index) => Math.round(mix(value, b[index], t)));
const rgba = ([r, g, b], alpha) => `rgba(${r},${g},${b},${clamp(alpha)})`;
const inOutSine = (t) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
const inCubic = (t) => clamp(t) ** 3;
const outCubic = (t) => 1 - (1 - clamp(t)) ** 3;

/** Mount once per rendered homepage; destroy() stops every timer, frame and observer. */
export function mountTearsMoment(section, { reducedMotion, onImpact = () => {} } = {}) {
  const doc = section?.ownerDocument;
  const win = doc?.defaultView;
  const title = section?.querySelector('.tears-title');
  const copy = section?.querySelector('.tears-copy');
  const canvas = section?.querySelector('.tears-canvas');
  const context = canvas?.getContext?.('2d');
  const reduced = () => Boolean(reducedMotion?.matches ?? reducedMotion);
  if (!win || !title || !copy || !context || reduced()) {
    if (section) section.dataset.tearState = 'static';
    return { destroy() {} };
  }

  const lang = doc.documentElement.lang || 'en';
  const timers = new Set();
  const animations = [];
  let destroyed = false;
  let frame = null;
  let observer = null;
  let state = 'idle';
  // While the tear falls, scrolling slows right down so it can be watched; it frees on 'done'.
  let lastTouch = null;
  const brakeWheel = (event) => { if (event.ctrlKey) return; event.preventDefault(); win.scrollBy(0, event.deltaY * 0.15); };
  const brakeStart = (event) => { lastTouch = event.touches[0]?.clientY ?? null; };
  const brakeMove = (event) => {
    const y = event.touches[0]?.clientY;
    if (lastTouch === null || y === undefined) return;
    event.preventDefault(); win.scrollBy(0, (lastTouch - y) * 0.15); lastTouch = y;
  };
  let braking = false;
  function brake(on) {
    if (on === braking) return;
    braking = on;
    const method = on ? 'addEventListener' : 'removeEventListener';
    win[method]('wheel', brakeWheel, { passive: false });
    win[method]('touchstart', brakeStart, { passive: true });
    win[method]('touchmove', brakeMove, { passive: false });
  }
  const setState = (next) => { state = next; section.dataset.tearState = next; brake(['wave', 'gather', 'falling', 'splash'].includes(next)); };

  function segments(text, granularity) {
    if (win.Intl?.Segmenter) {
      return [...new win.Intl.Segmenter(lang, { granularity }).segment(text)]
        .map(({ segment, isWordLike }) => ({ text: segment, word: granularity !== 'word' || isWordLike }));
    }
    if (granularity === 'grapheme') return Array.from(text, (character) => ({ text: character, word: true }));
    return text.split(/(\s+)/).filter(Boolean).map((part) => ({ text: part, word: !/^\s+$/.test(part) }));
  }

  // Words stay unbreakable; punctuation joins the word before it so a stop never wraps alone.
  function wordSpans(text, className, split) {
    const fragment = doc.createDocumentFragment();
    const spans = [];
    let current = null;
    for (const segment of segments(text.trim(), 'word')) {
      if (/^\s+$/.test(segment.text)) { fragment.append(doc.createTextNode(' ')); current = null; continue; }
      if (!current || segment.word) {
        current = doc.createElement('span');
        current.className = className;
        fragment.append(current);
        spans.push(current);
      }
      if (split) split(current, segment.text);
      else current.append(segment.text);
    }
    return { fragment, spans };
  }

  const heading = title.textContent.trim();
  const chars = [];
  const letters = wordSpans(heading, 'tears-word', (word, text) => {
    for (const grapheme of segments(text, 'grapheme')) {
      const character = doc.createElement('span');
      character.className = 'tears-char';
      character.textContent = grapheme.text;
      word.append(character);
      chars.push(character);
    }
  });
  const label = doc.createElement('span');
  label.className = 'tears-sr';
  label.textContent = heading;
  const visual = doc.createElement('span');
  visual.className = 'tears-letters';
  visual.setAttribute('aria-hidden', 'true');
  visual.append(letters.fragment);
  title.replaceChildren(label, visual);
  const last = chars.at(-1);
  const dot = last && STOPS.has(last.textContent) ? last : null;
  dot?.classList.add('tears-dot');
  const ripple = wordSpans(copy.textContent, 'tears-ripple-word');
  copy.replaceChildren(ripple.fragment);
  const words = ripple.spans;

  function later(callback, delay) {
    const id = win.setTimeout(() => { timers.delete(id); if (!destroyed) callback(); }, delay);
    timers.add(id);
  }

  function animate(node, keyframes, options) {
    if (!node.animate) return null;
    const animation = node.animate(keyframes, options);
    animations.push(animation);
    return animation;
  }

  // ---------------------------------------------------------------- geometry
  function local(rect, origin) {
    return { left: rect.left - origin.left, top: rect.top - origin.top, right: rect.right - origin.left, bottom: rect.bottom - origin.top, width: rect.width, height: rect.height };
  }

  /** The ink of the source glyph, measured from its font metrics and baseline. */
  function sourceGeometry(origin) {
    const node = dot || last;
    const style = win.getComputedStyle(node);
    const size = parseFloat(style.fontSize) || 64;
    const rect = local(node.getBoundingClientRect(), origin);
    const probe = doc.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    node.append(probe);
    const baseline = probe.getBoundingClientRect().top - origin.top;
    probe.remove();
    const measure = doc.createElement('canvas').getContext('2d');
    let ink = null;
    if (measure) {
      measure.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const metrics = measure.measureText(node.textContent);
      const left = rect.left - metrics.actualBoundingBoxLeft;
      const right = rect.left + metrics.actualBoundingBoxRight;
      const top = baseline - metrics.actualBoundingBoxAscent;
      const bottom = baseline + metrics.actualBoundingBoxDescent;
      if (right > left && bottom > top) ink = { left, right, top, bottom };
    }
    if (!dot) {
      // A heading without a full stop lets a tear form beneath its final letter.
      const r = Math.max(2.5, size * 0.055);
      return { x: rect.left + rect.width * 0.55, y: baseline + r * 0.6, r, size, hide: false };
    }
    if (!ink || ink.right - ink.left > size * 0.4) {
      const r = size * 0.06;
      return { x: rect.left + rect.width * 0.42, y: baseline - r, r, size, hide: true };
    }
    return { x: (ink.left + ink.right) / 2, y: (ink.top + ink.bottom) / 2, r: Math.max(2, (ink.right - ink.left) / 2), size, hide: true };
  }

  /** Where the tear meets the paragraph: the top of its first line, as close to the stop as text allows. */
  function surfaceGeometry(origin, x) {
    const firstTop = words[0]?.getBoundingClientRect().top;
    const line = words.map((word) => word.getBoundingClientRect())
      .filter((rect) => Math.abs(rect.top - firstTop) < 4);
    const size = parseFloat(win.getComputedStyle(copy).fontSize) || 24;
    if (!line.length) {
      const rect = local(copy.getBoundingClientRect(), origin);
      return { x: clamp(x, rect.left + 12, rect.right - 12), y: rect.top + size * 0.35, size };
    }
    const left = Math.min(...line.map((rect) => rect.left)) - origin.left;
    const right = Math.max(...line.map((rect) => rect.right)) - origin.left;
    const top = line[0].top - origin.top;
    const height = line[0].height;
    return { x: clamp(x, left + size * 0.4, right - size * 0.4), y: top + (height - size) / 2 + size * 0.24, size };
  }

  // ---------------------------------------------------------------- drawing
  function tearBody(rx, ry, tip, glass, alpha) {
    // Ink while it is still the full stop; pink-tinted glass by the time it lands.
    const top = mixRGB(GLOW, [255, 226, 241], glass);
    const bottom = mixRGB(GLOW, [212, 52, 136], glass);
    const body = context.createLinearGradient(0, -tip, 0, ry);
    body.addColorStop(0, rgba(top, mix(1, 0.62, glass) * alpha));
    body.addColorStop(0.55, rgba(mixRGB(top, bottom, 0.5), mix(1, 0.74, glass) * alpha));
    body.addColorStop(1, rgba(bottom, mix(1, 0.92, glass) * alpha));
    context.shadowColor = rgba(INK, 0.32 * alpha);
    context.shadowBlur = rx * 1.8;
    context.fillStyle = body;
    context.fill();
    context.shadowBlur = 0;
    const caustic = context.createRadialGradient(rx * 0.16, ry * 0.4, 0, rx * 0.16, ry * 0.4, rx * 0.82);
    caustic.addColorStop(0, `rgba(255,247,251,${0.78 * glass * alpha})`);
    caustic.addColorStop(1, 'rgba(255,247,251,0)');
    context.fillStyle = caustic;
    context.fill();
    context.lineWidth = Math.max(0.6, rx * 0.1);
    context.strokeStyle = `rgba(255,255,255,${0.42 * glass * alpha})`;
    context.stroke();
  }

  function highlight(x, y, rx, ry, glass, alpha) {
    context.beginPath();
    context.ellipse(x, y, rx, ry, -0.5, 0, TAU);
    context.fillStyle = `rgba(255,255,255,${(0.3 + 0.62 * glass) * alpha})`;
    context.fill();
  }

  /** A falling teardrop: round bulb at (x, y), point trailing opposite its motion. */
  function drawTear(x, y, r, tip, angle, wobble, glass, alpha = 1) {
    const rx = r * (1 + wobble);
    const ry = r * (1 - wobble);
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.beginPath();
    context.moveTo(0, -tip);
    context.bezierCurveTo(rx * 0.3, -tip * 0.62, rx, -ry * 0.64, rx, 0);
    context.ellipse(0, 0, rx, ry, 0, 0, Math.PI, false);
    context.bezierCurveTo(-rx, -ry * 0.64, -rx * 0.3, -tip * 0.62, 0, -tip);
    context.closePath();
    tearBody(rx, ry, tip, glass, alpha);
    highlight(-rx * 0.36, -ry * 0.2 - (tip - r) * 0.22, r * 0.19, r * 0.34, glass, alpha);
    highlight(rx * 0.3, ry * 0.5, r * 0.08, r * 0.05, glass, alpha * 0.8);
    context.restore();
  }

  /** The full stop still holding the swelling drop: two beads joined by a thinning neck. */
  function drawGather(a, b, neck, glass) {
    context.save();
    context.beginPath();
    context.moveTo(a.x + a.r, a.y);
    context.arc(a.x, a.y, a.r, 0, TAU, false);
    context.moveTo(b.x + b.r, b.y);
    context.arc(b.x, b.y, b.r, 0, TAU, false);
    if (neck > 0.05 && b.y - a.y > a.r * 0.4) {
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + a.r * 0.3 + b.y - b.r * 0.45) / 2;
      context.moveTo(a.x + a.r * 0.92, a.y + a.r * 0.3);
      context.quadraticCurveTo(midX + neck, midY, b.x + b.r * 0.88, b.y - b.r * 0.45);
      context.lineTo(b.x - b.r * 0.88, b.y - b.r * 0.45);
      context.quadraticCurveTo(midX - neck, midY, a.x - a.r * 0.92, a.y + a.r * 0.3);
      context.closePath();
    }
    const top = mixRGB(GLOW, [255, 226, 241], glass);
    const bottom = mixRGB(GLOW, [212, 52, 136], glass);
    const body = context.createLinearGradient(0, a.y - a.r, 0, b.y + b.r);
    body.addColorStop(0, rgba(top, mix(1, 0.7, glass)));
    body.addColorStop(1, rgba(bottom, mix(1, 0.92, glass)));
    context.shadowColor = rgba(GLOW, 0.55 * (1 - glass) + 0.2);
    context.shadowBlur = b.r * 2.2;
    context.fillStyle = body;
    context.fill('nonzero');
    context.shadowBlur = 0;
    highlight(b.x - b.r * 0.36, b.y - b.r * 0.22, b.r * 0.18, b.r * 0.3, glass, 1);
    context.restore();
  }

  function drawBead(x, y, r, colour, glow, alpha) {
    if (alpha <= 0.01 || r <= 0) return;
    context.save();
    context.beginPath();
    context.arc(x, y, r, 0, TAU);
    context.shadowColor = rgba(colour, 0.6 * glow * alpha);
    context.shadowBlur = r * 2.4 * glow;
    context.fillStyle = rgba(colour, alpha);
    context.fill();
    context.shadowBlur = 0;
    highlight(x - r * 0.34, y - r * 0.3, r * 0.2, r * 0.3, 0.15, alpha * 0.8);
    context.restore();
  }

  function drawDroplet(droplet, alpha) {
    const speed = Math.hypot(droplet.vx, droplet.vy);
    const stretch = 1 + Math.min(1.3, speed / 420);
    context.save();
    context.translate(droplet.x, droplet.y);
    context.rotate(Math.atan2(droplet.vy, droplet.vx));
    const paint = context.createRadialGradient(-droplet.r * 0.3, -droplet.r * 0.3, 0, 0, 0, droplet.r * stretch);
    paint.addColorStop(0, `rgba(255,248,252,${alpha})`);
    paint.addColorStop(0.55, `rgba(240,135,190,${0.85 * alpha})`);
    paint.addColorStop(1, `rgba(200,29,119,${0.55 * alpha})`);
    context.beginPath();
    context.ellipse(0, 0, droplet.r * stretch, droplet.r, 0, 0, TAU);
    context.fillStyle = paint;
    context.shadowColor = `rgba(200,29,119,${0.28 * alpha})`;
    context.shadowBlur = droplet.r * 2;
    context.fill();
    context.restore();
  }

  function drawRipple(ring, now) {
    const progress = (now - ring.start) / ring.duration;
    if (progress <= 0 || progress >= 1) return;
    const radius = ring.radius * outCubic(progress) + ring.base;
    const alpha = (1 - progress) ** 1.5 * (1 - Math.exp(-progress * 14)) * ring.strength;
    context.save();
    // A faint wet sheen inside the ring, then the ring's pink crest and white highlight.
    const sheen = context.createRadialGradient(ring.x, ring.y, 0, ring.x, ring.y, radius);
    sheen.addColorStop(0, `rgba(255,214,236,${0.22 * alpha})`);
    sheen.addColorStop(0.8, `rgba(255,214,236,${0.1 * alpha})`);
    sheen.addColorStop(1, 'rgba(255,214,236,0)');
    context.save();
    context.translate(ring.x, ring.y);
    context.scale(1, 0.2);
    context.translate(-ring.x, -ring.y);
    context.fillStyle = sheen;
    context.beginPath();
    context.arc(ring.x, ring.y, radius, 0, TAU);
    context.fill();
    context.restore();
    context.beginPath();
    context.ellipse(ring.x, ring.y, radius, radius * 0.2, 0, 0, TAU);
    context.lineWidth = mix(2.4, 0.6, progress) * ring.scale;
    context.strokeStyle = `rgba(200,29,119,${0.64 * alpha})`;
    context.shadowColor = `rgba(255,150,205,${0.6 * alpha})`;
    context.shadowBlur = 6 * ring.scale;
    context.stroke();
    context.shadowBlur = 0;
    context.beginPath();
    context.ellipse(ring.x, ring.y + 1.2 * ring.scale, Math.max(0, radius - 2 * ring.scale), Math.max(0, radius - 2 * ring.scale) * 0.2, 0, 0, Math.PI);
    context.lineWidth = mix(1.2, 0.3, progress) * ring.scale;
    context.strokeStyle = `rgba(255,255,255,${0.85 * alpha})`;
    context.stroke();
    context.restore();
  }

  // ---------------------------------------------------------------- the paragraph receives it
  function rippleWords(impact, scale) {
    const origin = canvas.getBoundingClientRect();
    const base = win.getComputedStyle(copy).color.match(/\d+(\.\d+)?/g)?.slice(0, 3).map(Number) || [36, 20, 32];
    for (const word of words) {
      const rect = word.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - origin.left - impact.x;
      const dy = (rect.top + rect.height / 2 - origin.top - impact.y) * 1.7;
      const distance = Math.hypot(dx, dy);
      const amplitude = 7 * scale * Math.exp(-distance / 260);
      if (amplitude < 0.3) continue;
      const delay = distance / 0.42;
      animate(word, [
        { transform: 'translateY(0)' },
        { transform: `translateY(${-amplitude}px)`, offset: 0.26 },
        { transform: `translateY(${amplitude * 0.4}px)`, offset: 0.56 },
        { transform: `translateY(${-amplitude * 0.12}px)`, offset: 0.8 },
        { transform: 'translateY(0)' },
      ], { duration: 1100, delay, easing: 'cubic-bezier(.3,0,.2,1)' });
      const tint = 0.75 * Math.exp(-distance / 150);
      if (tint > 0.06) {
        const colour = `rgb(${mixRGB(base, INK, tint).join(',')})`;
        animate(word, [
          { color: `rgb(${base.join(',')})`, textShadow: '0 0 0 rgba(255,170,215,0)' },
          { color: colour, textShadow: `0 0 ${Math.round(16 * tint)}px rgba(255,170,215,${0.8 * tint})`, offset: 0.3 },
          { color: `rgb(${base.join(',')})`, textShadow: '0 0 0 rgba(255,170,215,0)' },
        ], { duration: 1600, delay, easing: 'ease-out' });
      }
    }
  }

  // ---------------------------------------------------------------- choreography
  function sizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const dpr = Math.min(2, Math.max(1, win.devicePixelRatio || 1));
    canvas.width = Math.ceil(bounds.width * dpr);
    canvas.height = Math.ceil(bounds.height * dpr);
    context.setTransform(canvas.width / bounds.width, 0, 0, canvas.height / bounds.height, 0, 0);
    return bounds;
  }

  function releaseCanvas() {
    canvas.width = 0;
    canvas.height = 0;
  }

  function startDrop() {
    if (destroyed) return;
    const origin = sizeCanvas();
    const source = sourceGeometry(origin);
    const surface = surfaceGeometry(origin, source.x);
    const r0 = source.r;
    const bulbRadius = Math.max(r0 * 1.9, 5.5);
    const scale = clamp(bulbRadius / 8, 0.6, 1.6);
    // Rings spread in proportion to the column, so a phone keeps them within the text.
    const spread = clamp(origin.width / 1000, 0.55, 1);
    const fallFrom = source.y + r0 * 3.4;
    const depth = Math.max(40, surface.y - bulbRadius - fallFrom);
    const v0 = 70;
    const fallTime = (-v0 + Math.sqrt(v0 * v0 + 2 * GRAVITY * depth)) / GRAVITY;
    const vx = clamp((surface.x - source.x) / fallTime, -260, 260);
    const droplets = [];
    const ripples = [];
    let begin = null;
    let last = null;
    let falling = null;
    let satellite = null;
    let impact = null;
    let jet = null;
    let anchorBack = null;
    let restored = false;

    if (source.hide) {
      for (const animation of dot.getAnimations?.() || []) animation.cancel();
      dot.classList.add('is-falling');
    }
    setState('gather');

    function splash(x, y, count, strength) {
      for (let index = 0; index < count; index++) {
        const side = index % 2 ? 1 : -1;
        const angle = side * (0.3 + Math.random() * 0.95);
        const speed = (120 + Math.random() * 270) * strength * scale;
        droplets.push({ x: x + side * Math.random() * 3 * scale, y: y - 1, vx: Math.sin(angle) * speed, vy: -Math.cos(angle) * speed, r: (0.9 + Math.random() * 1.5) * scale * strength, floor: y + 3 * scale });
      }
    }

    function ring(x, y, start, radius, duration, strength) {
      ripples.push({ x, y, start, radius: radius * scale * spread, base: 2 * scale, duration, strength, scale });
    }

    // strength: 1 for the tear itself, smaller for the beads that follow it down.
    function sound(strength) {
      try { onImpact(strength); } catch { /* sound is decorative */ }
    }

    function land(x, y, now) {
      impact = { x, y, at: now };
      setState('splash');
      sound(1);
      splash(x, y, 14, 1);
      ring(x, y, now, 190, 1750, 1);
      ring(x, y, now + 160, 140, 1550, 0.8);
      ring(x, y, now + 330, 92, 1300, 0.6);
      rippleWords({ x, y }, scale);
      jet = { x, y: y - 2, vx: 0, vy: -290 * Math.sqrt(scale), r: bulbRadius * 0.42, launch: now + 120, floor: y, live: false };
    }

    function step(now) {
      frame = null;
      if (destroyed) return;
      if (begin === null) { begin = now; last = now; }
      const elapsed = now - begin;
      // Real time down to 20fps; beyond that, slow down rather than leap through the paragraph.
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      context.clearRect(0, 0, origin.width, origin.height);

      // 1. The stop swells and sags as the wave's energy gathers in it.
      if (elapsed < GATHER_MS + PINCH_MS) {
        const p = clamp(elapsed / GATHER_MS);
        const grow = inOutSine(p);
        const anchor = { x: source.x, y: source.y, r: r0 * (1 - 0.3 * grow) };
        if (elapsed < GATHER_MS) {
          const sag = r0 * (0.15 + 3.25 * inCubic(p));
          const bulb = { x: source.x + Math.sin(p * 9) * 0.3 * p, y: source.y + sag, r: mix(r0, bulbRadius, grow) };
          drawGather(anchor, bulb, mix(anchor.r * 0.9, anchor.r * 0.34, p), 0.22 * p);
        }
      }
      // 2. Pinch-off: the bulb falls freely while the neck thins and snaps.
      if (elapsed >= GATHER_MS && !falling && !impact) {
        falling = { x: source.x, y: fallFrom, vx, vy: v0, t: 0 };
        setState('falling');
      }
      if (falling) {
        falling.t += dt;
        falling.vy += GRAVITY * dt;
        falling.x += falling.vx * dt;
        falling.y += falling.vy * dt;
        const pinch = clamp((elapsed - GATHER_MS) / PINCH_MS);
        const glass = mix(0.22, 1, clamp(falling.t / 0.26));
        if (pinch < 1) {
          drawGather({ x: source.x, y: source.y, r: r0 * 0.7 }, { x: falling.x, y: falling.y, r: bulbRadius }, r0 * 0.3 * (1 - pinch), glass);
        } else {
          if (!satellite) {
            satellite = { x: source.x, y: source.y + r0 * 1.9, vx: vx * 0.4, vy: v0 * 0.5, r: Math.max(1, r0 * 0.26), floor: surface.y };
            anchorBack = now;
          }
          const speed = Math.hypot(falling.vx, falling.vy);
          const tip = bulbRadius * (1.55 + 0.75 * clamp(speed / 900));
          const angle = Math.atan2(falling.vx, falling.vy) * -1;
          const wobble = 0.07 * Math.sin(falling.t * 40) * Math.exp(-falling.t * 2);
          // A faint streak of light along its path, like a tear catching the window.
          context.save();
          const trail = context.createLinearGradient(falling.x, falling.y - tip - speed * 0.05, falling.x, falling.y - tip * 0.5);
          trail.addColorStop(0, 'rgba(255,190,225,0)');
          trail.addColorStop(1, `rgba(255,190,225,${0.32 * glass})`);
          context.strokeStyle = trail;
          context.lineWidth = bulbRadius * 0.7;
          context.lineCap = 'round';
          context.beginPath();
          context.moveTo(falling.x - falling.vx * 0.05, falling.y - tip - speed * 0.05);
          context.lineTo(falling.x, falling.y - tip * 0.5);
          context.stroke();
          context.restore();
          drawTear(falling.x, falling.y, bulbRadius, tip, angle, wobble, glass);
        }
        if (falling.y + bulbRadius >= surface.y) {
          // 3. Impact: the drop flattens into the surface it meets.
          land(falling.x, surface.y, now);
          impact.squash = { x: falling.x, r: bulbRadius };
          falling = null;
        }
      }
      // The remnant of the full stop recoils, wobbles and becomes a full stop again.
      if (anchorBack !== null && !restored) {
        const t = (now - anchorBack) / 1000;
        if (source.hide) {
          const spring = 1 - Math.exp(-5.5 * t) * Math.cos(11 * t);
          const r = r0 * mix(0.7, 1, clamp(spring, 0, 1.12));
          const lift = -r0 * 0.5 * Math.exp(-6 * t) * Math.sin(16 * t);
          const settle = clamp((t - 0.95) / 0.45);
          drawBead(source.x, source.y + lift, r, mixRGB(GLOW, INK, clamp(t / 0.9)), 1 - clamp(t / 0.9), 1 - settle);
          // The real glyph fades back in underneath as the drawn bead fades out.
          if (t > 0.95 && dot.classList.contains('is-falling')) dot.classList.remove('is-falling');
          if (settle >= 1) restored = true;
        } else {
          const fade = clamp(t / 0.3);
          drawBead(source.x, source.y, r0 * 0.7 * (1 - fade), GLOW, 1, 1 - fade);
          if (fade >= 1) restored = true;
        }
      }
      if (satellite) {
        satellite.vy += GRAVITY * dt;
        satellite.x += satellite.vx * dt;
        satellite.y += satellite.vy * dt;
        if (satellite.y + satellite.r >= satellite.floor) {
          sound(0.18);
          splash(satellite.x, satellite.floor, 4, 0.35);
          ring(satellite.x, satellite.floor, now, 46, 1000, 0.45);
          satellite = false;
        } else drawDroplet(satellite, 0.95);
      }
      if (impact?.squash) {
        const u = (now - impact.at) / 280;
        if (u < 1) {
          const rx = impact.squash.r * (1 + 1.8 * outCubic(u));
          const ry = impact.squash.r * mix(0.6, 0.12, outCubic(u));
          context.save();
          context.beginPath();
          context.ellipse(impact.squash.x, impact.y - ry * 0.6, rx, ry, 0, 0, TAU);
          const pool = context.createRadialGradient(impact.squash.x, impact.y - ry, 0, impact.squash.x, impact.y, rx);
          pool.addColorStop(0, `rgba(255,236,246,${0.9 * (1 - u)})`);
          pool.addColorStop(1, `rgba(212,52,136,${0.55 * (1 - u)})`);
          context.fillStyle = pool;
          context.fill();
          context.restore();
        }
        const bloom = (now - impact.at) / 950;
        if (bloom < 1) {
          const radius = 74 * scale;
          const glow = context.createRadialGradient(impact.x, impact.y, 0, impact.x, impact.y, radius);
          glow.addColorStop(0, `rgba(255,196,228,${0.34 * (1 - bloom) ** 2})`);
          glow.addColorStop(1, 'rgba(255,196,228,0)');
          context.fillStyle = glow;
          context.fillRect(impact.x - radius, impact.y - radius, radius * 2, radius * 2);
        }
      }
      // A Worthington jet: the surface throws one bead back up, which lands again.
      if (jet) {
        if (!jet.live && now >= jet.launch) jet.live = true;
        if (jet.live) {
          jet.vy += GRAVITY * dt;
          jet.y += jet.vy * dt;
          if (jet.vy > 0 && jet.y + jet.r >= jet.floor) {
            sound(0.32);
            splash(jet.x, jet.floor, 6, 0.45);
            ring(jet.x, jet.floor, now, 70, 1200, 0.55);
            jet = null;
          } else drawDroplet(jet, 1);
        }
      }
      for (let index = droplets.length - 1; index >= 0; index--) {
        const droplet = droplets[index];
        droplet.vy += GRAVITY * dt;
        droplet.x += droplet.vx * dt;
        droplet.y += droplet.vy * dt;
        if (droplet.y >= droplet.floor && droplet.vy > 0) { droplets.splice(index, 1); continue; }
        drawDroplet(droplet, 0.9);
      }
      for (const item of ripples) drawRipple(item, now);

      const ripplesDone = ripples.every((item) => now - item.start >= item.duration);
      const settled = impact && !falling && !jet && !satellite && !droplets.length && ripplesDone && restored;
      if (settled) {
        context.clearRect(0, 0, origin.width, origin.height);
        releaseCanvas();
        dot?.classList.remove('is-falling');
        setState('done');
        return;
      }
      frame = win.requestAnimationFrame(step);
    }
    // Paint the bead in the same task that hides the glyph, so the stop never blinks.
    step(win.performance.now());
  }

  function run() {
    if (destroyed || state !== 'idle') return;
    setState('wave');
    const count = chars.length;
    const stepMs = Math.min(52, 1500 / Math.max(1, count));
    const baseColour = win.getComputedStyle(title).color;
    chars.forEach((character, index) => {
      if (character === dot) return;
      animate(character, [
        { transform: 'translateY(0)', color: baseColour, textShadow: '0 0 0 rgba(255,150,205,0)' },
        { transform: 'translateY(-0.13em)', color: `rgb(${GLOW.join(',')})`, textShadow: '0 0.06em 0.45em rgba(255,150,205,.6)', offset: 0.34 },
        { transform: 'translateY(0.025em)', offset: 0.66 },
        { transform: 'translateY(0)', color: baseColour, textShadow: '0 0 0 rgba(255,150,205,0)' },
      ], { duration: WAVE_MS, delay: index * stepMs, easing: 'cubic-bezier(.35,0,.25,1)' });
    });
    const arrival = (count - 1) * stepMs + WAVE_MS * 0.34;
    if (dot) {
      // The wave arrives and stays in the full stop: it brightens without moving.
      animate(dot, [
        { color: baseColour, textShadow: '0 0 0 rgba(255,150,205,0)' },
        { color: `rgb(${GLOW.join(',')})`, textShadow: '0 0 .3em rgba(255,150,205,.9)' },
      ], { duration: 420, delay: Math.max(0, arrival - 260), fill: 'forwards', easing: 'ease-out' });
    }
    later(startDrop, arrival + 260);
  }

  function arm() {
    if (!('IntersectionObserver' in win)) { later(run, 600); return; }
    observer = new win.IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.6)) return;
      observer.disconnect();
      observer = null;
      later(run, 320);
    }, { threshold: [0, 0.6, 1], rootMargin: '0px 0px -10% 0px' });
    observer.observe(copy);
  }

  setState('idle');
  Promise.resolve(doc.fonts?.ready).catch(() => {}).then(() => { if (!destroyed) arm(); });

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      brake(false);
      observer?.disconnect();
      if (frame !== null) win.cancelAnimationFrame(frame);
      for (const id of timers) win.clearTimeout(id);
      timers.clear();
      for (const animation of animations) animation.cancel();
      releaseCanvas();
    },
  };
}
