// matthewhua.ch/linkinbio: the page social profiles link to. The arrival film plays by
// itself (with sound where the browser allows it, otherwise muted with a clear way to
// turn sound on), the tears moment slows the scroll beneath it, the six elements turn
// on a wheel that reveals each element's visual (the Mindset game included, with its
// sounds), and every way to reach Matthew sits in platform-tinted glass.
import {languages,escapeHTML as e,icon,renderElement} from './templates.js';
import {renderLinkInBio} from './linkinbio-template.js';
import {resolveLocale} from './language.js';
import {mountMindset} from './mindset.js';
import {mountElementVisual} from './element-visuals.js';
import {mountTearsMoment} from './tears.js';
import {createSoundEffects} from './sound.js';
import {mountTabSparks} from './tab-sparks.js';
import {playSunJourney} from './sun-journey.js';
import {mountDialogAtmosphere} from './dialog-atmosphere.js';

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
let selected=-1,stageToken=0,cleanups=[];

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
  // Scrolled well past, it rests (so its sound never talks over the game or the tear);
  // back in view it continues, unless the visitor paused it.
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
    const ratio=entries[entries.length-1].intersectionRatio;
    if(ratio<.18&&playing()){autoPaused=true;video.pause();}
    else if(ratio>=.18&&autoPaused&&!userPaused&&!video.ended){autoPaused=false;play();}
  },{threshold:[0,.18,.5]}):null;
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
  return {
    start,
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
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);wake();}):null;
  observer?.observe(root);if(!observer)visible=true;
  document.addEventListener('visibilitychange',wake);
  root.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY};},{passive:true});
  root.addEventListener('click',event=>{
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
    event.preventDefault();const wrapped=(next+6)%6;segments[wrapped].focus({preventScroll:true});onPick(wrapped);
  });
  apply();
  return {
    spinTo(index,{instant=false}={}){
      const want=-index*60;
      if(instant||motion.matches){theta=((want%360)+360)%360;omega=0;target=null;holdUntil=performance.now()+1800;apply();return;}
      target=want+360*Math.ceil((theta+120-want)/360);holdUntil=0;wake();
    },
    setActive(index){
      root.classList.add('has-active');
      segments.forEach((segment,i)=>{segment.setAttribute('aria-selected',String(i===index));segment.tabIndex=i===index?0:-1;});
      sectors.forEach((sector,i)=>sector.classList.toggle('is-active',i===index));
    },
    destroy(){destroyed=true;observer?.disconnect();document.removeEventListener('visibilitychange',wake);if(frame!==null)cancelAnimationFrame(frame);}
  };
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
  panel.animate?.([
    {opacity:0,clipPath:'circle(0% at 50% 0%)',transform:'translateY(-18px) scale(.95)',filter:'blur(10px) brightness(1.7)'},
    {opacity:1,clipPath:'circle(150% at 50% 0%)',transform:'none',filter:'blur(0) brightness(1)'}
  ],{duration:reveal?1000:820,easing:'cubic-bezier(.16,1,.3,1)'});
  // Bring the stage into view while keeping the wheel's lower half on screen.
  setTimeout(()=>{
    if(token!==stageToken)return;
    const box=panel.getBoundingClientRect(),over=box.bottom-innerHeight+16;
    if(over>0)scrollBy({top:Math.min(over,box.top-24),behavior:'smooth'});
  },reveal?260:120);
}
function selectElement(index,{quiet=false,instant=false}={}){
  index=Math.max(0,Math.min(5,Number(index)||0));
  wheel?.spinTo(index,{instant});
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
  }}).then(()=>tabSparks?.burst());
}

/* Links, language, map, dialogs ------------------------------------------------------ */
function setupLinks(){
  const animations=new Set();
  const play=(node,frames,options)=>{const animation=node.animate(frames,options);animations.add(animation);animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));return animation;};
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
    target.dataset.bioVisible=String(isIntersecting);
    if(!isIntersecting||target.dataset.bioRevealed)return;
    target.dataset.bioRevealed='true';
    if(!motion.matches&&target.animate)play(target,[{opacity:.2,translate:'0 22px'},{opacity:1,translate:'0 0'}],{duration:680,easing:'cubic-bezier(.16,1,.3,1)'});
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
      if(motion.matches||event.button!==0||!link.animate)return;
      const box=link.getBoundingClientRect(),ripple=document.createElement('span');
      ripple.className='bio-link__ripple';ripple.setAttribute('aria-hidden','true');
      ripple.style.setProperty('--tap-x',`${event.clientX-box.left}px`);ripple.style.setProperty('--tap-y',`${event.clientY-box.top}px`);
      link.append(ripple);
      play(ripple,[{transform:'scale(.12)',opacity:.85},{transform:'scale(2.8)',opacity:0}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'}).finished.then(()=>ripple.remove(),()=>ripple.remove());
    };
    link.addEventListener('pointermove',move,{passive:true});link.addEventListener('pointerleave',leave);link.addEventListener('pointerdown',press,{passive:true});
    removers.push(()=>{link.removeEventListener('pointermove',move);link.removeEventListener('pointerleave',leave);link.removeEventListener('pointerdown',press);});
  });
  cleanups.push(()=>{observer?.disconnect();animations.forEach(animation=>animation.cancel());removers.forEach(fn=>fn());});
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
});

/* Rendering ---------------------------------------------------------------------- */
function teardown(){
  closeModal();film?.destroy();film=null;tears?.destroy();tears=null;tabSparks?.destroy();tabSparks=null;wheel?.destroy();wheel=null;
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
  setupLinks();setupLanguage();setupMap();updateSoundButtons();
  if(keep>=0)selectElement(keep,{quiet:true,instant:true});
  document.documentElement.classList.add('ready');
  film.start();
}

async function init(){
  const params=new URLSearchParams(location.search);
  locale=resolveLocale(navigator.languages?.length?navigator.languages:[navigator.language],params.get('lang'),read('matthew-language'));
  try{dict=await getLocale(locale);}catch{locale='en';dict=await getLocale('en');}
  sfx.prefetch();
  render({hydrate:locale==='en'&&shell.dataset.locale==='en'});
}
init();
