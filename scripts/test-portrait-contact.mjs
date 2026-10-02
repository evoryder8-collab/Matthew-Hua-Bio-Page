import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const imported=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const {chromium,webkit}=imported.default||imported;
const base=process.env.TEST_URL||'http://127.0.0.1:4178';
await mkdir('output/qa',{recursive:true});
let assertions=0;
const check=(condition,message)=>{assert.ok(condition,message);assertions++;};

for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch();
  try{
    for(const scenario of [
      {width:390,entered:true,reduced:false},
      {width:1440,entered:false,reduced:false},
      {width:390,entered:false,reduced:true},
    ]){
      const {width,entered,reduced}=scenario;
      const label=`${name}/${width}/${entered?'returning':'fresh'}/${reduced?'reduced':'motion'}`;
      const context=await browser.newContext({viewport:{width,height:width===390?844:1050},hasTouch:width===390,isMobile:width===390,reducedMotion:reduced?'reduce':'no-preference'});
      try{
        const page=await context.newPage(),errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.addInitScript(entered=>{
          if(entered)sessionStorage.setItem('matthew-entered','1');
          localStorage.setItem('matthew-language','en');
        },entered);
        await page.goto(base);
        if(entered){
          await page.locator('#hero.portrait-alive').waitFor();
          check(!await page.locator('#hero').evaluate(hero=>hero.classList.contains('portrait-arrived')),`${label}: direct homepage does not consume the reveal`);
          await page.locator('.language-trigger').click();
        }
        await page.locator('[data-locale=en]').click();
        await page.locator('.sound-no').click();
        await page.locator('.portal').waitFor({state:'detached'});
        await page.locator('.arrival-player[open]').waitFor();
        check(!await page.locator('#hero').evaluate(hero=>hero.classList.contains('portrait-arrived')),`${label}: shine does not play behind the film`);
        check(await page.locator('.heritage-figure img:not([aria-hidden])').evaluate(img=>img.complete&&img.naturalWidth>0),`${label}: real portrait loaded`);
        if(entered){
          await page.locator('.arrival-reveal').click();
          await page.locator('.arrival-close').click();
        }else await page.locator('.arrival-enter').click();
        check(await page.locator('#hero').evaluate(hero=>hero.classList.contains('portrait-alive')&&hero.classList.contains('portrait-arrived')),`${label}: dismissing film reveals portrait`);
        const state=await page.locator('.heritage-figure').evaluate(figure=>{
          const gleam=figure.querySelector('.portrait-gleam'),aura=figure.querySelector('.portrait-aura');
          return {float:getComputedStyle(figure).animationName,gleam:getComputedStyle(gleam).animationName,iterations:getComputedStyle(gleam).animationIterationCount,aura:getComputedStyle(aura).opacity,display:getComputedStyle(gleam).display,pointerEvents:getComputedStyle(figure).pointerEvents};
        });
        check(state.pointerEvents==='none'&&Number(state.aura)>0,`${label}: decorative glow cannot block interaction`);
        if(reduced){
          check(state.float==='none'&&state.gleam==='none'&&state.display==='none',`${label}: reduced motion keeps portrait static`);
        }else{
          check(state.float==='portrait-float'&&state.gleam==='portrait-gleam'&&state.iterations==='1',`${label}: float continues, diagonal shine runs once`);
          const first=await page.locator('.heritage-figure').boundingBox();
          await page.waitForTimeout(850);
          const moved=await page.locator('.heritage-figure').boundingBox();
          check(Math.abs(first.y-moved.y)>.2,`${label}: portrait visibly moves without moving the text layout`);
          await page.screenshot({path:`output/qa/portrait-${name}-${width}.png`});
          await page.waitForFunction(()=>getComputedStyle(document.querySelector('.portrait-gleam')).opacity==='0'&&document.querySelector('.portrait-gleam').getAnimations().every(animation=>animation.playState==='finished'));
        }
        await page.locator('.language-trigger').click();
        await page.locator('[data-locale=en]').click();
        await page.locator('.sound-no').click();
        await page.locator('.portal').waitFor({state:'detached'});
        await page.locator('.arrival-enter').click();
        check(!await page.locator('#hero').evaluate(hero=>hero.classList.contains('portrait-arrived')),`${label}: replaying entrance does not repeat one-time shine`);
        check(errors.length===0,`${label}: no runtime errors: ${errors.join('; ')}`);
        console.log(`PASS ${label}`);
      }finally{await context.close();}
    }
    for(const width of [320,390,1440]){
      const context=await browser.newContext({viewport:{width,height:width<600?844:1050},hasTouch:width<600,isMobile:width<600});
      try{
        const page=await context.newPage(),errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.addInitScript(()=>{sessionStorage.setItem('matthew-entered','1');localStorage.setItem('matthew-language','en');});
        await page.goto(`${base}/contact/${width===320?'?lang=de':''}`);
        await page.locator('.contact-channels').scrollIntoViewIfNeeded();
        const rows=await page.locator('.contact-channels>a').evaluateAll(links=>links.map(link=>{
          const symbol=link.querySelector('.contact-symbol'),svg=symbol.querySelector('svg'),copy=link.querySelector('.contact-channel-copy'),arrow=link.querySelector(':scope>svg');
          const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
          const r=link.getBoundingClientRect(),target=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
          return {link:rect(link),symbol:rect(symbol),svg:rect(svg),copy:rect(copy),arrow:rect(arrow),href:link.href,clickable:link.contains(target)};
        }));
        check(rows.length===3,`${name}/${width}: three contact channels`);
        for(const row of rows){
          const {symbol,svg,copy,arrow,link}=row;
          check(Math.abs(symbol.x+symbol.width/2-svg.x-svg.width/2)<1&&Math.abs(symbol.y+symbol.height/2-svg.y-svg.height/2)<1,`${name}/${width}: ${row.href} icon centred in its badge`);
          check(copy.x>=symbol.right&&arrow.x>=copy.right&&arrow.right<=link.right+1,`${name}/${width}: ${row.href} remains a three-column row`);
          check(Math.abs(symbol.y+symbol.height/2-copy.y-copy.height/2)<1,`${name}/${width}: ${row.href} label and icon vertically aligned`);
          check(row.clickable,`${name}/${width}: ${row.href} remains hit-testable`);
        }
        check(rows.some(row=>row.href==='mailto:info@healwell.ch')&&rows.some(row=>row.href==='tel:+41765067488')&&rows.some(row=>row.href==='https://wa.me/41765067488'),`${name}/${width}: official contact destinations`);
        check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}/${width}: no horizontal overflow`);
        check(errors.length===0,`${name}/${width}: no contact runtime errors: ${errors.join('; ')}`);
        await page.screenshot({path:`output/qa/contact-icons-${name}-${width}.png`});
        console.log(`PASS ${name}/contact/${width}`);
      }finally{await context.close();}
    }
  }finally{await browser.close();}
}
console.log(`PASS: ${assertions} portrait and contact assertions across Chromium and WebKit.`);
