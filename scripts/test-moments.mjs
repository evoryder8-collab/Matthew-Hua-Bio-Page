import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

// Release checks: tears moment, homepage order, language pill and dialect bloom, endless
// award ribbon, game ignition/X/no re-lift/crossfades/red reveal, element invitation,
// consent-gated effects and soundtrack (ducked under films), and the eased curtain.
const runtime=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const {chromium,webkit}=runtime.default||runtime;
const base=(process.env.TEST_URL||'http://127.0.0.1:4178').replace(/\/$/,'');
await mkdir('output/qa',{recursive:true});
let assertions=0;
const failures=[];
const check=(value,label,detail)=>{assert.ok(value,`${label}${detail===undefined?'':`: ${JSON.stringify(detail)}`}`);assertions++;};
const returning=(page,locale)=>page.addInitScript(value=>{sessionStorage.setItem('matthew-entered','1');localStorage.setItem('matthew-language',value);},locale);

async function scenario(browser,name,label,options,body){
  const context=await browser.newContext(options);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
    await body(page,context);
    check(errors.length===0,`${name}/${label}: no page errors`,errors);
    console.log(`PASS ${name}/${label}`);
  }catch(error){failures.push(`${name}/${label}: ${error.message}`);console.error(`FAIL ${name}/${label}: ${error.message}`);}
  finally{await context.close();}
}

for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch();
  try{
    await scenario(browser,name,'homepage-order-and-pill',{viewport:{width:1440,height:900}},async page=>{
      await returning(page,'en');
      await page.goto(base+'/');await page.waitForSelector('#hero.portrait-alive');
      const order=await page.evaluate(()=>[...document.querySelectorAll('main > section, main > header')].map(node=>node.id||node.className.split(' ')[0]));
      check(order[1]==='heritage-recognition'&&order[2]==='philosophy'&&order[3]==='elements',`${name}: tears follow the ribbon, then the method`,order);
      check(!await page.locator('main .home-story').count(),`${name}: life-across-borders is not on Home`);
      const pill=await page.evaluate(()=>{const b=document.querySelector('.language-trigger');return {flag:!!b.querySelector('.language-orb img')?.complete,code:b.querySelector('.language-code').textContent,oldIcon:!!b.querySelector('[data-lucide=languages],.lucide-languages'),label:b.getAttribute('aria-label')};});
      check(pill.flag&&pill.code==='EN'&&!pill.oldIcon&&/English/.test(pill.label),`${name}: language pill with flag and code`,pill);
      await page.goto(base+'/about/');await page.locator('.about-story').waitFor();
      check((await page.locator('.about-story h2').textContent()).startsWith('A life across borders'),`${name}: About holds life-across-borders`);
    });

    for(const width of [390,2560]){
      await scenario(browser,name,`ribbon-${width}`,{viewport:{width,height:900}},async page=>{
        await returning(page,'en');
        await page.goto(base+'/');await page.waitForSelector('#hero.portrait-alive');await page.waitForTimeout(400);
        const slack=await page.evaluate(()=>{const track=document.querySelector('.recognition-track'),animation=track.getAnimations()[0];
          return [0,.5,.999].map(fraction=>{animation.pause();animation.currentTime=animation.effect.getComputedTiming().duration*fraction;
            return Math.max(...[...track.querySelectorAll('.recognition-group')].map(group=>group.getBoundingClientRect().right))-innerWidth;});});
        check(slack.every(value=>value>0),`${name}/${width}: ribbon never runs out at the right edge`,slack);
      });
    }

    for(const [width,height] of [[1440,900],[390,844]]){
      await scenario(browser,name,`tears-${width}`,{viewport:{width,height},deviceScaleFactor:1},async page=>{
        await returning(page,'en');
        await page.goto(base+'/');await page.waitForSelector('.tears-moment[data-tear-state=idle]');
        const heading=await page.evaluate(()=>({sr:document.querySelector('.tears-sr').textContent,hidden:document.querySelector('.tears-letters').getAttribute('aria-hidden'),dot:document.querySelector('.tears-dot')?.textContent}));
        check(heading.sr==='No need to wipe the tears away.'&&heading.hidden==='true'&&heading.dot==='.',`${name}/${width}: heading stays whole for assistive tech`,heading);
        await page.evaluate(()=>window.scrollTo({top:document.querySelector('.tears-moment').offsetTop-40,behavior:'instant'}));
        const states=[];
        for(const state of ['wave','gather','falling','splash','done']){
          await page.waitForFunction(value=>{const s=document.querySelector('.tears-moment').dataset.tearState;const order=['idle','wave','gather','falling','splash','done'];return order.indexOf(s)>=order.indexOf(value);},state,{timeout:12000});
          states.push(state);
        }
        const geometry=await page.evaluate(()=>{const dot=document.querySelector('.tears-dot').getBoundingClientRect(),first=document.querySelector('.tears-ripple-word').getBoundingClientRect(),copy=document.querySelector('.tears-copy').getBoundingClientRect();
          return {dotX:dot.left+dot.width/2,copyLeft:copy.left,copyRight:copy.right,below:first.top>dot.bottom,opacity:getComputedStyle(document.querySelector('.tears-dot')).opacity,canvas:document.querySelector('.tears-canvas').width,overflow:document.documentElement.scrollWidth>innerWidth};});
        check(geometry.dotX>geometry.copyLeft&&geometry.dotX<geometry.copyRight&&geometry.below,`${name}/${width}: full stop sits above the paragraph it falls onto`,geometry);
        check(geometry.opacity==='1'&&geometry.canvas===0&&!geometry.overflow,`${name}/${width}: full stop re-forms and the canvas is released`,geometry);
        await page.screenshot({path:`output/qa/tears-${name}-${width}.png`});
      });
    }

    await scenario(browser,name,'tears-reduced-motion',{viewport:{width:1440,height:900},reducedMotion:'reduce'},async page=>{
      await returning(page,'en');
      await page.goto(base+'/');await page.waitForSelector('.tears-moment[data-tear-state=static]');
      check(await page.locator('.tears-char').count()===0,`${name}: reduced motion keeps the plain heading`);
    });

    await scenario(browser,name,'game-lift',{viewport:{width:1440,height:900}},async page=>{
      await returning(page,'en');
      await page.goto(base+'/');await page.waitForSelector('#hero.portrait-alive');
      await page.evaluate(()=>{window.__host=document.getElementById('mindset-host');window.__ignited=false;new MutationObserver(()=>{if(document.querySelector('.game-home-slot.is-igniting'))window.__ignited=!document.querySelector('.game-dialog');}).observe(document.querySelector('main'),{attributes:true,subtree:true,attributeFilter:['class']});});
      await page.locator('a[href="#elements"]').click();
      await page.locator('.game-dialog[open]').waitFor();
      check(await page.evaluate(()=>window.__host===document.getElementById('mindset-host')),`${name}: in-page link keeps the live game`);
      check(await page.evaluate(()=>window.__ignited),`${name}: game fires up in place before lifting`);
      await page.waitForTimeout(1000);
      const toolbar=await page.evaluate(()=>{const x=document.querySelector('.game-close').getBoundingClientRect(),w=document.querySelector('.game-window').getBoundingClientRect();return {left:x.left-w.left,top:x.top-w.top,visible:x.width>0,outline:getComputedStyle(document.activeElement).outlineStyle};});
      check(toolbar.visible&&toolbar.left<40&&toolbar.top<40&&toolbar.outline==='none',`${name}: X at top left, no focus rectangle`,toolbar);
      await page.locator('[data-action=begin]').click();
      check(await page.locator('.mindset-ghost').count()===1&&await page.locator('.mindset-title').count()===1,`${name}: slide crossfade adds no duplicate controls`);
      await page.waitForFunction(()=>document.querySelector('.mindset-game').dataset.phase==='recall3positions',null,{timeout:8000});
      const recall=await page.evaluate(()=>getComputedStyle(document.querySelector('.mindset-title')).animationName);
      check(recall.includes('mindset-recall-float')&&recall.includes('mindset-recall-glow'),`${name}: recall question glows and floats`,recall);
      check(await page.evaluate(()=>getComputedStyle(document.querySelector('.mindset-field')).outlineStyle==='none'),`${name}: field focus has no outline`);
      for(const position of [0,1,2])await page.locator(`[data-position="${position}"]`).click();
      await page.locator('[data-action=confirm]').click();
      await page.locator('[data-quarter=tl]').click();
      await page.waitForTimeout(1500);
      const truth=await page.evaluate(()=>{const marker=document.querySelector('.mindset-truth-signal')?.getBoundingClientRect(),field=document.querySelector('.mindset-field').getBoundingClientRect();
        const words=[...document.querySelectorAll('.mindset-content .mindset-title,.mindset-content p,.mindset-content button')].map(node=>node.getBoundingClientRect());
        return {title:document.querySelector('.mindset-title').textContent,visible:!!marker&&marker.width>0,inRedQuarter:!!marker&&marker.left>field.left+field.width/2&&marker.top>field.top+field.height/2,
          clear:!!marker&&words.every(rect=>marker.right<rect.left||marker.left>rect.right||marker.bottom<rect.top||marker.top>rect.bottom)};});
      check(truth.title==='It was there, too.'&&truth.visible&&truth.inRedQuarter&&truth.clear,`${name}: a missed answer reveals the red signal, clear of the text`,truth);
      for(let i=0;i<4;i++)await page.locator('.mindset-next').click();
      check(await page.locator('.mindset-truth-signal').count()===0,`${name}: the reveal belongs to the answer slide only`);
      check(await page.locator('.game-replay').isVisible(),`${name}: replay offered at completion`);
      await page.locator('.game-close').click();await page.locator('.game-dialog').waitFor({state:'detached'});
      await page.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'instant'}));await page.waitForTimeout(300);
      for(let y=0;y<10;y++){await page.evaluate(()=>window.scrollBy({top:-innerHeight/2,behavior:'instant'}));await page.waitForTimeout(200);}
      check(await page.locator('.game-dialog').count()===0,`${name}: finished game does not lift again on the way back up`);
    });

    for(const [width,height] of [[1440,900],[390,844]]){
      await scenario(browser,name,`element-invite-${width}`,{viewport:{width,height},hasTouch:width<900,isMobile:width<900},async page=>{
        await returning(page,'en');
        await page.goto(base+'/');await page.waitForSelector('#hero.portrait-alive');
        await page.evaluate(()=>{window.__invited=false;new MutationObserver(()=>{if(document.querySelector('.element-tabs.is-inviting'))window.__invited=true;}).observe(document.querySelector('.element-tabs'),{attributes:true,attributeFilter:['class']});});
        await page.evaluate(()=>window.scrollTo({top:document.querySelector('.element-tabs').getBoundingClientRect().top+scrollY-120,behavior:'instant'}));
        await page.locator('.game-dialog[open]').waitFor();
        check(!await page.evaluate(()=>window.__invited),`${name}/${width}: invitation yields to the game lifting beside it`);
        await page.waitForTimeout(1000);await page.keyboard.press('Escape');await page.locator('.game-dialog').waitFor({state:'detached'});
        await page.waitForFunction(()=>document.querySelector('.element-tabs').classList.contains('is-hinting'),null,{timeout:6000});
        const tabs=await page.evaluate(()=>[...document.querySelectorAll('[data-element-tab]')].map(tab=>({explored:tab.hasAttribute('data-explored'),dot:getComputedStyle(tab,'::before').content!=='none'})));
        check(await page.evaluate(()=>window.__invited),`${name}/${width}: tabs wave once the game closes`);
        check(tabs[0].explored&&tabs.slice(1).every(tab=>!tab.explored&&tab.dot),`${name}/${width}: unopened elements carry a dot`,tabs);
        await page.locator('[data-element-tab="2"]').click();
        const after=await page.evaluate(()=>({hinting:document.querySelector('.element-tabs').classList.contains('is-hinting'),explored:document.querySelector('[data-element-tab="2"]').hasAttribute('data-explored')}));
        check(!after.hinting&&after.explored,`${name}/${width}: opening one stops the hint and clears its dot`,after);
      });
    }

    for(const choice of ['yes','no']){
      await scenario(browser,name,`sound-${choice}`,{viewport:{width:1440,height:900}},async page=>{
        await page.addInitScript(()=>{window.__starts=[];const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){window.__starts.push(Math.round((this.buffer?.duration||0)*100)/100);return start.apply(this,args);};
          const Context=window.AudioContext||window.webkitAudioContext,gain=Context.prototype.createGain,source=Context.prototype.createMediaElementSource;let last=null;
          Context.prototype.createGain=function(){last=gain.call(this);return last;};
          Context.prototype.createMediaElementSource=function(element){window.__music={element,gain:last};return source.call(this,element);};
          window.__soundtrack=()=>window.__music?{gain:window.__music.gain.gain.value,playing:!window.__music.element.paused}:null;});
        await page.goto(base+'/');await page.locator('[data-locale=en]').click();await page.locator(`.sound-${choice}`).click();
        await page.waitForTimeout(2600);
        const underFilm=await page.evaluate(()=>window.__soundtrack());
        await page.evaluate(()=>document.querySelector('.arrival-enter')?.click());
        if(choice==='yes'){
          check(underFilm?.playing&&underFilm.gain<.01,`${name}: soundtrack waits silently under the sparkle and arrival film`,underFilm);
          await page.waitForTimeout(3400);
          const after=await page.evaluate(()=>window.__soundtrack());
          check(after.playing&&after.gain>.25,`${name}: soundtrack glides in once the film is closed`,after);
        }else check(underFilm===null,`${name}: declined sound never loads the soundtrack`);
        await page.evaluate(()=>window.scrollTo({top:document.querySelector('.tears-moment').offsetTop-40,behavior:'instant'}));
        await page.waitForFunction(()=>document.querySelector('.tears-moment').dataset.tearState==='done',null,{timeout:12000});
        const starts=await page.evaluate(()=>window.__starts);
        if(choice==='yes'){
          check(starts[0]>1.3&&starts[0]<1.7&&starts.filter(duration=>duration>.5&&duration<.7).length>=1,`${name}: chosen sound plays the sizzle, then the tear landing`,starts);
          check((await page.evaluate(()=>window.__soundtrack())).gain>.25,`${name}: effects play on top of the soundtrack`);
          await page.locator('.archive-card [data-media="0"]').click();
          await page.waitForTimeout(2200);
          const film=await page.evaluate(()=>({playing:!document.querySelector('.gallery-view video')?.paused,...window.__soundtrack()}));
          check(film.gain<.03,`${name}: a gallery film lowers the soundtrack to silence`,film);
          await page.keyboard.press('Escape');await page.waitForTimeout(3000);
          check((await page.evaluate(()=>window.__soundtrack())).gain>.25,`${name}: soundtrack returns after the gallery film`);
        }else check(starts.length===0&&await page.evaluate(()=>window.__soundtrack())===null,`${name}: declined sound keeps every effect and the soundtrack silent`,starts);
      });
    }

    await scenario(browser,name,'german-bloom',{viewport:{width:1440,height:900}},async page=>{
      await returning(page,'de');
      await page.goto(base+'/?lang=de');await page.waitForSelector('#hero.portrait-alive');
      await page.locator('.language-trigger').click();await page.locator('[data-language-family]').click();
      check(await page.locator('.portal-shade.is-arriving').count()===1,`${name}: dialect prompt eases its darkness in`);
      await page.waitForSelector('.german-options.is-pondering',{timeout:4000});
      const motion=await page.evaluate(()=>[...document.querySelectorAll('.german-options .language-option')].map(card=>({name:getComputedStyle(card).animationName,delay:getComputedStyle(card).animationDelay})));
      check(motion.length===2&&motion.every(item=>item.name==='german-ponder')&&motion[0].delay!==motion[1].delay,`${name}: the two dialects float and glow in turn`,motion);
      await page.locator('.german-options [data-locale=gsw]').click({force:true});await page.locator('.sound-no').waitFor();
      check(await page.locator('.portal-shade.is-steady').count()===1,`${name}: next prompt keeps the darkness steady`);
    });

    await scenario(browser,name,'eased-curtain',{viewport:{width:1440,height:900}},async page=>{
      await returning(page,'en');
      await page.goto(base+'/');await page.waitForSelector('#hero.portrait-alive');
      await page.evaluate(()=>{window.__curtain=[];const canvas=document.getElementById('transition-canvas'),context=canvas.getContext('2d'),start=performance.now();
        const sample=()=>{const value=context.getImageData(Math.round(canvas.width*.04),Math.round(canvas.height*.06),1,1).data[3];window.__curtain.push([Math.round(performance.now()-start),value]);if(performance.now()-start<2400)requestAnimationFrame(sample);};requestAnimationFrame(sample);});
      await page.locator('.desktop-nav a[data-route=about]').click();
      await page.waitForTimeout(2600);
      const samples=await page.evaluate(()=>window.__curtain);
      const rising=samples.filter(([time,alpha])=>alpha>8&&alpha<247);
      check(rising.length>=4,`${name}: black curtain passes through intermediate opacity instead of cutting`,samples.slice(0,30));
      check(samples.some(([,alpha])=>alpha>=250),`${name}: curtain fully covers before the swap`);
      check(await page.evaluate(()=>document.body.dataset.route)==='about',`${name}: navigation completes`);
    });
  }finally{await browser.close();}
}
assert.equal(failures.length,0,failures.join('\n'));
console.log(`PASS: ${assertions} release assertions across Chromium and WebKit.`);
