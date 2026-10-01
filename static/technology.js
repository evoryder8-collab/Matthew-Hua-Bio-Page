const mounted = new WeakMap();
const visualSelector = '.m-viz[data-machine-visual]';

export function renderMachineVisual(kind) {
  if (kind === 'release') {
    return `<div class="m-viz viz-rc" data-machine-visual="release" aria-hidden="true">
      <svg viewBox="0 0 400 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        <path class="hand" d="M250 30 q40 10 50 45 q8 30 -20 45" />
        <path class="spiral" d="M70 75 q30 -45 70 -20 q40 25 10 55 q-28 28 -58 4 q-26 -22 0 -44 q22 -18 44 0 q16 14 0 28" />
        <path class="spiral two" d="M150 90 q40 -30 80 -8 q34 20 70 6" />
      </svg>
    </div>`;
  }
  if (kind === 'zimmer') {
    // Keep the original sonar diagram, without the unverified dose percentage.
    return `<div class="m-viz viz-zs" data-machine-visual="zimmer" aria-hidden="true">
      <div class="grid"></div>
      <span class="wave"></span><span class="wave"></span><span class="wave"></span>
      <span class="couple"></span>
      <svg class="dose" viewBox="0 0 132 48" aria-hidden="true" focusable="false">
        <path class="baseline" d="M0 24 H132" />
        <path class="trace" d="M0 24 H12 Q18 24 22 12 T32 24 T42 36 T52 24 T62 12 T72 24 T82 36 T92 24 T102 12 T112 24 H132" />
      </svg>
    </div>`;
  }
  throw new RangeError(`Unknown machine visual: ${kind}`);
}

export function mountTechnologyEffects(host, { reducedMotion = false } = {}) {
  if (!host?.querySelectorAll) {
    throw new TypeError('mountTechnologyEffects requires a DOM host.');
  }
  mounted.get(host)?.destroy();

  const doc = host.ownerDocument || host;
  const win = doc.defaultView;
  const visuals = [...host.querySelectorAll(visualSelector)];
  if (host.matches?.(visualSelector)) visuals.unshift(host);
  const visible = new Set();
  const motion = win?.matchMedia?.('(prefers-reduced-motion: reduce)');
  let observer;
  let destroyed = false;

  function sync() {
    if (destroyed) return;
    const reduced = Boolean(reducedMotion || motion?.matches);
    for (const visual of visuals) {
      visual.dataset.technologyReduced = String(reduced);
      visual.dataset.technologyActive = String(
        !reduced && !doc.hidden && visual.isConnected && visible.has(visual),
      );
    }
  }

  const api = {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer?.disconnect();
      doc.removeEventListener('visibilitychange', sync);
      if (motion?.removeEventListener) motion.removeEventListener('change', sync);
      else motion?.removeListener?.(sync);
      for (const visual of visuals) visual.dataset.technologyActive = 'false';
      visible.clear();
      if (mounted.get(host) === api) mounted.delete(host);
    },
  };

  mounted.set(host, api);
  sync();
  if (!win || !visuals.length) return api;

  // Without intersection observation, the diagrams remain safely static.
  if (win.IntersectionObserver) {
    observer = new win.IntersectionObserver((entries) => {
      if (destroyed) return;
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > 0) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      sync();
    }, { threshold: [0, 0.01] });
    for (const visual of visuals) observer.observe(visual);
  }
  doc.addEventListener('visibilitychange', sync);
  if (motion?.addEventListener) motion.addEventListener('change', sync);
  else motion?.addListener?.(sync);
  return api;
}
