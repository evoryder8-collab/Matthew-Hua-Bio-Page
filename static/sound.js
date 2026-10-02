// Interface sound effects. Silent and network-free until the visitor chooses sound:
// unlock() must run inside that tap/click so Safari and Chrome allow later playback.
// Callers decide consent; this module only plays what it is asked to while unlocked.

export function createSoundEffects(files) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const encoded = new Map();
  const decoded = new Map();
  const voices = new Set();
  let context = null;

  function fetchFile(name) {
    if (!encoded.has(name)) {
      encoded.set(name, fetch(files[name]).then((response) => {
        if (!response.ok) throw new Error(`Sound unavailable: ${name}`);
        return response.arrayBuffer();
      }).catch(() => null));
    }
    return encoded.get(name);
  }

  function decode(name) {
    if (!context) return Promise.resolve(null);
    if (!decoded.has(name)) {
      decoded.set(name, fetchFile(name).then((data) => data && new Promise((resolve) => {
        // Callback form for older Safari; the copy keeps the cached bytes reusable.
        context.decodeAudioData(data.slice(0), resolve, () => resolve(null));
      })));
    }
    return decoded.get(name);
  }

  return {
    /** The shared context, once unlocked; background music mixes into the same output. */
    get context() { return context; },
    /** Fetch the bytes early (no audio context, no autoplay prompt). */
    prefetch() { Object.keys(files).forEach(fetchFile); },
    /** Call from the click/tap that grants sound. */
    unlock() {
      if (!AudioContextClass) return;
      if (!context) context = new AudioContextClass();
      if (context.state === 'suspended') context.resume().catch(() => {});
      Object.keys(files).forEach(decode);
    },
    /**
     * Play once. A sound still decoding starts late but in sync (its opening is
     * skipped), and is dropped entirely if it would arrive after maxLate seconds.
     */
    async play(name, { volume = 1, rate = 1, fadeIn = 0, maxLate = 0.35 } = {}) {
      if (!context) return;
      const requested = performance.now();
      const buffer = await decode(name);
      if (!buffer || context.state !== 'running') return;
      const late = (performance.now() - requested) / 1000;
      if (late > maxLate || late >= buffer.duration) return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.playbackRate.value = rate;
      const now = context.currentTime;
      gain.gain.setValueAtTime(fadeIn ? 0.0001 : volume, now);
      if (fadeIn) gain.gain.exponentialRampToValueAtTime(volume, now + fadeIn);
      source.connect(gain).connect(context.destination);
      source.start(now, late);
      const voice = { source, gain };
      voices.add(voice);
      source.addEventListener('ended', () => voices.delete(voice));
    },
    /** Fade out effects still ringing, e.g. when sound is switched off. */
    silence() {
      if (!context) return;
      const now = context.currentTime;
      for (const { source, gain } of voices) {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.12);
        try { source.stop(now + 0.14); } catch { /* already stopped */ }
      }
      voices.clear();
    },
  };
}

/**
 * A soundtrack under the whole visit, only after sound is chosen. It streams through
 * the effects' audio context so every change is a gain curve (iOS ignores media
 * volume). Films "claim" it: the music glides to silence for as long as any claim is
 * held, then returns. Effects are never claims; they simply play on top.
 */
export function createBackgroundMusic(src, effects, { level = 0.3 } = {}) {
  const claims = new Set();
  let audio = null, gain = null, enabled = false, hidden = document.hidden, pauseTimer = 0;

  function ensure() {
    const context = effects.context;
    if (!context) return false;
    if (!audio) {
      audio = new Audio();
      audio.src = src;
      audio.loop = true;
      audio.preload = 'auto';
      audio.setAttribute('playsinline', '');
      gain = context.createGain();
      gain.gain.value = 0;
      context.createMediaElementSource(audio).connect(gain).connect(context.destination);
    }
    return true;
  }

  // An eased S-curve from wherever the gain is now; interrupting a fade stays seamless.
  function glide(value, seconds) {
    const context = effects.context;
    if (!gain || !context) return;
    const now = context.currentTime;
    const from = gain.gain.value;
    gain.gain.cancelScheduledValues(now);
    if (seconds <= 0.02 || Math.abs(from - value) < 0.002) { gain.gain.setValueAtTime(value, now); return; }
    const curve = new Float32Array(64);
    for (let index = 0; index < curve.length; index++) {
      const eased = (1 - Math.cos(Math.PI * index / (curve.length - 1))) / 2;
      curve[index] = from + (value - from) * eased;
    }
    gain.gain.setValueCurveAtTime(curve, now, seconds);
  }

  function apply(seconds) {
    if (!audio) return;
    clearTimeout(pauseTimer);
    const audible = enabled && !hidden && claims.size === 0;
    if (enabled && !hidden && audio.paused) audio.play().catch(() => {});
    glide(audible ? level : 0, seconds);
    // Fully off (switched off or tab hidden): stop decoding once the fade is done.
    if (!enabled || hidden) pauseTimer = setTimeout(() => { if (!enabled || hidden) audio.pause(); }, seconds * 1000 + 150);
  }

  return {
    /** Call inside the click that turns sound on; it also unlocks media playback. */
    enable() {
      if (!ensure()) return;
      enabled = true;
      audio.play().catch(() => {});
      apply(claims.size ? 0.4 : 2.8);
    },
    disable() { enabled = false; apply(0.8); },
    claim(key, seconds = 1.4) { if (claims.has(key)) return; claims.add(key); apply(seconds); },
    release(key, seconds = 2.6) { if (claims.delete(key)) apply(seconds); },
    setHidden(value) { hidden = value; apply(value ? 0.35 : 1.8); },
    get state() { return { enabled, claims: [...claims], playing: Boolean(audio && !audio.paused), gain: gain?.gain.value ?? 0 }; },
  };
}
