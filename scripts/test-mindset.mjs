// Run against npm run dev: node scripts/test-mindset.mjs
// Overrides: MINDSET_BASE_URL, PLAYWRIGHT_MODULE, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'output/qa');
const base = (process.env.MINDSET_BASE_URL || 'http://127.0.0.1:4178').replace(/\/?$/, '/');
const methodURL = new URL('method/', base).href;
const copy = JSON.parse(await readFile(path.join(root, 'static/locales/en.json'), 'utf8')).game;
const require = createRequire(import.meta.url);
const bundled = path.join(homedir(), '.nvm/versions/node/v25.8.0/lib/node_modules/@playwright/cli/node_modules/playwright');

function loadPlaywright() {
  if (process.env.PLAYWRIGHT_MODULE) return require(process.env.PLAYWRIGHT_MODULE);
  for (const candidate of ['playwright', '@playwright/test', bundled]) {
    try { return require(candidate); } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') throw error;
    }
  }
  throw new Error('Playwright not found. Set PLAYWRIGHT_MODULE to its installed package path.');
}

const playwrightModule = loadPlaywright();
const { chromium } = playwrightModule.default || playwrightModule;
async function browserExecutable() {
  const explicit = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (explicit) {
    assert.ok(existsSync(explicit), `Browser executable not found: ${explicit}`);
    return explicit;
  }
  if (existsSync(chromium.executablePath())) return chromium.executablePath();
  const cache = path.join(homedir(), 'Library/Caches/ms-playwright');
  const versions = (await readdir(cache).catch(() => []))
    .filter(name => /^chromium-\d+$/.test(name))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const version of versions) {
    const executable = path.join(cache, version, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
    if (existsSync(executable)) return executable;
  }
  throw new Error('Chromium not found. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to an installed browser.');
}

async function waitForServer() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(methodURL, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch { /* The preview may still be starting. */ }
    await delay(300);
  }
  throw new Error(`Preview unavailable: ${methodURL}. Start npm run dev first.`);
}

// Observe real browser scheduling without replacing callbacks, durations, or routes.
function installAudit() {
  sessionStorage.setItem('matthew-entered', '1');
  localStorage.setItem('matthew-language', 'en');
  const timeouts = new Set();
  const intervals = new Set();
  const frames = new Set();
  const visibility = new Set();
  let fired = 0;
  const fromGame = () => /\/mindset\.js(?:[?:]|$)/m.test(new Error().stack || '');
  const wrapSchedule = (name, pending, repeating = false) => {
    const original = window[name].bind(window);
    window[name] = function (callback, ...args) {
      if (!fromGame() || typeof callback !== 'function') return original(callback, ...args);
      const id = original(function (...values) {
        if (!repeating) pending.delete(id);
        fired++;
        return callback.apply(this, values);
      }, ...args);
      pending.add(id);
      return id;
    };
  };
  wrapSchedule('setTimeout', timeouts);
  wrapSchedule('setInterval', intervals, true);
  wrapSchedule('requestAnimationFrame', frames);
  for (const name of ['clearTimeout', 'clearInterval', 'cancelAnimationFrame']) {
    const original = window[name].bind(window);
    window[name] = function (id) {
      if (name === 'cancelAnimationFrame') frames.delete(id);
      else { timeouts.delete(id); intervals.delete(id); }
      return original(id);
    };
  }
  const add = document.addEventListener.bind(document);
  const remove = document.removeEventListener.bind(document);
  document.addEventListener = function (type, listener, options) {
    if (type === 'visibilitychange' && fromGame()) visibility.add(listener);
    return add(type, listener, options);
  };
  document.removeEventListener = function (type, listener, options) {
    if (type === 'visibilitychange') visibility.delete(listener);
    return remove(type, listener, options);
  };
  window.__mindsetQA = {
    documentId: crypto.randomUUID(),
    snapshot: () => ({
      pending: timeouts.size + intervals.size + frames.size,
      visibility: visibility.size,
      fired,
    }),
  };
}

let assertions = 0;
function check(value, message, details = '') {
  assertions++;
  assert.ok(value, `${message}${details ? `\n${JSON.stringify(details, null, 2)}` : ''}`);
}

async function phase(page, expected) {
  await page.waitForFunction(value => document.querySelector('.mindset-game')?.dataset.phase === value, expected);
  check(await page.locator('.mindset-game').count() === 1, `Only one game is mounted in ${expected}`);
}

const audit = page => page.evaluate(() => window.__mindsetQA.snapshot());

async function waitForInput(page, expected) {
  await phase(page, expected);
  const before = await audit(page);
  check(before.pending === 0, `${expected} has no game auto-advance timer`, before);
  // Longer than the old third-pick auto-advance delay (520ms).
  await delay(1100);
  check(await page.locator('.mindset-game').getAttribute('data-phase') === expected, `${expected} waits for explicit input`);
  check((await audit(page)).fired === before.fired, `${expected} has no background game callbacks`);
}

async function layout(page, label) {
  const result = await page.locator('.mindset-game').evaluate(game => {
    const rect = node => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    const field = game.querySelector('.mindset-field');
    const area = rect(field);
    const content = rect(game.querySelector('.mindset-content'));
    const overlap = (a, b) => a.x < b.right - 0.5 && a.right > b.x + 0.5 && a.y < b.bottom - 0.5 && a.bottom > b.y + 0.5;
    const targets = [...field.querySelectorAll('button')].map(rect);
    const collisions = targets.flatMap((a, i) => targets.slice(i + 1).filter(b => overlap(a, b)));
    const copy = [...game.querySelectorAll('.mindset-meta, .mindset-title, .mindset-description, .mindset-feedback, .mindset-controls')]
      .filter(node => node.getClientRects().length);
    const misplaced = copy.filter(node => rect(node).y < area.bottom - 0.5 || overlap(rect(node), area));
    const clipped = [...game.querySelectorAll('.mindset-button, .mindset-title, .mindset-copy, .mindset-life-label')]
      .filter(node => node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1);
    return {
      phase: game.dataset.phase,
      meaning: game.classList.contains('mindset-meaning'),
      fieldBlur: getComputedStyle(field).filter,
      overlayWithin: content.x >= area.x - 1 && content.right <= area.right + 1 && content.y >= area.y - 1 && content.bottom <= area.bottom + 1,
      interactive: field.querySelectorAll('button').length,
      width: area.width, ratio: area.width / area.height,
      fillsPanel: Math.abs(game.getBoundingClientRect().width - game.parentElement.getBoundingClientRect().width) <= 2,
      collisions: collisions.length, misplaced: misplaced.map(node => node.className),
      clipped: clipped.map(node => node.className),
      undersize: targets.filter(r => r.width < 44 || r.height < 44),
      outside: targets.filter(r => r.x < area.x || r.right > area.right || r.y < area.y || r.bottom > area.bottom),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      occlusion: [field, ...field.querySelectorAll('*')].some(node => {
        const css = getComputedStyle(node);
        return css.filter !== 'none' || (css.backdropFilter && css.backdropFilter !== 'none');
      }),
    };
  });
  const meaning = ['reveal', 'focusTitle', 'lessonTitle', 'integrationTitle'].includes(result.phase);
  const final = result.phase === 'finalPhoto';
  if (meaning) {
    check(result.meaning && result.overlayWithin && result.fieldBlur.includes('blur(') && result.interactive === 0, `${label}: meaning overlays only the completed, softly blurred game`, result);
  } else if (!final) {
    check(!result.meaning && result.misplaced.length === 0 && !result.occlusion, `${label}: active copy stays below the clear input field`, result);
  }
  check(result.collisions === 0 && result.undersize.length === 0 && result.outside.length === 0, `${label}: separate 44px signal targets stay inside the field`, result);
  check(!result.overflow && result.clipped.length === 0, `${label}: no page overflow or clipped text`, result);
  check(result.fillsPanel, `${label}: original stage fills its available panel width`, result);
  if (!meaning && !final) check(result.ratio <= 3.5 && result.ratio >= 0.75, `${label}: responsive constellation field`, result);
}

async function screenshot(page, viewport, stage) {
  const file = path.join(output, `mindset-${viewport}-${stage}.png`);
  await page.locator('.mindset-game').screenshot({ path: file, animations: 'disabled' });
  console.log(`  screenshot: ${path.relative(root, file)}`);
}

async function photoPixels(page, viewport) {
  const photo = page.locator('.mindset-photo');
  await photo.evaluate(node => node.decode());
  check(await photo.evaluate(node => node.naturalWidth === 6696 && node.naturalHeight === 6696), `${viewport}: original photo decoded`);
  check(decodeURIComponent(await photo.getAttribute('src')).endsWith('/v3 mat x tonyPHOTO-2026-03-16-21-22-09-2.webp'), `${viewport}: correct untouched source photo`);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const field = page.locator('.mindset-photo-frame');
  const background = await page.locator('.mindset-field').evaluate(node => getComputedStyle(node).backgroundColor);
  const pixels = await field.screenshot({ path: path.join(output, `mindset-${viewport}-final-field.png`), animations: 'disabled' });
  const stats = await page.evaluate(async ({ png, background }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, image.width, image.height).data;
    const bg = background.match(/[\d.]+/g).slice(0, 3).map(Number);
    let total = 0, colored = 0, dark = 0, skin = 0;
    let left = image.width, right = 0, top = image.height, bottom = 0;
    for (let y = 6; y < image.height - 6; y += 2) {
      for (let x = 6; x < image.width - 6; x += 2) {
        const i = (y * image.width + x) * 4;
        total++;
        if (Math.max(...bg.map((value, channel) => Math.abs(value - data[i + channel]))) > 45) {
          colored++; left = Math.min(left, x); right = Math.max(right, x);
          top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
        if (data[i] + data[i + 1] + data[i + 2] < 270) dark++;
        if (data[i] > 110 && data[i + 1] > 65 && data[i + 2] > 35 && data[i] > data[i + 1] * 1.12 && data[i + 1] > data[i + 2] * 1.02) skin++;
      }
    }
    return { coverage: colored / total, skin: skin / total, dark: dark / total, width: (right - left) / image.width, height: (bottom - top) / image.height };
  }, { png: pixels.toString('base64'), background });
  check(stats.coverage > 0.07 && stats.skin > 0.015 && stats.dark > 0.04, `${viewport}: screenshot contains visible photo subjects, not a blank image box`, stats);
  check(stats.width > 0.4 && stats.height > 0.55, `${viewport}: subjects are zoomed into the frame despite transparent margins`, stats);
  console.log(`  photo pixels: ${(100 * stats.coverage).toFixed(1)}% subject coverage`);
}

async function navigate(page, route, mobile) {
  if (route === 'home') await page.locator('.wordmark[data-route="home"]').click();
  else if (mobile) {
    await page.locator('.menu-trigger').click();
    await page.locator(`#mobile-nav a[data-route="${route}"]`).click();
  } else await page.locator(`.desktop-nav a[data-route="${route}"]`).click();
  await page.waitForFunction(value => document.body.dataset.route === value, route);
  await page.waitForURL(new URL(route === 'home' ? './' : `${route}/`, base).href);
}

async function verifyRouteCleanup(page, mobile, label) {
  await page.locator('[data-action="replay"]').click();
  await phase(page, 'intro');
  const documentId = await page.evaluate(() => window.__mindsetQA.documentId);
  for (let cycle = 0; cycle < 2; cycle++) {
    await page.locator('[data-action="begin"]').click();
    await phase(page, 'memorize3seconds');
    const active = await audit(page);
    check(active.pending > 0 && active.visibility === 1, `${label}: audit observes live memory timer and listener`, active);
    await page.evaluate(() => { window.__mindsetDetached = document.querySelector('.mindset-game'); });
    await navigate(page, 'about', mobile);
    check(await page.locator('.mindset-game').count() === 0, `${label}: route unmounts game`);
    const stopped = await audit(page);
    check(stopped.pending === 0 && stopped.visibility === 0, `${label}: route clears game timers and visibility listeners`, stopped);
    check(await page.evaluate(() => window.__mindsetQA.documentId) === documentId, `${label}: navigation exercised SPA cleanup, not a document reload`);
    await delay(3300);
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    const later = await audit(page);
    check(later.fired === stopped.fired && later.pending === 0, `${label}: no callbacks fire after leaving the route`, { stopped, later });
    check(await page.evaluate(() => !window.__mindsetDetached.isConnected && window.__mindsetDetached.dataset.phase === 'memorize3seconds'), `${label}: destroyed field never advances`);
    await navigate(page, 'method', mobile);
    await phase(page, 'intro');
    check((await audit(page)).visibility === 1, `${label}: returning mounts exactly one visibility listener`);
  }
  await page.evaluate(() => { delete window.__mindsetDetached; });
}

async function scenario(browser, config) {
  const context = await browser.newContext({ viewport: config.viewport, isMobile: config.mobile, hasTouch: config.mobile, deviceScaleFactor: 1, locale: 'en-GB' });
  await context.addInitScript(installAudit);
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    console.log(`Running ${config.name} (${config.viewport.width}x${config.viewport.height})`);
    await page.goto(methodURL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await phase(page, 'intro');
    check(await page.locator('dialog[open]').count() === 0, `${config.name}: portal bypassed`);
    check(await page.locator('html').getAttribute('lang') === 'en', `${config.name}: English selected`);
    await waitForInput(page, 'intro');
    await layout(page, `${config.name}/intro`);
    await page.locator('[data-action="begin"]').click();
    await phase(page, 'memorize3seconds');
    const observed = await page.locator('.mindset-field').evaluate(field => {
      const area = field.getBoundingClientRect();
      const nodes = [...field.querySelectorAll('.mindset-signal')];
      const red = field.querySelector('.mindset-signal-red');
      const blue = nodes.flatMap((node, index) => node.classList.contains('mindset-signal-blue') ? [index] : []);
      const lowerLeft = blue.filter(index => {
        const r = nodes[index].getBoundingClientRect();
        return r.x + r.width / 2 < area.x + area.width / 2 && r.y + r.height / 2 > area.y + area.height / 2;
      });
      return {
        blue, lowerLeft, redCount: field.querySelectorAll('.mindset-signal-red').length,
        otherCount: field.querySelectorAll('.mindset-signal-gold, .mindset-signal-neutral').length,
        redColor: red && getComputedStyle(red.querySelector('.mindset-signal-core')).backgroundColor,
        positions: nodes.map(node => [node.style.getPropertyValue('--mindset-x'), node.style.getPropertyValue('--mindset-y')]),
        visible: area.top >= document.querySelector('.site-header').getBoundingClientRect().bottom && area.bottom <= innerHeight,
      };
    });
    check(observed.blue.length === 3 && observed.redCount === 1 && observed.otherCount === 8, `${config.name}: correct 3/1/8 signal counts`, observed);
    check(observed.lowerLeft.length === 1, `${config.name}: lower-left blue exists`);
    check(JSON.stringify(observed.positions) === JSON.stringify([[20,24],[76,22],[26,60],[78,62],[50,16],[62,48],[14,46],[44,32],[88,44],[36,52],[58,68],[30,40]].map(pair => pair.map(value => `${value}%`))), `${config.name}: original constellation coordinates restored`);
    check(await page.locator('.mindset-signal-orbit').count() === 12 && await page.locator('.mindset-signal-stem').count() === 12, `${config.name}: original layered orbital signal treatment restored`);
    const [red, green, blue] = observed.redColor.match(/\d+/g).map(Number);
    check(red > 180 && red > green * 1.8 && red > blue * 1.5, `${config.name}: signal is actually red, not amber`, observed.redColor);
    check(observed.visible, `${config.name}: Begin reveals the full memory field below the fixed header`);
    await screenshot(page, config.name, 'memorize');
    await phase(page, 'recall3positions');
    await layout(page, `${config.name}/recall`);
    const targets = page.locator('button.mindset-signal');
    check(await targets.count() === 12, `${config.name}: all twelve signals selectable`);
    check(await page.locator('.mindset-signal-blue, .mindset-signal-red, .mindset-signal-gold').count() === 0, `${config.name}: recall does not leak colors`);
    check(await targets.evaluateAll(nodes => nodes.every((node, index) => node.getAttribute('aria-label') === `Position ${index + 1}`)), `${config.name}: recall accessible names are positions only`);
    const positions = await targets.evaluateAll(nodes => nodes.map(node => [node.style.getPropertyValue('--mindset-x'), node.style.getPropertyValue('--mindset-y')]));
    check(JSON.stringify(positions) === JSON.stringify(observed.positions), `${config.name}: recall positions never move`);
    check(await page.locator('[data-action="confirm"]').isDisabled(), `${config.name}: Continue requires three picks`);
    for (let index = 0; index < 12; index++) {
      await targets.nth(index).click();
      check(await targets.nth(index).getAttribute('aria-pressed') === 'true', `${config.name}: position ${index + 1} responds to a real click`);
      await targets.nth(index).click();
      check(await targets.nth(index).getAttribute('aria-pressed') === 'false', `${config.name}: position ${index + 1} can be revised`);
    }
    const lowerLeft = targets.nth(observed.lowerLeft[0]);
    await lowerLeft.focus();
    await page.keyboard.press('Space');
    check(await lowerLeft.getAttribute('aria-pressed') === 'true', `${config.name}: lower-left blue can be selected by keyboard`);
    for (const index of observed.blue.filter(value => value !== observed.lowerLeft[0])) await targets.nth(index).click();
    check(await page.locator('button.mindset-signal[aria-pressed="true"]').count() === 3, `${config.name}: exactly three picks`);
    await waitForInput(page, 'recall3positions');
    await screenshot(page, config.name, 'recall');
    await page.getByRole('button', { name: copy.confirm, exact: true }).click();
    await waitForInput(page, 'red');
    await layout(page, `${config.name}/red`);
    check(JSON.stringify(await page.locator('.mindset-quarter').allTextContents()) === JSON.stringify([copy.tl, copy.tr, copy.bl, copy.br]), `${config.name}: all four quadrant choices are explicit`);
    await screenshot(page, config.name, 'red');
    await page.getByRole('button', { name: copy.br, exact: true }).focus();
    await page.keyboard.press('Enter');
    await phase(page, 'reveal');
    check(await page.locator('.mindset-score').textContent() === copy.score.replace('{count}', '3'), `${config.name}: all three blue picks score correctly`);
    check(await page.locator('.mindset-title').textContent() === copy.caught, `${config.name}: bottom-right answer is correct`);
    for (const [current, next] of [['reveal', 'focusTitle'], ['focusTitle', 'lessonTitle'], ['lessonTitle', 'integrationTitle'], ['integrationTitle', 'finalPhoto']]) {
      await waitForInput(page, current);
      await layout(page, `${config.name}/${current}`);
      if (current === 'lessonTitle') await screenshot(page, config.name, 'lesson-overlay');
      check(await page.getByRole('button', { name: copy.next, exact: true }).count() === 1, `${config.name}: ${current} has one explicit Next`);
      await page.getByRole('button', { name: copy.next, exact: true }).click();
      await phase(page, next);
    }
    await waitForInput(page, 'finalPhoto');
    await layout(page, `${config.name}/finalPhoto`);
    await photoPixels(page, config.name);
    await screenshot(page, config.name, 'final');
    await verifyRouteCleanup(page, config.mobile, config.name);
    await navigate(page, 'home', config.mobile);
    await phase(page, 'intro');
    check((await audit(page)).visibility === 1, `${config.name}: Home mounts exactly one independent game`);
    await page.locator('[data-action="begin"]').click();
    await phase(page, 'memorize3seconds');
    await navigate(page, 'method', config.mobile);
    await phase(page, 'intro');
    const homeCleanup = await audit(page);
    check(homeCleanup.pending === 0 && homeCleanup.visibility === 1, `${config.name}: Home-to-Method clears the old timer and listener`, homeCleanup);
    await delay(3300);
    check((await audit(page)).fired === homeCleanup.fired, `${config.name}: no old Home callbacks affect Method`);
    if (config.mobile) {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.locator('[data-action="begin"]').click();
      await phase(page, 'recall3positions');
      await layout(page, 'mobile/320px-recall');
      await screenshot(page, 'mobile-320', 'recall');
    }
    check(errors.length === 0, `${config.name}: no browser errors`, errors);
    console.log(`PASS ${config.name}: flow, targets, keyboard, image pixels, and two route-cleanup cycles`);
  } catch (error) {
    await page.screenshot({ path: path.join(output, `mindset-${config.name}-failure.png`), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await context.close();
  }
}

await mkdir(output, { recursive: true });
const ignored = spawnSync('git', ['check-ignore', '-q', 'output/qa/mindset-desktop-final.png'], { cwd: root }).status === 0;
if (!ignored) console.warn('NOTE: output/qa is not currently Git-ignored. No ignore files were changed.');
await waitForServer();
const browser = await chromium.launch({ executablePath: await browserExecutable(), headless: true });
const failures = [];
try {
  for (const config of [
    { name: 'desktop', viewport: { width: 1440, height: 1080 }, mobile: false },
    { name: 'mobile', viewport: { width: 390, height: 844 }, mobile: true },
  ]) {
    try { await scenario(browser, config); } catch (error) {
      failures.push(`${config.name}: ${error.stack || error}`);
      console.error(`FAIL ${config.name}: ${error.message}`);
    }
  }
} finally {
  await browser.close();
}
console.log(`${assertions} assertions; ${failures.length} failing viewport(s). Screenshots: ${output}`);
if (failures.length) {
  console.error(failures.join('\n\n'));
  process.exitCode = 1;
}
