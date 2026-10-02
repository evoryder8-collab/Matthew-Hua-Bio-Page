import {mountDialogAtmosphere} from './dialog-atmosphere.js';
import {icon,escapeHTML as e} from './templates.js';
import {playSunJourney} from './sun-journey.js';

// The game "fires up" in its homepage slot, then lifts forward into the dialog.
const IGNITE_MS=500,LIFT_MS=900,RETURN_MS=600;

/**
 * memory is owned by the page document: once the game has lifted (automatically or
 * by request) it never lifts itself again during that visit, even after a re-render.
 */
export function mountGameSpotlight(host,{game,copy,common,canOpen,icons,reducedMotion,memory={lifted:false},onClose=()=>{}}) {
  const slot=document.createElement('div');
  slot.className='game-home-slot';
  host.before(slot);
  slot.append(host);
  const expand=document.createElement('button');
  expand.className='icon-button game-expand';
  expand.setAttribute('aria-label',copy.title);
  expand.title=copy.title;
  expand.innerHTML=icon('maximize-2');
  slot.prepend(expand);
  icons();
  let dialog=null,panel=null,stopAtmosphere=null,animation=null,igniteTimer=0;
  let intersects=false,closing=false,destroyed=false,igniting=false;
  let previousFocus=null;

  function syncPhase(phase=game.phase) {
    if(!dialog)return;
    dialog.querySelector('.game-replay').hidden=phase!=='finalPhoto';
  }

  function transformBetween(from,to) {
    return `translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width},${from.height/to.height})`;
  }

  function runAnimation(frames,duration,easing='cubic-bezier(.22,1,.36,1)') {
    animation?.cancel();
    if(reducedMotion.matches||!panel.animate)return Promise.resolve();
    animation=panel.animate(frames,{duration,easing});
    return animation.finished.catch(()=>{});
  }

  function ignite() {
    if(reducedMotion.matches)return Promise.resolve(true);
    igniting=true;slot.classList.add('is-igniting');
    return new Promise(resolve=>{igniteTimer=setTimeout(()=>{
      igniteTimer=0;igniting=false;slot.classList.remove('is-igniting');
      resolve(!destroyed&&!dialog&&canOpen());
    },IGNITE_MS);});
  }

  async function open() {
    if(destroyed||dialog||igniting||!canOpen())return;
    // Suspend before any await so a click on Begin cannot start the memory timer early.
    // An interrupted ignition leaves it paused, exactly like a game closed mid-round.
    game.suspend();
    previousFocus=document.activeElement;
    if(!await ignite())return;
    memory.lifted=true;
    const origin=host.getBoundingClientRect();
    slot.style.minHeight=`${slot.getBoundingClientRect().height}px`;
    dialog=document.createElement('dialog');
    const current=dialog;
    current.className='game-dialog atmospheric-dialog';
    current.setAttribute('aria-label',copy.title);
    current.innerHTML=`<div class="game-window modal-surface"><div class="game-window-toolbar"><button class="icon-button game-close" aria-label="${e(common.close)}" title="${e(common.close)}">${icon('x')}</button><span class="game-window-label">${e(copy.eyebrow)}</span><button class="game-replay" hidden>${icon('rotate-ccw')}<span>${e(copy.replay)}</span></button></div><div class="game-scroll"></div></div>`;
    document.getElementById('overlay-root').append(current);
    panel=current.querySelector('.game-window');
    current.querySelector('.game-scroll').append(host);
    icons();current.showModal();
    // showModal() would focus the X and flash its keyboard ring mid-flight; rest focus on
    // the (outline-free) heading instead. Keyboard users still reach the X with Tab.
    host.querySelector('.mindset-title')?.focus({preventScroll:true});
    stopAtmosphere=mountDialogAtmosphere(current);
    syncPhase();
    current.querySelector('.game-close').addEventListener('click',()=>close());
    current.querySelector('.game-replay').addEventListener('click',()=>{
      game.replay();current.querySelector('.game-scroll').scrollTop=0;
    });
    current.addEventListener('cancel',event=>{event.preventDefault();close();});
    current.addEventListener('click',event=>{if(event.target===current)close();});
    const destination=panel.getBoundingClientRect();
    panel.classList.add('is-launching');
    await runAnimation([
      {transform:transformBetween(origin,destination),opacity:.8},
      {transform:'none',opacity:1}
    ],LIFT_MS,'cubic-bezier(.16,1,.3,1)');
    panel?.classList.remove('is-launching');
    if(dialog!==current||closing||destroyed)return;
    game.resume();
    host.querySelector('.mindset-title')?.focus({preventScroll:true});
  }

  function restore() {
    animation?.cancel();animation=null;
    stopAtmosphere?.();stopAtmosphere=null;
    slot.append(host);slot.style.removeProperty('min-height');
    dialog?.close();dialog?.remove();dialog=null;panel=null;closing=false;
  }

  async function close() {
    if(!dialog||closing||destroyed)return;
    closing=true;game.suspend();
    const current=dialog,from=panel.getBoundingClientRect();
    const target=slot.getBoundingClientRect();
    const to={left:target.left,top:target.top+48,width:target.width,height:Math.max(1,target.height-48)};
    current.classList.add('returning');
    await runAnimation([{transform:'none',opacity:1},{transform:transformBetween(to,from),opacity:.82}],RETURN_MS);
    if(dialog!==current||destroyed)return;
    restore();
    const focus=previousFocus?.isConnected&&previousFocus!==document.body?previousFocus:expand;
    focus.focus({preventScroll:true});
    onClose('dismissed');
  }

  // "Let's continue": walk into the light; while the screen is white, the game returns
  // (reset) to its homepage slot and onArrive may move the page on (next element).
  async function journey(image,hdrSrc,onArrive=()=>{}) {
    if(!dialog||closing||destroyed)return;
    closing=true;game.suspend();
    await playSunJourney({image,hdrSrc,reducedMotion:reducedMotion.matches,onCovered:()=>{
      if(destroyed)return;
      restore();game.replay();
      slot.scrollIntoView({block:'center',behavior:'instant'});
      onArrive();
    }});
    if(destroyed)return;
    expand.focus({preventScroll:true});
    onClose();
  }

  function maybeOpen() {
    if(intersects&&!memory.lifted&&!destroyed&&canOpen())open();
  }
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
    intersects=entries.some(entry=>entry.isIntersecting);maybeOpen();
  },{rootMargin:'-15% 0px -20% 0px',threshold:.25}):null;
  observer?.observe(slot);
  expand.addEventListener('click',open);
  const liftOnInteraction=event=>{if(!dialog&&event.target.closest('button'))open();};
  host.addEventListener('click',liftOnInteraction,true);

  return {
    syncPhase,
    journey,
    get isOpen(){return Boolean(dialog);},
    refresh:maybeOpen,
    destroy(){
      if(destroyed)return;destroyed=true;observer?.disconnect();
      clearTimeout(igniteTimer);igniting=false;slot.classList.remove('is-igniting');
      host.removeEventListener('click',liftOnInteraction,true);
      expand.removeEventListener('click',open);
      if(dialog)restore();
      slot.before(host);slot.remove();
    }
  };
}
