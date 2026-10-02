import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const runtime=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const {chromium,webkit}=runtime.default||runtime;
const base=process.env.TEST_URL||'http://127.0.0.1:4178';
await mkdir('output/qa',{recursive:true});
let assertions=0;
const check=(condition,message)=>{assert.ok(condition,message);assertions++;};

for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch();
  try{
    for(const width of [1440,390]){
      const context=await browser.newContext({viewport:{width,height:width===390?844:1000},hasTouch:width===390,isMobile:width===390});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(()=>{sessionStorage.setItem('matthew-entered','1');localStorage.setItem('matthew-language','en');});
      await page.goto(base);
      await page.locator('#mindset-host .mindset-game').waitFor();
      check((await page.locator('.wordmark').textContent()).trim()==='mh',`${name}/${width}: lowercase mh-only header`);
      await page.evaluate(()=>{window.originalGame=document.querySelector('.mindset-game');});
      await page.locator('#mindset-host').scrollIntoViewIfNeeded();
      await page.locator('.game-dialog[open]').waitFor();
      await page.waitForTimeout(750);
      check(await page.evaluate(()=>document.querySelector('.game-dialog .mindset-game')===window.originalGame),`${name}/${width}: same live game lifted`);
      const closeAtTopLeft=await page.evaluate(()=>{const x=document.querySelector('.game-close').getBoundingClientRect(),w=document.querySelector('.game-window').getBoundingClientRect();return x.width>0&&x.left-w.left<40&&x.top-w.top<40;});
      check(closeAtTopLeft,`${name}/${width}: small X available at the top left from the start`);
      check(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle==='none'),`${name}/${width}: lifted game shows no focus rectangle`);
      check(await page.locator('.game-dialog .dialog-ambient').count()===1,`${name}/${width}: game atmosphere mounted`);
      await page.locator('[data-action=begin]').click();
      await page.mouse.click(4,4);
      await page.locator('.game-dialog').waitFor({state:'detached'});
      await page.waitForTimeout(3200);
      check(await page.locator('.mindset-game').getAttribute('data-phase')==='memorize3seconds',`${name}/${width}: closed memory round pauses`);
      await page.locator('.game-expand').click();
      await page.waitForFunction(()=>document.querySelector('.mindset-game').dataset.phase==='recall3positions');
      const exposed=await page.locator('[data-position]').evaluateAll(nodes=>nodes.every(node=>{
        const r=node.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
        return r.y>=0&&r.bottom<=innerHeight&&node.contains(top);
      }));
      check(exposed,`${name}/${width}: every signal is visible and hit-testable`);
      for(const position of [0,1,2])await page.locator(`[data-position="${position}"]`).click();
      await page.locator('[data-action=confirm]').click();
      await page.locator('[data-quarter=unknown]').click();
      for(let i=0;i<4;i++)await page.locator('.mindset-next').click();
      check(await page.locator('.game-close').isVisible(),`${name}/${width}: completion X appears`);
      await page.locator('.game-replay').click();
      check(await page.locator('.mindset-game').getAttribute('data-phase')==='intro',`${name}/${width}: play again works`);
      await page.mouse.click(4,4);
      await page.locator('.game-dialog').waitFor({state:'detached'});
      check(await page.evaluate(()=>document.querySelector('#mindset-host .mindset-game')===window.originalGame),`${name}/${width}: game returns without remount`);
      check(await page.locator('.dialog-ambient').count()===0,`${name}/${width}: game ambience removed`);
      await page.locator('.game-expand').click();
      await page.keyboard.press('Escape');
      await page.locator('.game-dialog').waitFor({state:'detached'});
      await page.goto(base+'/contact/');
      await page.locator('#contact-form').waitFor();
      check((await page.locator('[data-action=maps] span').textContent())==='Drive here',`${name}/${width}: drive label`);
      check(await page.locator('.contact-channels [data-contact-icon]').count()===3,`${name}/${width}: channel icons`);
      check(await page.locator('#contact-form').evaluate(form=>new URL(form.action).hostname==='formsubmit.co'&&form.action.endsWith('/info@healwell.ch')&&form.method==='post'),`${name}/${width}: official email endpoint`);
      check(!await page.locator('#contact-form').evaluate(form=>form.checkValidity()),`${name}/${width}: empty form rejected`);
      await page.locator('#enquiry-name').fill('Website QA');
      await page.locator('#enquiry-email').fill('qa@example.com');
      await page.locator('#enquiry-message').fill('Automated local test. This must never be sent.');
      await page.locator('#enquiry-consent').check();
      let submission;
      await page.route('https://formsubmit.co/**',async route=>{
        submission=new URLSearchParams(route.request().postData());
        await route.fulfill({status:200,contentType:'text/html',body:'<title>Intercepted local QA submission</title>'});
      });
      await page.locator('#contact-form [type=submit]').click();
      await page.waitForURL('https://formsubmit.co/**');
      check(submission?.get('email')==='qa@example.com'&&submission.get('message').startsWith('Automated local test'),`${name}/${width}: form sends visitor fields`);
      check(submission.get('_captcha')!=='false',`${name}/${width}: provider spam protection retained`);
      await page.goto(base+'/contact/');
      await page.locator('[data-action=maps]').click();
      check(await page.locator('.maps-dialog .dialog-ambient').count()===1,`${name}/${width}: map-dialog sparks`);
      await page.screenshot({path:`output/qa/refined-${name}-${width}-maps.png`});
      await page.keyboard.press('Escape');
      await page.locator('.maps-dialog').waitFor({state:'detached'});
      check(await page.locator('.dialog-ambient').count()===0,`${name}/${width}: map atmosphere stops on close`);
      await page.goto(base+'/archive/');
      await page.locator('[data-media="0"]').click();
      check(await page.locator('.gallery-dialog .dialog-ambient').count()===1,`${name}/${width}: media-dialog sparks`);
      check(await page.locator('.gallery-view video').isVisible(),`${name}/${width}: gallery video unobstructed`);
      await page.keyboard.press('Escape');
      check(await page.locator('.dialog-ambient').count()===0,`${name}/${width}: generic-dialog cleanup`);
      check(errors.length===0,`${name}/${width}: no runtime errors: ${errors.join('; ')}`);
      await context.close();
      console.log(`${name}/${width}: game lift, contact form and shared popup atmosphere passed`);
    }
  }finally{await browser.close();}
}
console.log(`PASS: ${assertions} refinement assertions.`);
