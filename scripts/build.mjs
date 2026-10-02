import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {renderPage,renderHeader,renderFooter,routes,escapeHTML as e} from '../static/templates.js';
const en=JSON.parse(await readFile(new URL('../static/locales/en.json',import.meta.url),'utf8'));
const root=new URL('../',import.meta.url);
for(const route of routes){
  const prefix=route==='home'?'./':'../';
  const asset=file=>prefix+'assets/'+file.split('/').map(encodeURIComponent).join('/');
  const href=r=>prefix+(r==='home'?'':r+'/');
  const flag=code=>prefix+'static/flags/'+code+'.png';
  const canonical='https://matthewhua.ch/'+(route==='home'?'':route+'/');
  const title=route==='home'?en.seo.title:`${en.nav[route==='private-practice'?'practice':route]} | Matthew Hua | Zurich`;
  const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="color-scheme" content="light"><title>${e(title)}</title>
<meta name="description" content="${e(en.seo.description)}"><meta name="author" content="Matthew Hua"><link rel="canonical" href="${canonical}"><meta name="theme-color" content="#f4f7f3">
<meta property="og:type" content="website"><meta property="og:site_name" content="Matthew Hua"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(en.seo.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://matthewhua.ch/assets/matthew-hua-tony-share-v1.jpg"><meta property="og:image:secure_url" content="https://matthewhua.ch/assets/matthew-hua-tony-share-v1.jpg"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="634"><meta property="og:image:alt" content="Matthew Hua with Tony Robbins. Transformation starts in the body."><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(en.seo.description)}"><meta name="twitter:image" content="https://matthewhua.ch/assets/matthew-hua-tony-share-v1.jpg">
<link rel="icon" href="${prefix}static/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${prefix}static/vendor/leaflet.css"><link rel="stylesheet" href="${prefix}static/style.css"><link rel="stylesheet" href="${prefix}static/mindset.css"><link rel="stylesheet" href="${prefix}static/technology.css"><link rel="stylesheet" href="${prefix}static/element-visuals.css"><link rel="stylesheet" href="${prefix}static/identity.css"><link rel="stylesheet" href="${prefix}static/refinements.css">
<script>document.documentElement.classList.add('js');setTimeout(function(){document.documentElement.classList.add('ready')},5000);</script>
<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Person',name:'Matthew Hua',url:'https://matthewhua.ch/',jobTitle:'Transformational Therapist',email:'info@healwell.ch',telephone:'+41765067488',address:{'@type':'PostalAddress',streetAddress:'Rüdigerstrasse 7/Ground Floor',postalCode:'8045',addressLocality:'Zürich',addressCountry:'CH'},worksFor:{'@type':'Organization',name:'healwell'}})}</script></head>
<body data-route="${route}"><div class="bg-aurora" aria-hidden="true"><span class="blob g1"></span><span class="blob p1"></span><span class="blob g2"></span><span class="blob p2"></span><span class="blob g3"></span><span class="blob p3"></span></div><div id="shell">${renderHeader(en,href,route,flag)}<main id="main">${renderPage(route,en,asset,href)}</main>${renderFooter(en,href)}</div><div id="overlay-root"></div><canvas id="transition-canvas" aria-hidden="true"></canvas><canvas id="sparkler-canvas" aria-hidden="true"></canvas><script defer src="${prefix}static/vendor/lucide.min.js"></script><script defer src="${prefix}static/vendor/leaflet.js"></script><script type="module" src="${prefix}static/app.js"></script></body></html>`;
  const dir=route==='home'?root:new URL(route+'/',root); await mkdir(dir,{recursive:true});await writeFile(new URL('index.html',dir),html);
}
console.log('Built six static pages with accessible English content and shared multilingual enhancement.');
