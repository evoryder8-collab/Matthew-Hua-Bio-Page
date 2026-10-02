// Shows that each of the six elements opens: a spring "domino" wave down the tabs,
// a peek along the row when it scrolls sideways, then a quiet periodic shimmer until
// the visitor opens one. Unopened tabs keep a small breathing dot (styled in CSS).

const PEEK_PX = 76;

export function mountElementInvite(tablist, { reducedMotion, isBlocked = () => false }) {
  const win = tablist.ownerDocument.defaultView;
  let destroyed = false, visible = false, invited = false, touched = false;
  let frame = null, waveTimer = 0;
  [...tablist.querySelectorAll('[data-element-tab]')].forEach((tab, index) => tab.style.setProperty('--tab-index', String(index)));

  function hint() {
    tablist.classList.toggle('is-hinting', invited && visible && !touched && !destroyed);
  }

  // A sideways row reveals that more tabs wait to the right, then springs home.
  function peek(reach = PEEK_PX, insist = false) {
    const room = tablist.scrollWidth - tablist.clientWidth;
    if (room < 24 || tablist.scrollLeft > 4) return;
    const distance = Math.min(reach, room);
    const start = win.performance.now();
    if (frame !== null) win.cancelAnimationFrame(frame);
    const step = (now) => {
      if (destroyed || (touched && !insist)) { frame = null; return; }
      const t = Math.min(1, (now - start) / 1500);
      // Out with ease, back with a small damped overshoot.
      const offset = t < 0.4
        ? distance * (1 - (1 - t / 0.4) ** 3)
        : distance * Math.exp(-7 * (t - 0.4)) * Math.cos(9 * (t - 0.4));
      tablist.scrollLeft = Math.max(0, offset);
      frame = t < 1 ? win.requestAnimationFrame(step) : null;
      if (!frame) tablist.scrollLeft = 0;
    };
    frame = win.requestAnimationFrame(step);
  }

  // Wait a beat after the tabs appear: if the game is about to fire up beside them, the
  // invitation yields to it and is re-checked when the game closes (refresh()).
  let settleTimer = 0;
  function invite() {
    if (invited || destroyed || touched || !visible || settleTimer) return;
    settleTimer = win.setTimeout(() => { settleTimer = 0; begin(); }, 650);
  }

  function begin() {
    if (invited || destroyed || touched || !visible || isBlocked()) return;
    invited = true;
    if (reducedMotion.matches) return;
    tablist.classList.add('is-inviting');
    peek();
    const count = tablist.querySelectorAll('[data-element-tab]').length;
    waveTimer = win.setTimeout(() => { tablist.classList.remove('is-inviting'); hint(); }, 1000 + count * 95);
  }

  const observer = 'IntersectionObserver' in win ? new win.IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) invite();
    if (!tablist.classList.contains('is-inviting')) hint();
  }, { threshold: 0.6 }) : null;
  observer?.observe(tablist);

  const stop = () => {
    touched = true;
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
    tablist.classList.remove('is-inviting', 'is-hinting');
  };
  tablist.addEventListener('click', stop);
  tablist.addEventListener('pointerdown', stop, { passive: true });
  tablist.addEventListener('keydown', stop);

  return {
    /** Re-check after something that blocked the invitation (the game dialog) closes. */
    refresh: invite,
    /** A deliberate reminder (after the game): wave once more and peek along the row. */
    nudge() {
      if (destroyed || reducedMotion.matches) return;
      win.clearTimeout(waveTimer);
      tablist.classList.remove('is-inviting', 'is-hinting');
      void tablist.offsetWidth;
      tablist.classList.add('is-inviting');
      peek(PEEK_PX * 1.5, true);
      const count = tablist.querySelectorAll('[data-element-tab]').length;
      waveTimer = win.setTimeout(() => { tablist.classList.remove('is-inviting'); hint(); }, 1000 + count * 95);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer?.disconnect();
      win.clearTimeout(waveTimer);
      win.clearTimeout(settleTimer);
      if (frame !== null) win.cancelAnimationFrame(frame);
      tablist.removeEventListener('click', stop);
      tablist.removeEventListener('pointerdown', stop);
      tablist.removeEventListener('keydown', stop);
      tablist.classList.remove('is-inviting', 'is-hinting');
    },
  };
}
