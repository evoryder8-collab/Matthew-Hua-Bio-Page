// The selected element tab sizzles like a small sparkler: warm sparks leave its edges,
// arc and fall. Drawn on a fixed overlay that follows the tab, so neither the tab's own
// clipping nor the scrolling mobile row can cut them off. Runs only while visible.

// Saturated sparkler colours: they must read on the site's light pastel background.
const COLORS = [[240, 150, 30], [255, 120, 30], [255, 190, 60], [214, 52, 136]];

export function mountTabSparks(tablist, { reducedMotion }) {
  const doc = tablist.ownerDocument, win = doc.defaultView;
  const canvas = doc.createElement('canvas');
  canvas.className = 'tab-sparks';
  canvas.setAttribute('aria-hidden', 'true');
  doc.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const sparks = [];
  let frame = null, last = null, visible = false, clock = 0, destroyed = false, burstLeft = 0;

  function size() {
    const dpr = Math.min(2, win.devicePixelRatio || 1);
    canvas.width = Math.ceil(win.innerWidth * dpr);
    canvas.height = Math.ceil(win.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // A point on the tab's outline, with the outward direction there.
  function edgePoint(r) {
    const perimeter = 2 * (r.width + r.height);
    let d = Math.random() * perimeter;
    if (d < r.width) return [r.left + d, r.top, 0, -1];
    d -= r.width;
    if (d < r.height) return [r.right, r.top + d, 1, 0];
    d -= r.height;
    if (d < r.width) return [r.right - d, r.bottom, 0, 1];
    d -= r.width;
    return [r.left, r.bottom - d, -1, 0];
  }

  function spawn(r, strength) {
    const [x, y, nx, ny] = edgePoint(r);
    const speed = (55 + Math.pow(Math.random(), 1.5) * 190) * strength;
    const spread = (Math.random() - 0.5) * 1.3;
    const ax = nx * Math.cos(spread) - ny * Math.sin(spread), ay = nx * Math.sin(spread) + ny * Math.cos(spread);
    sparks.push({ x, y, px: x, py: y, vx: ax * speed, vy: ay * speed - 20, life: 0, max: 0.3 + Math.random() * 0.5, c: COLORS[Math.random() < 0.55 ? 0 : Math.random() < 0.6 ? 1 : Math.random() < 0.6 ? 2 : 3], w: 0.55 + Math.random() * 0.75 });
  }

  function tick(now) {
    frame = null;
    if (destroyed) return;
    const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    const tab = tablist.querySelector('[aria-selected="true"]');
    const r = tab?.getBoundingClientRect();
    const onScreen = r && r.bottom > 0 && r.top < win.innerHeight && r.right > 0 && r.left < win.innerWidth;
    if (onScreen && visible) {
      clock += dt * 80;
      while (clock >= 1) { clock--; spawn(r, 1); }
      if (burstLeft > 0) { const n = Math.min(burstLeft, 6); burstLeft -= n; for (let i = 0; i < n; i++) spawn(r, 1.6); }
    }
    ctx.clearRect(0, 0, win.innerWidth, win.innerHeight);
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life += dt; s.px = s.x; s.py = s.y;
      const drag = Math.exp(-2.6 * dt);
      s.vx *= drag; s.vy = s.vy * drag + 170 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.life > s.max) { sparks.splice(i, 1); continue; }
      const k = s.life / s.max, a = Math.pow(1 - k, 0.7);
      const colour = `rgb(${s.c[0]},${s.c[1]},${s.c[2]})`;
      const tailX = s.x - s.vx * 0.055, tailY = s.y - s.vy * 0.055;   // a fine streak along its flight
      ctx.strokeStyle = colour;
      ctx.globalAlpha = a * 0.14; ctx.lineWidth = s.w * 3.5;                // soft halo
      ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(s.x, s.y); ctx.stroke();
      ctx.globalAlpha = a * 0.95; ctx.lineWidth = s.w;                      // the spark
      ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(s.x, s.y); ctx.stroke();
      if (k < 0.3) { ctx.globalAlpha = a; ctx.fillStyle = '#fff6dc'; ctx.beginPath(); ctx.arc(s.x, s.y, s.w * 0.75, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    if ((visible && onScreen) || sparks.length) frame = win.requestAnimationFrame(tick);
    else last = null;
  }

  function wake() {
    if (destroyed || reducedMotion.matches || doc.hidden || frame !== null) return;
    last = null;
    frame = win.requestAnimationFrame(tick);
  }

  const observer = 'IntersectionObserver' in win ? new win.IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) wake();
  }) : null;
  observer?.observe(tablist);
  if (!observer) visible = true;
  const onVisibility = () => { if (!doc.hidden) wake(); };
  size();
  win.addEventListener('resize', size, { passive: true });
  win.addEventListener('scroll', wake, { passive: true });
  doc.addEventListener('visibilitychange', onVisibility);

  return {
    /** A brighter flurry when an element is chosen. */
    burst() { burstLeft += 36; wake(); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (frame !== null) win.cancelAnimationFrame(frame);
      observer?.disconnect();
      win.removeEventListener('resize', size);
      win.removeEventListener('scroll', wake);
      doc.removeEventListener('visibilitychange', onVisibility);
      canvas.remove();
    },
  };
}
