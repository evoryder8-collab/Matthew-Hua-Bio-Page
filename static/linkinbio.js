// matthewhua.ch/linkinbio: the page social profiles link to. The arrival film plays by
// itself (with sound where the browser allows it, otherwise muted with a clear way to
// turn sound on), the tears moment slows the scroll beneath it, the six elements turn
// on a wheel that reveals each element's visual (the Mindset game included, with its
// sounds), and every way to reach Matthew sits in platform-tinted glass.
import {languages,escapeHTML as e,icon,renderElement} from './templates.js';
import {resolveLocale} from './language.js';
import {mountMindset} from './mindset.js';
import {mountElementVisual} from './element-visuals.js';
import {mountTearsMoment} from './tears.js';
import {createSoundEffects} from './sound.js';
import {mountTabSparks} from './tab-sparks.js';
import {playSunJourney} from './sun-journey.js';
import {mountDialogAtmosphere} from './dialog-atmosphere.js';
import {mountAmbientSparks} from './effects.js';

// The template travels with this module's version (see build.mjs).
const {renderLinkInBio}=await import(new URL('linkinbio-template.js'+new URL(import.meta.url).search,import.meta.url).href);
const base=new URL('../',import.meta.url);
const asset=file=>new URL('assets/'+file.split('/').map(encodeURIComponent).join('/'),base).href;
const file=path=>new URL(path,base).href;
const flag=code=>new URL('flags/'+code+'.png',import.meta.url).href;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
const shell=document.getElementById('bio-shell');
const overlayRoot=document.getElementById('overlay-root');
const local=(()=>{try{return window.localStorage;}catch{return null;}})();
const read=key=>{try{return local?.getItem(key)??null;}catch{return null;}};
const write=(key,value)=>{try{local?.setItem(key,value);}catch{}};
const icons=()=>window.lucide?.createIcons({attrs:{'stroke-width':1.5}});

let dict,locale,soundEnabled=false,film=null,tears=null,tabSparks=null,wheel=null,game=null,visual=null,map=null,modal=null;
let selected=-1,stageToken=0,cleanups=[],wheelIntro=null;

// The game's own sounds and the tear, exactly as on the homepage; only after sound is on.
const sfx=createSoundEffects({nav:asset('sfx/button-pop.mp3'),drop:asset('sfx/tear-drop.mp3'),wink:asset('sfx/element-wink.mp3'),pick:asset('sfx/signal-pick.mp3'),twinkle:asset('sfx/red-twinkle.mp3'),conclusion:asset('sfx/conclusion-pop.mp3'),whoosh:asset('sfx/slide-whoosh.mp3')});
const CUES={nav:[.45,0],wink:[.5,0],pick:[.42,0],twinkle:[.62,480],conclusion:[.55,380],whoosh:[.6,0]};
const cue=name=>{const [volume,delay]=CUES[name]||[];if(!soundEnabled||volume===undefined)return;const play=()=>{if(soundEnabled)sfx.play(name,{volume});};if(delay)setTimeout(play,delay);else play();};
const tearSound=strength=>{if(soundEnabled)sfx.play('drop',{volume:.62*strength+.08,rate:strength<1?1.18+(1-strength)*.4:1,maxLate:.12});};

const href=(route,lang=locale)=>{const url=new URL(route==='home'?'./':route+'/',base);if(lang&&lang!=='en')url.searchParams.set('lang',lang);return url.href;};
async function getLocale(code){const response=await fetch(new URL(`locales/${code}.json`,import.meta.url));if(!response.ok)throw new Error('Language unavailable');return response.json();}

function setMetadata(){
  document.documentElement.lang=languages.find(l=>l.code===locale)?.html||'en';
  document.title=dict.bio.title;
  for(const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'])document.querySelector(selector)?.setAttribute('content',dict.bio.description);
  for(const selector of ['meta[property="og:title"]','meta[name="twitter:title"]'])document.querySelector(selector)?.setAttribute('content',dict.bio.title);
}

/* Sound -------------------------------------------------------------------------- */
function updateSoundButtons(){
  const label=soundEnabled?dict.nav.soundOn:dict.nav.soundOff;
  document.querySelectorAll('[data-action="sound"]').forEach(button=>{button.setAttribute('aria-label',label);button.title=label;button.setAttribute('aria-pressed',String(soundEnabled));button.innerHTML=icon(soundEnabled?'volume-2':'volume-x');});
  icons();
}
// Called from the tap that changes it, so switching on also unlocks the effects.
function setSound(on,{remember=true}={}){
  soundEnabled=on;
  if(on)sfx.unlock();else sfx.silence();
  film?.setMuted(!on);
  if(remember)write('matthew-bio-sound',on?'on':'off');
  updateSoundButtons();
}
// Audible autoplay can succeed without a tap; the effects still need one to start.
document.addEventListener('pointerdown',()=>{if(soundEnabled)sfx.unlock();},{capture:true,passive:true});

/* The film ----------------------------------------------------------------------- */
function mountFilm(frame,resume){
  const video=frame.querySelector('video'),cover=frame.querySelector('.bio-film__cover'),unmute=frame.querySelector('.bio-film__unmute');
  const toggle=frame.querySelector('.bio-film__toggle'),bar=frame.querySelector('.bio-film__track i'),time=frame.querySelector('.bio-film__time');
  let destroyed=false,userPaused=false,autoPaused=false,frameId=0;
  const playing=()=>!video.paused&&!video.ended;
  function sync(){
    const on=playing();
    frame.classList.toggle('is-playing',on);
    frame.classList.toggle('is-ended',video.ended);
    const label=on?dict.common.pause:video.ended?dict.common.replay:dict.common.play;
    toggle.setAttribute('aria-label',label);toggle.innerHTML=icon(on?'pause':video.ended?'rotate-ccw':'play');
    cover.setAttribute('aria-label',label);cover.querySelector('span').innerHTML=icon(video.ended?'rotate-ccw':'play');
    if(on)cover.hidden=true;
    icons();
  }
  function progress(){
    frameId=0;
    const duration=video.duration||28;
    bar.style.transform=`scaleX(${Math.min(1,video.currentTime/duration).toFixed(4)})`;
    const left=Math.max(0,Math.ceil(duration-video.currentTime));
    time.textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;
    if(playing()&&!destroyed)frameId=requestAnimationFrame(progress);
  }
  const play=()=>{const attempt=video.play();attempt?.catch(()=>{cover.hidden=false;sync();});return attempt;};
  function onPlaying(){sync();if(!frameId)frameId=requestAnimationFrame(progress);}
  function onStop(){sync();progress();if(video.ended)cover.hidden=false;}
  video.addEventListener('playing',onPlaying);video.addEventListener('pause',onStop);video.addEventListener('ended',onStop);
  video.addEventListener('loadedmetadata',progress);
  toggle.addEventListener('click',()=>{if(video.ended){video.currentTime=0;userPaused=false;play();}else if(video.paused){userPaused=false;play();}else{userPaused=true;video.pause();}});
  cover.addEventListener('click',()=>{if(!soundEnabled&&read('matthew-bio-sound')!=='off')setSound(true,{remember:false});if(video.ended)video.currentTime=0;userPaused=false;play();});
  unmute.addEventListener('click',()=>{setSound(true);if(video.paused&&!video.ended)play();});
  frame.querySelector('[data-action="film-fullscreen"]').addEventListener('click',()=>{
    const request=frame.requestFullscreen||frame.webkitRequestFullscreen;
    if(request&&(document.fullscreenEnabled||document.webkitFullscreenEnabled))request.call(frame)?.catch?.(()=>{});
    else video.webkitEnterFullscreen?.();
  });
  // Scrolled past (half the frame gone), it stops where it is; it continues only once the
  // frame itself is back in view (two thirds of it), unless the visitor paused it. The gap
  // between the two keeps it from flickering at the edge. Fullscreen never counts as away.
  const away=()=>document.fullscreenElement===frame||document.webkitFullscreenElement===frame||video.webkitDisplayingFullscreen;
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
    const ratio=entries[entries.length-1].intersectionRatio;
    if(away())return;
    if(ratio<.5&&playing()){autoPaused=true;video.pause();}
    else if(ratio>=.66&&autoPaused&&!userPaused&&!video.ended){autoPaused=false;play();}
  },{threshold:[0,.25,.5,.66,.8,1]}):null;
  observer?.observe(frame);
  sync();

  async function start(){
    if(resume){
      const seek=()=>{video.currentTime=Math.min(resume.time,(video.duration||resume.time+1)-.1);};
      if(video.readyState>=1)seek();else video.addEventListener('loadedmetadata',seek,{once:true});
      video.muted=!soundEnabled;
      if(resume.playing)play();else sync();
      return;
    }
    if(motion.matches){cover.hidden=false;return;}
    // Some in-app browsers allow audible autoplay: let play() decide, keep an earlier
    // "sound off", and fall back to muted playback with a visible way to turn it on.
    video.muted=read('matthew-bio-sound')==='off';
    try{await video.play();if(!destroyed)setSound(!video.muted,{remember:false});}
    catch{
      if(destroyed)return;
      if(video.muted){cover.hidden=false;return;}
      video.muted=true;
      try{await video.play();if(!destroyed){setSound(false,{remember:false});unmute.hidden=false;}}
      catch{if(!destroyed)cover.hidden=false;}
    }
  }
  // Called from the sound prompt's tap, so audible playback is allowed.
  function begin(withSound){
    if(destroyed)return;
    if(motion.matches){cover.hidden=false;sync();return;}
    video.muted=!withSound;
    const attempt=video.play();
    attempt?.catch(()=>{
      if(destroyed)return;
      if(!video.muted){video.muted=true;video.play()?.then(()=>{unmute.hidden=false;},()=>{cover.hidden=false;sync();});}
      else{cover.hidden=false;sync();}
    });
  }
  return {
    start,begin,
    setMuted(muted){video.muted=muted;if(!muted)unmute.hidden=true;},
    state:()=>({time:video.currentTime||0,playing:playing()||autoPaused}),
    destroy(){destroyed=true;observer?.disconnect();cancelAnimationFrame(frameId);video.pause();video.removeAttribute('src');video.load();}
  };
}

/* The elemental wheel -------------------------------------------------------------- */
// Cruises slowly; a tap springs the chosen element round to the pointer, rests there a
// moment, then eases back into the cruise. Labels counter-rotate so they stay upright.
function mountWheel(root,{onPick}){
  const disc=root.querySelector('.bio-wheel__disc');
  const segments=[...root.querySelectorAll('.bio-wheel__seg')];
  const sectors=[...root.querySelectorAll('.bio-wheel__sector')];
  const CRUISE=7;               // degrees per second
  const STIFFNESS=26,DAMPING=2*Math.sqrt(26)*.72;
  let theta=0,omega=CRUISE,target=null,holdUntil=0,frame=null,last=null,visible=false,destroyed=false,down=null;
  const apply=()=>disc.style.setProperty('--spin',`${theta.toFixed(3)}deg`);
  function tick(now){
    frame=null;
    const dt=last===null?0:Math.min(.05,(now-last)/1000);last=now;
    if(target!==null){
      omega+=(STIFFNESS*(target-theta)-DAMPING*omega)*dt;theta+=omega*dt;
      if(Math.abs(target-theta)<.08&&Math.abs(omega)<1){theta=target;omega=0;target=null;holdUntil=now+1800;}
    }else if(now<holdUntil)omega=0;
    else{omega+=(CRUISE-omega)*Math.min(1,dt*.9);theta+=omega*dt;}
    if(target===null&&(theta>=360||theta<0))theta=((theta%360)+360)%360;
    apply();
    if(!destroyed&&visible&&!document.hidden&&!motion.matches)frame=requestAnimationFrame(tick);
  }
  const wake=()=>{if(destroyed||frame!==null||!visible||document.hidden||motion.matches)return;last=null;frame=requestAnimationFrame(tick);};
  // Until the first tap, a ring pings from each element in turn and its sector glows, so
  // the labels read as things to press rather than decoration.
  let hintTimer=0,hinted=false,hintIndex=0,active=-1,hintsAllowed=false;
  function ping(){
    hintTimer=0;
    if(hinted||destroyed)return;
    if(visible&&!document.hidden&&!motion.matches){
      do{hintIndex=(hintIndex+1)%6;}while(hintIndex===active);
      for(const node of [segments[hintIndex],sectors[hintIndex]])node.classList.remove('is-pinging');
      void root.offsetWidth;
      for(const node of [segments[hintIndex],sectors[hintIndex]])node.classList.add('is-pinging');
    }
    hintTimer=setTimeout(ping,1500);
  }
  function stopHint(){
    if(hinted)return;hinted=true;clearTimeout(hintTimer);hintTimer=0;
    root.closest('.bio-elements')?.classList.add('is-explored');
    [...segments,...sectors].forEach(node=>node.classList.remove('is-pinging'));
  }
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
    visible=entries.some(entry=>entry.isIntersecting);wake();
    if(visible&&hintsAllowed&&!hinted&&!hintTimer)hintTimer=setTimeout(ping,900);
  }):null;
  observer?.observe(root);if(!observer)visible=true;
  document.addEventListener('visibilitychange',wake);
  root.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY};},{passive:true});
  root.addEventListener('click',event=>{
    stopHint();
    const segment=event.target.closest('.bio-wheel__seg');
    if(segment){onPick(Number(segment.dataset.element));return;}
    if(down&&Math.hypot(event.clientX-down.x,event.clientY-down.y)>10)return;
    // Anywhere on a sector counts: find it from the tap's angle around the centre.
    const box=root.getBoundingClientRect(),dx=event.clientX-(box.left+box.width/2),dy=event.clientY-(box.top+box.height/2);
    const distance=Math.hypot(dx,dy),radius=box.width/2;
    if(distance<radius*.31||distance>radius)return;
    const angle=Math.atan2(dx,-dy)*180/Math.PI;
    onPick((((Math.round((angle-theta)/60))%6)+6)%6);
  });
  root.addEventListener('keydown',event=>{
    const index=segments.indexOf(event.target.closest('.bio-wheel__seg'));if(index<0)return;
    const next={ArrowRight:index+1,ArrowDown:index+1,ArrowLeft:index-1,ArrowUp:index-1,Home:0,End:5}[event.key];
    if(next===undefined)return;
    stopHint();event.preventDefault();const wrapped=(next+6)%6;segments[wrapped].focus({preventScroll:true});onPick(wrapped);
  });
  apply();
  return {
    spinTo(index,{instant=false}={}){
      const want=-index*60;
      if(instant||motion.matches){theta=((want%360)+360)%360;omega=0;target=null;holdUntil=performance.now()+1800;apply();return;}
      target=want+360*Math.ceil((theta+120-want)/360);holdUntil=0;wake();
    },
    /** The pings begin once the wheel has been introduced. */
    startHints(){
      if(hintsAllowed||destroyed)return;hintsAllowed=true;
      if(visible&&!hinted&&!hintTimer)hintTimer=setTimeout(ping,700);
    },
    setActive(index){
      active=index;root.classList.add('has-active');
      segments.forEach((segment,i)=>{segment.setAttribute('aria-selected',String(i===index));segment.tabIndex=i===index?0:-1;});
      sectors.forEach((sector,i)=>sector.classList.toggle('is-active',i===index));
    },
    destroy(){destroyed=true;clearTimeout(hintTimer);observer?.disconnect();document.removeEventListener('visibilitychange',wake);if(frame!==null)cancelAnimationFrame(frame);}
  };
}

/* The wheel's introduction ------------------------------------------------------------ */
// On first arrival the wheel waits out of focus while "Tap each element to learn more"
// assembles in light over its centre, letter by letter. The line then glides up to its
// place above the wheel, cooling from light to ink, as the wheel sharpens and steps
// forward; then the pings begin. Once per visit; a tap on the wheel ends it at once.
let wheelIntroduced=false;
function mountWheelIntro(section,wheelApi){
  const root=section?.querySelector('[data-bio-wheel]'),hint=section?.querySelector('.bio-wheel-hint');
  if(!root||!hint||wheelIntroduced||motion.matches||!root.animate||!('IntersectionObserver' in window)){wheelApi.startHints();return {destroy(){}};}
  const ink=hint.querySelector('.bio-wheel-hint__ink'),glow=hint.querySelector('.bio-wheel-hint__glow'),lines=[...hint.querySelectorAll('.bio-wheel-hint__line')];
  // Both layers are split the same way (words that never break inside), so they align.
  const graphemes=text=>window.Intl?.Segmenter?[...new Intl.Segmenter(document.documentElement.lang||'en',{granularity:'grapheme'}).segment(text)].map(part=>part.segment):[...text];
  const split=layer=>{
    const chars=[];const text=layer.textContent;layer.textContent='';
    text.split(/(\s+)/).forEach(piece=>{
      if(!piece)return;
      if(/^\s+$/.test(piece)){layer.append(document.createTextNode(piece));return;}
      const word=document.createElement('span');word.className='bio-wheel-hint__word';
      for(const g of graphemes(piece)){const c=document.createElement('span');c.className='bio-wheel-hint__char';c.textContent=g;word.append(c);chars.push(c);}
      layer.append(word);
    });
    return chars;
  };
  split(ink);const chars=split(glow);
  section.classList.add('is-prelude');
  const animations=[];let started=false,done=false;
  const play=(node,frames,options)=>{const a=node.animate(frames,{fill:'both',...options});animations.push(a);return a;};
  function finish(){
    if(done)return;done=true;wheelIntroduced=true;
    observer.disconnect();root.removeEventListener('pointerdown',finish);
    animations.forEach(a=>a.cancel());
    section.classList.remove('is-prelude');
    wheelApi.startHints();
  }
  function run(){
    started=true;
    const wheelBox=root.getBoundingClientRect(),hintBox=hint.getBoundingClientRect();
    const dy=(wheelBox.top+wheelBox.height/2)-(hintBox.top+hintBox.height/2);
    const SCALE=Math.min(1.45,(root.getBoundingClientRect().width*.94)/Math.max(1,hint.querySelector('.bio-wheel-hint__text').getBoundingClientRect().width)),STAGGER=Math.min(30,900/Math.max(1,chars.length));
    section.classList.remove('is-prelude');   // from here the animations hold every state
    play(root,[{filter:'blur(12px) brightness(.72) saturate(.8)',transform:'scale(.93)'},{filter:'blur(12px) brightness(.72) saturate(.8)',transform:'scale(.93)'}],{duration:1});
    play(ink,[{opacity:0},{opacity:0}],{duration:1});
    lines.forEach(line=>play(line,[{opacity:0,transform:'scaleX(0)'},{opacity:0,transform:'scaleX(0)'}],{duration:1}));
    // 1. The line assembles over the centre of the blurred wheel.
    play(hint,[{transform:`translateY(${dy}px) scale(${SCALE})`},{transform:`translateY(${dy}px) scale(${SCALE})`}],{duration:1});
    play(glow,[{opacity:1},{opacity:1}],{duration:1});
    chars.forEach((c,i)=>play(c,[{opacity:0,transform:'translateY(12px) scale(.92)',filter:'blur(8px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:760,delay:150+i*STAGGER,easing:'cubic-bezier(.16,1,.3,1)'}));
    const land=150+chars.length*STAGGER+760+700;
    // 2. It lands above the wheel, which comes into focus beneath it.
    const travel=play(hint,[{transform:`translateY(${dy}px) scale(${SCALE})`},{transform:'none'}],{duration:1050,delay:land,easing:'cubic-bezier(.65,0,.35,1)'});
    play(glow,[{opacity:1},{opacity:0}],{duration:650,delay:land+380,easing:'ease-out'});
    play(ink,[{opacity:0},{opacity:1}],{duration:650,delay:land+380,easing:'ease-out'});
    play(root,[{filter:'blur(12px) brightness(.72) saturate(.8)',transform:'scale(.93)'},{filter:'blur(0) brightness(1) saturate(1)',transform:'none'}],{duration:1200,delay:land+120,easing:'cubic-bezier(.22,1,.36,1)'});
    lines.forEach(line=>play(line,[{opacity:0,transform:'scaleX(0)'},{opacity:1,transform:'scaleX(1)'}],{duration:760,delay:land+820,easing:'cubic-bezier(.16,1,.3,1)'}));
    travel.finished.then(()=>setTimeout(finish,700),()=>{});
  }
  const observer=new IntersectionObserver(entries=>{
    const entry=entries[entries.length-1];
    if(!started&&entry.intersectionRatio>=.55)run();
  },{threshold:[0,.55,.8]});
  observer.observe(root);
  root.addEventListener('pointerdown',finish);
  return {destroy(){if(!done){done=true;observer.disconnect();root.removeEventListener('pointerdown',finish);animations.forEach(a=>a.cancel());section.classList.remove('is-prelude');}}};
}

/* The revealed element ------------------------------------------------------------- */
function clearStage(){game?.destroy();game=null;visual?.destroy();visual=null;}
async function showStage(index,{instant=false}={}){
  const panel=document.getElementById('element-panel');if(!panel)return;
  const token=++stageToken;
  if(!panel.hidden&&!instant&&!motion.matches&&panel.animate){
    await panel.animate([{opacity:1,transform:'none',filter:'blur(0)'},{opacity:0,transform:'scale(.975)',filter:'blur(6px)'}],{duration:190,easing:'cubic-bezier(.4,0,1,1)'}).finished.catch(()=>{});
    if(token!==stageToken)return;
  }
  clearStage();
  const reveal=panel.hidden;
  panel.hidden=false;panel.setAttribute('aria-labelledby',`bio-element-${index}`);
  if(index===0){
    panel.innerHTML='<div id="mindset-host"></div>';
    game=mountMindset(document.getElementById('mindset-host'),{copy:dict.game,asset,reducedMotion:motion.matches,onSound:cue,onContinue:continueFromGame});
  }else{
    panel.innerHTML=renderElement(index,dict);
    visual=mountElementVisual(document.getElementById('element-visual-host'),index,{reducedMotion:motion.matches});
  }
  icons();
  if(instant||motion.matches)return;
  // It blooms open from the wheel above it, light-struck, and settles.
  // No opacity in this reveal: the element visual only draws while it is visible, and a
  // fully transparent first frame would stop it before it starts.
  panel.classList.remove('is-settled');
  const bloom=panel.animate?.([
    {clipPath:'circle(0% at 50% 0%)',transform:'translateY(-18px) scale(.95)',filter:'blur(10px) brightness(1.7)'},
    {clipPath:'circle(150% at 50% 0%)',transform:'none',filter:'blur(0) brightness(1)'}
  ],{duration:reveal?1000:820,easing:'cubic-bezier(.16,1,.3,1)'});
  // A class change also prompts the visual to re-check that it may draw.
  bloom?.finished.then(()=>{if(token===stageToken)panel.classList.add('is-settled');},()=>{});
  // Bring the stage into view while keeping the wheel's lower half on screen.
  setTimeout(()=>{
    if(token!==stageToken)return;
    const box=panel.getBoundingClientRect(),over=box.bottom-innerHeight+16;
    if(over>0)scrollBy({top:Math.min(over,box.top-24),behavior:'smooth'});
  },reveal?260:120);
}
function selectElement(index,{quiet=false,instant=false,spin=true}={}){
  index=Math.max(0,Math.min(5,Number(index)||0));
  if(spin)wheel?.spinTo(index,{instant});
  wheel?.setActive(index);
  if(!quiet){cue('wink');tabSparks?.burst();}
  const panel=document.getElementById('element-panel');
  if(index===selected&&panel&&!panel.hidden)return;
  selected=index;
  showStage(index,{instant});
}
// "Let's continue" at the end of the game: walk into the light, arrive at Hot / Cold.
function continueFromGame(image){
  playSunJourney({image,hdrSrc:asset('films/hdr-white.mp4'),reducedMotion:motion.matches,onCovered:()=>{
    document.querySelector('.bio-elements')?.scrollIntoView({block:'start',behavior:'instant'});
    selectElement(1,{quiet:true});
  }}).then(()=>{
    // The pressed button left with the game; don't leave a focus ring on the new panel.
    const panel=document.getElementById('element-panel');
    if(panel&&(panel===document.activeElement||panel.contains(document.activeElement)))document.activeElement.blur();
    tabSparks?.burst();
  });
}

/* The sound prompt ------------------------------------------------------------------- */
// The website's own question, asked once per visit: the page waits beneath a near-black,
// blurred layer of drifting sparks. Yes unlocks the effects and starts the film with
// sound inside the same tap; No starts it quietly.
function askSound(){
  const dialog=document.createElement('dialog');
  dialog.className='portal bio-sound-dialog';dialog.setAttribute('aria-label',dict.portal.sound);
  dialog.innerHTML=`<div class="portal-shade is-arriving" aria-hidden="true"></div><canvas class="portal-ambient is-arriving" aria-hidden="true"></canvas><div class="portal-frost is-arriving" aria-hidden="true"></div><div class="portal-focus is-in"><div class="portal-focus-content sound-stage"><span class="mh-monogram bio-sound-mark" aria-hidden="true">mh</span><div class="sound-symbol">${icon('audio-lines')}</div><h2 class="portal-title">${e(dict.portal.sound)}</h2><p class="portal-sub">${e(dict.portal.soundCopy)}</p><div class="sound-choices"><button class="sound-yes" type="button"><span>${e(dict.portal.yes)}<small>${e(dict.portal.recommended)}</small></span>${icon('arrow-right')}</button><button class="sound-no" type="button">${e(dict.portal.no)}</button></div></div></div>`;
  overlayRoot.append(dialog);icons();dialog.showModal();
  const stopSparks=mountAmbientSparks(dialog.querySelector('.portal-ambient'));
  let chosen=false;
  const choose=on=>{
    if(chosen)return;chosen=true;
    try{sessionStorage.setItem('matthew-bio-asked','1');}catch{}
    setSound(on);
    film?.begin(on);
    if(on)cue('nav');
    dialog.querySelectorAll('button').forEach(button=>button.disabled=true);
    const finish=()=>{stopSparks?.();dialog.close();dialog.remove();};
    if(motion.matches){finish();return;}
    dialog.classList.add('is-leaving');
    for(const layer of dialog.querySelectorAll('.portal-shade,.portal-frost')){layer.classList.remove('is-arriving');layer.classList.add('is-leaving');}
    setTimeout(finish,460);
  };
  dialog.querySelector('.sound-yes').addEventListener('click',()=>choose(true));
  dialog.querySelector('.sound-no').addEventListener('click',()=>choose(false));
  dialog.addEventListener('cancel',event=>{event.preventDefault();choose(false);});
  dialog.querySelector('.sound-yes').focus({preventScroll:true});
}

/* Links, language, map, dialogs ------------------------------------------------------ */
function setupLinks(){
  const animations=new Set();
  const play=(node,frames,options)=>{const animation=node.animate(frames,options);animations.add(animation);animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));return animation;};
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
    target.dataset.bioVisible=String(isIntersecting);
    if(!isIntersecting||target.dataset.bioRevealed)return;
    target.dataset.bioRevealed='true';
    if(motion.matches||!target.animate)return;
    play(target,[{opacity:.2,translate:'0 22px'},{opacity:1,translate:'0 0'}],{duration:680,easing:'cubic-bezier(.16,1,.3,1)'});
    const art=target.querySelector('.bio-link__art');
    if(art)play(art,[{opacity:0,transform:'scale(1.14) translateX(16px)'},{opacity:1,transform:'none'}],{duration:1100,easing:'cubic-bezier(.16,1,.3,1)'});
  }),{threshold:.12,rootMargin:'0px 0px -20px 0px'}):null;
  shell.querySelectorAll('[data-bio-reveal]').forEach(node=>observer?observer.observe(node):node.dataset.bioRevealed='true');
  const removers=[];
  shell.querySelectorAll('.bio-link').forEach(link=>{
    const move=event=>{
      if(motion.matches||!finePointer.matches||event.pointerType==='touch')return;
      const box=link.getBoundingClientRect(),x=(event.clientX-box.left)/box.width,y=(event.clientY-box.top)/box.height;
      link.style.setProperty('--bio-x',`${x*100}%`);link.style.setProperty('--bio-y',`${y*100}%`);
      link.style.setProperty('--bio-rx',`${(.5-y)*3}deg`);link.style.setProperty('--bio-ry',`${(x-.5)*3}deg`);
    };
    const leave=()=>{link.style.setProperty('--bio-rx','0deg');link.style.setProperty('--bio-ry','0deg');};
    const press=event=>{
      if(motion.matches||event.button!==0)return;
      link.classList.remove('is-pressed');void link.offsetWidth;link.classList.add('is-pressed');
    };
    const released=()=>link.classList.remove('is-pressed');
    link.addEventListener('pointermove',move,{passive:true});link.addEventListener('pointerleave',leave);link.addEventListener('pointerdown',press,{passive:true});link.addEventListener('animationend',released);
    removers.push(()=>{link.removeEventListener('pointermove',move);link.removeEventListener('pointerleave',leave);link.removeEventListener('pointerdown',press);link.removeEventListener('animationend',released);});
  });
  cleanups.push(()=>{observer?.disconnect();animations.forEach(animation=>animation.cancel());removers.forEach(fn=>fn());});
}

// The other contacts unfold beneath the socials; folded, they are inert (not focusable).
function setupMore(){
  const button=shell.querySelector('.bio-more'),panel=shell.querySelector('.bio-more-links');if(!button||!panel)return;
  button.addEventListener('click',()=>{
    const open=button.getAttribute('aria-expanded')!=='true';
    button.setAttribute('aria-expanded',String(open));
    panel.toggleAttribute('data-open',open);panel.inert=!open;
    if(open)cue('nav');
  });
}
// Reaching the call card: it arrives with a burst before settling into its ringing.
function setupCall(){
  const call=shell.querySelector('.bio-link--call');if(!call||motion.matches||!call.animate||!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.intersectionRatio>=.6))return;
    observer.disconnect();
    call.animate([{transform:'scale(.96)',boxShadow:'0 0 0 0 rgba(52,199,89,.0)'},{transform:'scale(1.025)',boxShadow:'0 0 0 10px rgba(52,199,89,.18)',offset:.45},{transform:'none',boxShadow:'0 0 0 0 rgba(52,199,89,0)'}],{duration:900,easing:'cubic-bezier(.22,1,.36,1)'});
    call.querySelector('.bio-call-button')?.animate([{transform:'scale(.4)',opacity:0},{transform:'scale(1.18)',opacity:1,offset:.6},{transform:'none',opacity:1}],{duration:800,delay:150,easing:'cubic-bezier(.16,1.4,.3,1)',fill:'backwards'});
    call.querySelector('.bio-call-avatar img')?.animate([{transform:'scale(.7)',filter:'brightness(1.6)'},{transform:'none',filter:'none'}],{duration:800,easing:'cubic-bezier(.16,1,.3,1)'});
  },{threshold:[0,.6]});
  observer.observe(call);cleanups.push(()=>observer.disconnect());
}

function setupLanguage(){
  const root=shell.querySelector('[data-bio-language]');if(!root)return;
  const trigger=root.querySelector('.bio-language__trigger'),menu=root.querySelector('.bio-language__menu');
  const open=value=>{menu.hidden=!value;trigger.setAttribute('aria-expanded',String(value));};
  trigger.addEventListener('click',()=>open(menu.hidden));
  const outside=event=>{if(!menu.hidden&&!root.contains(event.target))open(false);};
  const escape=event=>{if(event.key==='Escape'&&!menu.hidden){event.preventDefault();open(false);trigger.focus();}};
  document.addEventListener('pointerdown',outside);root.addEventListener('keydown',escape);
  menu.addEventListener('click',event=>{const choice=event.target.closest('[data-lang]');if(!choice)return;event.preventDefault();open(false);changeLanguage(choice.dataset.lang);});
  cleanups.push(()=>document.removeEventListener('pointerdown',outside));
}
let languageRequest=0;
async function changeLanguage(code){
  if(code===locale)return;
  const request=++languageRequest;
  try{
    const next=await getLocale(code);if(request!==languageRequest)return;
    locale=code;dict=next;write('matthew-language',code);
    const url=new URL(location.href);if(code==='en')url.searchParams.delete('lang');else url.searchParams.set('lang',code);
    history.replaceState(history.state,'',url);
    render();
  }catch{ /* The current language stays; the menu remains available to try again. */ }
}

function setupMap(){
  const host=document.getElementById('studio-map');if(!host)return;
  // Tiles load only as the studio comes near, and touch scrolls the page, not the map.
  const begin=async()=>{
    const L=window.L;if(!L){document.getElementById('map-fallback').hidden=false;return;}
    const touch=matchMedia('(pointer: coarse)').matches;
    const localMap=L.map(host,{scrollWheelZoom:false,dragging:!touch,tap:false,zoomControl:false,attributionControl:true,fadeAnimation:!motion.matches,zoomAnimation:!motion.matches}).setView([47.3694,8.5303],14);map=localMap;
    let tileSuccess=false;
    const layer=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(localMap);
    layer.on('tileload',()=>{tileSuccess=true;if(host.isConnected)document.getElementById('map-fallback').hidden=true;});
    layer.on('tileerror',()=>{if(!tileSuccess&&host.isConnected)document.getElementById('map-fallback').hidden=false;});
    L.marker([47.36079406738281,8.521052360534668],{icon:L.divIcon({className:'studio-pin',html:'<span class="studio-pin-beam"></span><span class="studio-pin-core"></span>',iconSize:[40,40],iconAnchor:[20,20]}),title:'Matthew Hua · Rüdigerstrasse 7',keyboard:true}).addTo(localMap).bindTooltip('matthew hua · healwell',{direction:'top',offset:[0,-24]});
    try{
      const response=await fetch(new URL('studio-route.json',import.meta.url));if(!response.ok)throw new Error('Route unavailable');
      const routeData=await response.json();if(map!==localMap||!host.isConnected)return;
      L.geoJSON(routeData,{style:{color:'#98804a',weight:5,opacity:.2,className:'map-route-glow'}}).addTo(localMap);
      const line=L.geoJSON(routeData,{style:{color:'#967935',weight:2.5,opacity:.85}}).addTo(localMap);
      if(!motion.matches)L.geoJSON(routeData,{style:{color:'#ffefb9',weight:2,opacity:1,className:'map-route-motion'}}).addTo(localMap);
      localMap.fitBounds(line.getBounds(),{paddingTopLeft:[30,60],paddingBottomRight:[40,120],animate:false});
      requestAnimationFrame(()=>{if(map===localMap)localMap.invalidateSize();});
    }catch{ /* The destination and the Maps links remain without the reference route. */ }
  };
  if(!('IntersectionObserver' in window)){begin();return;}
  const near=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){near.disconnect();begin();}},{rootMargin:'400px 0px'});
  near.observe(host);cleanups.push(()=>near.disconnect());
}

function closeModal(){if(!modal)return;const old=modal;modal=null;old.cleanup?.();old.close();old.remove();}
function openModal(className,content){
  closeModal();
  const dialog=document.createElement('dialog');dialog.className=className+' atmospheric-dialog';
  dialog.innerHTML=`<div class="modal-surface ${className.replace('-dialog','-surface')}"><button class="icon-button dialog-close" type="button" data-action="close-dialog" aria-label="${e(dict.common.close)}" title="${e(dict.common.close)}">${icon('x')}</button>${content}</div>`;
  overlayRoot.append(dialog);modal=dialog;icons();dialog.showModal();dialog.cleanup=mountDialogAtmosphere(dialog);
  dialog.querySelector('.dialog-close').focus({preventScroll:true});
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeModal();});
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeModal();});
}
function openMaps(){
  const google=new URL('https://www.google.com/maps/dir/');google.searchParams.set('api','1');google.searchParams.set('destination','Rüdigerstrasse 7, 8045 Zürich, Switzerland');google.searchParams.set('travelmode','driving');google.searchParams.set('dir_action','navigate');
  const apple=new URL('https://maps.apple.com/');apple.searchParams.set('daddr','Rüdigerstrasse 7, 8045 Zürich, Switzerland');apple.searchParams.set('dirflg','d');
  openModal('maps-dialog',`<p class="eyebrow">Rüdigerstrasse 7 · Zürich</p><h2>${e(dict.contact.chooseMap)}</h2><p>${e(dict.contact.chooseMapCopy)}</p><div class="map-options">${[['google','googlemaps.svg',google],['apple','apple.svg',apple]].map(([key,image,url])=>`<a class="map-option" href="${e(url.href)}" target="_blank" rel="noopener"><img src="${e(asset('brands/'+image))}" alt=""><span><strong>${e(dict.contact[key])}</strong><small>${e(dict.contact[key+'Hint'])}</small></span>${icon('arrow-up-right')}</a>`).join('')}</div>`);
}

document.addEventListener('click',event=>{
  const action=event.target.closest('[data-action]')?.dataset.action;
  if(action==='sound')setSound(!soundEnabled);
  else if(action==='maps')openMaps();
  else if(action==='privacy')openModal('privacy-dialog',`<h2>${e(dict.footer.privacy)}</h2><p>${e(dict.footer.privacyText)}</p>`);
  else if(action==='close-dialog')closeModal();
  else if(action==='copy-address'){
    const button=event.target.closest('[data-action="copy-address"]');
    navigator.clipboard?.writeText('Rüdigerstrasse 7, Ground Floor, 8045 Zürich, Switzerland').then(()=>{
      button.classList.add('is-copied');button.setAttribute('aria-label',dict.contact.copied);button.title=dict.contact.copied;button.innerHTML=icon('check');icons();
      setTimeout(()=>{if(!button.isConnected)return;button.classList.remove('is-copied');button.setAttribute('aria-label',dict.contact.copyAddress);button.title=dict.contact.copyAddress;button.innerHTML=icon('copy');icons();},2000);
    }).catch(()=>{});
  }
});

/* Rendering ---------------------------------------------------------------------- */
function teardown(){
  closeModal();film?.destroy();film=null;tears?.destroy();tears=null;tabSparks?.destroy();tabSparks=null;wheelIntro?.destroy();wheelIntro=null;wheel?.destroy();wheel=null;
  clearStage();map?.remove();map=null;cleanups.forEach(fn=>fn());cleanups=[];
}
// The build ships English markup; another language replaces it (keeping the film's place).
function render({hydrate=false}={}){
  const resume=film?.state(),keep=selected;
  teardown();selected=-1;
  if(!hydrate)shell.innerHTML=renderLinkInBio(dict,{asset,href,file,flag});
  setMetadata();icons();
  film=mountFilm(shell.querySelector('[data-bio-film]'),resume);
  const tearsSection=shell.querySelector('.tears-moment');
  if(tearsSection)tears=mountTearsMoment(tearsSection,{reducedMotion:motion,onImpact:tearSound});
  const tablist=shell.querySelector('.bio-wheel__labels');
  if(tablist)tabSparks=mountTabSparks(tablist,{reducedMotion:motion});
  wheel=mountWheel(shell.querySelector('[data-bio-wheel]'),{onPick:index=>selectElement(index)});
  wheelIntro=mountWheelIntro(shell.querySelector('.bio-elements'),wheel);
  setupLinks();setupMore();setupCall();setupLanguage();setupMap();updateSoundButtons();
  // Mindset is chosen from the start (its game waits below); the wheel keeps cruising.
  selectElement(keep>=0?keep:0,{quiet:true,instant:true,spin:false});
  document.documentElement.classList.add('ready');
  let asked=false;try{asked=!!sessionStorage.getItem('matthew-bio-asked');}catch{}
  if(resume||asked)film.start();else askSound();
}

async function init(){
  const params=new URLSearchParams(location.search);
  locale=resolveLocale(navigator.languages?.length?navigator.languages:[navigator.language],params.get('lang'),read('matthew-language'));
  try{dict=await getLocale(locale);}catch{locale='en';dict=await getLocale('en');}
  sfx.prefetch();
  render({hydrate:locale==='en'&&shell.dataset.locale==='en'});
}
init();
