import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {supportedLocales,resolveLocale,interpolate} from '../static/language.js';
import {media,mediaOrder,languages,routes,renderPage} from '../static/templates.js';
const root=new URL('../',import.meta.url);
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const en=await read('static/locales/en.json');
const paths=(value,path='')=>Object.entries(value).flatMap(([key,item])=>typeof item==='object'?paths(item,`${path}${key}.`):`${path}${key}`);
const baseline=paths(en).sort();
let checks=0;
for(const locale of supportedLocales){
  const dict=await read(`static/locales/${locale}.json`);
  assert.deepEqual(paths(dict).sort(),baseline,`${locale} schema`);
  assert.equal(dict.locale,locale);
  for(const route of routes){
    const html=renderPage(route,dict,x=>'assets/'+x,r=>r+'/');
    assert.ok(!html.includes('undefined'),`${locale}/${route} missing text`);
    assert.ok(html.includes('info@healwell.ch')||route!=='contact');
    if(route==='home')for(const id of ['mindset-host','technology','archive','philosophy','studio'])assert.ok(html.includes(`id="${id}"`),`Homepage retains ${id}`);
    checks++;
  }
  assert.ok(dict.arrival.title.length&&dict.game.next.length);
}
assert.equal(resolveLocale(['de-CH','en']), 'gsw');
assert.equal(resolveLocale(['gsw-CH']), 'gsw');
assert.equal(resolveLocale(['pt-BR']), 'pt');
assert.equal(resolveLocale(['zh-TW']), 'zh');
assert.equal(resolveLocale(['ko-KR','ja-JP']), 'ja');
assert.equal(resolveLocale(['zz']), 'en');
assert.equal(resolveLocale(['de'],'fr','ja'), 'fr');
assert.equal(resolveLocale(['de'],null,'ja'), 'ja');
assert.equal(interpolate('{count} of {total}',{count:2,total:3}), '2 of 3');
assert.deepEqual(mediaOrder.slice(0,2),[5,6]);
assert.equal(new Set(mediaOrder).size,media.length);
assert.ok(languages.every(l=>/^[A-Z]{2}$/.test(l.abbr)));
for(const item of media)for(const key of ['image','film','poster'])if(item[key])await access(new URL('assets/'+item[key],root));
for(const lang of languages)await access(new URL('static/flags/'+lang.flag+'.png',root));
for(const route of routes){
  const html=await readFile(new URL((route==='home'?'':route+'/')+'index.html',root),'utf8');
  assert.ok(html.includes('https://matthewhua.ch/assets/matthew-hua-tony-share-v1.jpg'));
  assert.ok(html.includes('static/identity.css'));
}
console.log(`PASS: ${checks} localized page renders, ten matching dictionaries, homepage attractions, language precedence, media and static metadata.`);
