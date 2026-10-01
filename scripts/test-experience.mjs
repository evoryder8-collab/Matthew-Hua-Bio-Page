import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const {chromium,webkit}=playwright.default||playwright;
const base=process.env.TEST_URL||'http://127.0.0.1:4178';
await mkdir('output/qa',{recursive:true});
let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};

for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
    for(const sound of [true,false]){
      const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'de-CH'});
      const page=await context.newPage(),errors=[];
      // WebKit on this host normalizes de-CH to de-DE; exercise the supplied browser list explicitly.
      await page.addInitScript(()=>{Object.defineProperty(navigator,'language',{get:()=> 'de-CH'});Object.defineProperty(navigator,'languages',{get:()=> ['de-CH','en']});});
      page.on('pageerror',error=>errors.push(error.message));
      page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
      await page.goto(base);
      await page.locator('.language-option').first().waitFor();
      check(await page.locator('[data-language-family=german]').getAttribute('aria-pressed')==='true',`${name}: Swiss browser detected`);
      check((await page.locator('.language-option').allTextContents()).every(s=>/^[A-Z]{2}$/.test(s.trim())),`${name}: two-letter language tiles`);
      check(await page.locator('.language-option img').count()===10,`${name}: ten flags`);
      if(sound){
        await page.locator('[data-locale=en]').click();
      }else{
        const start=Date.now();
        await page.locator('.sound-no').waitFor();
        check(Date.now()-start>=4000,`${name}: countdown not premature`);
        check(await page.locator('html').getAttribute('lang')==='gsw-CH',`${name}: automatic language applied`);
      }
      await page.locator(sound?'.sound-yes':'.sound-no').click();
      await page.locator('.portal').waitFor({state:'detached'});
      await page.waitForFunction(()=>{const v=document.querySelector('.arrival-player video');return v&&!v.paused&&v.currentTime>.3&&v.videoWidth>0;});
      const state=await page.locator('.arrival-player').evaluate(el=>({muted:el.querySelector('video').muted,source:el.querySelector('video').currentSrc,ratio:el.querySelector('.arrival-screen').clientHeight/innerHeight,controls:getComputedStyle(el.querySelector('.arrival-controls')).opacity,overflow:el.scrollHeight>el.clientHeight+1,canvas:el.contains(document.querySelector('#transition-canvas'))}));
      check(state.muted===!sound,`${name}: sound consent honoured`);
      check(state.source.includes('european-championship.mp4'),`${name}: correct arrival film`);
      check(Math.abs(state.ratio-.7)<.002,`${name}: 70 percent video`);
      check(state.controls==='0',`${name}: controls initially hidden`);
      check(!state.overflow,`${name}: arrival fits viewport`);
      check(state.canvas,`${name}: transition remains above dialog`);
      await page.screenshot({path:`output/qa/${name}-arrival-${sound?'sound':'muted'}.png`});
      await page.locator('.arrival-reveal').tap();
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('.arrival-controls')).opacity==='1');
      await page.locator('.arrival-play').tap();
      check(await page.locator('.arrival-player video').evaluate(v=>v.paused),`${name}: pause works`);
      await page.locator('.arrival-player [data-action=sound]').tap();
      check(await page.locator('.arrival-player video').evaluate(v=>v.muted)===sound,`${name}: sound toggle works`);
      await page.locator('.arrival-play').tap();
      check(!await page.locator('.arrival-player video').evaluate(v=>v.paused),`${name}: resume works`);
      await page.locator(sound?'.arrival-close':'.arrival-enter').tap();
      await page.locator('.arrival-player').waitFor({state:'detached'});
      check(await page.locator('#transition-canvas').evaluate(c=>c.parentElement===document.body),`${name}: canvas restored after closing`);
      check(!await page.locator('#shell').evaluate(el=>el.inert),`${name}: homepage interactive`);
      await page.locator('.menu-trigger').tap();
      await page.locator('#mobile-nav [data-route=contact]').tap();
      await page.waitForFunction(()=>document.body.dataset.route==='contact');
      await page.locator('[data-action=maps]').tap();
      const links=await page.locator('.map-options a').evaluateAll(els=>els.map(el=>el.href));
      check(links[0].includes('travelmode=driving')&&links[0].includes('dir_action=navigate'),`${name}: Google driving link`);
      check(links[1].includes('maps.apple.com')&&links[1].includes('dirflg=d'),`${name}: Apple driving link`);
      await page.keyboard.press('Escape');
      await page.reload();
      await page.locator('.site-header').waitFor();
      check(await page.locator('.portal').count()===0,`${name}: portal does not repeat within session`);
      check(errors.length===0,`${name}: no page errors ${errors.join('; ')}`);
      console.log(`${name}: ${sound?'opt-in sound/manual English':'silent/auto Swiss German'} arrival passed`);
      await context.close();
    }
    const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.addInitScript(()=>{sessionStorage.setItem('matthew-entered','1');localStorage.setItem('matthew-language','en');});
    await page.goto(base+'/Matthew-Hua-Bio-Page/archive/');
    await page.locator('.archive-card').first().waitFor();
    check((await page.locator('.archive-card h2').allTextContents()).slice(0,2).join('|')==='Champ of the Champs|On the podium, Switzerland',`${name}: gallery photo ordering`);
    for(const index of [0,1,2,3]){
      await page.locator(`[data-media="${index}"]`).click();
      await page.waitForFunction(()=>{const v=document.querySelector('.gallery-view video');return v&&v.videoWidth>0&&v.currentTime>0;});
      check(await page.locator('.gallery-view video').evaluate(v=>v.getBoundingClientRect().height>250&&v.videoWidth===720),`${name}: gallery film ${index} visible and decoded`);
      await page.keyboard.press('Escape');
    }
    await page.locator('.desktop-nav [data-route=about]').click();
    await page.waitForFunction(()=>document.body.dataset.route==='about');
    check(page.url().includes('/Matthew-Hua-Bio-Page/about/'),`${name}: GitHub Pages prefix retained`);
    check(await page.locator('img[src*="about-matthew"]').evaluate(i=>i.complete&&i.naturalWidth>0),`${name}: prefixed media loaded`);
    await page.goBack();
    await page.waitForFunction(()=>document.body.dataset.route==='archive');
    check(true,`${name}: history navigation works`);
    console.log(`${name}: archive, reduced motion, history and repository-prefix checks passed`);
    await context.close();
    const navigationContext=await browser.newContext({viewport:{width:1440,height:1000}});
    const navigationPage=await navigationContext.newPage();
    await navigationPage.addInitScript(()=>{sessionStorage.setItem('matthew-entered','1');localStorage.setItem('matthew-language','en');});
    await navigationPage.goto(base);
    await navigationPage.locator('#mindset-host button').first().waitFor();
    await navigationPage.evaluate(async()=>{
      const {createEffects}=await import(new URL('static/effects.js',location.href));
      const effect=createEffects({transitionCanvas:document.querySelector('#transition-canvas'),cursorCanvas:document.querySelector('#sparkler-canvas')});
      const transition=effect.transition;
      window.navigationSparks={count:0,durations:[]};
      effect.transition=(...args)=>{const start=performance.now();window.navigationSparks.count++;return transition(...args).then(result=>{window.navigationSparks.durations.push(performance.now()-start);return result;});};
    });
    await navigationPage.locator('.desktop-nav [data-route=method]').click();
    await navigationPage.waitForFunction(()=>window.navigationSparks.durations.length===1);
    const duration=await navigationPage.evaluate(()=>window.navigationSparks.durations[0]);
    check(duration>=1950&&duration<3000,`${name}: menu sparkle lasts two seconds (${Math.round(duration)}ms)`);
    await navigationPage.locator('.desktop-nav [data-route=method]').click();
    await navigationPage.goBack();
    await navigationPage.waitForFunction(()=>document.body.dataset.route==='home');
    await navigationPage.goForward();
    await navigationPage.waitForFunction(()=>document.body.dataset.route==='method');
    check(await navigationPage.evaluate(()=>window.navigationSparks.count)===1,`${name}: same page and browser history do not replay sparks`);
    await navigationPage.locator('.wordmark').click();
    await navigationPage.waitForFunction(()=>document.body.dataset.route==='home');
    check(await navigationPage.evaluate(()=>window.navigationSparks.count)===1,`${name}: non-menu navigation does not replay sparks`);
    check(await navigationPage.locator('#transition-canvas').evaluate(canvas=>{const data=canvas.getContext('2d').getImageData(0,0,1,1).data;return data[3]===0;}),`${name}: no black transition layer remains`);
    console.log(`${name}: two-second menu transition and direct Back/Forward passed`);
    await navigationContext.close();
  }finally{await browser.close();}
}
console.log(`PASS: ${checks} experience assertions across Chromium and WebKit.`);
