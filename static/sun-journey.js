// "Let's continue": Matthew and Tony come closer and brighter, as if walking into the
// sun, until the screen is pure white (HDR white on displays with headroom), then the
// light lifts to reveal the page. Runs in its own top-layer dialog so it stays above
// the game dialog and survives that dialog being removed underneath it.

const GROW_MS = 1750;
const WHITE_AT = 2250;
const HOLD_MS = 380;
const REVEAL_MS = 950;

/**
 * image: the final slide's photograph; hdrSrc: tiny PQ white clip (optional).
 * onCovered runs while the screen is fully white: swap whatever must change there.
 */
export function playSunJourney({ image, hdrSrc, reducedMotion = false, onCovered = () => {} }) {
  const doc = document;
  const dialog = doc.createElement('dialog');
  dialog.className = 'sun-journey';
  dialog.setAttribute('aria-hidden', 'true');
  dialog.addEventListener('cancel', (event) => event.preventDefault());
  const bloom = doc.createElement('div');
  bloom.className = 'sun-bloom';
  const white = doc.createElement('div');
  white.className = 'sun-white';
  dialog.append(bloom);
  let figure = null;
  const rect = image?.isConnected ? image.getBoundingClientRect() : null;
  if (rect?.width && !reducedMotion) {
    figure = image.cloneNode(false);
    figure.removeAttribute('class');
    figure.className = 'sun-figure';
    figure.alt = '';
    // The on-screen box already includes the slide's zoom, so the copy needs no transform.
    Object.assign(figure.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    dialog.append(figure);
    // The copy takes over from the original so the couple is never seen twice.
    image.style.visibility = 'hidden';
  }
  dialog.append(white);
  let hdr = null;
  if (hdrSrc && !reducedMotion) {
    hdr = doc.createElement('video');
    Object.assign(hdr, { muted: true, loop: true, playsInline: true, preload: 'auto', src: hdrSrc });
    hdr.className = 'sun-hdr';
    hdr.setAttribute('playsinline', '');
    dialog.append(hdr);
    hdr.play()?.catch(() => {});
  }
  doc.body.append(dialog);
  dialog.showModal();

  const run = (node, frames, options) => node?.animate?.(frames, { fill: 'forwards', ...options });
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function sequence() {
    if (reducedMotion) {
      await run(white, [{ opacity: 0 }, { opacity: 1 }], { duration: 260 })?.finished;
    } else {
      // Centre of the people, roughly a third down the frame, is where the light grows from.
      const cx = rect ? rect.left + rect.width / 2 : innerWidth / 2;
      const cy = rect ? rect.top + rect.height * 0.42 : innerHeight / 2;
      bloom.style.setProperty('--sun-x', `${cx}px`);
      bloom.style.setProperty('--sun-y', `${cy}px`);
      // Straight out of the screen: the photograph travels toward the viewer along the depth
      // axis. For a flat image facing us that projects to a uniform scale of P / (P - z)
      // about its centre, so it is computed here in 2D (reliable in every Safari) and grows
      // ever faster as it nears. Motion blur and light build with that speed.
      const P = 900, Z = 795, frames = [];
      for (let i = 0; i <= 40; i++) {
        const k = i / 40, z = Z * Math.pow(k, 2.1), scale = P / (P - z), near = (scale - 1) / (P / (P - Z) - 1);
        frames.push({ offset: k, transform: `scale(${scale.toFixed(4)})`, filter: `blur(${(9 * Math.pow(near, 1.3)).toFixed(2)}px) brightness(${(1 + 2.3 * Math.pow(k, 1.6)).toFixed(3)})` });
      }
      run(figure, frames, { duration: GROW_MS + 400, easing: 'linear' });
      run(bloom, [
        { opacity: 0, transform: 'scale(.15)' },
        { opacity: 0.55, transform: 'scale(1.1)', offset: 0.5 },
        { opacity: 1, transform: 'scale(4)' },
      ], { duration: GROW_MS + 300, delay: 250, easing: 'cubic-bezier(.5,0,.8,.4)' });
      run(white, [{ opacity: 0 }, { opacity: 1 }], { duration: 800, delay: WHITE_AT - 800, easing: 'cubic-bezier(.55,0,1,.45)' });
      run(hdr, [{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: WHITE_AT - 350, easing: 'ease-in' });
      await wait(WHITE_AT + 40);
    }
    try { onCovered(); } catch (error) { console.warn('Sun journey swap failed.', error); }
    await wait(reducedMotion ? 60 : HOLD_MS);
    // Lift the light: everything fades together, revealing the page beneath.
    await run(dialog, [{ opacity: 1 }, { opacity: 0 }], { duration: reducedMotion ? 220 : REVEAL_MS, easing: 'cubic-bezier(.2,.6,.3,1)' })?.finished;
  }

  return sequence().catch(() => {}).finally(() => {
    if (image?.isConnected) image.style.removeProperty('visibility');
    hdr?.pause();
    dialog.close();
    dialog.remove();
  });
}
