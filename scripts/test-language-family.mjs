import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const imported=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const {chromium,webkit}=imported.default||imported;
const base=process.env.TEST_URL||'http://127.0.0.1:4178';
await mkdir('output/qa',{recursive:true});
let checks=0;
const check=(value,label)=>{assert.ok(value,label);checks++;};
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
    for(const choice of ['de','gsw']){
      const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'de-CH'});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(()=>{Object.defineProperty(navigator,'language',{get:()=> 'de-CH'});Object.defineProperty(navigator,'languages',{get:()=> ['de-CH']});});
      await page.goto(base);
      await page.locator('.language-grid').waitFor();
      check(await page.locator('[data-language-family="german"]').count()===1,`${name}: German choices share one tile`);
      check(await page.locator('.language-grid > button').count()===9,`${name}: nine main tiles retain ten languages`);
      check(await page.locator('[data-language-family="german"] img').count()===2,`${name}: split tile includes both flag assets`);
      check(await page.locator('[data-language-family="german"]').getAttribute('aria-pressed')==='true',`${name}: detected Swiss language highlights shared tile`);
      await page.locator('[data-language-family="german"]').tap();
      await page.locator('.german-options').waitFor();
      check(await page.locator('.portal-focus h2').textContent()==='Deutsch oder Schwiizertüütsch?',`${name}: native German prompt`);
      check(await page.locator('.german-options [data-locale]').count()===2,`${name}: two distinct German choices`);
      check(await page.locator('.portal-scene').evaluate(el=>el.inert),`${name}: background choices inert`);
      check(await page.locator('.portal-frost').evaluate(el=>getComputedStyle(el).backdropFilter!=='none'),`${name}: background blurred`);
      await page.waitForTimeout(5400);
      check(await page.locator('.german-options').count()===1,`${name}: original timer cannot interrupt choice`);
      const frames=await page.locator('.portal-ambient').evaluate(async canvas=>{
        const sample=()=>{const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let sum=0;for(let i=3;i<data.length;i+=16)sum+=data[i];return sum;};
        const first=sample();await new Promise(resolve=>setTimeout(resolve,180));return [first,sample()];
      });
      check(frames.some(Boolean)&&frames[0]!==frames[1],`${name}: ambient sparks remain animated beyond countdown`);
      await page.locator(`.german-options [data-locale="${choice}"]`).tap();
      await page.locator('.sound-no').waitFor();
      check(await page.locator('html').getAttribute('lang')===(choice==='de'?'de':'gsw-CH'),`${name}: explicit dialect applied`);
      check(await page.locator('.portal-ambient').count()===1,`${name}: sound prompt retains one ambient effect`);
      check(await page.locator('.portal-focus .sound-no').count()===1,`${name}: sound choice remains above blur`);
      await page.screenshot({path:`output/qa/${name}-sound-focus-${choice}.png`});
      await page.locator('.portal-focus .portal-back').tap();
      check(await page.locator('.portal-focus').count()===0,`${name}: back removes focus layer`);
      check(await page.locator('.portal-ambient').count()===0,`${name}: ambient canvas disposed on back`);
      check(!await page.locator('.portal-scene').evaluate(el=>el.inert),`${name}: language tiles interactive again`);
      await page.locator('[data-language-family="german"]').tap();
      await page.screenshot({path:`output/qa/${name}-german-focus.png`});
      await page.setViewportSize({width:320,height:844});
      check(await page.locator('.portal-focus h2').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);return range.getBoundingClientRect().right<=innerWidth-20;}),`${name}: German heading fits narrow mobile`);
      await page.keyboard.press('Escape');
      check(await page.locator('.portal-focus').count()===0,`${name}: Escape returns to languages`);
      check(errors.length===0,`${name}: no script errors ${errors.join('; ')}`);
      await context.close();
    }
  }finally{await browser.close();}
}
console.log(`PASS: ${checks} grouped-language assertions across Chromium and WebKit.`);
