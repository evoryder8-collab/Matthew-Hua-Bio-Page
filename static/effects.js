// Sizes are CSS pixels, trailLength is seconds, gravity is px/s^2.
// count is the desktop particle budget; fadeSpeed scales the decay rate.
export const SPARK_TUNING = {
  sparkSize: 0.95,
  count: 220,
  trailLength: 0.65,
  opacity: 0.94,
  gravity: 360,
  fadeSpeed: 1.1,
  colors: ['#ffca78', '#fff8e8', '#edaf91'],
};

const instances = new WeakMap();
const ambientInstances = new WeakMap();
const CURTAIN = '#0a0810';
const DURATION = 1500;
const TAU = Math.PI * 2;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const setting = (key, fallback, min, max) => {
  const value = Number(SPARK_TUNING[key]);
  return Number.isFinite(value) ? clamp(value, min, max) : fallback;
};

/**
 * Transitions are serialized; simultaneous opening() calls share one Promise.
 * Both transition modes take about 1500ms, plus any async swap time; long remains
 * accepted for compatibility. Reduced motion uses a brief, particle-free fade.
 * Keep both canvases mounted through swap. A caller may reparent the transition
 * canvas into its active dialog before calling transition(), then move it back.
 * destroy() rejects pending work with AbortError. A swap already executing cannot
 * be undone; its eventual settlement is observed but never restarts the effects.
 */
export function createEffects({ transitionCanvas, cursorCanvas }) {
  if (!transitionCanvas?.getContext || !cursorCanvas?.getContext ||
      transitionCanvas === cursorCanvas ||
      transitionCanvas.ownerDocument !== cursorCanvas.ownerDocument) {
    throw new TypeError('createEffects requires two distinct canvases in the same document.');
  }
  if (ambientInstances.has(transitionCanvas) || ambientInstances.has(cursorCanvas)) {
    throw new Error('Ambient canvases cannot also host transition or cursor effects.');
  }
  const existing = instances.get(transitionCanvas);
  if (existing && existing === instances.get(cursorCanvas)) return existing;
  if (existing || instances.has(cursorCanvas)) {
    throw new Error('A canvas already belongs to an effects instance. Destroy it before reusing it.');
  }

  const doc = transitionCanvas.ownerDocument;
  const win = doc.defaultView;
  const curtain = transitionCanvas.getContext('2d');
  const cursor = cursorCanvas.getContext('2d');
  if (!win || !curtain || !cursor) throw new Error('Canvas 2D is unavailable.');

  const motionQuery = win.matchMedia('(prefers-reduced-motion: reduce)');
  const pointerQuery = win.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
  const cleanups = [];
  const queue = [];
  const particles = [];
  const pointer = { x: 0, y: 0, inside: false, strength: 0.55, quiet: false };
  let width = 1;
  let height = 1;
  let dpr = 1;
  let active = null;
  let frame = null;
  let lastTime = null;
  let destroyed = false;
  let cursorEnabled = false;
  let cursorDirty = false;
  let reduced = motionQuery.matches;

  function listen(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    cleanups.push(() => target.removeEventListener(event, handler, options));
  }

  function listenQuery(query, handler) {
    if (query.addEventListener) listen(query, 'change', handler);
    else {
      query.addListener(handler);
      cleanups.push(() => query.removeListener(handler));
    }
  }

  function prepareCanvas(canvas, zIndex) {
    const styles = {
      position: 'fixed', inset: '0', width: '100%', height: '100%',
      'pointer-events': 'none', 'z-index': String(zIndex), display: 'block',
      opacity: '1', visibility: 'visible', background: 'transparent',
      'mix-blend-mode': 'normal', margin: '0', padding: '0', border: '0',
    };
    const previous = Object.keys(styles).map((key) =>
      [key, canvas.style.getPropertyValue(key), canvas.style.getPropertyPriority(key)]);
    const attributes = ['aria-hidden', 'width', 'height'].map((key) => [key, canvas.getAttribute(key)]);
    for (const [key, value] of Object.entries(styles)) canvas.style.setProperty(key, value);
    canvas.setAttribute('aria-hidden', 'true');
    cleanups.push(() => {
      for (const [key, value, priority] of previous) {
        if (value) canvas.style.setProperty(key, value, priority);
        else canvas.style.removeProperty(key);
      }
      for (const [key, value] of attributes) {
        if (value === null) canvas.removeAttribute(key);
        else canvas.setAttribute(key, value);
      }
    });
  }

  function budget() {
    const mobile = width < 900 || (win.navigator.maxTouchPoints || 0) > 0;
    return Math.min(mobile ? 96 : 260, Math.round(setting('count', 220, 0, 400) * (mobile ? 0.44 : 1)));
  }

  function palette(seed) {
    const colors = SPARK_TUNING.colors;
    const index = seed > 0.93 ? 2 : seed > 0.57 ? 1 : 0;
    return Array.isArray(colors) ? colors[index] || colors[0] || '#fff3d9' : '#fff3d9';
  }

  function seeds() {
    const count = budget();
    return Array.from({ length: count }, (_, index) => ({
      u: (index + Math.random() * 0.7) / Math.max(1, count),
      angle: Math.random() * TAU,
      speed: 190 + Math.pow(Math.random(), 1.4) * 720,
      life: 0.24 + Math.random() * 0.38,
      drag: 1.2 + Math.random() * 1.8,
      size: 0.35 + Math.random() * 0.85,
      phase: Math.random() * TAU,
      color: Math.random(),
    }));
  }

  function clear(context) {
    context.clearRect(0, 0, width, height);
  }

  function spark(context, x, y, radius, alpha, color, glint = false) {
    if (alpha < 0.008 || radius <= 0) return;
    context.fillStyle = color;
    context.globalAlpha = clamp(alpha * 0.1);
    context.beginPath();
    context.arc(x, y, radius * 2.7, 0, TAU);
    context.fill();
    context.globalAlpha = clamp(alpha);
    context.beginPath();
    context.arc(x, y, radius, 0, TAU);
    context.fill();
    if (glint) {
      context.globalAlpha = clamp(alpha * 0.4);
      context.fillRect(x - radius * 2.4, y - 0.25, radius * 4.8, 0.5);
    }
    context.globalAlpha = 1;
  }

  function burningTip(time) {
    const travel = smooth(time / (DURATION / 1000));
    const scale = clamp(Math.min(width, height) / 720, 0.65, 1.2);
    return {
      x: width * (0.43 + travel * 0.14) + Math.sin(time * 11) * 2 * scale,
      y: height * (0.58 - 0.08 * Math.sin(travel * Math.PI)) + Math.sin(time * 17) * 1.5 * scale,
    };
  }

  function flight(origin, seed, age, scale, gravity) {
    const travel = -Math.expm1(-seed.drag * age) / seed.drag;
    return {
      x: origin.x + Math.cos(seed.angle) * seed.speed * scale * travel,
      y: origin.y + Math.sin(seed.angle) * seed.speed * scale * travel + gravity * scale * (age - travel) / seed.drag,
    };
  }

  function drawSparkler(job, time, alpha = 1) {
    if (reduced || !job.seeds.length) return;
    // Macro framing is deliberately independent of cursor size and density.
    const macroScale = width < 900 ? 0.72 : clamp(Math.min(width, height) / 800, 0.9, 1.2);
    const sprayScale = clamp(Math.max(width / 340, height / 300), 2.4, 6);
    const streakScale = macroScale * 1.6;
    const tip = burningTip(time);
    const size = setting('sparkSize', 0.95, 0, 3);
    const envelope = smooth(time / 0.12) * (1 - smooth((time - 1.04) / 0.46));
    const opacity = setting('opacity', 0.94, 0, 1) * alpha * envelope;
    if (opacity < 0.005 || size === 0) return;
    const gravity = setting('gravity', 360, -800, 1200);
    const decay = setting('fadeSpeed', 1.1, 0.2, 5);
    const exposure = setting('trailLength', 0.65, 0.05, 2) / 0.65;
    curtain.save();
    curtain.lineCap = 'round';

    // A wire disappearing below the frame anchors the overexposed burning head.
    const wireLength = Math.max(height * 0.7, 450 * macroScale);
    const wire = curtain.createLinearGradient(tip.x - 90 * macroScale, tip.y + wireLength, tip.x, tip.y);
    wire.addColorStop(0, 'rgba(108,79,60,0)');
    wire.addColorStop(0.65, 'rgba(145,103,70,0.45)');
    wire.addColorStop(1, '#f2b971');
    curtain.strokeStyle = wire;
    curtain.lineWidth = 3 * macroScale;
    curtain.globalAlpha = opacity;
    curtain.beginPath();
    curtain.moveTo(tip.x - 90 * macroScale, tip.y + wireLength);
    curtain.lineTo(tip.x, tip.y);
    curtain.stroke();
    const glowRadius = 270 * macroScale * size;
    const halo = curtain.createRadialGradient(tip.x, tip.y - 20 * macroScale, 0, tip.x, tip.y - 20 * macroScale, glowRadius);
    halo.addColorStop(0, 'rgba(255,251,232,1)');
    halo.addColorStop(0.22, 'rgba(255,233,181,0.85)');
    halo.addColorStop(0.5, 'rgba(255,190,100,0.23)');
    halo.addColorStop(0.8, 'rgba(255,160,64,0.055)');
    halo.addColorStop(1, 'rgba(255,178,80,0)');
    curtain.globalCompositeOperation = 'lighter';
    curtain.fillStyle = halo;
    curtain.fillRect(tip.x - glowRadius, tip.y - 20 * macroScale - glowRadius, glowRadius * 2, glowRadius * 2);

    // Staggered lifetimes continuously shed sparks; drag plus gravity gives each
    // trail a curved trajectory. Reusable seeds keep allocation and density bounded.
    for (const seed of job.seeds) {
      const life = seed.life / decay;
      const cycle = life + 0.055;
      const age = (time + seed.u * cycle) % cycle;
      const birth = time - age;
      if (birth < 0 || age >= life) continue;
      const origin = burningTip(birth);
      origin.x += Math.cos(seed.angle) * 38 * macroScale * size;
      origin.y += Math.sin(seed.angle) * 55 * macroScale * size - 15 * macroScale;
      const drag = Math.exp(-seed.drag * age);
      const vx = Math.cos(seed.angle) * seed.speed * sprayScale * drag;
      const vy = Math.sin(seed.angle) * seed.speed * sprayScale * drag + gravity * sprayScale * (1 - drag) / seed.drag;
      const fragment = (seed.color > 0.94 ? 48 + seed.size * 28 : 5 + seed.size * 19) * macroScale * exposure;
      const tailAge = Math.max(0, age - Math.min(0.09, fragment / Math.max(80, Math.hypot(vx, vy))));
      const tail = flight(origin, seed, tailAge, sprayScale, gravity);
      const middle = flight(origin, seed, (tailAge + age) / 2, sprayScale, gravity);
      const head = flight(origin, seed, age, sprayScale, gravity);
      const brightness = opacity * smooth(age / 0.018) * Math.pow(1 - age / life, 0.55);
      const weight = (0.55 + seed.size * 0.8) * size * streakScale;
      curtain.beginPath();
      curtain.moveTo(tail.x, tail.y);
      curtain.quadraticCurveTo(2 * middle.x - (tail.x + head.x) / 2, 2 * middle.y - (tail.y + head.y) / 2, head.x, head.y);
      const warm = palette(seed.color > 0.93 ? 0.97 : seed.color * 0.55);
      curtain.strokeStyle = warm;
      curtain.lineWidth = weight * 3;
      curtain.globalAlpha = brightness * 0.12;
      curtain.stroke();
      const trail = curtain.createLinearGradient(tail.x, tail.y, head.x, head.y);
      trail.addColorStop(0, 'rgba(255,182,84,0)');
      trail.addColorStop(0.45, warm);
      trail.addColorStop(1, age < life * 0.28 && seed.color > 0.7 ? '#fff9eb' : warm);
      curtain.strokeStyle = trail;
      curtain.lineWidth = weight;
      curtain.globalAlpha = brightness;
      curtain.stroke();
      if (seed.color > 0.92 && age > life * 0.3 && age < life * 0.65) {
        const angle = Math.atan2(vy, vx) + (seed.phase < Math.PI ? -0.65 : 0.65);
        const length = (5 + seed.size * 11) * macroScale;
        const endX = head.x + Math.cos(angle) * length;
        const endY = head.y + Math.sin(angle) * length + 3 * macroScale;
        curtain.beginPath();
        curtain.moveTo(head.x, head.y);
        curtain.bezierCurveTo(head.x + (head.x - middle.x) * 0.3, head.y + (head.y - middle.y) * 0.3,
          endX, endY - 3 * macroScale, endX, endY);
        curtain.strokeStyle = warm;
        curtain.lineWidth = weight * 0.65;
        curtain.globalAlpha = brightness * 0.6;
        curtain.stroke();
      }
      const glint = Math.max(0, Math.sin(age * 35 + seed.phase) - 0.82) / 0.18;
      if (seed.color > 0.86 && glint > 0) {
        spark(curtain, head.x, head.y, weight * 0.95, brightness * glint, '#fff9eb', true);
      }
    }

    // Overlapping feathered light lobes bloom into an overexposed burning head.
    // No filled silhouette or fixed radial spokes: every edge falls off softly.
    for (let layer = 0; layer < 5; layer++) {
      const angle = layer * 2.4;
      const spread = layer === 0 ? 0 : 25;
      const x = tip.x + (Math.cos(angle) * spread + Math.sin(time * 9 + layer) * 4) * macroScale;
      const y = tip.y + (Math.sin(angle) * spread * 1.35 - 12) * macroScale;
      const radius = (layer === 0 ? 78 : 62) * macroScale * size;
      curtain.save();
      curtain.translate(x, y);
      curtain.rotate(Math.sin(time * 5 + layer) * 0.12);
      curtain.scale(1, 1.22);
      const burn = curtain.createRadialGradient(0, 0, 0, 0, 0, radius);
      burn.addColorStop(0, 'rgba(255,255,250,1)');
      burn.addColorStop(0.34, 'rgba(255,253,241,0.98)');
      burn.addColorStop(0.64, 'rgba(255,241,210,0.62)');
      burn.addColorStop(0.84, 'rgba(255,210,148,0.16)');
      burn.addColorStop(1, 'rgba(255,190,116,0)');
      curtain.fillStyle = burn;
      curtain.globalAlpha = opacity * (0.92 + Math.sin(time * 8 + layer) * 0.05);
      curtain.fillRect(-radius, -radius, radius * 2, radius * 2);
      curtain.restore();
    }
    curtain.restore();
  }

  function drawOpening(job) {
    clear(curtain);
    drawSparkler(job, job.elapsed / 1000);
  }

  function drawTransition(job) {
    const covered = job.phase === 'covered' || job.phase === 'waiting';
    const progress = covered ? 1 : clamp(job.elapsed / job.halfDuration);
    const alpha = covered ? 1 : job.phase === 'cover' ? smooth(progress) : 1 - smooth(progress);
    // The CSS backing also guards the opaque hold if a swap resizes/reparents us.
    transitionCanvas.style.backgroundColor = covered ? CURTAIN : 'transparent';
    clear(curtain);
    curtain.globalAlpha = alpha;
    curtain.fillStyle = CURTAIN;
    curtain.fillRect(0, 0, width, height);
    curtain.globalAlpha = 1;
    const time = (covered ? 0.5 : job.phase === 'cover' ? progress * 0.5 : 0.5 + progress * 0.5) * DURATION / 1000;
    drawSparkler(job, time, smooth(alpha * 2));
  }

  function drawActive() {
    if (!active) return;
    if (active.kind === 'opening') drawOpening(active);
    else drawTransition(active);
  }

  function drawCursor() {
    clear(cursor);
    if (!cursorEnabled) return;
    const opacity = setting('opacity', 0.94, 0, 1) * 0.83;
    const size = setting('sparkSize', 0.95, 0, 3) * 0.9;
    for (const particle of particles) {
      const remaining = 1 - particle.age / particle.life;
      spark(cursor, particle.x, particle.y, particle.size * size,
        remaining * remaining * opacity * particle.strength, particle.color);
    }
    if (pointer.inside) {
      spark(cursor, pointer.x, pointer.y, size * (pointer.quiet ? 0.5 : 0.85),
        opacity * pointer.strength, '#fff3d9');
    }
    cursorDirty = false;
  }

  function needsFrame() {
    return (active && active.phase !== 'waiting') || particles.length > 0 || cursorDirty;
  }

  function wake() {
    if (destroyed || doc.hidden || frame !== null || !needsFrame()) return;
    if (lastTime === null) lastTime = win.performance.now();
    frame = win.requestAnimationFrame(tick);
  }

  function cancelFrame() {
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
    lastTime = null;
  }

  function startNext() {
    if (destroyed || active || !queue.length) return;
    active = queue.shift();
    active.elapsed = 0;
    active.seeds = reduced ? [] : seeds();
    active.phase = active.kind === 'opening' ? 'opening' : 'cover';
    active.halfDuration = reduced ? 48 : DURATION / 2;
    lastTime = null;
    drawActive();
    wake();
  }

  function finish(job) {
    if (destroyed || active !== job) return;
    active = null;
    transitionCanvas.style.backgroundColor = 'transparent';
    clear(curtain);
    if (job.failed) job.reject(job.error);
    else job.resolve();
    startNext();
  }

  function settleSwap(job, failed, error) {
    if (destroyed || active !== job) return;
    job.failed = failed;
    job.error = error;
    job.phase = 'reveal';
    job.elapsed = 0;
    // Reset the clock so async callback time never consumes the reveal.
    lastTime = null;
    drawActive();
    wake();
  }

  function swapCovered(job) {
    job.phase = 'waiting';
    drawTransition(job);
    try {
      const result = job.swap();
      Promise.resolve(result).then(
        () => settleSwap(job, false),
        (error) => settleSwap(job, true, error),
      );
    } catch (error) {
      settleSwap(job, true, error);
    }
  }

  function tick(time) {
    frame = null;
    if (destroyed || doc.hidden) { lastTime = null; return; }
    const elapsed = lastTime === null ? 0 : Math.max(0, time - lastTime);
    lastTime = time;
    const job = active;
    if (job) {
      if (job.phase === 'covered') {
        // Leave the fully opaque bitmap in place for a paint before swapping.
        swapCovered(job);
      } else if (job.phase !== 'waiting') {
        job.elapsed += elapsed;
        if (job.kind === 'opening') {
          if (reduced || job.elapsed >= DURATION) finish(job);
          else drawOpening(job);
        } else if (job.phase === 'cover' && job.elapsed >= job.halfDuration) {
          job.phase = 'covered';
          drawTransition(job);
        } else if (job.phase === 'reveal' && job.elapsed >= job.halfDuration) {
          finish(job);
        } else drawTransition(job);
      }
    }
    if (particles.length || cursorDirty) {
      const seconds = elapsed / 1000;
      for (let index = particles.length - 1; index >= 0; index--) {
        const particle = particles[index];
        particle.age += seconds;
        if (particle.age >= particle.life) { particles.splice(index, 1); continue; }
        particle.x += particle.vx * seconds;
        const gravity = setting('gravity', 360, -800, 1200) * 0.035;
        particle.y += particle.vy * seconds + gravity * seconds * seconds / 2;
        particle.vy += gravity * seconds;
      }
      drawCursor();
    }
    if (needsFrame()) wake();
    else lastTime = null;
  }

  function enqueue(kind, swap, long = false) {
    if (destroyed) return Promise.reject(new win.DOMException('Effects have been destroyed.', 'AbortError'));
    if (kind === 'opening') {
      const opening = active?.kind === 'opening' ? active : queue.find((job) => job.kind === 'opening');
      if (opening) return opening.promise;
      if (reduced) return Promise.resolve();
    }
    const job = { kind, swap, long, failed: false };
    job.promise = new Promise((resolve, reject) => { job.resolve = resolve; job.reject = reject; });
    queue.push(job);
    startNext();
    return job.promise;
  }

  function resetCursor() {
    particles.length = 0;
    pointer.inside = false;
    cursorDirty = false;
    clear(cursor);
  }

  function refreshPreferences() {
    reduced = motionQuery.matches;
    cursorEnabled = !reduced && width >= 900 && pointerQuery.matches && (win.navigator.maxTouchPoints || 0) === 0;
    if (!cursorEnabled) resetCursor();
    if (reduced && active) {
      active.seeds = [];
      if (active.kind === 'opening') finish(active);
      else {
        active.halfDuration = 48;
        active.elapsed = Math.min(active.elapsed, 48);
      }
    }
    drawActive();
    if (!needsFrame()) cancelFrame();
    else wake();
  }

  function resize() {
    width = Math.max(1, win.innerWidth);
    height = Math.max(1, win.innerHeight);
    dpr = Math.min(1.75, Math.max(1, win.devicePixelRatio || 1));
    for (const [canvas, context] of [[transitionCanvas, curtain], [cursorCanvas, cursor]]) {
      const pixelWidth = Math.ceil(width * dpr);
      const pixelHeight = Math.ceil(height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      context.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
    }
    // Resizing clears a canvas: repaint synchronously, especially during swap.
    if (active && !reduced && active.seeds.length !== budget()) active.seeds = seeds();
    refreshPreferences();
    drawCursor();
  }

  function pointerStyle(target) {
    const element = target?.nodeType === 1 ? target : target?.parentElement;
    const input = element?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
    const interactive = element?.closest('a[href], button, summary, [role="button"], [role="link"]');
    const text = element?.closest('p, li, blockquote, figcaption, pre, code, [data-sparkler="quiet"]');
    const selection = doc.getSelection();
    const selecting = selection && !selection.isCollapsed;
    pointer.quiet = Boolean(input || selecting || (text && !interactive && win.getComputedStyle(text).userSelect !== 'none'));
    pointer.strength = pointer.quiet ? 0.14 : interactive ? 0.95 : 0.55;
  }

  function addParticle(x, y, vx, vy, strength) {
    if (particles.length >= Math.min(90, budget())) return;
    particles.push({
      x, y, vx, vy, strength, age: 0,
      life: setting('trailLength', 0.65, 0.05, 2) * (0.5 + Math.random() * 0.5) / setting('fadeSpeed', 1.1, 0.2, 5),
      size: 0.3 + Math.random() * 0.6,
      color: palette(Math.random() * 0.92),
    });
  }

  function movePointer(event) {
    if (!cursorEnabled || doc.hidden || event.pointerType !== 'mouse') return;
    const wasInside = pointer.inside;
    const oldX = pointer.x;
    const oldY = pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.inside = true;
    pointerStyle(event.target);
    const distance = Math.hypot(pointer.x - oldX, pointer.y - oldY);
    if (wasInside && !pointer.quiet && distance > 1) {
      const count = Math.min(6, Math.ceil(distance / 8));
      for (let i = 1; i <= count; i++) {
        const t = i / count;
        addParticle(oldX + (pointer.x - oldX) * t, oldY + (pointer.y - oldY) * t,
          (Math.random() - 0.5) * 10, -3 - Math.random() * 9, pointer.strength);
      }
    }
    cursorDirty = true;
    wake();
  }

  function clickPointer(event) {
    if (!cursorEnabled || doc.hidden || event.pointerType !== 'mouse' || event.button !== 0) return;
    pointerStyle(event.target);
    if (pointer.quiet) return;
    for (let i = 0; i < 6; i++) {
      const angle = -Math.PI * (0.18 + Math.random() * 0.64);
      const speed = 12 + Math.random() * 13;
      addParticle(event.clientX, event.clientY, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.75);
    }
    cursorDirty = true;
    wake();
  }

  function leavePointer(event) {
    if (event.relatedTarget || !pointer.inside) return;
    pointer.inside = false;
    cursorDirty = true;
    wake();
  }

  function visibilityChanged() {
    cancelFrame();
    resetCursor();
    if (!doc.hidden) { resize(); wake(); }
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    cancelFrame();
    resetCursor();
    clear(curtain);
    const error = new win.DOMException('Effects have been destroyed.', 'AbortError');
    if (active) active.reject(error);
    for (const job of queue) job.reject(error);
    active = null;
    queue.length = 0;
    for (const cleanup of cleanups.reverse()) cleanup();
    instances.delete(transitionCanvas);
    instances.delete(cursorCanvas);
  }

  const api = {
    opening: () => enqueue('opening'),
    transition: (swap, { long = false } = {}) => typeof swap === 'function'
      ? enqueue('transition', swap, long)
      : Promise.reject(new TypeError('transition requires a swap callback.')),
    destroy,
  };
  prepareCanvas(transitionCanvas, 2000);
  prepareCanvas(cursorCanvas, 1800);
  listen(win, 'resize', resize, { passive: true });
  if (win.visualViewport) listen(win.visualViewport, 'resize', resize, { passive: true });
  listen(doc, 'visibilitychange', visibilityChanged);
  listen(win, 'pointermove', movePointer, { passive: true });
  listen(win, 'pointerdown', clickPointer, { passive: true });
  listen(win, 'pointerout', leavePointer, { passive: true });
  listen(win, 'blur', () => { resetCursor(); if (!needsFrame()) cancelFrame(); });
  listenQuery(motionQuery, refreshPreferences);
  listenQuery(pointerQuery, refreshPreferences);
  resize();
  instances.set(transitionCanvas, api);
  instances.set(cursorCanvas, api);
  return api;
}

/**
 * A continuous, low-density field for a portal's frosted choice panel.
 * Fills its positioned parent; the caller owns z-index, blur, and DOM removal.
 * Call the returned cleanup on prompt changes/exit. Repeated mounts reuse it.
 */
export function mountAmbientSparks(canvas) {
  if (!canvas?.getContext || !canvas.ownerDocument?.defaultView) {
    throw new TypeError('mountAmbientSparks requires a canvas in a document.');
  }
  if (ambientInstances.has(canvas)) return ambientInstances.get(canvas);
  if (instances.has(canvas)) throw new Error('Use a separate canvas for ambient sparks.');
  const doc = canvas.ownerDocument;
  const win = doc.defaultView;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  const styles = { position: 'absolute', inset: '0', width: '100%', height: '100%', 'pointer-events': 'none', display: 'block' };
  const previous = Object.keys(styles).map((key) => [key, canvas.style.getPropertyValue(key), canvas.style.getPropertyPriority(key)]);
  const attributes = ['aria-hidden', 'width', 'height'].map((key) => [key, canvas.getAttribute(key)]);
  const removals = [];
  let width = 1;
  let height = 1;
  let field = [];
  let glows = [];
  let frame = null;
  let lastTime = null;
  let lastDraw = -Infinity;
  let time = 0;
  let visible = false;
  let disposed = false;

  for (const [key, value] of Object.entries(styles)) canvas.style.setProperty(key, value);
  canvas.setAttribute('aria-hidden', 'true');

  function listen(target, event, handler) {
    target.addEventListener(event, handler, { passive: true });
    removals.push(() => target.removeEventListener(event, handler));
  }

  function stopFrame() {
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
    lastTime = null;
    lastDraw = -Infinity;
  }

  function wake() {
    if (disposed || doc.hidden || motion.matches || !visible || !canvas.isConnected || frame !== null) return;
    frame = win.requestAnimationFrame(tick);
  }

  function point(particle, age) {
    const origin = particle.side === 0 ? { x: -12, y: height * 0.7 }
      : particle.side === 1 ? { x: width + 12, y: height * 0.3 }
        : { x: width * 0.66, y: height + 12 };
    return {
      x: origin.x + particle.vx * age + Math.sin(age * 1.7 + particle.phase) * age * 3,
      y: origin.y + particle.vy * age + 7 * age * age,
    };
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    if (!visible) return;
    context.globalCompositeOperation = 'source-over';
    for (let index = 0; index < glows.length; index++) {
      const glow = glows[index];
      context.globalAlpha = motion.matches ? 0.7 : 0.66 + Math.sin(time * 1.4 + index * 2) * 0.13;
      context.fillStyle = glow.paint;
      context.fillRect(glow.x - glow.radius, glow.y - glow.radius, glow.radius * 2, glow.radius * 2);
    }
    if (!motion.matches) {
      context.lineCap = 'round';
      for (const particle of field) {
        const age = (time + particle.offset * particle.life) % particle.life;
        const alpha = Math.pow(Math.sin(Math.PI * age / particle.life), 0.65);
        const head = point(particle, age);
        const tail = point(particle, Math.max(0, age - particle.exposure));
        context.beginPath();
        context.moveTo(tail.x, tail.y);
        context.lineTo(head.x, head.y);
        // Broad amber edges survive the caller's 10px frost on a pale backdrop.
        context.lineWidth = particle.size * 2.2;
        context.strokeStyle = '#9f521b';
        context.globalAlpha = alpha * 0.92;
        context.stroke();
        context.lineWidth = particle.size * 0.7;
        context.strokeStyle = '#ffd68c';
        context.globalAlpha = alpha;
        context.stroke();
        context.fillStyle = '#fff4d5';
        context.globalAlpha = alpha * 0.95;
        context.beginPath();
        context.arc(head.x, head.y, particle.size * 0.5, 0, TAU);
        context.fill();
      }
    }
    context.globalAlpha = 1;
  }

  function tick(now) {
    frame = null;
    if (disposed || doc.hidden || motion.matches || !visible || !canvas.isConnected) { lastTime = null; return; }
    if (lastTime !== null) time += Math.max(0, now - lastTime) / 1000;
    lastTime = now;
    // The field is deliberately rendered at at most 30fps beneath the frost.
    if (now - lastDraw >= 1000 / 30) { draw(); lastDraw = now; }
    wake();
  }

  function resize() {
    if (disposed) return;
    const bounds = canvas.getBoundingClientRect();
    visible = canvas.isConnected && bounds.width > 0 && bounds.height > 0;
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    const dpr = Math.min(1.5, Math.max(1, win.devicePixelRatio || 1));
    const pixelWidth = Math.ceil(width * dpr);
    const pixelHeight = Math.ceil(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
    const count = width < 900 || (win.navigator.maxTouchPoints || 0) > 0 ? 18 : 32;
    if (field.length !== count) {
      field = Array.from({ length: count }, (_, index) => {
        const side = index % 3;
        return {
          side, offset: (index + Math.random()) / count, phase: Math.random() * TAU,
          life: 2.4 + Math.random() * 1.6,
          vx: side === 0 ? 35 + Math.random() * 65 : side === 1 ? -35 - Math.random() * 65 : (Math.random() - 0.5) * 70,
          vy: side === 2 ? -60 - Math.random() * 45 : -25 - Math.random() * 65,
          size: 5 + Math.random() * 3,
          exposure: 0.2 + Math.random() * 0.2,
        };
      });
    }
    glows = [[-8, height * 0.7], [width + 8, height * 0.3], [width * 0.66, height + 8]].map(([x, y]) => {
      const radius = clamp(Math.min(width, height) * 0.23, 80, 155);
      const paint = context.createRadialGradient(x, y, 0, x, y, radius);
      paint.addColorStop(0, 'rgba(255,247,215,0.98)');
      paint.addColorStop(0.13, 'rgba(242,185,89,0.75)');
      paint.addColorStop(0.42, 'rgba(193,127,42,0.28)');
      paint.addColorStop(1, 'rgba(193,127,42,0)');
      return { x, y, radius, paint };
    });
    draw();
    if (!visible || motion.matches) stopFrame();
    else wake();
  }

  function visibilityChanged() {
    stopFrame();
    if (!doc.hidden) resize();
  }

  function preferenceChanged() {
    stopFrame();
    draw();
    wake();
  }

  function cleanup() {
    if (disposed) return;
    disposed = true;
    stopFrame();
    for (const remove of removals) remove();
    context.clearRect(0, 0, width, height);
    for (const [key, value, priority] of previous) {
      if (value) canvas.style.setProperty(key, value, priority);
      else canvas.style.removeProperty(key);
    }
    for (const [key, value] of attributes) {
      if (value === null) canvas.removeAttribute(key);
      else canvas.setAttribute(key, value);
    }
    field = [];
    glows = [];
    ambientInstances.delete(canvas);
  }

  listen(win, 'resize', resize);
  if (win.visualViewport) listen(win.visualViewport, 'resize', resize);
  listen(doc, 'visibilitychange', visibilityChanged);
  if (motion.addEventListener) listen(motion, 'change', preferenceChanged);
  else { motion.addListener(preferenceChanged); removals.push(() => motion.removeListener(preferenceChanged)); }
  if (win.ResizeObserver) {
    const observer = new win.ResizeObserver(resize);
    observer.observe(canvas);
    removals.push(() => observer.disconnect());
  }
  ambientInstances.set(canvas, cleanup);
  resize();
  return cleanup;
}
