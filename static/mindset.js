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
const PHOTO = 'v3 mat x tonyPHOTO-2026-03-16-21-22-09-2.webp';
const MEMORIZE_MS = 3000;
let instanceId = 0;

function quarterOf(signal) {
  return `${signal.y < 50 ? 't' : 'b'}${signal.x < 50 ? 'l' : 'r'}`;
}

/** Mount one self-contained experiment; the caller owns its locale and lifetime. */
export function mountMindset(host, { copy, asset, reducedMotion = false, onPhaseChange = () => {} }) {
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
  root.append(field, content);
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

  function renderPhoto() {
    const wrapper = element('div', 'mindset-photo-frame');
    const photo = element('img', 'mindset-photo');
    photo.src = asset(PHOTO);
    photo.alt = text('photoAlt') || 'Matthew Hua, Tony Robbins';
    photo.width = 6696;
    photo.height = 6696;
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
    remaining = Math.max(0, remaining - (now - runningSince));
    runningSince = now;
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

  function setPhase(next, focus = true) {
    if (destroyed) return;
    stopTimer();
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
      title.textContent = text(answer === quarterOf(red) ? 'caught' : 'missed');
      const score = [...picks].filter((index) => SIGNALS[index].color === 'blue').length;
      description.append(element('p', 'mindset-score', text('score', { count: score })));
      paragraph('revealCopy');
      renderSignals(true);
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
      addButton(text('replay'), 'replay', 'mindset-replay');
    }

    feedback.hidden = !['memorize3seconds', 'recall3positions'].includes(phase);
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
      updatePicks();
      return;
    }
    const action = button.dataset.action;
    if (action === 'begin' && phase === 'intro') setPhase('memorize3seconds');
    else if (action === 'confirm' && phase === 'recall3positions' && picks.size === 3) setPhase('red');
    else if (action === 'answer' && phase === 'red') {
      answer = button.dataset.quarter;
      setPhase('reveal');
    } else if (action === 'next' && ['reveal', 'focusTitle', 'lessonTitle', 'integrationTitle'].includes(phase)) {
      setPhase(PHASES[PHASES.indexOf(phase) + 1]);
    } else if (action === 'replay' && phase === 'finalPhoto') setPhase('intro');
  }

  root.addEventListener('click', onClick);
  doc.addEventListener('visibilitychange', onVisibilityChange);
  setPhase('intro', false);

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
