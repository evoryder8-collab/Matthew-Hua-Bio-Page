import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const imported=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const {chromium,webkit}=imported.default||imported;
const base=process.env.TEST_URL||'http://127.0.0.1:4178';
await mkdir('output/qa',{recursive:true});
const failures=[];
let assertions=0;
const check=(condition,message)=>{assert.ok(condition,message);assertions++;};

for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch();
  try{
    for(const scenario of [
      {route:'home',width:390,locale:'en',sound:true},
      {route:'home',width:1440,locale:'gsw',sound:false},
      {route:'contact',width:390,locale:'fr',sound:true},
      {route:'contact',width:1440,locale:'es',sound:false},
    ]){
      const {route,width,locale,sound}=scenario;
      const label=`${name}/${route}/${width}/${locale}`;
      const context=await browser.newContext({viewport:{width,height:width===390?844:1000},isMobile:width===390,hasTouch:width===390});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      try{
        await page.addInitScript(()=>{sessionStorage.setItem('matthew-entered','1');localStorage.setItem('matthew-language','en');});
        await page.goto(base+(route==='home'?'/':'/contact/'));
        await page.locator('.language-trigger').click();
        await page.locator('.language-grid').waitFor();
        if(locale==='gsw')await page.locator('[data-language-family=german]').click();
        // The two dialect flags float on purpose; force skips Playwright's still-element wait.
        await page.locator(`[data-locale=${locale}]`).click({force:locale==='gsw'});
        await page.locator('.sound-yes').waitFor({timeout:2000}).catch(()=>{});
        check(await page.locator('.sound-yes').count()===1,`${label}: selecting language must still ask for sound`);
        check(await page.locator('.sound-no').count()===1,`${label}: declining sound remains available`);
        check(await page.locator('.portal[open]').count()===1,`${label}: homepage is not revealed before sound consent`);
        check(await page.locator('#shell').evaluate(el=>el.inert),`${label}: underlying page remains isolated`);
        if(route==='contact'){
          await page.locator('.portal-back').click();
          check(await page.locator('.sound-yes').count()===0,`${label}: Back returns to language choices`);
          await page.keyboard.press('Escape');
          check(await page.locator('.portal').count()===0&&!await page.locator('#shell').evaluate(el=>el.inert),`${label}: Escape dismisses the reopened selector safely`);
          check(await page.locator('.language-trigger').evaluate(button=>button===document.activeElement),`${label}: cancellation restores focus to the current language button`);
          await page.locator('.language-trigger').click();
          await page.locator(`[data-locale=${locale}]`).click();
          await page.locator('.sound-yes').waitFor();
        }
        const started=Date.now();
        await page.locator(sound?'.sound-yes':'.sound-no').click();
        await page.waitForFunction(()=>{
          const canvas=document.querySelector('#transition-canvas');
          return canvas.getContext('2d').getImageData(5,5,1,1).data[3]>230;
        },null,{timeout:1500});
        check(await page.locator('.portal[open]').count()===1,`${label}: sparkle curtain plays before landing`);
        if(route==='home')check(await page.locator('.arrival-player video').evaluate(video=>video.paused),`${label}: film waits for the full transition`);
        await page.locator('.portal').waitFor({state:'detached'});
        check(Date.now()-started>=1900,`${label}: intentional transition lasts two seconds`);
        check(await page.locator('body').getAttribute('data-route')===route,`${label}: language choice preserves current page`);
        check(await page.locator('html').getAttribute('lang')===(locale==='gsw'?'gsw-CH':locale),`${label}: selected language is applied`);
        check(new URL(page.url()).searchParams.get('lang')===(locale==='en'?null:locale),`${label}: language URL stays in sync`);
        if(route==='home'){
          await page.waitForFunction(()=>{const video=document.querySelector('.arrival-player video');return video&&!video.paused&&video.currentTime>.3&&video.videoWidth>0;});
          const film=await page.locator('.arrival-player video').evaluate(video=>({source:video.currentSrc,muted:video.muted}));
          check(film.source.includes('european-championship.mp4')&&film.muted===!sound,`${label}: correct introductory film respects consent`);
          await page.screenshot({path:`output/qa/returning-portal-${name}-${width}.png`});
          await page.locator('.arrival-enter').click();
          await page.locator('.arrival-player').waitFor({state:'detached'});
        }else{
          check(await page.locator('.arrival-player').count()===0,`${label}: changing a subpage language does not force a homepage film`);
          check(await page.locator('.sound-trigger').getAttribute('aria-pressed')===String(sound),`${label}: sound selection is retained`);
        }
        check(!await page.locator('#shell').evaluate(el=>el.inert),`${label}: page becomes interactive after arrival`);
        check(await page.locator('#transition-canvas').evaluate(canvas=>canvas.parentElement===document.body),`${label}: transition canvas is restored`);
        check(errors.length===0,`${label}: no runtime errors ${errors.join('; ')}`);
        console.log(`PASS ${label}`);
      }catch(error){failures.push(error.message);console.error(`FAIL ${label}: ${error.message}`);}
      finally{await context.close();}
    }
  }finally{await browser.close();}
}
assert.equal(failures.length,0,failures.join('\n'));
console.log(`PASS: ${assertions} returning-language workflow assertions across Chromium and WebKit.`);
