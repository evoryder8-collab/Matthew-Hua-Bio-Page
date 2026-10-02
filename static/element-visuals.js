const ELEMENT_KEYS = [null, 'hotcold', 'breath', 'body', 'movement', 'community'];
const { renderers, palette } = createRenderers();

/** The caller owns localized copy; this mount owns only its decorative canvas. */
export function mountElementVisual(host, index, { reducedMotion = false } = {}) {
  const key = ELEMENT_KEYS[index];
  if (!Number.isInteger(index) || !key) {
    throw new RangeError('Element visual index must be between 1 and 5.');
  }
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  const frame = doc.createElement('div');
  frame.className = 'element-visual';
  frame.setAttribute('aria-hidden', 'true');
  const canvas = doc.createElement('canvas');
  canvas.className = 'element-visual__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  frame.appendChild(canvas);
  host.appendChild(frame);
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy() { frame.remove(); } };

  const renderer = renderers[key];
  const motion = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  let destroyed = false;
  let intersecting = !win.IntersectionObserver;
  let raf = null;
  let previousTime = null;
  let elapsed = 0;
  let width = 0;
  let height = 0;
  let dpr = 0;
  let state = {};
  let needsDraw = true;

  function canDraw() {
    if (destroyed || doc.hidden || !intersecting || !frame.isConnected) return false;
    if (frame.checkVisibility) {
      if (!frame.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    } else {
      if (!frame.getClientRects().length) return false;
      for (let node = frame; node; node = node.parentElement) {
        const style = win.getComputedStyle(node);
        if (node.hidden || style.display === 'none' || style.visibility === 'hidden' ||
            style.visibility === 'collapse' || Number(style.opacity) === 0) return false;
      }
    }
    if (!win.IntersectionObserver) {
      const rect = frame.getBoundingClientRect();
      return rect.bottom > 0 && rect.right > 0 &&
        rect.top < win.innerHeight && rect.left < win.innerWidth;
    }
    return true;
  }

  function stop() {
    if (raf !== null) win.cancelAnimationFrame(raf);
    raf = null;
    previousTime = null;
  }

  function resize() {
    const nextWidth = frame.clientWidth;
    const nextHeight = frame.clientHeight;
    const nextDpr = Math.min(win.devicePixelRatio || 1, 1.5);
    if (nextWidth <= 0 || nextHeight <= 0) return false;
    const geometryChanged = width !== nextWidth || height !== nextHeight;
    if (geometryChanged || dpr !== nextDpr) {
      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (geometryChanged) {
        state = {};
        renderer.init(state, width, height);
      }
      needsDraw = true;
    }
    return true;
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    renderer.draw(ctx, width, height, time, state, palette);
    needsDraw = false;
  }

  function tick(timestamp) {
    raf = null;
    if (!canDraw()) { stop(); return; }
    if (reducedMotion || motion?.matches) { refresh(); return; }
    if (previousTime !== null) elapsed += Math.min(50, timestamp - previousTime) / 1000;
    previousTime = timestamp;
    draw(elapsed);
    raf = win.requestAnimationFrame(tick);
  }

  function refresh() {
    if (!canDraw() || !resize()) { stop(); return; }
    if (reducedMotion || motion?.matches) {
      stop();
      // A settled phase also gives the body network a visible signal.
      if (needsDraw) draw(4);
      return;
    }
    if (needsDraw) draw(elapsed);
    if (raf === null) raf = win.requestAnimationFrame(tick);
  }

  function onMotionChange() {
    needsDraw = true;
    refresh();
  }

  const visibilityObserver = win.IntersectionObserver
    ? new win.IntersectionObserver(entries => {
      if (destroyed) return;
      const entry = entries.find(item => item.target === frame);
      if (!entry) return;
      intersecting = entry.isIntersecting;
      refresh();
    })
    : null;
  visibilityObserver?.observe(frame);

  const resizeObserver = win.ResizeObserver ? new win.ResizeObserver(refresh) : null;
  resizeObserver?.observe(frame);

  // CSS visibility and hidden attributes need not change intersection geometry.
  const attributeObserver = win.MutationObserver ? new win.MutationObserver(refresh) : null;
  for (let node = frame; node && attributeObserver; node = node.parentElement) {
    attributeObserver.observe(node, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
  }

  doc.addEventListener('visibilitychange', refresh);
  win.addEventListener('resize', refresh, { passive: true });
  if (!visibilityObserver) win.addEventListener('scroll', refresh, { passive: true, capture: true });
  if (motion?.addEventListener) motion.addEventListener('change', onMotionChange);
  else motion?.addListener?.(onMotionChange);
  refresh();

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      visibilityObserver?.disconnect();
      resizeObserver?.disconnect();
      attributeObserver?.disconnect();
      doc.removeEventListener('visibilitychange', refresh);
      win.removeEventListener('resize', refresh);
      if (!visibilityObserver) win.removeEventListener('scroll', refresh, true);
      if (motion?.removeEventListener) motion.removeEventListener('change', onMotionChange);
      else motion?.removeListener?.(onMotionChange);
      frame.remove();
      canvas.width = 0;
      canvas.height = 0;
      state = {};
    },
  };
}

// Five living illustrations of the elements. Each keeps its focus in the upper part of
// the stage (the copy covers the lower third) and advances its own small physics with
// a clamped time step, so a hidden or slow tab never makes it leap.
function createRenderers() {
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a)})`;
  const smooth = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
  const C = {
    pink: [239, 132, 190], pinkB: [255, 194, 228], mint: [143, 227, 176], mintB: [214, 247, 224],
    white: [246, 242, 248], ember: [255, 222, 160], ice: [205, 238, 255], gold: [255, 210, 122],
  };
  const sprites = new Map();
  // Pre-rendered soft lights: far cheaper than shadowBlur for many particles.
  function sprite(c) {
    const key = c.join();
    if (sprites.has(key)) return sprites.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const g = canvas.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, rgba(c, 1));
    grad.addColorStop(0.2, rgba(c, 0.72));
    grad.addColorStop(0.5, rgba(c, 0.2));
    grad.addColorStop(1, rgba(c, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    sprites.set(key, canvas);
    return canvas;
  }
  function light(ctx, c, x, y, r, a) {
    if (a <= 0.004 || r <= 0.3) return;
    ctx.globalAlpha = clamp(a);
    ctx.drawImage(sprite(c), x - r, y - r, r * 2, r * 2);
  }
  function backdrop(ctx, w, h, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  // Advance physics; a first frame at a later time (reduced motion) is pre-simulated.
  function advance(st, t, update) {
    if (st.prev === undefined) {
      st.prev = 0;
      for (let s = 0; s < Math.min(t, 6); s += 1 / 30) update(1 / 30, s);
    }
    const dt = clamp(t - st.prev, 0, 0.05);
    st.prev = t;
    if (dt > 0) update(dt, t);
  }
  const R = {};

  /* HOT / COLD: frost grows from the left, embers rise on the right, steam forms where
     they meet, and a calm breathing presence holds the centre undisturbed. */
  R.hotcold = {
    init(st, w, h) {
      st.cx = w * 0.5; st.cy = h * 0.34; st.R = Math.min(w, h) * 0.085;
      const count = Math.round(40 * clamp(w / 900, 0.6, 1.2));
      st.flakes = Array.from({ length: count }, () => ({ x: Math.random() * w * 0.45, y: Math.random() * h, v: 14 + Math.random() * 22, r: 0.9 + Math.random() * 1.7, ph: Math.random() * TAU, dx: 0 }));
      st.embers = []; st.steam = []; st.emberClock = 0; st.steamClock = 0; st.sparks = []; st.sparkClock = 0;
      const segs = [];
      const L0 = Math.min(w, h) * 0.09;
      function grow(x, y, a, L, depth, at) {
        if (depth > 4 || segs.length > 240) return;
        const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L;
        if (x2 > w * 0.42 || y2 < -10 || y2 > h + 10) return;
        segs.push({ x1: x, y1: y, x2, y2, at, depth });
        const next = at + 0.45 + Math.random() * 0.25;
        grow(x2, y2, a + (Math.random() - 0.5) * 0.22, L * 0.84, depth + 1, next);
        if (Math.random() < 0.8) grow(x2, y2, a + Math.PI / 3, L * 0.5, depth + 1, next + 0.12);
        if (Math.random() < 0.8) grow(x2, y2, a - Math.PI / 3, L * 0.5, depth + 1, next + 0.12);
      }
      for (let r = 0; r < 6; r++) grow(0, h * (0.06 + 0.88 * (r + Math.random() * 0.7) / 6), (Math.random() - 0.5) * 0.6, L0, 0, 0.2 + r * 0.25);
      st.frost = segs;
    },
    draw(ctx, w, h, t, st) {
      const { cx, cy } = st;
      const R0 = st.R;
      const avoid = (p, dt) => {
        const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1, zone = R0 * 2.1;
        if (d < zone) { const push = (zone - d) / zone; p.vx = (p.vx || 0) + dx / d * push * 260 * dt; p.vy = (p.vy || 0) + dy / d * push * 260 * dt; }
      };
      advance(st, t, (dt, time) => {
        st.emberClock += dt * 46;
        while (st.emberClock >= 1) {
          st.emberClock--;
          st.embers.push({ x: w * (0.55 + Math.random() * 0.43), y: h + 6, vx: (Math.random() - 0.5) * 14, vy: -18 - Math.random() * 26, life: 0, max: 2.6 + Math.random() * 1.8, r: 1.2 + Math.random() * 2.2, px: 0, py: 0 });
        }
        for (let i = st.embers.length - 1; i >= 0; i--) {
          const e = st.embers[i];
          e.life += dt; e.px = e.x; e.py = e.y;
          const flow = Math.sin(e.y * 0.017 + time * 1.3) * 30 + Math.sin(e.x * 0.011 - time * 0.8) * 14;
          e.vx += (flow - e.vx) * 0.9 * dt;
          e.vy -= 52 * dt;                          // buoyancy
          e.vy *= 1 - 0.32 * dt;                    // air drag
          avoid(e, dt);
          e.x += e.vx * dt; e.y += e.vy * dt;
          if (e.x < w * 0.5 && Math.random() < dt * 2.5) { st.steam.push({ x: e.x, y: e.y, r: 6, vy: -16, life: 0, max: 2.6, ph: Math.random() * TAU }); st.embers.splice(i, 1); continue; }
          if (e.life > e.max || e.y < -12) st.embers.splice(i, 1);
        }
        for (const f of st.flakes) {
          f.y += f.v * dt;
          f.x += (Math.sin(time * 0.7 + f.ph) * 9 + 5) * dt;
          const p = { x: f.x, y: f.y, vx: 0, vy: 0 }; avoid(p, dt); f.x += p.vx * dt * 6; f.y += p.vy * dt * 2;
          if (f.x > w * 0.47) {
            if (Math.random() < 0.6) st.steam.push({ x: f.x, y: f.y, r: 5, vy: -14, life: 0, max: 2.4, ph: Math.random() * TAU });
            f.x = Math.random() * w * 0.4; f.y = -6;
          }
          if (f.y > h + 6) { f.y = -6; f.x = Math.random() * w * 0.45; }
        }
        st.steamClock += dt * 4;
        while (st.steamClock >= 1) { st.steamClock--; st.steam.push({ x: w * 0.5 + (Math.random() - 0.5) * w * 0.05, y: h * (0.4 + Math.random() * 0.6), r: 7, vy: -18, life: 0, max: 3, ph: Math.random() * TAU }); }
        for (let i = st.steam.length - 1; i >= 0; i--) {
          const s = st.steam[i];
          s.life += dt; s.y += s.vy * dt; s.x += Math.sin(time * 1.1 + s.ph) * 7 * dt; s.r += dt * 15;
          if (s.life > s.max) st.steam.splice(i, 1);
        }
        if (st.steam.length > 90) st.steam.splice(0, st.steam.length - 90);
        // Sparkler: sparks spray from the head, slowed by air and pulled down by gravity.
        const unit = Math.min(w, h) / 500 * 1.2;   // sparkler scale (+20%)
        st.sparkClock += dt * 150;
        while (st.sparkClock >= 1) {
          st.sparkClock--;
          const an = Math.random() * TAU, sp = (140 + Math.pow(Math.random(), 1.4) * 620) * unit, roll = Math.random();
          st.sparks.push({ x: cx, y: cy - 4 * unit, px: cx, py: cy, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, life: 0, max: 0.25 + Math.random() * 0.4, drag: 2.2 + Math.random() * 2, s: Math.random(), c: roll > 0.9 ? C.white : roll > 0.55 ? [255, 248, 232] : [255, 202, 120] });
        }
        for (let i = st.sparks.length - 1; i >= 0; i--) {
          const p = st.sparks[i];
          p.life += dt; p.px = p.x; p.py = p.y;
          const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy = p.vy * d + 380 * unit * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.life > p.max) st.sparks.splice(i, 1);
        }
      });
      const bg = ctx.createLinearGradient(0, 0, w, 0);
      bg.addColorStop(0, '#05182b'); bg.addColorStop(0.46, '#0a1220'); bg.addColorStop(0.54, '#1a0d0c'); bg.addColorStop(1, '#2a110b');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      light(ctx, [120, 190, 255], w * 0.12, h * 0.5, w * 0.45, 0.24);
      light(ctx, [255, 140, 90], w * 0.88, h * 0.75, w * 0.5, 0.3);
      light(ctx, C.ember, w * 0.8, h * 1.05, w * 0.4, 0.22);
      // Frost: hexagonal branches growing in, glinting as light passes along them.
      ctx.lineCap = 'round';
      for (const s of st.frost) {
        const p = clamp((t - s.at) / 0.7);
        if (p <= 0) continue;
        const x2 = s.x1 + (s.x2 - s.x1) * smooth(p), y2 = s.y1 + (s.y2 - s.y1) * smooth(p);
        ctx.globalAlpha = 0.16 + 0.34 * (1 - s.depth / 5);
        ctx.strokeStyle = rgba(C.ice, 1);
        ctx.lineWidth = Math.max(0.5, 1.7 - s.depth * 0.3);
        ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(x2, y2); ctx.stroke();
        const glint = Math.pow(Math.max(0, Math.sin(t * 1.5 - s.x2 * 0.025 - s.y2 * 0.008)), 14);
        if (p >= 1 && glint > 0.05) light(ctx, C.ice, s.x2, s.y2, 5 + glint * 4, glint * 0.7);
      }
      for (const f of st.flakes) light(ctx, C.ice, f.x, f.y, f.r * 3, 0.5);
      // Heat shimmer over the warm side.
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.05;
        ctx.strokeStyle = rgba(C.pinkB, 1);
        ctx.beginPath();
        for (let y = h; y >= 0; y -= 8) { const x = w * (0.64 + i * 0.12) + Math.sin(y * 0.045 - t * 3.2 + i * 2) * 5; if (y === h) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
      }
      for (const e of st.embers) {
        const k = e.life / e.max;
        const col = k < 0.3 ? mix(C.ember, C.pinkB, k / 0.3) : mix(C.pinkB, C.pink, (k - 0.3) / 0.7);
        const a = Math.min(1, (1 - k) * 1.1);
        ctx.globalAlpha = a * 0.5; ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = e.r;
        ctx.beginPath(); ctx.moveTo(e.x - e.vx * 0.05, e.y - e.vy * 0.05); ctx.lineTo(e.x, e.y); ctx.stroke();
        light(ctx, col, e.x, e.y, e.r * (4.2 - 1.8 * k), a);
        light(ctx, C.white, e.x, e.y, e.r * 0.9, a * (1 - k));
      }
      for (const s of st.steam) { const k = s.life / s.max; light(ctx, C.white, s.x, s.y, s.r, Math.sin(Math.PI * k) * 0.13); }
      // The seam where they meet.
      ctx.globalAlpha = 0.12; ctx.strokeStyle = rgba(C.white, 1); ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 0; y <= h; y += 6) { const x = w * 0.5 + Math.sin(y * 0.03 + t * 1.4) * 5; if (!y) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      // At the centre, a sparkler burns upright on its wire, as in the page transitions.
      const unit = Math.min(w, h) / 500 * 1.2;   // sparkler scale (+20%)
      const wire = ctx.createLinearGradient(cx, h, cx, cy);
      wire.addColorStop(0, 'rgba(108,79,60,0)'); wire.addColorStop(0.7, 'rgba(145,103,70,0.25)'); wire.addColorStop(1, '#f2b971');
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.strokeStyle = wire; ctx.lineWidth = 1.6 * unit; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, h + 4); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      light(ctx, [255, 200, 120], cx, cy - 6 * unit, 70 * unit, 0.35 + 0.08 * Math.sin(t * 23));
      for (const p of st.sparks) {
        const k = p.life / p.max, a = Math.pow(1 - k, 0.6) * 0.95;
        ctx.globalAlpha = a; ctx.strokeStyle = rgba(p.c, 1); ctx.lineWidth = (0.5 + p.s * 0.9) * unit;
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
        if (p.c === C.white && k < 0.5) light(ctx, C.white, p.x, p.y, 2.5 * unit, a * 0.7);
      }
      // The white-hot head: an uneven, flickering burning edge.
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.fillStyle = '#fffdf5'; ctx.shadowColor = '#ffdda0'; ctx.shadowBlur = 8 * unit;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const an = i / 24 * TAU, rr = 6.5 * unit * (1 + Math.sin(i * 2.7 + t * 14) * 0.24 + Math.cos(i * 1.4 - t * 9) * 0.16);
        const x = cx + Math.cos(an) * rr, y = cy - 4 * unit + Math.sin(an) * rr * 1.3;
        if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    },
  };

  /* BREATHWORK: two soft lungs with a branching bronchial tree. On the inhale light runs
     from the windpipe out to every tip and air is drawn in; on the exhale warm light
     retreats and the breath leaves. Inhale 4 s, hold 1.5 s, exhale 5.5 s. */
  R.breath = {
    init(st, w, h) {
      const S = Math.min(w * 0.42, h * 0.62);
      Object.assign(st, { cx: w / 2, top: h * 0.07, S, s: 0.25, sv: 0, tone: 1, air: [], flow: [], airClock: 0 });
      const fork = { x: st.cx, y: st.top + S * 0.36 };
      const segs = [{ x1: st.cx, y1: st.top, x2: fork.x, y2: fork.y, depth: 0, parent: -1 }];
      const grow = (x, y, a, len, depth, parent) => {
        if (depth > 6) return;
        const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
        const index = segs.push({ x1: x, y1: y, x2, y2, depth, parent }) - 1;
        const spread = 0.42 - depth * 0.025;
        grow(x2, y2, a - spread * (0.75 + Math.random() * 0.5), len * (0.7 + Math.random() * 0.08), depth + 1, index);
        grow(x2, y2, a + spread * (0.75 + Math.random() * 0.5), len * (0.7 + Math.random() * 0.08), depth + 1, index);
      };
      grow(fork.x, fork.y, Math.PI / 2 + 0.78, S * 0.3, 1, 0);
      grow(fork.x, fork.y, Math.PI / 2 - 0.78, S * 0.3, 1, 0);
      st.segs = segs;
      st.fork = fork;
      // Every leaf's route from the windpipe, for the air that travels through the tree.
      st.routes = segs.map((s, i) => i).filter((i) => segs[i].depth === 6).map((leaf) => {
        const chain = [];
        for (let i = leaf; i >= 0; i = segs[i].parent) chain.unshift(segs[i]);
        return chain;
      });
      st.flow = Array.from({ length: 46 }, () => ({ route: Math.floor(Math.random() * st.routes.length), u: Math.random() }));
    },
    guide(t) {
      const p = t % 11;
      if (p < 4) return { stage: 'in', v: smooth(p / 4) };
      if (p < 5.5) return { stage: 'hold', v: 1 };
      return { stage: 'out', v: 1 - smooth((p - 5.5) / 5.5) };
    },
    at(st, x, y) {   // the whole tree swells about the fork as the lungs fill
      const k = 0.86 + 0.16 * st.s;
      return [st.fork.x + (x - st.fork.x) * k, st.fork.y + (y - st.fork.y) * k];
    },
    draw(ctx, w, h, t, st) {
      const { cx, top, S } = st;
      let g = this.guide(t);
      advance(st, t, (dt, time) => {
        g = this.guide(time);
        st.sv += (26 * (g.v - st.s) - 8 * st.sv) * dt;
        st.s += st.sv * dt;
        st.tone += ((g.stage === 'out' ? 0 : 1) - st.tone) * clamp(dt * 1.6);
        const dir = g.stage === 'in' ? 1 : g.stage === 'out' ? -1 : 0;
        for (const f of st.flow) {
          f.u += dir * (0.35 + 0.2 * Math.random()) * dt;
          if (f.u > 1 || f.u < 0) { f.route = Math.floor(Math.random() * st.routes.length); f.u = dir > 0 ? 0 : 1; }
        }
        // Air at the opening: drawn in from above, or released upward and away.
        st.airClock += dt * (dir ? 26 : 4);
        while (st.airClock >= 1) {
          st.airClock--;
          if (dir >= 0) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, d = S * (0.25 + Math.random() * 0.25); st.air.push({ x: cx + Math.cos(a) * d, y: top + Math.sin(a) * d * 0.6, vx: 0, vy: 0, life: 0, max: 1.4, mode: 'in' }); }
          else st.air.push({ x: cx + (Math.random() - 0.5) * 4, y: top, vx: (Math.random() - 0.5) * 40, vy: -30 - Math.random() * 30, life: 0, max: 1.8, mode: 'out' });
        }
        for (let i = st.air.length - 1; i >= 0; i--) {
          const p = st.air[i];
          p.life += dt;
          if (p.mode === 'in') { p.vx += (cx - p.x) * 6 * dt; p.vy += (top - p.y) * 6 * dt; p.vx *= 1 - 2.2 * dt; p.vy *= 1 - 2.2 * dt; }
          else { p.vx *= 1 - 0.6 * dt; p.vy *= 1 - 0.4 * dt; p.vx += Math.sin(time * 2 + i) * 6 * dt; }
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.life > p.max || (p.mode === 'in' && Math.hypot(cx - p.x, top - p.y) < 3)) st.air.splice(i, 1);
        }
        if (st.air.length > 70) st.air.splice(0, st.air.length - 70);
      });
      const cool = [180, 240, 220], warm = C.pinkB;
      const col = mix(warm, cool, st.tone), deep = mix(C.pink, C.mint, st.tone);
      backdrop(ctx, w, h, '#0b0b14', '#09090f');
      ctx.globalCompositeOperation = 'lighter';
      light(ctx, deep, cx, top + S * 0.7, S * 1.3, 0.12 + 0.12 * st.s);
      // Lobes: soft volumes that fill and empty.
      for (const side of [-1, 1]) {
        const k = 0.86 + 0.16 * st.s;
        const lx = cx + side * S * 0.42 * k, ly = top + S * 0.74, rx = S * 0.46 * k, ry = S * 0.56 * k;
        const fill = ctx.createRadialGradient(lx, ly - ry * 0.2, rx * 0.1, lx, ly, ry);
        fill.addColorStop(0, rgba(col, 0.16 + 0.12 * st.s)); fill.addColorStop(1, rgba(deep, 0.02));
        ctx.globalAlpha = 1; ctx.fillStyle = fill;
        ctx.beginPath(); ctx.ellipse(lx, ly, rx, ry, side * -0.12, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(col, 0.18 + 0.12 * st.s); ctx.lineWidth = 1; ctx.stroke();
      }
      // The tree: lit from the windpipe outward as far as the breath has reached.
      const front = 0.4 + st.s * 6.8;
      ctx.lineCap = 'round';
      for (const s of st.segs) {
        const lit = clamp(front - s.depth);
        const [x1, y1] = this.at(st, s.x1, s.y1), [x2, y2] = this.at(st, s.x2, s.y2);
        ctx.globalAlpha = 0.12 + 0.6 * lit;
        ctx.strokeStyle = rgba(lit > 0.02 ? col : C.white, 1);
        ctx.lineWidth = Math.max(0.6, (3.4 - s.depth * 0.45) * (S / 300));
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        if (s.depth === 6 && lit > 0.05) light(ctx, col, x2, y2, (5 + 6 * lit) * (S / 300), 0.55 * lit);
      }
      for (const f of st.flow) {
        const chain = st.routes[f.route], pos = f.u * chain.length, i = Math.min(chain.length - 1, Math.floor(pos)), k = pos - i, s = chain[i];
        const [x, y] = this.at(st, s.x1 + (s.x2 - s.x1) * k, s.y1 + (s.y2 - s.y1) * k);
        light(ctx, col, x, y, 4 * (S / 300), g.stage === 'hold' ? 0.25 : 0.85);
      }
      for (const p of st.air) {
        const a = Math.sin(Math.PI * clamp(p.life / p.max)) * 0.8;
        light(ctx, p.mode === 'in' ? cool : C.pinkB, p.x, p.y, 3, a);
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    },
  };

  /* BODY: a responsive surface like skin and fascia. Two open hands, each on its own
     spring, lower, press and hold, glide and lift in turns. Soft fingers relax into a
     curl and flatten along the surface when they press; the surface takes the print of
     palm and fingertips, bulges at the rim and answers with travelling waves. */
  const FINGERS = [{ x: -0.36, len: 0.62, a: -0.17 }, { x: -0.12, len: 0.8, a: -0.05 }, { x: 0.12, len: 0.86, a: 0.04 }, { x: 0.36, len: 0.74, a: 0.14 }];
  const PALM_CELLS = 4.6, LAYER_W = 92;
  // Finger and thumb joints in palm-width units (fingers toward -y), for one right hand.
  function handGeometry(contact, bends) {
    const relax = 1 - contact, spread = contact * 0.32;
    const digits = FINGERS.map((f, n) => {
      let x = f.x * (1 + spread * 0.08), y = -0.38, a = f.a * (1 + spread);
      const pts = [[x, y]];
      [0.46, 0.31, 0.23].forEach((part, j) => {
        // Relaxed fingers arc softly inward and shorten (curl); pressed ones lie flat.
        // Fingers never stand straight: each joint curves them a little inward, more when
        // they press and knead (a soft cup that follows the hollow they make).
        // (scaled by distance from the hand's centre, so the middle fingers never cross).
        a += (bends[n] - (f.x / 0.36) * (0.05 + contact * 0.08) * (1 + j * 0.5)) * (j ? 1 : 0.4);
        const L = part * f.len * (1 - relax * (0.05 + j * 0.09) - contact * j * 0.05);
        x += Math.sin(a) * L; y -= Math.cos(a) * L; pts.push([x, y]);
      });
      return { pts, width: n === 0 ? 0.19 : 0.215 };
    });
    let x = 0.4, y = 0.1, a = 0.95 + spread * 0.3;
    const thumb = [[x, y]];
    [0.32, 0.27].forEach((part, j) => { a += bends[4] * (j ? 1 : 0.4) - relax * 0.12; x += Math.sin(a) * part; y -= Math.cos(a) * part; thumb.push([x, y]); });
    digits.push({ pts: thumb, width: 0.245 });
    return digits;
  }
  function paintHand(layer, mirror, digits, contact, c, cb) {
    const g = layer.getContext('2d'), W = LAYER_W;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, layer.width, layer.height);
    g.translate(128, 150);
    g.scale(mirror ? -1 : 1, 1);
    g.fillStyle = g.strokeStyle = '#fff';
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.shadowColor = rgba(c, 0.9); g.shadowBlur = 18;
    g.beginPath();
    g.moveTo(-0.46 * W, -0.38 * W);
    g.quadraticCurveTo(-0.53 * W, 0.18 * W, -0.33 * W, 0.62 * W);
    g.lineTo(-0.22 * W, 0.98 * W); g.lineTo(0.24 * W, 0.98 * W); g.lineTo(0.35 * W, 0.56 * W);
    g.quadraticCurveTo(0.56 * W, 0.26 * W, 0.46 * W, -0.38 * W);
    g.closePath(); g.fill();
    for (const digit of digits) {
      const p = digit.pts;
      // A soft, tapering curve through the joints instead of straight sticks.
      for (let j = 1; j < p.length; j++) {
        g.lineWidth = digit.width * W * (1 - (j - 1) * 0.1);
        g.beginPath();
        const [x0, y0] = p[j - 1], [x1, y1] = p[j];
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        const prev = p[j - 2] || [x0 - (x1 - x0), y0 - (y1 - y0)];
        g.moveTo(x0 * W, y0 * W);
        g.quadraticCurveTo((mx + (x0 - prev[0]) * 0.15) * W, (my + (y0 - prev[1]) * 0.15) * W, x1 * W, y1 * W);
        g.stroke();
      }
      // Soft knuckles at the joints, and pads that flatten slightly under pressure.
      for (let j = 1; j < p.length - 1; j++) { g.beginPath(); g.arc(p[j][0] * W, p[j][1] * W, digit.width * W * (0.53 - j * 0.04), 0, TAU); g.fill(); }
      const [tx, ty] = p[p.length - 1];
      g.beginPath(); g.ellipse(tx * W, ty * W, digit.width * W * 0.42 * (1 + contact * 0.22), digit.width * W * 0.4, 0, 0, TAU); g.fill();
    }
    g.shadowBlur = 0;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    const tint = g.createRadialGradient(128, 160, 10, 128, 140, 150);
    tint.addColorStop(0, rgba(C.white, 1)); tint.addColorStop(0.45, rgba(cb, 1)); tint.addColorStop(1, rgba(c, 1));
    g.fillStyle = tint; g.fillRect(0, 0, layer.width, layer.height);
    g.globalCompositeOperation = 'source-over';
  }
  R.body = {
    init(st, w, h) {
      // Rows follow the cell width so cells (and the hands' prints) keep the same
      // foreshortened proportions on a narrow phone as on a wide desktop.
      // On phones the copy covers more of the stage, so the surface sits higher.
      const narrow = w < 600, y0 = h * (narrow ? 0.08 : 0.16), y1 = h * (narrow ? 0.5 : 0.7);
      const cols = Math.round(clamp(w / 20, 26, 50)), cellW = w * 0.88 / (cols - 1);
      const rows = Math.round(clamp((y1 - y0) / (cellW * 0.62), 12, 40)) + 1;
      Object.assign(st, { cols, rows, x0: w * 0.06, x1: w * 0.94, y0, y1, z: new Float32Array(cols * rows), v: new Float32Array(cols * rows) });
      st.hands = [0, 1].map((i) => ({ i, lift: 1, vlift: 0, u: 0.5, v: 0.5, angle: 0, contact: 0, bend: new Float32Array(5), vbend: new Float32Array(5), layer: Object.assign(document.createElement('canvas'), { width: 256, height: 300 }) }));
    },
    // Massage rhythm per hand: lower 0.55 s, hold about 2 s with a slow glide, release.
    path(i, t) {
      const TURN = 3.3, turn = Math.floor(t / TURN), active = turn % 2 === i, k = t % TURN;
      const envelope = k < 0.55 ? smooth(k / 0.55) : k < 2.55 ? 0.94 + 0.06 * Math.sin((k - 0.55) * 3) : k < 3.1 ? smooth((3.1 - k) / 0.55) : 0;
      return {
        u: 0.5 + 0.13 * Math.sin(t * 0.34 + i * 2.4) + (i ? 0.21 : -0.21),
        v: 0.6 + 0.12 * Math.sin(t * 0.5 + i * 1.7),
        press: active ? envelope : 0,
      };
    },
    project(st, i, j, z, w) {
      const fj = clamp(j / (st.rows - 1), 0, 1), depth = 0.78 + 0.22 * fj;
      const x = w / 2 + ((st.x0 + (st.x1 - st.x0) * i / (st.cols - 1)) - w / 2) * depth;
      const y = st.y0 + (st.y1 - st.y0) * Math.pow(fj, 1.15) - z * (46 + 54 * fj);
      return [x, y, depth];
    },
    draw(ctx, w, h, t, st) {
      const { cols, rows, z, v } = st;
      advance(st, t, (dt, time) => {
        for (const hand of st.hands) {
          const p = this.path(hand.i, time);
          const du = (p.u - hand.u) / Math.max(dt, 1e-3);
          hand.u = p.u; hand.v = p.v;
          hand.vlift += (40 * ((1 - 1.5 * p.press) - hand.lift) - 8.5 * hand.vlift) * dt;
          hand.lift += hand.vlift * dt;
          hand.angle += ((hand.i ? -0.1 : 0.1) + clamp(du, -1, 1) * 0.25 - hand.angle) * clamp(dt * 3);
          hand.contact = clamp((0.15 - hand.lift) / 0.45);
          // Each finger is its own soft spring: it lags the hand's glide and settles.
          for (let n = 0; n < 5; n++) {
            const outward = n === 4 ? 1 : FINGERS[n].x < 0 ? -1 : 1;
            const target = -clamp(du, -1.5, 1.5) * 0.14 + Math.sin(time * 0.8 + n * 1.3) * 0.03 * (1 - hand.contact * 0.5);
            hand.vbend[n] += (55 * (target - hand.bend[n]) - 7 * hand.vbend[n]) * dt;
            hand.bend[n] += hand.vbend[n] * dt;
          }
        }
        const steps = 2, sdt = dt / steps;
        for (let s = 0; s < steps; s++) {
          for (let j = 1; j < rows - 1; j++) for (let i = 1; i < cols - 1; i++) {
            const n = j * cols + i, lap = z[n - 1] + z[n + 1] + z[n - cols] + z[n + cols] - 4 * z[n];
            v[n] += (520 * lap - 2.6 * v[n] - 3 * z[n]) * sdt;
          }
          for (const hand of st.hands) {
            if (hand.contact <= 0) continue;
            const hi = hand.u * (cols - 1), hj = hand.v * (rows - 1), ca = Math.cos(hand.angle), sa = Math.sin(hand.angle);
            // The hand presses the surface toward a set depth: a firm, stable print that
            // rebounds in waves on release; the displaced surface rises around the palm.
            const shape = (gi, gj, sigma, depth, rim) => {
              const reach = rim ? 3.4 * sigma : 3 * sigma;
              for (let j = Math.max(1, Math.floor(gj - reach)); j < Math.min(rows - 1, gj + reach); j++) for (let i = Math.max(1, Math.floor(gi - reach)); i < Math.min(cols - 1, gi + reach); i++) {
                const n = j * cols + i, d2 = (i - gi) ** 2 + (j - gj) ** 2, g = Math.exp(-d2 / (2 * sigma * sigma));
                v[n] += 90 * hand.contact * g * (depth * hand.contact - z[n]) * sdt;
                if (rim) { const r = Math.sqrt(d2) / sigma, ring = Math.exp(-((r - 2.3) ** 2) / 0.35); v[n] += 40 * hand.contact * ring * (0.22 * hand.contact - z[n]) * sdt; }
              }
            };
            shape(hi, hj + 0.3 * PALM_CELLS, 1.7, -0.95, true);
            for (const digit of handGeometry(hand.contact, hand.bend)) {
              const [x0, y0] = digit.pts[digit.pts.length - 1];
              const x = hand.i === 1 ? -x0 : x0;
              shape(hi + (x * ca - y0 * sa) * PALM_CELLS, hj + (x * sa + y0 * ca) * PALM_CELLS, 0.8, -0.7, false);
            }
          }
          for (let n = 0; n < z.length; n++) z[n] += v[n] * sdt;
        }
      });
      backdrop(ctx, w, h, '#0c0a12', '#0b0a10');
      ctx.globalCompositeOperation = 'lighter';
      for (const hand of st.hands) {
        const [hx, hy] = this.project(st, hand.u * (cols - 1), hand.v * (rows - 1), 0, w);
        light(ctx, hand.i ? C.mint : C.pink, hx, hy, Math.min(w, h) * 0.34, 0.08 + 0.14 * hand.contact);
      }
      // Shading first: hollows darken, raised rims catch the light.
      for (let j = 1; j < rows - 1; j++) for (let i = 1; i < cols - 1; i++) {
        const value = z[j * cols + i];
        if (Math.abs(value) < 0.04) continue;
        const [x, y] = this.project(st, i, j, value, w);
        if (value < 0) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = Math.min(0.75, -value * 1.25);
          ctx.drawImage(sprite([3, 1, 6]), x - 22, y - 14, 44, 28);
        } else {
          ctx.globalCompositeOperation = 'lighter';
          light(ctx, C.mintB, x, y, 6 + value * 14, Math.min(0.5, value * 2.2));
        }
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(C.white, 1);
      for (let j = 0; j < rows; j++) {
        ctx.globalAlpha = 0.13 + 0.22 * (j / rows);
        ctx.beginPath();
        for (let i = 0; i < cols; i++) { const [x, y] = this.project(st, i, j, z[j * cols + i], w); if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
      }
      for (let i = 0; i < cols; i += 2) {
        ctx.globalAlpha = 0.1; ctx.beginPath();
        for (let j = 0; j < rows; j++) { const [x, y] = this.project(st, i, j, z[j * cols + i], w); if (!j) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
      }
      for (let j = 1; j < rows - 1; j++) for (let i = 1; i < cols - 1; i++) {
        const value = z[j * cols + i];
        if (value > -0.08) continue;
        const [x, y] = this.project(st, i, j, value, w);
        light(ctx, C.pinkB, x, y, 2 + -value * 8, Math.min(0.6, -value * 1.4));
      }
      const cellW = (st.x1 - st.x0) / (cols - 1);
      for (const hand of st.hands) {
        const c = hand.i ? C.mint : C.pink, cb = hand.i ? C.mintB : C.pinkB;
        const lift = Math.max(0, hand.lift), contact = hand.contact;
        const hi = hand.u * (cols - 1), hj = hand.v * (rows - 1);
        // Pressed hands sit down into their hollow.
        const sink = z[Math.round(hj) * cols + Math.round(hi)] || 0;
        const [px, py, depth] = this.project(st, hi, hj, sink * contact, w);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.5 * (1 - lift * 0.55);
        ctx.drawImage(sprite([6, 4, 10]), px - 70 * (1 + lift), py - 28 * (1 + lift) + 8, 140 * (1 + lift), 56 * (1 + lift));
        paintHand(hand.layer, hand.i === 1, handGeometry(contact, hand.bend), contact, c, cb);
        // A fixed, natural aspect (seen at an angle), whatever the screen's shape.
        const grow = 1 + lift * 0.12, sx = cellW * depth * PALM_CELLS / LAYER_W * grow, sy = sx * 0.74;
        ctx.save();
        ctx.translate(px, py - lift * 34);
        ctx.scale(sx, sy);
        ctx.rotate(hand.angle);
        ctx.globalAlpha = 0.72 + 0.2 * contact;
        ctx.drawImage(hand.layer, -128, -150);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.25 + 0.45 * contact;
        ctx.drawImage(hand.layer, -128, -150);
        ctx.restore();
        if (contact > 0.05) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = contact * 0.35; ctx.strokeStyle = rgba(cb, 1); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.ellipse(px, py + 6, 50 + contact * 22, (50 + contact * 22) * 0.3, 0, 0, TAU); ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    },
  };

  /* MOVEMENT: a figure of light flows through a mobility sequence (side reaches, soft
     squats); faint afterimages of its last poses show the motion and the range of ease. */
  R.movement = {
    init(st, w, h) {
      st.S = h * 0.6; st.floor = h * 0.66; st.cx = w * 0.5;
    },
    pose(st, t) {
      const S = st.S, w = 2 * Math.PI / 12;
      const side = Math.sin(t * w), sq = ((1 - Math.cos(2 * t * w)) / 2) * 0.85;
      const lean = side * 0.24;
      const P = (x, y) => ({ x, y });
      const pelvis = P(st.cx - side * S * 0.03, 0);
      const chest = P(pelvis.x + Math.sin(lean) * S * 0.28, pelvis.y - Math.cos(lean) * S * 0.28);
      const head = P(chest.x + Math.sin(lean * 1.3) * S * 0.11, chest.y - Math.cos(lean * 1.3) * S * 0.11);
      const perp = [Math.cos(lean), Math.sin(lean)];
      const shL = P(chest.x - perp[0] * S * 0.11, chest.y - perp[1] * S * 0.11), shR = P(chest.x + perp[0] * S * 0.11, chest.y + perp[1] * S * 0.11);
      const raiseL = smooth((side + 0.25) / 1.1), raiseR = smooth((-side + 0.25) / 1.1);
      const aUL = Math.PI / 2 + 0.35 + raiseL * (Math.PI + 0.6), aUR = Math.PI / 2 - 0.35 - raiseR * (Math.PI + 0.6);
      const limb = (o, a, L) => P(o.x + Math.cos(a) * L, o.y + Math.sin(a) * L);
      const elL = limb(shL, aUL, S * 0.15), elR = limb(shR, aUR, S * 0.15);
      const wrL = limb(elL, aUL - 0.3 * (1 - raiseL) - 0.08, S * 0.14), wrR = limb(elR, aUR + 0.3 * (1 - raiseR) + 0.08, S * 0.14);
      const hipL = P(pelvis.x - S * 0.06, pelvis.y), hipR = P(pelvis.x + S * 0.06, pelvis.y);
      const tL = Math.PI / 2 + 0.1 + sq * 0.34, tR = Math.PI / 2 - 0.1 - sq * 0.34;
      const knL = limb(hipL, tL, S * 0.24), knR = limb(hipR, tR, S * 0.24);
      const ftL = limb(knL, tL - 0.12 - sq * 0.66, S * 0.23), ftR = limb(knR, tR + 0.12 + sq * 0.66, S * 0.23);
      const joints = { pelvis, chest, head, shL, shR, elL, elR, wrL, wrR, hipL, hipR, knL, knR, ftL, ftR };
      const drop = st.floor - Math.max(ftL.y, ftR.y);   // feet stay on the floor
      for (const k in joints) joints[k].y += drop;
      return { joints, aUL, aUR };
    },
    figure(ctx, J, S, alpha, glow) {
      const unit = S / 100;
      const bone = (a, b, c, width) => {
        if (glow) { ctx.globalAlpha = 0.12 * alpha; ctx.strokeStyle = rgba(c, 1); ctx.lineWidth = width * 4; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        ctx.globalAlpha = 0.9 * alpha; ctx.strokeStyle = rgba(c, 1); ctx.lineWidth = Math.max(1.2, width * 0.45);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      };
      if (glow) {
        ctx.globalAlpha = 0.16 * alpha; ctx.fillStyle = rgba(C.white, 1);
        ctx.beginPath(); ctx.moveTo(J.shL.x, J.shL.y); ctx.quadraticCurveTo(J.chest.x, J.chest.y + S * 0.12, J.hipL.x, J.hipL.y); ctx.lineTo(J.hipR.x, J.hipR.y); ctx.quadraticCurveTo(J.chest.x, J.chest.y + S * 0.12, J.shR.x, J.shR.y); ctx.closePath(); ctx.fill();
      }
      bone(J.pelvis, J.chest, C.white, 4.2 * unit); bone(J.shL, J.shR, C.white, 3.4 * unit); bone(J.hipL, J.hipR, C.white, 3.4 * unit);
      bone(J.shL, J.elL, C.pink, 3.2 * unit); bone(J.elL, J.wrL, C.pink, 2.6 * unit);
      bone(J.shR, J.elR, C.mint, 3.2 * unit); bone(J.elR, J.wrR, C.mint, 2.6 * unit);
      bone(J.hipL, J.knL, C.pink, 3.6 * unit); bone(J.knL, J.ftL, C.pink, 3 * unit);
      bone(J.hipR, J.knR, C.mint, 3.6 * unit); bone(J.knR, J.ftR, C.mint, 3 * unit);
      light(ctx, C.white, J.head.x, J.head.y, S * 0.12, 0.7 * alpha);
      if (!glow) return;
      light(ctx, C.white, J.head.x, J.head.y, S * 0.04, 1);
      for (const [k, c] of [['shL', C.pinkB], ['elL', C.pinkB], ['wrL', C.pinkB], ['knL', C.pinkB], ['shR', C.mintB], ['elR', C.mintB], ['wrR', C.mintB], ['knR', C.mintB], ['pelvis', C.white], ['chest', C.white]]) { light(ctx, c, J[k].x, J[k].y, S * 0.045, 0.75); light(ctx, C.white, J[k].x, J[k].y, S * 0.012, 1); }
    },
    draw(ctx, w, h, t, st) {
      backdrop(ctx, w, h, '#0b0d14', '#0a0b10');
      const { joints: J, aUL, aUR } = this.pose(st, t);
      const S = st.S;
      ctx.globalCompositeOperation = 'lighter';
      light(ctx, C.pink, w * 0.3, h * 0.35, w * 0.35, 0.09);
      light(ctx, C.mint, w * 0.7, h * 0.35, w * 0.35, 0.09);
      ctx.globalAlpha = 0.14; ctx.strokeStyle = rgba(C.white, 1); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(w * 0.15, st.floor + 2); ctx.lineTo(w * 0.85, st.floor + 2); ctx.stroke();
      light(ctx, C.white, (J.ftL.x + J.ftR.x) / 2, st.floor + 2, S * 0.22, 0.08);
      const rom = (o, from, to, now, c) => {
        ctx.globalAlpha = 0.09; ctx.strokeStyle = rgba(c, 1); ctx.lineWidth = 1; ctx.setLineDash([2, 5]);
        ctx.beginPath(); ctx.arc(o.x, o.y, S * 0.15, Math.min(from, to), Math.max(from, to)); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 0.45; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(o.x, o.y, S * 0.15, now - 0.18, now + 0.18); ctx.stroke();
      };
      rom(J.shL, Math.PI / 2 + 0.35, Math.PI / 2 + 0.35 + Math.PI + 0.6, aUL, C.pink);
      rom(J.shR, Math.PI / 2 - 0.35 - Math.PI - 0.6, Math.PI / 2 - 0.35, aUR, C.mint);
      ctx.lineCap = 'round';
      // Afterimages of the last moments of movement, fading into the present pose.
      for (const [delay, alpha] of [[0.6, 0.1], [0.4, 0.16], [0.2, 0.24]]) this.figure(ctx, this.pose(st, Math.max(0, t - delay)).joints, S, alpha, false);
      this.figure(ctx, J, S, 1, true);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    },
  };

  /* COMMUNITY: Matthew's light at the centre keeps a steady rhythm. People arrive, are
     welcomed into the circle and gradually fall into step with him and each other
     (coupled oscillators); a flower with a petal for each person opens as they do. */
  R.community = {
    init(st, w, h) {
      Object.assign(st, { cx: w * 0.5, cy: h * 0.36, unit: Math.min(w, h), members: [], order: [], ripples: [], nextArrival: 0.6, spin: 0, guide: 0, sync: 0 });
      for (let i = 0; i < 5; i++) this.add(st, w, h, true);
    },
    add(st, w, h, seated) {
      const a = Math.random() * TAU, far = Math.hypot(w, h) * 0.6;
      const member = { x: seated ? st.cx : st.cx + Math.cos(a) * far, y: seated ? st.cy : st.cy + Math.sin(a) * far, vx: 0, vy: 0, th: Math.random() * TAU, w: 1.5 + Math.random() * 0.6, joined: seated ? 1 : 0, seat: 0 };
      st.members.push(member);
      const n = st.order.length + 1;
      const at = seated ? st.order.length : Math.round((((a - st.spin) % TAU + TAU) % TAU) / TAU * n) % n;
      st.order.splice(at, 0, member);
    },
    draw(ctx, w, h, t, st) {
      const ring = () => st.unit * (0.14 + 0.011 * st.members.length);
      advance(st, t, (dt, time) => {
        if (time >= st.nextArrival && st.members.length < 14) { st.nextArrival = time + 3.4; this.add(st, w, h, false); }
        st.spin += dt * 0.06;
        st.guide += 1.8 * dt;                                   // the steady rhythm at the centre
        const radius = ring(), N = st.members.length;
        st.order.forEach((m, k) => { m.seat = k / N * TAU + st.spin; });
        let sx = 0, sy = 0;
        for (const m of st.members) { sx += Math.cos(m.th); sy += Math.sin(m.th); }
        const mean = Math.atan2(sy, sx), order1 = Math.hypot(sx, sy) / N;
        st.sync += (order1 - st.sync) * clamp(dt * 2);
        for (const m of st.members) {
          const tx = st.cx + Math.cos(m.seat) * radius * 1.25, ty = st.cy + Math.sin(m.seat) * radius;
          const k = m.joined ? 7 : 2.2, damp = m.joined ? 4.6 : 2.4;
          m.vx += ((tx - m.x) * k - m.vx * damp) * dt; m.vy += ((ty - m.y) * k - m.vy * damp) * dt;
          m.x += m.vx * dt; m.y += m.vy * dt;
          if (!m.joined && Math.hypot(tx - m.x, ty - m.y) < 8) { m.joined = 1; st.ripples.push({ x: m.x, y: m.y, at: time }); }
          const toGuide = m.joined ? 0.9 : 0.15, toGroup = m.joined ? 0.8 : 0.1;
          m.th += (m.w + toGuide * Math.sin(st.guide - m.th) + toGroup * order1 * Math.sin(mean - m.th)) * dt;
        }
        st.ripples = st.ripples.filter((r) => time - r.at < 1.6);
      });
      backdrop(ctx, w, h, '#0a110e', '#0a0d0c');
      const { cx, cy } = st, radius = ring();
      const beat = Math.pow((1 + Math.sin(st.guide)) / 2, 3);
      const pulseOf = (m) => Math.pow((1 + Math.sin(m.th)) / 2, 4);
      ctx.globalCompositeOperation = 'lighter';
      light(ctx, mix(C.mint, C.pink, beat), cx, cy, radius * (2.2 + st.sync * 0.9), 0.1 + 0.25 * st.sync);
      // The shared flower: one petal toward each seated person, opening as they align.
      const seated = st.order.filter((m) => m.joined);
      const open = st.sync * (0.75 + 0.25 * beat);
      for (const m of seated) {
        const a = Math.atan2(m.y - cy, m.x - cx), len = radius * 0.85 * open, wid = Math.min(0.42, 2.6 / Math.max(3, seated.length));
        if (len < 2) continue;
        ctx.globalAlpha = 0.14 + 0.2 * open;
        ctx.fillStyle = rgba(mix(C.mintB, C.pinkB, beat), 1);
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(cx + Math.cos(a - wid) * len * 0.7, cy + Math.sin(a - wid) * len * 0.7, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        ctx.quadraticCurveTo(cx + Math.cos(a + wid) * len * 0.7, cy + Math.sin(a + wid) * len * 0.7, cx, cy);
        ctx.fill();
      }
      for (let i = 0; i < seated.length; i++) {
        const a = seated[i], b = seated[(i + 1) % seated.length];
        if (seated.length < 2) break;
        const together = (Math.cos(a.th - b.th) + 1) / 2;
        ctx.globalAlpha = 0.06 + 0.3 * together * together; ctx.strokeStyle = rgba(mix(C.mint, C.pink, together), 1); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2 + (cx - (a.x + b.x) / 2) * 0.15, (a.y + b.y) / 2 + (cy - (a.y + b.y) / 2) * 0.15, b.x, b.y); ctx.stroke();
        const aligned = (Math.cos(a.th - st.guide) + 1) / 2;
        ctx.globalAlpha = 0.04 + 0.22 * Math.pow(aligned, 3); ctx.strokeStyle = rgba(C.gold, 1);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(a.x, a.y); ctx.stroke();
      }
      for (const r of st.ripples) {
        const k = (t - r.at) / 1.6;
        ctx.globalAlpha = Math.pow(1 - k, 2) * 0.5; ctx.strokeStyle = rgba(C.white, 1); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(r.x, r.y, 6 + k * 42, 0, TAU); ctx.stroke();
      }
      for (const m of st.members) {
        const p = pulseOf(m), c = mix(C.mint, C.pink, p);
        if (!m.joined) {
          ctx.globalAlpha = 0.25; ctx.strokeStyle = rgba(C.mintB, 1); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(m.x - m.vx * 0.25, m.y - m.vy * 0.25); ctx.lineTo(m.x, m.y); ctx.stroke();
        }
        light(ctx, c, m.x, m.y, 10 + p * 18, 0.45 + 0.5 * p);
        light(ctx, C.white, m.x, m.y, 3 + p * 2.5, 0.9);
      }
      // Matthew: the guiding light whose rhythm the circle finds.
      light(ctx, C.gold, cx, cy, 26 + beat * 22, 0.5 + 0.4 * beat);
      light(ctx, C.white, cx, cy, 6 + beat * 3, 1);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    },
  };

  return { renderers: R, palette: C };
}
