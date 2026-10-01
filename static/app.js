import {renderHeader,renderFooter,renderPage,renderElement,routes,languages,media,mediaOrder,escapeHTML as e,icon} from './templates.js';
import {resolveLocale,interpolate} from './language.js';
import {createEffects,mountAmbientSparks} from './effects.js';
import {mountMindset} from './mindset.js';
import {mountTechnologyEffects} from './technology.js';
import {mountElementVisual} from './element-visuals.js';

const base=new URL('../',import.meta.url);
document.querySelector('link[rel="icon"]').href=new URL('static/favicon.svg',base).href;
const asset=file=>new URL('assets/'+file.split('/').map(encodeURIComponent).join('/'),base).href;
const shell=document.getElementById('shell');
const overlayRoot=document.getElementById('overlay-root');
const transitionCanvas=document.getElementById('transition-canvas');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const effects=createEffects({transitionCanvas,cursorCanvas:document.getElementById('sparkler-canvas')});
const localeCache=new Map();
let dict,locale,route,game,map,observer,portal,portalCleanup,heroVideo,elementVisual,technology,cleanupTilt=()=>{};
let soundEnabled=false,navigating=false,pendingNavigation=null,selectedElement=0,archiveFilter='all',modal=null;
let restoreFocus=null,arrival=null;
const readStore=(store,key)=>{try{return store.getItem(key);}catch{return null;}};
const writeStore=(store,key,value)=>{try{store.setItem(key,value);}catch{}};
const availableStorage=name=>{try{return window[name];}catch{return null;}};
const localStorage=availableStorage('localStorage'),sessionStorage=availableStorage('sessionStorage');
const href=(target,lang=locale)=>{const u=new URL(target==='home'?'./':target+'/',base);if(lang&&lang!=='en')u.searchParams.set('lang',lang);return u.href;};
const icons=()=>window.lucide?.createIcons({attrs:{'stroke-width':1.5}});
function currentRoute(){const tail=location.pathname.slice(base.pathname.length).replace(/^\/+|\/+$/g,'').replace(/\/index\.html$/,'');const candidate=tail==='index.html'||!tail?'home':tail;return routes.includes(candidate)?candidate:'home';}
const legacyRoutes={journey:'about',elements:'method',technology:'method',philosophy:'private-practice',studio:'contact',archive:'archive'};
async function getLocale(code){
  if(localeCache.has(code))return localeCache.get(code);
  const response=await fetch(new URL(`locales/${code}.json`,import.meta.url));
  if(!response.ok)throw new Error('Language unavailable');
  const value=await response.json();localeCache.set(code,value);return value;
}
function setMetadata(){
  document.documentElement.lang=languages.find(l=>l.code===locale)?.html||'en';
  document.title=route==='home'?dict.seo.title:`${dict.nav[route==='private-practice'?'practice':route]} | Matthew Hua | Zurich`;
  document.querySelector('meta[name="description"]').content=dict.seo.description;
  document.querySelector('meta[property="og:title"]').content=document.title;
  document.querySelector('meta[property="og:description"]').content=dict.seo.description;
  document.querySelector('meta[name="twitter:title"]').content=document.title;
  document.querySelector('meta[name="twitter:description"]').content=dict.seo.description;
  const canonical='https://matthewhua.ch/'+(route==='home'?'':route+'/');
  document.querySelector('link[rel="canonical"]').href=canonical;
  document.querySelector('meta[property="og:url"]').content=canonical;
}
function cleanPage(){game?.destroy();game=null;elementVisual?.destroy();elementVisual=null;technology?.destroy();technology=null;map?.remove();map=null;observer?.disconnect();cleanupTilt();cleanupTilt=()=>{};if(heroVideo){heroVideo.pause();heroVideo=null;}}
function renderSite({element=0}={}){
  cleanPage();document.body.dataset.route=route;document.body.classList.remove('menu-open');
  shell.innerHTML=renderHeader(dict,href,route)+`<main id="main">${renderPage(route,dict,asset,href)}</main>`+renderFooter(dict,href);
  setMetadata();icons();setupReveals();setupHero();updateSoundButtons();setupTilt();
  if(document.getElementById('element-panel'))selectElement(element);
  if(document.getElementById('technology'))technology=mountTechnologyEffects(document.getElementById('technology'));
  if(route==='contact')setupMap();
  archiveFilter='all';selectedElement=element;
  document.documentElement.classList.add('ready');
}
function setupReveals(){
  const items=document.querySelectorAll('.reveal');
  if(motion.matches||!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('is-visible'));return;}
  observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{rootMargin:'0px 0px -24px 0px',threshold:.03});
  items.forEach(el=>observer.observe(el));
}
function setupTilt(){
  if(motion.matches||navigator.maxTouchPoints>0||!matchMedia('(min-width:900px) and (hover:hover) and (pointer:fine)').matches)return;
  const removals=[];
  for(const el of document.querySelectorAll('.archive-card,.instrument')){
    const limit=el.classList.contains('instrument')?.4:.7;
    const move=event=>{const r=el.getBoundingClientRect();const x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;el.style.transform=`perspective(1100px) rotateX(${-y*limit*2}deg) rotateY(${x*limit*2}deg)`;};
    const leave=()=>el.style.removeProperty('transform');
    el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);
    removals.push(()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave);leave();});
  }
  cleanupTilt=()=>removals.forEach(fn=>fn());
}
function setupHero(){
  heroVideo=document.getElementById('hero-film');if(!heroVideo)return;
  const video=heroVideo,hero=document.getElementById('hero');
  video.muted=!soundEnabled;
  video.addEventListener('playing',()=>{hero.classList.add('is-playing');hero.classList.remove('is-paused');hero.querySelector('.hero-error').hidden=true;updateVideoButtons();});
  video.addEventListener('pause',()=>{hero.classList.remove('is-playing');if(video.currentTime>0&&!video.ended)hero.classList.add('is-paused');updateVideoButtons();});
  video.addEventListener('ended',()=>{hero.classList.remove('is-playing','is-paused');updateVideoButtons();});
  video.addEventListener('error',()=>{hero.querySelector('.hero-error').hidden=false;hero.classList.remove('is-playing','is-paused');updateVideoButtons();});
  video.addEventListener('timeupdate',()=>{const time=hero.querySelector('.film-time');const remaining=Math.max(0,Math.ceil((video.duration||60)-video.currentTime));time.textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;});
}
function playHero(){
  const video=heroVideo;if(!video)return;
  if(!video.src)video.src=asset('films/inner-fire.mp4');
  video.muted=!soundEnabled;
  if(video.ended)video.currentTime=0;
  const promise=video.play();
  promise?.catch(()=>{if(video===heroVideo){document.getElementById('hero')?.classList.remove('is-playing');updateVideoButtons();}});
}
function updateVideoButtons(){
  document.querySelectorAll('[data-action="hero-play"]').forEach(button=>{const playing=heroVideo&&!heroVideo.paused;const text=playing?dict.common.pause:heroVideo?.ended?dict.common.replay:dict.common.play;button.setAttribute('aria-label',text);if(button.classList.contains('icon-button')){button.title=text;button.innerHTML=icon(playing?'pause':'play');}else button.innerHTML=icon(playing?'pause':'play')+`<span>${e(playing?dict.common.pause:dict.common.watchFilm)}</span>`;});icons();
}
function updateSoundButtons(){
  const label=soundEnabled?dict.nav.soundOn:dict.nav.soundOff;
  document.querySelectorAll('[data-action="sound"]').forEach(button=>{button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(soundEnabled));button.title=label;button.innerHTML=icon(soundEnabled?'volume-2':'volume-x');});
  if(heroVideo)heroVideo.muted=!soundEnabled;
  if(arrival)arrival.video.muted=!soundEnabled;
  document.querySelectorAll('.gallery-view video').forEach(video=>video.muted=!soundEnabled);
  icons();
}
function setSound(value){soundEnabled=value;updateSoundButtons();}

function prepareArrival(){
  if(arrival)return arrival;
  const dialog=document.createElement('dialog');
  dialog.className='arrival-player';dialog.setAttribute('aria-label',dict.arrival.eyebrow);
  dialog.innerHTML=`<div class="arrival-screen"><video playsinline preload="auto" poster="${e(asset('European Championship.webp'))}" src="${e(asset('films/european-championship.mp4'))}" aria-label="${e(dict.arrival.eyebrow)}"></video><button class="arrival-reveal" aria-label="${e(dict.arrival.reveal)}"></button><div class="arrival-controls"><button class="icon-button arrival-close" aria-label="${e(dict.common.close)}" title="${e(dict.common.close)}">${icon('x')}</button><div class="arrival-transport"><button class="icon-button arrival-play" aria-label="${e(dict.common.pause)}" title="${e(dict.common.pause)}">${icon('pause')}</button><span class="arrival-time" aria-hidden="true">00:28</span><button class="icon-button" data-action="sound" aria-label="${e(dict.nav.soundOff)}" title="${e(dict.nav.soundOff)}">${icon('volume-x')}</button></div></div><p class="arrival-error" hidden>${e(dict.common.mediaError)} <a href="${e(asset('films/european-championship.mp4'))}">${e(dict.common.openFilm)}</a></p></div><button class="arrival-enter"><span class="arrival-label">MATTHEW HUA · ${e(dict.arrival.eyebrow)}</span><span class="arrival-title">${e(dict.arrival.title)}</span><span class="arrival-link">${e(dict.arrival.enter)}${icon('arrow-down')}</span></button>`;
  overlayRoot.append(dialog);
  const video=dialog.querySelector('video'),play=dialog.querySelector('.arrival-play');
  let hideTimer=0,closing=false;
  const showControls=()=>{
    dialog.classList.add('controls-visible');clearTimeout(hideTimer);
    if(!video.paused)hideTimer=setTimeout(()=>{if(!dialog.querySelector('.arrival-controls').contains(document.activeElement))dialog.classList.remove('controls-visible');},3200);
  };
  const update=()=>{const label=video.paused?dict.common.play:dict.common.pause;play.innerHTML=icon(video.paused?'play':'pause');play.setAttribute('aria-label',label);play.title=label;icons();};
  const dismiss=async()=>{
    if(closing)return;closing=true;video.pause();clearTimeout(hideTimer);dialog.append(transitionCanvas);
    await effects.transition(()=>{dialog.classList.add('departing');});
    document.body.append(transitionCanvas);dialog.close();dialog.remove();arrival=null;
    document.querySelector('main h1')?.focus({preventScroll:true});
  };
  arrival={video,dialog,show(){dialog.showModal();dialog.append(transitionCanvas);dialog.querySelector('.arrival-enter').focus({preventScroll:true});},start(){if(closing)return;video.currentTime=0;video.play()?.catch(showControls);},dismiss};
  video.muted=!soundEnabled;updateSoundButtons();
  dialog.querySelector('.arrival-reveal').addEventListener('click',showControls);
  dialog.querySelector('.arrival-controls').addEventListener('focusin',showControls);
  play.addEventListener('click',()=>{if(video.paused){video.play()?.catch(showControls);}else video.pause();showControls();});
  dialog.querySelector('.arrival-close').addEventListener('click',dismiss);
  dialog.querySelector('.arrival-enter').addEventListener('click',dismiss);
  dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
  video.addEventListener('play',update);video.addEventListener('pause',update);
  video.addEventListener('ended',update);
  video.addEventListener('timeupdate',()=>{const left=Math.ceil(Math.max(0,(video.duration||28)-video.currentTime));dialog.querySelector('.arrival-time').textContent=`00:${String(left).padStart(2,'0')}`;});
  video.addEventListener('error',()=>{dialog.querySelector('.arrival-error').hidden=false;showControls();});
  // Authorize this media element in the gesture, but start the film only after the curtain.
  video.play()?.catch(error=>{if(error.name!=='AbortError')showControls();});
  video.pause();
  return arrival;
}
function selectElement(index){
  if(!document.getElementById('element-panel'))return;index=Math.max(0,Math.min(5,Number(index)||0));game?.destroy();game=null;elementVisual?.destroy();elementVisual=null;
  selectedElement=index;const panel=document.getElementById('element-panel');
  document.querySelectorAll('[data-element-tab]').forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
  panel.setAttribute('aria-labelledby',`element-tab-${index}`);
  if(index===0){panel.innerHTML='<div id="mindset-host"></div>';game=mountMindset(document.getElementById('mindset-host'),{copy:dict.game,asset,reducedMotion:motion.matches});}
  else {panel.innerHTML=renderElement(index,dict);elementVisual=mountElementVisual(document.getElementById('element-visual-host'),index,{reducedMotion:motion.matches});}
  icons();
}
async function navigate(target,{push=true,element=0,url=null}={}){
  if(!routes.includes(target))return;
  if(navigating){pendingNavigation={target,options:{push,element,url}};return;}
  navigating=true;setMenu(false);closeModal();
  try{
    await effects.transition(()=>{
      route=target;
      if(push){const next=new URL(url||href(target));if(locale!=='en')next.searchParams.set('lang',locale);history.pushState({route},'',next);}
      renderSite({element});window.scrollTo({top:0,behavior:'instant'});document.querySelector('main h1')?.focus({preventScroll:true});
    });
  }finally{navigating=false;if(pendingNavigation){const next=pendingNavigation;pendingNavigation=null;navigate(next.target,next.options);}}
}
function setMenu(open){
  document.body.classList.toggle('menu-open',open);
  const menu=document.getElementById('mobile-nav'),button=document.querySelector('.menu-trigger');if(!menu)return;
  menu.hidden=!open;button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?dict.nav.closeMenu:dict.nav.menu);button.innerHTML=icon(open?'x':'menu');
  document.getElementById('main').inert=open;document.querySelector('.site-footer').inert=open;icons();
  if(open)menu.querySelector('a')?.focus();
}
function closeModal(){if(!modal)return;const old=modal;modal=null;old.querySelectorAll('video').forEach(video=>video.pause());old.close();old.remove();restoreFocus?.isConnected&&restoreFocus.focus({preventScroll:true});}
function openModal(className,content){
  closeModal();restoreFocus=document.activeElement;const dialog=document.createElement('dialog');dialog.className=className;dialog.innerHTML=`<button class="icon-button dialog-close" data-action="close-dialog" aria-label="${e(dict.common.close)}">${icon('x')}</button>`+content;
  overlayRoot.append(dialog);modal=dialog;icons();dialog.showModal();dialog.querySelector('.dialog-close').focus();
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeModal();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();}});
  return dialog;
}
function openMaps(){
  const google=new URL('https://www.google.com/maps/dir/');google.searchParams.set('api','1');google.searchParams.set('destination','Rüdigerstrasse 7, 8045 Zürich, Switzerland');google.searchParams.set('travelmode','driving');google.searchParams.set('dir_action','navigate');
  const apple=new URL('https://maps.apple.com/');apple.searchParams.set('daddr','Rüdigerstrasse 7, 8045 Zürich, Switzerland');apple.searchParams.set('dirflg','d');
  openModal('maps-dialog',`<p class="eyebrow">Rüdigerstrasse 7 · Zürich</p><h2>${e(dict.contact.chooseMap)}</h2><p>${e(dict.contact.chooseMapCopy)}</p><div class="map-options">${[['google','googlemaps.svg',google],['apple','apple.svg',apple]].map(([key,image,url])=>`<a class="map-option" href="${e(url.href)}" target="_blank" rel="noopener"><img src="${e(asset('brands/'+image))}" alt=""><span><strong>${e(dict.contact[key])}</strong><small>${e(dict.contact[key+'Hint'])}</small></span>${icon('arrow-up-right')}</a>`).join('')}</div>`);
}
async function setupMap(){
  const host=document.getElementById('studio-map');if(!host)return;
  const L=window.L;if(!L){document.getElementById('map-fallback').hidden=false;return;}
  const localMap=L.map(host,{scrollWheelZoom:false,zoomControl:true,attributionControl:true,fadeAnimation:!motion.matches,zoomAnimation:!motion.matches}).setView([47.3694,8.5303],14);map=localMap;
  let tileSuccess=false;
  const layer=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(localMap);
  layer.on('tileload',()=>{tileSuccess=true;if(host.isConnected)document.getElementById('map-fallback').hidden=true;});
  layer.on('tileerror',()=>{if(!tileSuccess&&host.isConnected)document.getElementById('map-fallback').hidden=false;});
  L.marker([47.36079406738281,8.521052360534668],{icon:L.divIcon({className:'studio-pin',html:'<span class="studio-pin-core"></span>',iconSize:[40,40],iconAnchor:[20,20]}),title:'Matthew Hua · Rüdigerstrasse 7',keyboard:true}).addTo(localMap).bindTooltip('Matthew Hua · Healwell',{direction:'top',offset:[0,-24]});
  try{
    const response=await fetch(new URL('studio-route.json',import.meta.url));if(!response.ok)throw new Error('Route unavailable');
    const routeData=await response.json();if(map!==localMap||!host.isConnected)return;
    L.geoJSON(routeData,{style:{color:'#98804a',weight:5,opacity:.2,className:'map-route-glow'}}).addTo(localMap);
    const routeLine=L.geoJSON(routeData,{style:{color:'#967935',weight:2.5,opacity:.85}}).addTo(localMap);
    if(!motion.matches)L.geoJSON(routeData,{style:{color:'#ffefb9',weight:2,opacity:1,className:'map-route-motion'}}).addTo(localMap);
    localMap.fitBounds(routeLine.getBounds(),{paddingTopLeft:[50,45],paddingBottomRight:[50,100],animate:false});
    requestAnimationFrame(()=>{if(map===localMap)localMap.invalidateSize();});
  }catch{ /* The destination and navigation links remain usable without the reference route. */ }
}
function filterArchive(filter){
  archiveFilter=filter;
  document.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===filter)));
  document.querySelectorAll('.archive-card').forEach(card=>{card.hidden=!(filter==='all'||(filter==='films'&&card.dataset.film==='true')||card.dataset.group===filter);if(!card.hidden)card.classList.add('is-visible');});
}
function openMedia(index){
  const sequence=mediaOrder.filter(i=>archiveFilter==='all'||(archiveFilter==='films'&&media[i].film)||media[i].group===archiveFilter);
  if(!sequence.includes(index))sequence.push(index);
  let current=index;
  const dialog=openModal('gallery-dialog','<div class="gallery-layout"></div>');
  function show(next){
    dialog.querySelector('video')?.pause();current=next;const item=media[current],copy=dict.archive.items[current];
    dialog.querySelector('.gallery-layout').innerHTML=`<div class="gallery-view">${item.film?`<video controls playsinline preload="metadata" poster="${e(asset(item.poster))}" src="${e(asset(item.film))}" aria-label="${e(copy.title)}"></video>`:`<img src="${e(asset(item.image))}" alt="${e(copy.title)}">`}</div><div class="gallery-details"><p class="eyebrow">${e(dict.archive.eyebrow)}${item.year?' / '+item.year:''}</p><h2>${e(copy.title)}</h2><p>${e(copy.caption)}</p><div class="gallery-pagination"><span>${sequence.indexOf(current)+1} / ${sequence.length}</span><div><button class="icon-button" data-gallery-step="-1" aria-label="${e(dict.archive.previous)}">${icon('arrow-left')}</button><button class="icon-button" data-gallery-step="1" aria-label="${e(dict.archive.next)}">${icon('arrow-right')}</button></div></div></div>`;
    icons();const video=dialog.querySelector('video');
    if(video){video.muted=!soundEnabled;video.play()?.catch(()=>{});video.addEventListener('error',()=>{const error=document.createElement('div');error.className='gallery-media-error';error.innerHTML=`<p>${e(dict.common.mediaError)}</p><a href="${e(asset(item.film))}">${e(dict.common.openFilm)}</a>`;dialog.querySelector('.gallery-view').append(error);},{once:true});}
  }
  const step=delta=>show(sequence[(sequence.indexOf(current)+delta+sequence.length)%sequence.length]);
  dialog.addEventListener('click',event=>{const button=event.target.closest('[data-gallery-step]');if(button)step(Number(button.dataset.galleryStep));});
  dialog.addEventListener('keydown',event=>{if(event.target.tagName==='VIDEO')return;if(event.key==='ArrowRight'){event.preventDefault();step(1);}if(event.key==='ArrowLeft'){event.preventDefault();step(-1);}});
  show(index);
}
async function applyLocale(next,isCurrent=()=>true){const nextDict=await getLocale(next);if(!isCurrent())return false;locale=next;dict=nextDict;writeStore(localStorage,'matthew-language',next);return true;}
function dismissPortal(expected=portal){if(portal!==expected)return;portalCleanup?.();portalCleanup=null;if(!portal)return;if(portal.contains(transitionCanvas))document.body.append(transitionCanvas);portal.close();portal.remove();portal=null;shell.inert=false;}
async function showPortal({settings=false}={}){
  if(portal||navigating)return;setMenu(false);closeModal();
  restoreFocus=document.activeElement;const dialog=document.createElement('dialog');dialog.className='portal';dialog.setAttribute('aria-label',dict.portal.choose);dialog.innerHTML=`<div class="portal-scene"><div class="portal-brand"><span>Mh.</span>MATTHEW HUA</div><div class="portal-stage"><p class="portal-welcome">${e(dict.portal.welcome)}</p></div></div>`;
  overlayRoot.append(dialog);portal=dialog;shell.inert=true;dialog.showModal();dialog.append(transitionCanvas);
  let exiting=false;
  const cancel=event=>{event.preventDefault();if(exiting)return;if(settings&&!dialog.querySelector('.portal-focus')){dismissPortal();restoreFocus?.isConnected&&restoreFocus.focus();}else showLanguages(false);};
  dialog.addEventListener('cancel',cancel);
  let languageBusy=false,localeRequest=0;
  const stage=()=>dialog.querySelector('.portal-stage');
  const flag=code=>e(new URL('flags/'+code+'.png',import.meta.url).href);
  const languageButton=language=>`<button class="language-option" data-locale="${language.code}" lang="${language.html}" aria-label="${e(language.name)}" title="${e(language.name)}" aria-pressed="${language.code===locale}"><img src="${flag(language.flag)}" alt=""><span>${language.abbr}</span></button>`;
  const languageTiles=()=>languages.filter(language=>language.code!=='de').map(language=>language.code==='gsw'?`<button class="language-option language-family" data-language-family="german" lang="de" aria-label="Deutsch oder Schwiizertüütsch?" title="Deutsch / Schwiizertüütsch" aria-haspopup="dialog" aria-pressed="${locale==='de'||locale==='gsw'}"><span class="split-flag" aria-hidden="true"><img src="${flag('ch')}" alt=""><img src="${flag('de')}" alt=""></span><span>DE</span></button>`:languageButton(language)).join('');
  async function chooseLanguage(next,generation,errorNode){
    if(languageBusy)return;languageBusy=true;
    const isCurrent=()=>portal===dialog&&generation===localeRequest&&!exiting;
    try{
      if(!await applyLocale(next,isCurrent))return;
      if(settings){await leavePortal(()=>{const nextURL=new URL(location.href);if(locale==='en')nextURL.searchParams.delete('lang');else nextURL.searchParams.set('lang',locale);history.replaceState({route},'',nextURL);renderSite({element:selectedElement});});}
      else{renderSite({element:selectedElement});shell.inert=true;showSound();}
    }catch{if(isCurrent()){errorNode.textContent=dict.languageError;errorNode.setAttribute('role','alert');}}
    finally{if(generation===localeRequest)languageBusy=false;}
  }
  function focusPrompt(label,html){
    portalCleanup?.();portalCleanup=null;
    const scene=dialog.querySelector('.portal-scene');scene.inert=true;scene.setAttribute('aria-hidden','true');
    dialog.setAttribute('aria-label',label);
    const canvas=document.createElement('canvas');canvas.className='portal-ambient';canvas.setAttribute('aria-hidden','true');
    const frost=document.createElement('div');frost.className='portal-frost';frost.setAttribute('aria-hidden','true');
    const panel=document.createElement('div');panel.className='portal-focus is-in';panel.innerHTML=html;
    dialog.append(canvas,frost,panel);icons();
    const stopAmbient=mountAmbientSparks(canvas);
    portalCleanup=()=>{stopAmbient();canvas.remove();frost.remove();panel.remove();scene.inert=false;scene.removeAttribute('aria-hidden');};
    return panel;
  }
  function showGerman(){
    const generation=++localeRequest;languageBusy=false;
    const title='Deutsch oder Schwiizertüütsch?';
    const panel=focusPrompt(title,`<div class="portal-focus-content german-focus" lang="de"><h2 class="portal-title">${title}</h2><div class="german-options" role="group" aria-label="${title}">${['de','gsw'].map(code=>languageButton(languages.find(language=>language.code===code))).join('')}</div><p class="portal-choice-error" aria-live="polite"></p><button class="portal-back">${icon('arrow-left')}${e(dict.portal.change)}</button></div>`);
    panel.querySelectorAll('[data-locale]').forEach(button=>button.addEventListener('click',()=>chooseLanguage(button.dataset.locale,generation,panel.querySelector('.portal-choice-error'))));
    panel.querySelector('.portal-back').addEventListener('click',()=>showLanguages(false));
    (panel.querySelector(`[data-locale="${locale}"]`)||panel.querySelector('[data-locale]')).focus({preventScroll:true});
  }
  function showLanguages(auto=true){
    const generation=++localeRequest;languageBusy=false;
    portalCleanup?.();let stopped=!auto||settings,start=performance.now(),elapsed=0,lastSecond=-1,frame=0,alive=true;
    dialog.classList.remove('revealing');dialog.setAttribute('aria-label',dict.portal.choose);
    stage().className='portal-stage is-in';
    stage().innerHTML=`${settings?`<button class="icon-button portal-dismiss" data-portal-close aria-label="${e(dict.common.close)}">${icon('x')}</button>`:''}<h2 class="portal-title">${e(dict.portal.choose)}</h2><p class="portal-sub">${e(dict.portal.hint)}</p><div class="language-grid" role="group" aria-label="${e(dict.portal.choose)}">${languageTiles()}</div><p class="portal-countdown" aria-live="off"></p><div class="countdown-track" aria-hidden="true"><span></span></div><button class="portal-pause">${e(dict.portal.pause)}</button>`;
    icons();
    const countdown=stage().querySelector('.portal-countdown'),track=stage().querySelector('.countdown-track'),pauseButton=stage().querySelector('.portal-pause');
    const stop=()=>{stopped=true;cancelAnimationFrame(frame);countdown.textContent=dict.portal.pause;track.hidden=true;pauseButton.hidden=true;};
    const key=event=>{if(['Tab','ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(event.key))stop();};
    const visibility=()=>{if(document.hidden){elapsed+=performance.now()-start;cancelAnimationFrame(frame);}else if(!stopped&&alive){start=performance.now();frame=requestAnimationFrame(tick);}};
    const tick=now=>{if(!alive||stopped||document.hidden)return;const remaining=Math.max(0,5000-elapsed-(now-start));const second=Math.ceil(remaining/1000);if(second!==lastSecond){countdown.textContent=interpolate(dict.portal.auto,{language:languages.find(l=>l.code===locale).name,seconds:second});lastSecond=second;}track.firstElementChild.style.transform=`scaleX(${remaining/5000})`;if(remaining<=0){showSound();return;}frame=requestAnimationFrame(tick);};
    pauseButton.addEventListener('click',stop);dialog.addEventListener('keydown',key);document.addEventListener('visibilitychange',visibility);
    stage().querySelectorAll('[data-locale]').forEach(button=>button.addEventListener('click',()=>{stop();chooseLanguage(button.dataset.locale,generation,countdown);}));
    stage().querySelector('[data-language-family]').addEventListener('click',()=>{stop();showGerman();});
    stage().querySelector('[data-portal-close]')?.addEventListener('click',()=>{dismissPortal();restoreFocus?.isConnected&&restoreFocus.focus();});
    portalCleanup=()=>{alive=false;cancelAnimationFrame(frame);dialog.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);};
    if(stopped)stop();else frame=requestAnimationFrame(tick);
    stage().querySelector(locale==='gsw'||locale==='de'?'[data-language-family]':`[data-locale="${locale}"]`)?.focus({preventScroll:true});
  }
  async function leavePortal(swap=()=>{}){
    if(exiting||portal!==dialog)return;exiting=true;
    dialog.querySelectorAll('button').forEach(button=>button.disabled=true);
    await effects.transition(()=>{portalCleanup?.();portalCleanup=null;swap();dialog.classList.add('revealing');dialog.querySelector('.portal-scene').style.visibility='hidden';document.documentElement.classList.add('ready');},{long:true});
    dismissPortal(dialog);writeStore(sessionStorage,'matthew-entered','1');
    if(arrival){arrival.start();arrival.dialog.querySelector('.arrival-enter').focus({preventScroll:true});}else document.querySelector('main h1')?.focus({preventScroll:true});
  }
  function showSound(){
    ++localeRequest;languageBusy=false;writeStore(localStorage,'matthew-language',locale);
    const panel=focusPrompt(dict.portal.sound,`<div class="portal-focus-content sound-stage"><div class="sound-symbol">${icon('audio-lines')}</div><h2 class="portal-title">${e(dict.portal.sound)}</h2><p class="portal-sub">${e(dict.portal.soundCopy)}</p><div class="sound-choices"><button class="sound-yes"><span>${e(dict.portal.yes)}<small>${e(dict.portal.recommended)}</small></span>${icon('arrow-right')}</button><button class="sound-no">${e(dict.portal.no)}</button></div><button class="portal-back">${icon('arrow-left')}${e(dict.portal.change)}</button></div>`);
    const enter=enabled=>{setSound(enabled);const player=route==='home'?prepareArrival():null;leavePortal(()=>player?.show());};
    panel.querySelector('.sound-yes').addEventListener('click',()=>enter(true),{once:true});
    panel.querySelector('.sound-no').addEventListener('click',()=>enter(false),{once:true});
    panel.querySelector('.portal-back').addEventListener('click',()=>showLanguages(false));panel.querySelector('.sound-yes').focus({preventScroll:true});
  }
  if(!settings)await effects.opening();
  if(portal===dialog)showLanguages(!settings);
}

document.addEventListener('click',event=>{
  const link=event.target.closest('a[data-route]');
  if(link&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&event.button===0){event.preventDefault();const target=link.dataset.route;navigate(target,{element:Number(link.dataset.element)||0,url:link.href});return;}
  const tab=event.target.closest('[data-element-tab]');if(tab){selectElement(tab.dataset.elementTab);return;}
  const filter=event.target.closest('[data-filter]');if(filter){filterArchive(filter.dataset.filter);return;}
  const card=event.target.closest('[data-media]');if(card){openMedia(Number(card.dataset.media));return;}
  const button=event.target.closest('[data-action]');if(!button)return;
  switch(button.dataset.action){
    case 'menu':setMenu(!document.body.classList.contains('menu-open'));break;
    case 'language':showPortal({settings:true});break;
    case 'sound':setSound(!soundEnabled);if(soundEnabled&&heroVideo&&!heroVideo.src)playHero();break;
    case 'hero-play':if(heroVideo?.paused)playHero();else heroVideo?.pause();break;
    case 'top':window.scrollTo({top:0,behavior:motion.matches?'instant':'smooth'});break;
    case 'maps':openMaps();break;
    case 'privacy':openModal('privacy-dialog',`<h2>${e(dict.footer.privacy)}</h2><p>${e(dict.footer.privacyText)}</p>`);break;
    case 'close-dialog':closeModal();break;
    case 'copy-address':{const address='Rüdigerstrasse 7, Ground Floor, 8045 Zürich, Switzerland';navigator.clipboard?.writeText(address).then(()=>{const span=button.querySelector('span');if(span){span.textContent=dict.contact.copied;setTimeout(()=>{if(span.isConnected)span.textContent=dict.contact.copyAddress;},2000);}}).catch(()=>{});break;}
  }
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&document.body.classList.contains('menu-open')){setMenu(false);document.querySelector('.menu-trigger').focus();}
  if(event.key==='Tab'&&document.body.classList.contains('menu-open')){const all=[...document.querySelectorAll('.site-header a,.site-header button,.mobile-nav a')].filter(el=>el.getBoundingClientRect().width>0);const first=all[0],last=all.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  const tab=event.target.closest('[data-element-tab]');if(!tab)return;
  let next=Number(tab.dataset.elementTab);
  if(['ArrowLeft','ArrowUp'].includes(event.key))next=(next+5)%6;else if(['ArrowRight','ArrowDown'].includes(event.key))next=(next+1)%6;else if(event.key==='Home')next=0;else if(event.key==='End')next=5;else return;
  event.preventDefault();selectElement(next);document.getElementById(`element-tab-${next}`).focus();
});
addEventListener('scroll',()=>document.body.classList.toggle('scrolled',scrollY>35),{passive:true});
addEventListener('popstate',async()=>{const wanted=resolveLocale([],(new URL(location.href)).searchParams.get('lang'),readStore(localStorage,'matthew-language'));if(wanted!==locale)await applyLocale(wanted);navigate(currentRoute(),{push:false});});
addEventListener('resize',()=>{if(innerWidth>900&&document.body.classList.contains('menu-open'))setMenu(false);},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){heroVideo?.pause();arrival?.video.pause();modal?.querySelectorAll('video').forEach(video=>video.pause());}});
motion.addEventListener('change',()=>{cleanupTilt();setupTilt();if(document.getElementById('element-panel'))selectElement(selectedElement);});

async function init(){
  const params=new URL(location.href).searchParams;
  locale=resolveLocale(navigator.languages?.length?navigator.languages:[navigator.language],params.get('lang'),readStore(localStorage,'matthew-language'));
  try{dict=await getLocale(locale);}catch{locale='en';dict=await getLocale('en');}
  route=currentRoute();const legacy=location.hash.slice(1);
  const elementNames=['mindset','hotcold','breath','body','movement','community'];
  selectedElement=Math.max(0,elementNames.indexOf(legacy));renderSite({element:selectedElement});
  if(!readStore(sessionStorage,'matthew-entered'))await showPortal();
}
init().catch(error=>{document.documentElement.classList.add('ready');dismissPortal();console.error('Website enhancement could not load.',error);});
