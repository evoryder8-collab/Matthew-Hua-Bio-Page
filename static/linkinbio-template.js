// The native link-in-bio page (matthewhua.ch/linkinbio): one portrait-first column with
// the arrival film, the tears moment, every way to reach Matthew, the six elements as a
// spinning wheel and the studio map. Rendered at build time in English and again in the
// visitor's language by linkinbio.js.
import {escapeHTML as e,icon,PORTRAIT,languages,whatsappMark} from './templates.js';

export const BIO_FILM='films/european-championship.mp4';
export const BIO_POSTER='European Championship.webp';
export const SOCIAL={
  instagram:'https://www.instagram.com/healwell.ch/',
  facebook:'https://www.facebook.com/798396450196704',
  threads:'https://www.threads.com/@healwell.ch',
  youtube:'https://www.youtube.com/channel/UCv6wQL8NsjxnEzns6yOGzBA',
  linkedin:'https://www.linkedin.com/in/matthewhua/',
  maps:'https://maps.google.com/?cid=1527841935863557630'
};
export const ELEMENT_ICONS=['brain','thermometer-snowflake','wind','hand-heart','person-standing','users'];
// Each element's light on the wheel: [inner, outer] colours of its sector.
export const ELEMENT_TINTS=[['#ff7cc0','#c81d77'],['#8fdcff','#ffb35c'],['#9fe7ff','#ff9fc4'],['#ffb3cf','#ef84be'],['#ffe09a','#e9a93b'],['#9ff3c8','#38c98a']];

// Line marks in the Lucide idiom (the vendored set has no brand icons).
const mark=paths=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const BRANDS={
  instagram:mark('<rect x="3" y="3" width="18" height="18" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none"/>'),
  facebook:mark('<path d="M15.5 3.5h-2.3a4 4 0 0 0-4 4v2.8H7v3.4h2.2v6.8h3.5v-6.8h2.6l.5-3.4h-3.1V8a1 1 0 0 1 1-1h1.8z"/>'),
  threads:mark('<path d="M16.6 11.1c-.4-2.6-2.1-3.9-4.5-3.9-2.9 0-4.6 2.1-4.6 4.9 0 2.9 1.7 4.9 4.6 4.9 2.4 0 4-1.3 4-3.3 0-1.9-1.5-2.9-3.4-2.9-1.7 0-2.9.9-2.9 2.2 0 1.2 1 2 2.3 2 2.5 0 3.6-2 3.6-4.6"/><path d="M20 12c0 4.6-3.2 8.5-8 8.5S4 16.8 4 12s3.2-8.5 8-8.5c3.6 0 6.3 2 7.4 5.2"/>'),
  youtube:mark('<path d="M2.6 16.8a23 23 0 0 1 0-9.6 2 2 0 0 1 1.5-1.5 48 48 0 0 1 15.8 0 2 2 0 0 1 1.5 1.5 23 23 0 0 1 0 9.6 2 2 0 0 1-1.5 1.5 48 48 0 0 1-15.8 0 2 2 0 0 1-1.5-1.5"/><path d="m10 15 5-3-5-3z"/>'),
  linkedin:mark('<rect x="3" y="3" width="18" height="18" rx="3.5"/><path d="M8 10.5v6M8 7.6v.1M11.6 16.5v-3.4a2.4 2.4 0 0 1 4.8 0v3.4M11.6 10.5v6"/>')
};

const polar=(r,deg)=>{const a=deg*Math.PI/180;return [(r*Math.sin(a)).toFixed(2),(-r*Math.cos(a)).toFixed(2)];};
// One annular sector of the wheel, centred on `centre` degrees (0 = top, clockwise).
function sector(centre,inner=31,outer=95,gap=0){
  const a=centre-30+gap,b=centre+30-gap;
  const [x1,y1]=polar(outer,a),[x2,y2]=polar(outer,b),[x3,y3]=polar(inner,b+gap*1.6),[x4,y4]=polar(inner,a-gap*1.6);
  return `M${x1} ${y1}A${outer} ${outer} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${inner} ${inner} 0 0 0 ${x4} ${y4}Z`;
}
// Fixed star dust (a deterministic scatter, so build and client markup match).
function dust(count=46){
  let seed=7;const rand=()=>((seed=(seed*16807)%2147483647)/2147483647);
  return Array.from({length:count},()=>{const [x,y]=polar(36+rand()*56,rand()*360);return `<circle cx="${x}" cy="${y}" r="${(.25+rand()*.7).toFixed(2)}" style="--tw:${(rand()*4).toFixed(2)}s"/>`;}).join('');
}

function wheel(d){
  const art=`<svg class="bio-wheel__art" viewBox="-100 -100 200 200" aria-hidden="true"><defs>${ELEMENT_TINTS.map(([a,b],i)=>{
    const [sx,sy]=polar(95,i*60-30),[ex,ey]=polar(95,i*60+30);
    return `<radialGradient id="wheel-glow-${i}" cx="0" cy="0" r="95" gradientUnits="userSpaceOnUse"><stop offset=".3" stop-color="#140d1b"/><stop offset=".62" stop-color="${b}" stop-opacity=".34"/><stop offset="1" stop-color="${a}" stop-opacity=".78"/></radialGradient><radialGradient id="wheel-flare-${i}" cx="0" cy="0" r="95" gradientUnits="userSpaceOnUse"><stop offset=".32" stop-color="${a}" stop-opacity="0"/><stop offset=".7" stop-color="${a}" stop-opacity=".45"/><stop offset="1" stop-color="#fff5fb" stop-opacity=".85"/></radialGradient><linearGradient id="wheel-edge-${i}" x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  }).join('')}<linearGradient id="wheel-rim" x1="-1" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#ffb4dc"/><stop offset=".5" stop-color="#fff5fb"/><stop offset="1" stop-color="#8fe9bd"/></linearGradient></defs><circle r="99" fill="#120c18"/><circle r="98.2" fill="none" stroke="url(#wheel-rim)" stroke-width="1.2" opacity=".85"/>${ELEMENT_TINTS.map((t,i)=>`<g class="bio-wheel__sector" data-sector="${i}"><path class="bio-wheel__fill" d="${sector(i*60)}" fill="url(#wheel-glow-${i})"/><path class="bio-wheel__flare" d="${sector(i*60)}" fill="url(#wheel-flare-${i})"/><path class="bio-wheel__edge" d="${sector(i*60,94,97,1.4)}" fill="url(#wheel-edge-${i})"/></g>`).join('')}<g class="bio-wheel__seams" stroke="#120c18" stroke-width="1.6">${ELEMENT_TINTS.map((t,i)=>{const [x1,y1]=polar(30,i*60+30),[x2,y2]=polar(97.5,i*60+30);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;}).join('')}</g><g class="bio-wheel__dust" fill="#fff5fb">${dust()}</g><circle r="30" fill="#120c18" stroke="url(#wheel-rim)" stroke-width=".7" opacity=".95"/></svg>`;
  const segments=d.method.elements.map((x,i)=>`<button class="bio-wheel__seg" type="button" role="tab" id="bio-element-${i}" aria-selected="false" aria-controls="element-panel" tabindex="${i?-1:0}" data-element="${i}" style="--a:${i*60}deg;--tint:${ELEMENT_TINTS[i][0]}"><span class="bio-wheel__label">${icon(ELEMENT_ICONS[i])}<span>${e(x.name)}</span></span></button>`).join('');
  return `<div class="bio-wheel" data-bio-wheel><span class="bio-wheel__pointer" aria-hidden="true"></span><div class="bio-wheel__halo" aria-hidden="true"></div><div class="bio-wheel__disc">${art}<div class="bio-wheel__labels" role="tablist" aria-label="${e(d.method.title)}">${segments}</div></div><div class="bio-wheel__hub" aria-hidden="true"><span class="mh-monogram">mh</span></div></div>`;
}

function card({tone,title,detail,url,symbol,extra='',primary=false}){
  return `<a class="bio-link${primary?' bio-link--primary':''}" data-tone="${tone}" href="${e(url)}" ${extra} data-bio-reveal><span class="bio-link__sheen" aria-hidden="true"></span><span class="bio-link__icon">${symbol}</span><span class="bio-link__copy"><strong>${e(title)}</strong><small>${e(detail)}</small></span><span class="bio-link__arrow">${icon('arrow-up-right')}</span></a>`;
}

/**
 * d: the locale dictionary. asset(file), href(route), file(path) and flag(code) build
 * URLs for the current location (build prefix or the client's base URL).
 */
export function renderLinkInBio(d,{asset,href,file,flag}){
  const b=d.bio,current=languages.find(l=>l.code===d.locale)||languages[0];
  const external='target="_blank" rel="noopener noreferrer"';
  const greeting=encodeURIComponent(`${b.welcome} · matthewhua.ch`);
  const links=[
    {tone:'contact',title:b.save,detail:b.saveDetail,url:file('matthew-hua.vcf'),symbol:icon('user-round-plus'),extra:'download="Matthew-Hua.vcf"'},
    {tone:'phone',title:b.call,detail:'+41 76 506 74 88',url:'tel:+41765067488',symbol:icon('phone')},
    {tone:'mail',title:b.email,detail:'info@healwell.ch',url:`mailto:info@healwell.ch?subject=${encodeURIComponent(b.subject)}`,symbol:icon('mail')},
    {tone:'instagram',title:'Instagram',detail:b.instagramDetail,url:SOCIAL.instagram,symbol:BRANDS.instagram,extra:external},
    {tone:'facebook',title:'Facebook',detail:b.facebookDetail,url:SOCIAL.facebook,symbol:BRANDS.facebook,extra:external},
    {tone:'threads',title:'Threads',detail:b.threadsDetail,url:SOCIAL.threads,symbol:BRANDS.threads,extra:external},
    {tone:'youtube',title:'YouTube',detail:b.youtubeDetail,url:SOCIAL.youtube,symbol:BRANDS.youtube,extra:external},
    {tone:'linkedin',title:'LinkedIn',detail:b.linkedinDetail,url:SOCIAL.linkedin,symbol:BRANDS.linkedin,extra:external},
    {tone:'maps',title:d.contact.google,detail:b.mapsDetail,url:SOCIAL.maps,symbol:icon('map-pinned'),extra:external}
  ];
  const site=[
    {tone:'method',title:d.nav.method,detail:d.method.title,url:href('method'),symbol:icon('sparkles')},
    {tone:'practice',title:d.nav.practice,detail:d.home.practiceTitle,url:href('private-practice'),symbol:icon('leaf')},
    {tone:'about',title:d.nav.about,detail:d.home.aboutTitle,url:href('about'),symbol:icon('user-round')}
  ];
  const honours=[d.home.awardRome,d.home.awardGermany,d.home.awardSwiss,d.home.awardJury];
  return `<header class="bio-bar">
  <a class="bio-mark" href="${e(href('home'))}" aria-label="Matthew Hua, ${e(d.nav.home)}"><span class="mh-monogram" aria-hidden="true">mh</span></a>
  <div class="bio-bar__actions"><a class="bio-website" href="${e(href('home'))}">${e(b.website)}${icon('arrow-up-right')}</a><div class="bio-language" data-bio-language><button class="bio-language__trigger" type="button" aria-expanded="false" aria-controls="bio-languages" aria-label="${e(d.nav.language)} · ${e(current.name)}"><img src="${e(flag(current.flag))}" alt="" width="22" height="22" decoding="async"><span>${e(current.abbr)}</span>${icon('chevron-down')}</button><nav class="bio-language__menu" id="bio-languages" aria-label="${e(d.nav.language)}" hidden>${languages.map(l=>`<a href="?lang=${l.code}" lang="${l.html}" hreflang="${l.html}" data-lang="${l.code}" ${l.code===current.code?'aria-current="true"':''}><img src="${e(flag(l.flag))}" alt="" width="22" height="22" loading="lazy" decoding="async"><span>${e(l.name)}</span><i aria-hidden="true"></i></a>`).join('')}</nav></div><button class="icon-button bio-sound" type="button" data-action="sound" aria-pressed="false" aria-label="${e(d.nav.soundOff)}" title="${e(d.nav.soundOff)}">${icon('volume-x')}</button></div>
</header>
<main id="main">
<section class="bio-profile" aria-labelledby="bio-name">
  <figure class="bio-portrait"><img class="bio-portrait__aura" src="${e(asset(PORTRAIT))}" alt="" aria-hidden="true" decoding="async"><img class="bio-portrait__main" src="${e(asset(PORTRAIT))}" alt="${e(d.common.imageAlt)}" decoding="async" fetchpriority="high"></figure>
  <p class="eyebrow">${e(b.welcome)}</p>
  <h1 id="bio-name"><span>Matthew Hua</span><em>${e(d.home.signature)}</em></h1>
  <p class="bio-role"><span class="bio-role__dot" aria-hidden="true"></span>${e(d.home.eyebrow)}</p>
  <ul class="bio-honours" aria-label="${e(d.home.awardsLabel)}">${honours.map(x=>`<li>${icon('star')}${e(x)}</li>`).join('')}</ul>
</section>
<section class="bio-film" aria-label="${e(d.arrival.eyebrow)}">
  <div class="bio-film__frame" data-bio-film>
    <span class="bio-film__glow" aria-hidden="true"></span>
    <div class="bio-film__screen">
      <video playsinline webkit-playsinline preload="auto" poster="${e(asset(BIO_POSTER))}" src="${e(asset(BIO_FILM))}" aria-label="${e(d.arrival.eyebrow)} · ${e(d.arrival.title)}"></video>
      <button class="bio-film__cover" type="button" data-action="film-play" aria-label="${e(d.common.play)}" hidden><span>${icon('play')}</span></button>
      <button class="bio-film__unmute" type="button" data-action="film-unmute" hidden>${icon('volume-2')}<span>${e(b.tapSound)}</span></button>
      <div class="bio-film__bar"><button class="bio-film__toggle" type="button" data-action="film-toggle" aria-label="${e(d.common.play)}">${icon('play')}</button><span class="bio-film__track" aria-hidden="true"><i></i></span><span class="bio-film__time" aria-hidden="true">00:28</span><button class="bio-film__sound" type="button" data-action="sound" aria-pressed="false" aria-label="${e(d.nav.soundOff)}" title="${e(d.nav.soundOff)}">${icon('volume-x')}</button><button class="bio-film__expand" type="button" data-action="film-fullscreen" aria-label="${e(b.fullscreen)}" title="${e(b.fullscreen)}">${icon('maximize-2')}</button></div>
    </div>
  </div>
  <p class="bio-film__caption"><span>${e(d.arrival.eyebrow)}</span><span>Rome · 2024</span></p>
</section>
<section class="tears-moment bio-tears" aria-labelledby="tears-title"><div class="tears-layout"><p class="eyebrow">${e(d.emotion.eyebrow)}</p><h2 class="tears-title" id="tears-title">${e(d.emotion.title)}</h2><p class="tears-copy">${e(d.emotion.copy)}</p><div class="tears-footer"><span class="tears-note">${e(d.emotion.note)}</span></div></div><canvas class="tears-canvas" aria-hidden="true"></canvas></section>
<nav class="bio-links" aria-label="${e(b.links)}">
  ${card({tone:'whatsapp',title:b.whatsapp,detail:b.whatsappDetail,url:`https://wa.me/41765067488?text=${greeting}`,symbol:whatsappMark,extra:external,primary:true})}
  <p class="bio-group-label">${e(b.links)}</p>
  ${links.map(card).join('')}
</nav>
<section class="bio-elements" aria-labelledby="bio-elements-title">
  <header class="bio-section-head"><p class="eyebrow">${e(d.method.eyebrow)}</p><h2 id="bio-elements-title">${e(d.method.title)}</h2><p>${e(b.wheelHint)}</p></header>
  ${wheel(d)}
  <div id="element-panel" class="bio-stage" role="tabpanel" aria-labelledby="bio-element-0" tabindex="0" hidden></div>
</section>
<nav class="bio-links bio-links--site" aria-label="${e(b.explore)}"><p class="bio-group-label">${e(b.explore)}</p>${site.map(card).join('')}</nav>
<section class="bio-studio" aria-labelledby="bio-studio-title" data-bio-reveal>
  <p class="bio-group-label" id="bio-studio-title">${e(b.studio)}</p>
  <div class="map-section"><div class="map-topline"><span class="map-wordmark">healwell <small>ZÜRICH</small></span><span class="coordinates">47.36079° N / 8.52105° E</span></div><div class="map-frame"><div id="studio-map" role="region" aria-label="${e(d.contact.mapLabel)}"></div><span class="map-north" aria-hidden="true">${icon('compass')}N</span><div class="map-fallback" id="map-fallback" hidden><p>Rüdigerstrasse 7 · Zürich</p><a href="${e(SOCIAL.maps)}" ${external}>${e(d.contact.mapFallback)}</a></div><div class="map-destination"><span class="destination-star" aria-hidden="true">${icon('map-pin')}</span><span class="map-address"><span>matthew hua <small>· healwell</small></span><strong>Rüdigerstrasse 7</strong><span>${e(d.contact.floor)} · 8045 Zürich</span></span></div></div><div class="map-footer"><div>${icon('train-front')}<span class="route-swatch" aria-hidden="true"></span><span>${e(d.contact.route)}</span></div><button class="button button-dark drive-button" type="button" data-action="maps">${icon('navigation')}<span>${e(d.contact.drive)}</span></button></div></div>
</section>
</main>
<footer class="bio-footer"><p>${e(b.farewell)}</p><span>${e(d.contact.near)}</span><nav aria-label="${e(b.more)}"><a href="${e(href('home'))}">Matthew Hua</a><a href="${e(href('contact'))}">${e(d.nav.contact)}</a><button type="button" data-action="privacy">${e(d.footer.privacy)}</button></nav><span class="bio-signature">matthew</span></footer>`;
}
