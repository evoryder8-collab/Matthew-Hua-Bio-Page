import {mountDialogAtmosphere} from './dialog-atmosphere.js';
import {icon,escapeHTML as e} from './templates.js';

export function mountGameSpotlight(host,{game,copy,common,canOpen,icons,reducedMotion}) {
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
  let dialog=null,panel=null,stopAtmosphere=null,animation=null;
  let visited=false,intersects=false,closing=false,destroyed=false;
  let previousFocus=null;

  function syncPhase(phase=game.phase) {
    if(!dialog)return;
    const complete=phase==='finalPhoto';
    dialog.querySelector('.game-close').hidden=!complete;
    dialog.querySelector('.game-replay').hidden=!complete;
    dialog.querySelector('.game-window-label').hidden=complete;
  }

  function transformBetween(from,to) {
    return `translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width},${from.height/to.height})`;
  }

  function runAnimation(frames,duration) {
    animation?.cancel();
    if(reducedMotion.matches||!panel.animate)return Promise.resolve();
    animation=panel.animate(frames,{duration,easing:'cubic-bezier(.22,1,.36,1)'});
    return animation.finished.catch(()=>{});
  }

  async function open() {
    if(destroyed||dialog||!canOpen())return;
    visited=true;previousFocus=document.activeElement;
    const origin=host.getBoundingClientRect();
    slot.style.minHeight=`${slot.getBoundingClientRect().height}px`;
    game.suspend();
    dialog=document.createElement('dialog');
    const current=dialog;
    current.className='game-dialog atmospheric-dialog';
    current.setAttribute('aria-label',copy.title);
    current.innerHTML=`<div class="game-window modal-surface"><div class="game-window-toolbar"><button class="icon-button game-close" aria-label="${e(common.close)}" title="${e(common.close)}" hidden>${icon('x')}</button><span class="game-window-label">${e(copy.eyebrow)}</span><button class="game-replay" hidden>${icon('rotate-ccw')}<span>${e(copy.replay)}</span></button></div><div class="game-scroll"></div></div>`;
    document.getElementById('overlay-root').append(current);
    panel=current.querySelector('.game-window');
    current.querySelector('.game-scroll').append(host);
    icons();current.showModal();
    stopAtmosphere=mountDialogAtmosphere(current);
    syncPhase();
    current.querySelector('.game-close').addEventListener('click',()=>close());
    current.querySelector('.game-replay').addEventListener('click',()=>{
      game.replay();current.querySelector('.game-scroll').scrollTop=0;
    });
    current.addEventListener('cancel',event=>{event.preventDefault();close();});
    current.addEventListener('click',event=>{if(event.target===current)close();});
    const destination=panel.getBoundingClientRect();
    await runAnimation([{transform:transformBetween(origin,destination),opacity:.75},{transform:'none',opacity:1}],650);
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
    await runAnimation([{transform:'none',opacity:1},{transform:transformBetween(to,from),opacity:.82}],520);
    if(dialog!==current||destroyed)return;
    restore();
    const focus=previousFocus?.isConnected&&previousFocus!==document.body?previousFocus:expand;
    focus.focus({preventScroll:true});
  }

  function maybeOpen() {
    if(intersects&&!visited&&!destroyed&&canOpen())open();
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
    refresh:maybeOpen,
    destroy(){
      if(destroyed)return;destroyed=true;observer?.disconnect();
      host.removeEventListener('click',liftOnInteraction,true);
      expand.removeEventListener('click',open);
      if(dialog)restore();
      slot.before(host);slot.remove();
    }
  };
}
