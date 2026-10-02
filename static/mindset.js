const SIGNALS = [
  { x: 20, y: 24, color: 'blue' },
  { x: 76, y: 22, color: 'blue' },
  { x: 26, y: 60, color: 'blue' },
  { x: 78, y: 62, color: 'red' },
  { x: 50, y: 16, color: 'gold' },
  { x: 62, y: 48, color: 'gold' },
  { x: 14, y: 46, mobileX: 9, color: 'gold' },
  { x: 44, y: 32, color: 'neutral' },
  { x: 88, y: 44, color: 'neutral' },
  { x: 36, y: 52, mobileX: 44, color: 'neutral' },
  { x: 58, y: 68, color: 'neutral' },
  { x: 30, y: 40, mobileX: 26, color: 'neutral' },
];

const PHASES = [
  'intro', 'memorize3seconds', 'recall3positions', 'red', 'reveal',
  'focusTitle', 'lessonTitle', 'integrationTitle', 'finalPhoto',
];
// A 2400px copy of the 6696px original: same framing, about 8x less to decode on phones.
const PHOTO = 'matthew-tony-game-2400.webp';
const MEMORIZE_MS = 3000;
// Slides crossfade instead of cutting; the memory clock waits for the fade to clear.
const PHASE_FADE_MS = 420;
// The philosophy slides after the answer travel right to left like a passing torch.
const WHOOSH_MS = 720;
const TEACHING = ['reveal', 'focusTitle', 'lessonTitle', 'integrationTitle'];
let instanceId = 0;

let ghostSheet;
/**
 * The page's own game rules, rebuilt once for the shadow-root copy used in crossfades.
 * Dialog-scoped rules (.game-window ...) are re-pointed at the copy's wrapper.
 * Browsers without constructable stylesheets simply skip the crossfade.
 */
function ghostStyles(doc) {
  if (ghostSheet !== undefined) return ghostSheet;
  ghostSheet = null;
  const Sheet = doc.defaultView?.CSSStyleSheet;
  if (!Sheet || !('adoptedStyleSheets' in doc)) return null;
  try {
    const rules = [];
    for (const styleSheet of doc.styleSheets) {
      let list;
      try { list = styleSheet.cssRules; } catch { continue; }
      for (const rule of list) {
        if (rule.cssText.includes('mindset')) rules.push(rule.cssText.replaceAll('.game-window', '.ghost-window'));
      }
    }
    if (!rules.length) return null;
    const sheet = new Sheet();
    sheet.replaceSync(`:host{display:block;overflow:hidden}${rules.join('\n')}
      *,*::before,*::after{animation:none!important;transition:none!important}
      .ghost-clear .mindset-game,.ghost-clear .mindset-field{background:transparent!important;background-image:none!important;box-shadow:none!important}`);
    ghostSheet = sheet;
  } catch { ghostSheet = null; }
  return ghostSheet;
}

function quarterOf(signal) {
  return `${signal.y < 50 ? 't' : 'b'}${signal.x < 50 ? 'l' : 'r'}`;
}

/** Mount one self-contained experiment; the caller owns its locale and lifetime. */
export function mountMindset(host, { copy, asset, reducedMotion = false, onPhaseChange = () => {}, onSound = () => {}, onContinue = null }) {
  // Named cues only; the page decides whether sound is allowed.
  const sound = (name) => { try { onSound(name); } catch { /* sound is decorative */ } };
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  const id = `mindset-${++instanceId}`;
  const picks = new Set();
  let phase = 'intro';
  let answer = null;
  let destroyed = false;
  let suspended = false;
  let timer = null;
  let remaining = MEMORIZE_MS;
  let runningSince = null;
  let graceUntil = 0;
  let confirmButton = null;

  function element(tag, className, text) {
    const node = doc.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function text(key, values = {}) {
    const template = typeof copy[key] === 'string' ? copy[key] : '';
    return template.replace(/\{(\w+)\}/g, (token, name) => (
      Object.hasOwn(values, name) ? String(values[name]) : token
    ));
  }

  const root = element('section', 'mindset-game');
  root.classList.toggle('mindset-reduced-motion', Boolean(reducedMotion));
  root.setAttribute('aria-labelledby', `${id}-title`);
  const field = element('div', 'mindset-field');
  field.tabIndex = -1;
  field.setAttribute('role', 'group');
  field.setAttribute('aria-label', text('fieldLabel'));
  const content = element('div', 'mindset-content');
  const meta = element('div', 'mindset-meta');
  const eyebrow = element('p', 'mindset-eyebrow', text('eyebrow'));
  const progress = element('progress', 'mindset-progress');
  progress.max = PHASES.length;
  progress.setAttribute('aria-label', text('progressLabel'));
  meta.append(eyebrow, progress);
  const title = element('h3', 'mindset-title');
  title.id = `${id}-title`;
  title.tabIndex = -1;
  const description = element('div', 'mindset-description');
  description.id = `${id}-description`;
  const memorySummary = element('p', 'mindset-sr-only');
  memorySummary.id = `${id}-memory`;
  const feedback = element('div', 'mindset-feedback');
  const status = element('p', 'mindset-status');
  status.id = `${id}-status`;
  status.setAttribute('role', 'status');
  status.setAttribute('aria-atomic', 'true');
  const countdown = element('span', 'mindset-countdown');
  countdown.setAttribute('role', 'timer');
  countdown.setAttribute('aria-label', text('memorize'));
  countdown.setAttribute('aria-live', 'off');
  const clockNumber = element('span', 'mindset-countdown-number');
  const clockRing = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  clockRing.setAttribute('viewBox', '0 0 44 44');
  clockRing.setAttribute('aria-hidden', 'true');
  for (const name of ['background', 'remaining']) {
    const circle = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', `mindset-clock-${name}`);
    circle.setAttribute('cx', '22');
    circle.setAttribute('cy', '22');
    circle.setAttribute('r', '20');
    clockRing.append(circle);
  }
  countdown.append(clockRing, clockNumber);
  feedback.append(status, countdown);
  const controls = element('div', 'mindset-controls');
  content.append(meta, title, description, memorySummary, feedback, controls);
  // Above the blurred answer field: where the red signal really was.
  const truth = element('div', 'mindset-truth');
  truth.setAttribute('aria-hidden', 'true');
  truth.hidden = true;
  root.append(field, content, truth);
  host.append(root);

  function addButton(label, action, className = '') {
    const button = element('button', `mindset-button ${className}`.trim(), label);
    button.type = 'button';
    button.dataset.action = action;
    if (action === 'next') {
      button.classList.add('mindset-next');
      button.setAttribute('aria-label', label);
    }
    controls.append(button);
    return button;
  }

  function paragraph(key, className = 'mindset-copy') {
    description.append(element('p', className, text(key)));
  }

  function renderSignals(colored = false, interactive = false) {
    SIGNALS.forEach((signal, index) => {
      const node = element(interactive ? 'button' : 'span', 'mindset-signal');
      node.style.setProperty('--mindset-x', `${signal.x}%`);
      node.style.setProperty('--mindset-y', `${signal.y}%`);
      node.style.setProperty('--mindset-mobile-x', `${signal.mobileX ?? signal.x}%`);
      node.style.setProperty('--mindset-delay', `${-((signal.x + signal.y) % 5)}s`);
      for (const part of ['aura', 'stem', 'ring', 'core', 'orbit']) {
        const layer = element('span', `mindset-signal-${part}`);
        layer.setAttribute('aria-hidden', 'true');
        if (part === 'orbit') layer.append(element('i', 'mindset-signal-point'));
        node.append(layer);
      }
      if (colored) node.classList.add(`mindset-signal-${signal.color}`);
      if (interactive) {
        node.type = 'button';
        node.dataset.position = String(index);
        node.setAttribute('aria-label', text('position', { number: index + 1 }));
        node.setAttribute('aria-pressed', 'false');
      } else {
        node.setAttribute('aria-hidden', 'true');
        if (['reveal', 'focusTitle', 'lessonTitle', 'integrationTitle'].includes(phase) && picks.has(index)) {
          node.classList.add('mindset-signal-picked');
        }
      }
      field.append(node);
    });
  }

  function renderMemorySummary() {
    const blue = SIGNALS.flatMap((signal, index) => signal.color === 'blue'
      ? [`${text('position', { number: index + 1 })} (${text(quarterOf(signal))})`] : []);
    const redIndex = SIGNALS.findIndex((signal) => signal.color === 'red');
    const redPosition = text('position', { number: redIndex + 1 });
    memorySummary.textContent = `${text('memorize')} ${blue.join(', ')}. ${text('red')} ${redPosition} (${text(quarterOf(SIGNALS[redIndex]))}).`;
    memorySummary.hidden = false;
  }

  function renderLife() {
    renderSignals(true);
    const list = element('ul', 'mindset-life');
    list.setAttribute('aria-hidden', 'true');
    const positions = [[20, 16], [26, 76], [76, 14], [80, 54], [50, 8], [13, 38], [62, 40]];
    const labels = Array.isArray(copy.labels) ? copy.labels : [];
    labels.forEach((label, index) => {
      const item = element('li', 'mindset-life-label', String(label));
      item.classList.add(index < 3 ? 'mindset-life-concern' : 'mindset-life-support');
      const [x, y] = positions[index % positions.length];
      item.style.left = `${x}%`;
      item.style.top = `${y}%`;
      list.append(item);
    });
    field.append(list);
  }

  /** Reveal the red signal crisply, whether the visitor found it or not. */
  function renderTruth(caught) {
    const red = SIGNALS.find((signal) => signal.color === 'red');
    const marker = element('span', 'mindset-truth-signal');
    marker.style.setProperty('--mindset-x', `${red.x}%`);
    marker.style.setProperty('--mindset-y', `${red.y}%`);
    marker.style.setProperty('--mindset-mobile-x', `${red.mobileX ?? red.x}%`);
    for (const part of ['glow', 'pulse', 'pulse', 'ring', 'core']) marker.append(element('span', `mindset-truth-${part}`));
    truth.toggleAttribute('data-caught', caught);
    truth.replaceChildren(marker);
    truth.hidden = false;
  }

  // Decode the closing photograph during the teaching slides, so its slide never waits.
  let warmed = null;
  function warmPhoto() {
    if (warmed) return;
    warmed = new win.Image();
    warmed.decoding = 'async';
    warmed.src = asset(PHOTO);
    warmed.decode?.().catch(() => {});
  }

  function renderPhoto() {
    const wrapper = element('div', 'mindset-photo-frame');
    const photo = element('img', 'mindset-photo');
    photo.src = asset(PHOTO);
    photo.alt = text('photoAlt') || 'Matthew Hua, Tony Robbins';
    photo.width = 2400;
    photo.height = 2400;
    photo.decoding = 'async';
    wrapper.append(photo);
    field.append(wrapper);
  }

  function stopTimer() {
    if (timer !== null) win.clearTimeout(timer);
    timer = null;
    runningSince = null;
  }

  function updateClock() {
    clockNumber.textContent = String(Math.max(1, Math.ceil(remaining / 1000)));
    countdown.style.setProperty('--mindset-clock-offset', String(126 * (1 - remaining / MEMORIZE_MS)));
    status.textContent = doc.hidden ? text('paused') : '';
  }

  function consumeTime() {
    if (runningSince === null) return;
    const now = win.performance.now();
    const from = Math.max(runningSince, graceUntil);
    if (now > from) remaining = Math.max(0, remaining - (now - from));
    runningSince = now;
  }

  function animated() {
    return !reducedMotion && !win.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      && root.isConnected && root.getClientRects().length > 0 && typeof root.animate === 'function';
  }

  /**
   * Leave a still copy of the outgoing slide over the new one and fade it away.
   * The copy lives in a closed shadow root, so it adds no duplicate ids, buttons or
   * headings to the page, and it never takes input. Leaving the memory phase, its
   * signals are removed and it turns transparent: no blue signal lingers and every
   * choice is visible at once.
   */
  function crossfade(from, whoosh = false) {
    const height = root.offsetHeight;
    const sheet = ghostStyles(doc);
    root.querySelectorAll(':scope > .mindset-ghost').forEach((node) => node.remove());
    if (!sheet) return height;
    const border = parseFloat(win.getComputedStyle(root).borderTopWidth) || 0;
    const copy = root.cloneNode(true);
    copy.querySelectorAll('.mindset-ghost').forEach((node) => node.remove());
    copy.classList.remove('mindset-entering', 'mindset-whooshing');
    const frame = doc.createElement('div');
    frame.classList.toggle('ghost-window', Boolean(root.closest('.game-window')));
    if (from === 'memorize3seconds') {
      frame.classList.add('ghost-clear');
      copy.querySelector('.mindset-field')?.replaceChildren();
    }
    frame.append(copy);
    const ghost = doc.createElement('div');
    ghost.className = 'mindset-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.inert = true;
    Object.assign(ghost.style, { top: `${-border}px`, left: `${-border}px`, right: `${-border}px`, height: `${height}px` });
    const shadow = ghost.attachShadow({ mode: 'closed' });
    shadow.adoptedStyleSheets = [sheet];
    shadow.append(frame);
    root.append(ghost);
    const fade = whoosh
      ? ghost.animate([
        { transform: 'translateX(0)', opacity: 1, filter: 'blur(0)' },
        { transform: 'translateX(-5%)', opacity: 0.92, filter: 'blur(1px)', offset: 0.28 },
        { transform: 'translateX(-24%)', opacity: 0, filter: 'blur(12px)' },
      ], { duration: WHOOSH_MS, easing: 'cubic-bezier(.62,0,.32,1)', fill: 'forwards' })
      : ghost.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: PHASE_FADE_MS, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards',
      });
    fade.finished.catch(() => {}).then(() => ghost.remove());
    return height;
  }

  function settleHeight(from) {
    const to = root.offsetHeight;
    if (Math.abs(to - from) < 3) return;
    root.animate([{ height: `${from}px` }, { height: `${to}px` }], {
      duration: PHASE_FADE_MS + 120, easing: 'cubic-bezier(.22,1,.36,1)',
    });
  }

  function tick() {
    timer = null;
    if (destroyed || suspended || phase !== 'memorize3seconds') return;
    consumeTime();
    if (doc.hidden) {
      stopTimer();
      updateClock();
      return;
    }
    if (remaining <= 0) {
      // Do not steal focus if the visitor left the experiment while it ran.
      setPhase('recall3positions', root.contains(doc.activeElement));
      return;
    }
    updateClock();
    timer = win.setTimeout(tick, Math.min(100, remaining));
  }

  function onVisibilityChange() {
    if (destroyed || suspended || phase !== 'memorize3seconds') return;
    if (doc.hidden) {
      consumeTime();
      stopTimer();
      updateClock();
    } else {
      runningSince = win.performance.now();
      tick();
    }
  }

  function updatePicks() {
    for (const node of field.querySelectorAll('[data-position]')) {
      const selected = picks.has(Number(node.dataset.position));
      node.setAttribute('aria-pressed', String(selected));
      node.classList.toggle('mindset-signal-picked', selected);
    }
    status.textContent = text('selected', { count: picks.size });
    confirmButton.disabled = picks.size !== 3;
  }

  function setPhase(next, focus = true, initial = false) {
    if (destroyed) return;
    stopTimer();
    const smooth = !initial && animated();
    const whoosh = !initial && TEACHING.includes(phase) && next !== 'intro';
    const previousHeight = smooth ? crossfade(phase, whoosh) : 0;
    if (whoosh) sound('whoosh');
    phase = next;
    root.dataset.phase = phase;
    const meaning = ['reveal', 'focusTitle', 'lessonTitle', 'integrationTitle'].includes(phase);
    root.classList.toggle('mindset-meaning', meaning);
    progress.value = PHASES.indexOf(phase) + 1;
    field.replaceChildren();
    field.removeAttribute('aria-hidden');
    field.setAttribute('aria-label', text('fieldLabel'));
    field.setAttribute('aria-describedby', `${title.id} ${description.id}`);
    description.replaceChildren();
    memorySummary.hidden = true;
    memorySummary.textContent = '';
    title.removeAttribute('aria-describedby');
    status.textContent = '';
    countdown.hidden = phase !== 'memorize3seconds';
    truth.hidden = true;
    truth.replaceChildren();
    controls.replaceChildren();
    controls.classList.toggle('mindset-controls-quarters', phase === 'red');
    confirmButton = null;

    if (phase === 'intro') {
      picks.clear();
      answer = null;
      title.textContent = text('title');
      paragraph('intro', 'mindset-lead');
      paragraph('introSub');
      paragraph('memorize', 'mindset-instruction');
      renderSignals(true);
      field.setAttribute('aria-hidden', 'true');
      addButton(text('begin'), 'begin');
    } else if (phase === 'memorize3seconds') {
      title.textContent = text('memorize');
      paragraph('memorizeSub');
      renderSignals(true);
      renderMemorySummary();
      title.setAttribute('aria-describedby', memorySummary.id);
      remaining = MEMORIZE_MS;
      graceUntil = win.performance.now() + (smooth ? PHASE_FADE_MS : 0);
      runningSince = doc.hidden || suspended ? null : win.performance.now();
      updateClock();
      if (!doc.hidden && !suspended) timer = win.setTimeout(tick, 100);
    } else if (phase === 'recall3positions') {
      title.textContent = text('recall');
      paragraph('recallSub');
      renderSignals(false, true);
      confirmButton = addButton(text('confirm'), 'confirm');
      confirmButton.setAttribute('aria-describedby', status.id);
      updatePicks();
    } else if (phase === 'red') {
      title.textContent = text('red');
      paragraph('redSub');
      renderSignals();
      for (const quarter of ['tl', 'tr', 'bl', 'br']) {
        const button = addButton(text(quarter), 'answer', 'mindset-quarter');
        button.dataset.quarter = quarter;
      }
      const unknown = addButton(text('unknown'), 'answer', 'mindset-unknown');
      unknown.dataset.quarter = 'unknown';
    } else if (phase === 'reveal') {
      const red = SIGNALS.find((signal) => signal.color === 'red');
      const caught = answer === quarterOf(red);
      title.textContent = text(caught ? 'caught' : 'missed');
      const score = [...picks].filter((index) => SIGNALS[index].color === 'blue').length;
      description.append(element('p', 'mindset-score', text('score', { count: score })));
      paragraph('revealCopy');
      renderSignals(true);
      renderTruth(caught);
      warmPhoto();
      if (!caught) sound('twinkle');
      renderMemorySummary();
      addButton(text('next'), 'next');
    } else if (phase === 'focusTitle') {
      title.textContent = text('focusTitle');
      paragraph('focusCopy');
      renderSignals(true);
      field.setAttribute('aria-hidden', 'true');
      addButton(text('next'), 'next');
    } else if (phase === 'lessonTitle' || phase === 'integrationTitle') {
      title.textContent = text(phase);
      paragraph(phase === 'lessonTitle' ? 'lessonCopy' : 'integrationCopy');
      field.setAttribute('aria-label', text(phase));
      field.removeAttribute('aria-describedby');
      renderLife();
      addButton(text('next'), 'next');
    } else if (phase === 'finalPhoto') {
      title.textContent = text('finalTitle');
      paragraph('finalCopy');
      field.removeAttribute('aria-describedby');
      field.setAttribute('aria-label', text('finalTitle'));
      renderPhoto();
      // Onward is the main invitation; the inline replay is hidden inside the pop-up,
      // whose toolbar already offers it.
      if (onContinue) addButton(text('continueOn'), 'continue', 'mindset-continue');
      addButton(text('replay'), 'replay', 'mindset-replay');
      sound('conclusion');
    }

    feedback.hidden = !['memorize3seconds', 'recall3positions'].includes(phase);
    // The entrance runs once and holds its end state; no timer is needed (or allowed)
    // while the game waits for input. The next slide resets it.
    root.classList.remove('mindset-entering', 'mindset-whooshing');
    if (smooth) {
      void root.offsetWidth;
      root.classList.add(whoosh ? 'mindset-whooshing' : 'mindset-entering');
      settleHeight(previousHeight);
    }
    if (meaning) {
      field.setAttribute('aria-hidden', 'true');
      field.removeAttribute('aria-describedby');
    }
    if (focus) (phase === 'recall3positions' ? field : title).focus({ preventScroll: true });
    if (phase === 'reveal' && focus) {
      root.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
    if (phase === 'memorize3seconds' && !doc.hidden) {
      // Begin may have been below the fold; the timed field must be visible.
      field.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
    onPhaseChange(phase);
  }

  function onClick(event) {
    const button = event.target.closest('button');
    if (destroyed || !button || !root.contains(button) || button.disabled) return;
    if (phase === 'recall3positions' && button.hasAttribute('data-position')) {
      const position = Number(button.dataset.position);
      if (picks.has(position)) picks.delete(position);
      else if (picks.size < 3) picks.add(position);
      sound('pick');
      updatePicks();
      return;
    }
    const action = button.dataset.action;
    // A soft pop for the game's opening steps; from the answer onward the whoosh speaks alone.
    if (['begin', 'confirm'].includes(action)) sound('nav');
    if (action === 'begin' && phase === 'intro') setPhase('memorize3seconds');
    else if (action === 'confirm' && phase === 'recall3positions' && picks.size === 3) setPhase('red');
    else if (action === 'answer' && phase === 'red') {
      answer = button.dataset.quarter;
      setPhase('reveal');
    } else if (action === 'next' && ['reveal', 'focusTitle', 'lessonTitle', 'integrationTitle'].includes(phase)) {
      setPhase(PHASES[PHASES.indexOf(phase) + 1]);
    } else if (action === 'replay' && phase === 'finalPhoto') setPhase('intro');
    else if (action === 'continue' && phase === 'finalPhoto') onContinue?.(root.querySelector('.mindset-photo'));
  }

  root.addEventListener('click', onClick);
  doc.addEventListener('visibilitychange', onVisibilityChange);
  setPhase('intro', false, true);

  return {
    get phase() { return phase; },
    replay() { setPhase('intro'); },
    suspend() {
      if (destroyed || suspended) return;
      if (phase === 'memorize3seconds') consumeTime();
      suspended = true;
      stopTimer();
    },
    resume() {
      if (destroyed || !suspended) return;
      suspended = false;
      if (phase === 'memorize3seconds' && !doc.hidden) {
        runningSince = win.performance.now();
        tick();
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopTimer();
      doc.removeEventListener('visibilitychange', onVisibilityChange);
      root.removeEventListener('click', onClick);
      root.remove();
      picks.clear();
    },
  };
}
