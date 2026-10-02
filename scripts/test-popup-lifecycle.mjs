import assert from 'node:assert/strict';
const imported=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const {chromium,webkit}=imported.default||imported;
const base=process.env.TEST_URL||'http://127.0.0.1:4178';
const failures=[];
let assertions=0;
const check=(value,label,detail)=>{assert.ok(value,`${label}: ${JSON.stringify(detail)}`);assertions++;};

for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch();
  try{
    for(const scenario of ['menu-retry','cancelled-arrival','returning-cancelled-arrival']){
      const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      try{
        if(scenario!=='cancelled-arrival')await page.addInitScript(()=>{sessionStorage.setItem('matthew-entered','1');localStorage.setItem('matthew-language','en');});
        if(scenario==='menu-retry'){
          await page.goto(base);
          await page.locator('#mindset-host').waitFor();
          await page.locator('.menu-trigger').tap();
          await page.locator('#mindset-host').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
          await page.waitForTimeout(300);
          check(await page.locator('.game-dialog').count()===0,`${name}: game waits while menu blocks it`);
          await page.locator('.menu-trigger').tap();
          await page.waitForTimeout(800);
          check(await page.locator('.game-dialog[open]').count()===1,`${name}: closing menu retries visible game lift`);
          await page.keyboard.press('Escape');
          await page.locator('.game-dialog').waitFor({state:'detached'});
        }else{
          await page.goto(base);
          if(scenario==='returning-cancelled-arrival')await page.locator('.language-trigger').tap();
          await page.locator('[data-locale=en]').waitFor();
          await page.evaluate(()=>history.pushState({},'',`${location.pathname}?entrance-history-check=1`));
          await page.locator('[data-locale=en]').tap();
          await page.locator('.sound-no').tap();
          await page.goBack();
          await page.waitForTimeout(2400);
          const state=await page.evaluate(()=>({portal:!!document.querySelector('.portal[open]'),arrival:!!document.querySelector('.arrival-player'),inert:document.querySelector('#shell').inert,entered:sessionStorage.getItem('matthew-entered')}));
          check(!state.portal&&!state.arrival&&!state.inert,`${name}: history cancels pending arrival without stranding portal`,state);
          check(state.entered==='1',`${name}: cancelled entrance marked entered`,state);
          check(await page.locator('#transition-canvas').evaluate(c=>c.parentElement===document.body),`${name}: cancelled entrance restores transition canvas`);
        }
        check(errors.length===0,`${name}/${scenario}: no lifecycle errors`,errors);
        console.log(`PASS ${name}/${scenario}`);
      }catch(error){failures.push(error.message);console.error(`FAIL ${name}/${scenario}: ${error.message}`);}
      finally{await context.close();}
    }
  }finally{await browser.close();}
}
assert.equal(failures.length,0,failures.join('\n'));
console.log(`PASS: ${assertions} popup lifecycle assertions across Chromium and WebKit.`);
