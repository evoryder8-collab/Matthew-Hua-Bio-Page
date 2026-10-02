// The native link-in-bio page (matthewhua.ch/linkinbio): one portrait-first column with
// the arrival film, the tears moment, every way to reach Matthew, the six elements as a
// spinning wheel and the studio map. Rendered at build time in English and again in the
// visitor's language by linkinbio.js.
import {escapeHTML as e,icon,PORTRAIT,languages} from './templates.js';

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

// Matthew's own brand marks: flat, solid forms in each platform's colour (currentColor),
// with cut-outs in the card's glass colour (.g-cut), no containers.
const glyph=body=>`<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">${body}</svg>`;
const GLYPHS={
  whatsapp:glyph('<path fill="currentColor" d="M12 2.4a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.9-1.3A9.5 9.5 0 1 0 12 2.4z"/><path class="g-cut" d="M9.3 7.3c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3c.2.2 2.2 3.5 5.5 4.8 2.7 1.1 3.3.9 3.9.8.6-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4l-2-1c-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6z"/>'),
  contact:glyph('<rect x="2.5" y="4.6" width="19" height="14.8" rx="3.4" fill="currentColor"/><circle class="g-cut" cx="8.6" cy="10.4" r="2.3"/><path class="g-cut" d="M4.9 16.3c.5-2 2-3.1 3.7-3.1s3.2 1.1 3.7 3.1z"/><rect class="g-cut" x="13.6" y="9" width="5.4" height="1.7" rx=".85"/><rect class="g-cut" x="13.6" y="12.4" width="3.8" height="1.7" rx=".85" opacity=".7"/>'),
  phone:glyph('<path fill="currentColor" d="M6.7 3.1c.5-.4 1.3-.3 1.7.2l2.2 2.8c.4.5.4 1.2 0 1.7l-1.3 1.6a11.8 11.8 0 0 0 5.3 5.3l1.6-1.3c.5-.4 1.2-.4 1.7 0l2.8 2.2c.5.4.6 1.2.2 1.7l-1.3 1.7c-.8 1-2.2 1.5-3.4 1.1C9.9 18.4 5.6 14.1 3.9 7.8c-.3-1.2.1-2.6 1.1-3.4z"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M14.6 3.6a6.3 6.3 0 0 1 5.8 5.8M14.3 6.9a3.2 3.2 0 0 1 2.8 2.8" opacity=".8"/>'),
  mail:glyph('<rect x="2.6" y="5" width="18.8" height="14" rx="3.2" fill="currentColor"/><path class="g-cut-line" d="M4.3 7.4 12 13l7.7-5.6" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  instagram:glyph('<defs><linearGradient id="bio-ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".28" stop-color="#fa7e1e"/><stop offset=".55" stop-color="#d62976"/><stop offset=".8" stop-color="#962fbf"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.4" fill="none" stroke="url(#bio-ig)" stroke-width="2.1"/><circle cx="12" cy="12" r="4" fill="none" stroke="url(#bio-ig)" stroke-width="2.1"/><circle cx="17.2" cy="6.8" r="1.35" fill="url(#bio-ig)"/>'),
  facebook:glyph('<path fill="currentColor" d="M13.7 21.2v-7.6h2.6l.4-3.1h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3H8v3.1h2.6v7.6z"/>'),
  threads:glyph('<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16.5 11.2c-.4-2.6-2.1-3.9-4.4-3.9-2.8 0-4.5 2-4.5 4.7s1.7 4.7 4.4 4.7c2.3 0 3.9-1.2 3.9-3.2 0-1.8-1.4-2.8-3.3-2.8-1.6 0-2.8.9-2.8 2.1 0 1.1.9 1.9 2.2 1.9 2.4 0 3.4-1.9 3.4-4.5"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M20 13.3A8.1 8.1 0 1 1 18.8 7"/>'),
  youtube:glyph('<rect x="2" y="5.4" width="20" height="13.2" rx="4.2" fill="currentColor"/><path class="g-cut" d="M10 9.1v5.8l5-2.9z"/>'),
  linkedin:glyph('<rect x="3.6" y="9.2" width="3.5" height="11" rx=".8" fill="currentColor"/><circle cx="5.35" cy="5.4" r="2.05" fill="currentColor"/><path fill="currentColor" d="M9.8 9.2h3.3v1.6c.5-.9 1.8-1.9 3.6-1.9 3.4 0 4 2.3 4 5.2v6.1h-3.5v-5.4c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8v5.5H9.8z"/>'),
  maps:glyph('<path fill="currentColor" d="M12 2.3a7 7 0 0 0-7 7c0 5.2 7 12.4 7 12.4s7-7.2 7-12.4a7 7 0 0 0-7-7z"/><circle class="g-cut" cx="12" cy="9.3" r="2.7"/>'),
  method:glyph('<path fill="currentColor" d="M11 2.6c.6 4.7 2.9 7 7.6 7.6-4.7.6-7 2.9-7.6 7.6-.6-4.7-2.9-7-7.6-7.6 4.7-.6 7-2.9 7.6-7.6z"/><path fill="currentColor" opacity=".7" d="M18.4 14.6c.3 2.1 1.3 3.1 3.4 3.4-2.1.3-3.1 1.3-3.4 3.4-.3-2.1-1.3-3.1-3.4-3.4 2.1-.3 3.1-1.3 3.4-3.4z"/>'),
  practice:glyph('<path fill="currentColor" d="M12 3.6c2 2.3 3 4.7 3 7.4s-1 5.3-3 7c-2-1.7-3-4.3-3-7s1-5.1 3-7.4z"/><path fill="currentColor" opacity=".72" d="M2.9 9.4c3.2.2 5.8 1.6 7.4 4.3.7 1.1 1.1 2.5 1.7 4.4-2.8 0-5.2-.8-6.9-2.4-1.5-1.6-2.1-3.7-2.2-6.3zm18.2 0c-.1 2.6-.7 4.7-2.2 6.3-1.7 1.6-4.1 2.4-6.9 2.4.6-1.9 1-3.3 1.7-4.4 1.6-2.7 4.2-4.1 7.4-4.3z"/>'),
  about:glyph('<circle cx="12" cy="7.9" r="4.1" fill="currentColor"/><path fill="currentColor" d="M4.3 20.3c.8-4.1 3.9-6.5 7.7-6.5s6.9 2.4 7.7 6.5z"/>')
};
const GO='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8.2 15.8 15.8 8.2M10.2 8h5.8v5.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// A drawn street plan for the Maps card (Zurich-like grid, the river, the route in).
const MAP_ART='<svg viewBox="0 0 200 100" width="200" height="100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="200" height="100" fill="#e3f0e8"/><path d="M-10 74C40 62 72 84 122 64s70-26 96-18" stroke="#b9dcf4" stroke-width="10" fill="none"/><g stroke="#fff" stroke-width="4.2" stroke-linecap="round"><path d="M22-6 60 106"/><path d="M-6 30 210 17"/><path d="M112-6 96 106"/><path d="M152-6l26 112"/><path d="M-6 90 210 81"/></g><g stroke="#fff" stroke-width="1.7" opacity=".95"><path d="M42-6l5 112"/><path d="M-6 51 210 44"/><path d="M132-6l10 112"/><path d="M80-6 70 106"/><path d="M172-6 186 106"/></g><path d="M28 94C66 74 98 68 128 41" stroke="#c81d77" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-dasharray="1 5.5"/><circle cx="128" cy="41" r="11" fill="#34a853" opacity=".18"/><circle cx="128" cy="41" r="4.6" fill="#34a853" stroke="#fff" stroke-width="1.8"/></svg>';

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
  return `<div class="bio-wheel" data-bio-wheel><div class="bio-wheel__halo" aria-hidden="true"></div><div class="bio-wheel__disc">${art}<div class="bio-wheel__labels" role="tablist" aria-label="${e(d.method.title)}">${segments}</div></div><div class="bio-wheel__hub" aria-hidden="true"><span class="mh-monogram">mh</span></div></div>`;
}

// A photographic glass card: the platform-toned photo on the right under frosted glass,
// the platform's mark beside a hairline, a small label, the invitation, and a light that
// travels round the frame.
function card(l,asset){
  const art=l.art==='map'?MAP_ART:`<img src="${e(asset('bio/'+l.art+'.webp'))}" alt="" width="200" height="100" loading="lazy" decoding="async">`;
  return `<a class="bio-link${l.primary?' bio-link--primary':''}" data-tone="${l.tone}" href="${e(l.url)}" ${l.extra||''} data-bio-reveal><span class="bio-link__art" aria-hidden="true">${art}</span><span class="bio-link__glass" aria-hidden="true"></span><span class="bio-link__mark" aria-hidden="true">${GLYPHS[l.tone]}</span><span class="bio-link__copy"><span class="bio-link__eyebrow">${e(l.eyebrow)}</span><strong>${e(l.title)}</strong>${l.detail?`<small>${e(l.detail)}</small>`:''}</span><span class="bio-link__go" aria-hidden="true">${GO}</span></a>`;
}

/**
 * d: the locale dictionary. asset(file), href(route), file(path) and flag(code) build
 * URLs for the current location (build prefix or the client's base URL).
 */
export function renderLinkInBio(d,{asset,href,file,flag}){
  const b=d.bio,current=languages.find(l=>l.code===d.locale)||languages[0];
  const external='target="_blank" rel="noopener noreferrer"';
  const greeting=encodeURIComponent(`${b.welcome} · matthewhua.ch`);
  const phone='+41 76 506 74 88';
  const links=[
    {tone:'contact',art:'contact',eyebrow:'vCard · Matthew Hua',title:b.save,detail:b.saveDetail,url:file('matthew-hua.vcf'),extra:'download="Matthew-Hua.vcf"'},
    {tone:'phone',art:'phone',eyebrow:phone,title:b.call,detail:d.contact.near,url:'tel:+41765067488'},
    {tone:'mail',art:'mail',eyebrow:'info@healwell.ch',title:b.email,detail:d.contact.direct,url:`mailto:info@healwell.ch?subject=${encodeURIComponent(b.subject)}`},
    {tone:'instagram',art:'instagram',eyebrow:'Instagram · @healwell.ch',title:b.instagramDetail,url:SOCIAL.instagram,extra:external},
    {tone:'facebook',art:'facebook',eyebrow:'Facebook',title:b.facebookDetail,url:SOCIAL.facebook,extra:external},
    {tone:'threads',art:'threads',eyebrow:'Threads · @healwell.ch',title:b.threadsDetail,url:SOCIAL.threads,extra:external},
    {tone:'youtube',art:'youtube',eyebrow:'YouTube',title:b.youtubeDetail,url:SOCIAL.youtube,extra:external},
    {tone:'linkedin',art:'linkedin',eyebrow:'LinkedIn · Matthew Hua',title:b.linkedinDetail,url:SOCIAL.linkedin,extra:external},
    {tone:'maps',art:'map',eyebrow:`${d.contact.google} · healwell`,title:b.mapsDetail,detail:'Rüdigerstrasse 7 · 8045 Zürich',url:SOCIAL.maps,extra:external}
  ];
  const site=[
    {tone:'method',art:'method',eyebrow:d.nav.method,title:d.method.title,url:href('method')},
    {tone:'practice',art:'practice',eyebrow:d.nav.practice,title:d.home.practiceTitle,url:href('private-practice')},
    {tone:'about',art:'about',eyebrow:d.nav.about,title:d.home.aboutTitle,url:href('about')}
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
  <h1 id="bio-name">Matthew Hua</h1>
  <p class="bio-role"><span class="bio-role__dot" aria-hidden="true"></span>${e(d.home.eyebrow)}</p>
  <p class="bio-headline">${e(d.home.headline)}</p>
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
<section class="bio-elements" aria-labelledby="bio-elements-title">
  <header class="bio-section-head"><p class="eyebrow">${e(d.method.eyebrow)}</p><h2 id="bio-elements-title">${e(d.method.title)}</h2><p>${e(b.wheelHint)}</p></header>
  ${wheel(d)}
  <div id="element-panel" class="bio-stage" role="tabpanel" aria-labelledby="bio-element-0" tabindex="0" hidden></div>
</section>
<nav class="bio-links" aria-label="${e(b.links)}">
  ${card({tone:'whatsapp',art:'whatsapp',eyebrow:`WhatsApp · ${phone}`,title:b.whatsapp,detail:b.whatsappDetail,url:`https://wa.me/41765067488?text=${greeting}`,extra:external,primary:true},asset)}
  <p class="bio-group-label">${e(b.links)}</p>
  ${links.map(l=>card(l,asset)).join('')}
</nav>
<nav class="bio-links bio-links--site" aria-label="${e(b.explore)}"><p class="bio-group-label">${e(b.explore)}</p>${site.map(l=>card(l,asset)).join('')}</nav>
<section class="bio-studio" aria-labelledby="bio-studio-title" data-bio-reveal>
  <p class="bio-group-label" id="bio-studio-title">${e(b.studio)}</p>
  <div class="map-section"><div class="map-topline"><span class="map-wordmark">healwell <small>ZÜRICH</small></span><span class="coordinates">47.36079° N / 8.52105° E</span></div><div class="map-frame"><div id="studio-map" role="region" aria-label="${e(d.contact.mapLabel)}"></div><span class="map-north" aria-hidden="true">${icon('compass')}N</span><div class="map-fallback" id="map-fallback" hidden><p>Rüdigerstrasse 7 · Zürich</p><a href="${e(SOCIAL.maps)}" ${external}>${e(d.contact.mapFallback)}</a></div><div class="map-destination"><span class="destination-star" aria-hidden="true">${icon('map-pin')}</span><span class="map-address"><span>matthew hua <small>· healwell</small></span><strong>Rüdigerstrasse 7<button class="bio-copy" type="button" data-action="copy-address" aria-label="${e(d.contact.copyAddress)}" title="${e(d.contact.copyAddress)}">${icon('copy')}</button></strong><span>${e(d.contact.floor)} · 8045 Zürich</span></span></div></div><div class="map-footer"><div>${icon('train-front')}<span class="route-swatch" aria-hidden="true"></span><span>${e(d.contact.route)}</span></div><button class="button button-dark drive-button" type="button" data-action="maps">${icon('navigation')}<span>${e(d.contact.drive)}</span></button></div></div>
</section>
</main>
<footer class="bio-footer"><p>${e(b.farewell)}</p><span>${e(d.contact.near)}</span><nav aria-label="${e(b.more)}"><a href="${e(href('home'))}">Matthew Hua</a><a href="${e(href('contact'))}">${e(d.nav.contact)}</a><button type="button" data-action="privacy">${e(d.footer.privacy)}</button></nav><span class="bio-signature">matthew</span></footer>`;
}
