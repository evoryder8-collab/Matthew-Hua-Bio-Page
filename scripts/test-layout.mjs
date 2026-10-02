import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Example: PLAYWRIGHT_MODULE=/path/to/playwright/index.js node scripts/test-layout.mjs
const root = fileURLToPath(new URL('../', import.meta.url));
const baseURL = new URL(process.env.LAYOUT_BASE_URL || 'http://127.0.0.1:4178');
const output = path.join(root, 'output/qa');
const allRoutes = ['home', 'method', 'private-practice', 'about', 'archive', 'contact'];
const routes = process.env.LAYOUT_ROUTES ? [...new Set(process.env.LAYOUT_ROUTES.split(',').map(route => route.trim()))] : allRoutes;
assert.ok(routes.length && routes.every(route => allRoutes.includes(route)), 'LAYOUT_ROUTES must contain known comma-separated routes');
const locales = ['en', 'gsw', 'de', 'es', 'pt', 'fr', 'it', 'zh', 'vi', 'ja'];
const htmlLang = code => ({ gsw: 'gsw-CH', zh: 'zh-Hans' }[code] || code);
const viewports = [
  { width: 390, height: 844, locales },
  { width: 1440, height: 1000, locales },
  { width: 320, height: 844, locales: ['de', 'ja'] },
];
const screenshotsOnly = process.env.LAYOUT_SCREENSHOTS_ONLY === '1';
const expectedCases = viewports.reduce((sum, viewport) => sum + viewport.locales.reduce((count, locale) =>
  count + routes.filter(route => !screenshotsOnly || wantsScreenshot(route, locale, viewport.width)).length, 0), 0);
const results = [];
let failureScreenshots = 0;

async function loadPlaywright() {
  const candidates = [...new Set([process.env.PLAYWRIGHT_MODULE, 'playwright'].filter(Boolean))];
  const errors = [];
  for (const candidate of candidates) {
    try {
      const module = await import(path.isAbsolute(candidate) ? pathToFileURL(candidate).href : candidate);
      return module.default || module;
    } catch (error) {
      errors.push(`${candidate}: ${error.message}`);
    }
  }
  throw new Error(`Playwright is unavailable. Set PLAYWRIGHT_MODULE or install playwright.\n${errors.join('\n')}`);
}

async function sourceSnapshot() {
  const files = ['static/app.js', 'static/templates.js', 'static/style.css', 'static/identity.css', 'static/mindset.css',
    'static/mindset.js', 'static/effects.js', 'static/language.js',
    ...locales.map(code => `static/locales/${code}.json`)];
  const snapshot = {};
  for (const file of files) {
    snapshot[file] = createHash('sha256').update(await readFile(path.join(root, file))).digest('hex');
  }
  return snapshot;
}

// This function runs in the browser; parent/child boxes are never treated as collisions.
function inspectLayout(phase) {
  const round = value => Math.round(value * 100) / 100;
  const box = rect => Object.fromEntries(['x', 'y', 'width', 'height', 'left', 'right', 'top', 'bottom']
    .map(key => [key, round(rect[key])]));
  const visible = el => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden'
      && style.display !== 'none' && !el.closest('[hidden]');
  };
  const label = el => el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}${[...el.classList].map(c => `.${c}`).join('')}`;
  const describe = el => ({ selector: label(el), text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 120), box: box(el.getBoundingClientRect()) });
  const overlaps = (a, b) => {
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    return Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left) > 1
      && Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top) > 1;
  };
  const issues = [];
  const width = document.documentElement.clientWidth;
  const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  const header = document.querySelector('.site-header');
  if (!header) issues.push({ type: 'missing-header', phase });
  const groups = header ? [...header.children].filter(visible) : [];
  const controls = [...document.querySelectorAll('.site-header a, .site-header button, .mobile-nav a')].filter(visible);
  for (const items of [groups, controls]) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (!items[i].contains(items[j]) && !items[j].contains(items[i]) && overlaps(items[i], items[j])) {
          issues.push({ type: 'header-nav-overlap', phase, first: describe(items[i]), second: describe(items[j]) });
        }
      }
    }
  }
  for (const el of controls) {
    const rect = el.getBoundingClientRect();
    if (rect.left < -1 || rect.right > width + 1) {
      issues.push({ type: 'header-control-outside-viewport', phase, element: describe(el), viewportWidth: width });
    }
  }
  for (const el of document.querySelectorAll('.contact-channels strong')) {
    const rect = el.getBoundingClientRect();
    const lines = rect.height / Number.parseFloat(getComputedStyle(el).lineHeight);
    if (visible(el) && rect.width < 100 && lines > 3) {
      issues.push({ type: 'contact-value-column-collapse', phase, element: describe(el), lines: round(lines),
        parentGridColumns: getComputedStyle(el.parentElement).gridTemplateColumns });
    }
  }
  if (scrollWidth > width + 1) {
    const offenders = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!visible(el) || el instanceof SVGElement || el.closest('.leaflet-pane')) continue;
      let clipped = false;
      for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        if (['hidden', 'clip', 'auto', 'scroll'].includes(getComputedStyle(parent).overflowX)) {
          clipped = true;
          break;
        }
      }
      if (clipped) continue;
      const rect = el.getBoundingClientRect();
      let textRect;
      if (el.childNodes.length && [...el.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())) {
        const range = document.createRange();
        range.selectNodeContents(el);
        textRect = range.getBoundingClientRect();
      }
      if (rect.left < -1 || rect.right > width + 1 || (textRect && (textRect.left < -1 || textRect.right > width + 1))) {
        offenders.push({ ...describe(el), ...(textRect ? { contentBox: box(textRect) } : {}) });
      }
      if (offenders.length === 12) break;
    }
    issues.push({ type: 'document-horizontal-overflow', phase, viewportWidth: width, scrollWidth, excess: scrollWidth - width, offenders });
  }
  return { issues, viewportWidth: width, scrollWidth, height: document.documentElement.scrollHeight };
}

async function scrollAndCheckImages(page) {
  let steps = 0;
  for (; steps < 120; steps++) {
    const atBottom = await page.evaluate(() => {
      window.scrollBy({ top: Math.max(240, innerHeight * 0.8), behavior: 'instant' });
      return scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    });
    await page.waitForTimeout(45);
    if (atBottom) break;
  }
  if (steps === 120) throw new Error('Lazy-load scroll exceeded the 120-step safety bound');
  // Revisit unfinished lazy images at their visible frame, including oversized clipped portraits.
  for (const img of await page.locator('img[loading="lazy"]').all()) {
    if (await img.isVisible() && !await img.evaluate(el => el.complete)) {
      await img.evaluate(el => (el.closest('figure') || el).scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(120);
    }
  }
  await page.waitForFunction(() => [...document.images].every(img => !img.getClientRects().length || img.complete), null, { timeout: 6000 }).catch(() => {});
  return page.evaluate(async () => Promise.all([...document.images].filter(img => {
    const style = getComputedStyle(img);
    return img.getClientRects().length && style.visibility !== 'hidden' && !img.closest('[hidden]');
  }).map(async img => {
    let decodeError;
    if (img.complete && img.naturalWidth) {
      try { await img.decode(); } catch (error) { decodeError = error.message; }
    }
    return { src: img.currentSrc || img.src, alt: img.alt, complete: img.complete,
      naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, loading: img.loading, decodeError };
  })));
}

function wantsScreenshot(route, locale, width) {
  if (route === 'home') return locale === 'de' && width === 390;
  if (!['about', 'archive', 'contact'].includes(route)) return false;
  return (width === 1440 && locale === 'en') || (width === 390 && locale === 'de')
    || (width === 320 && locale === 'ja') || (width === 320 && locale === 'de' && route === 'about');
}

async function checkFavicon(page, record, phase) {
  const icon = await page.evaluate(async () => {
    const link = document.querySelector('link[rel="icon"]');
    if (!link) return { missing: true };
    const response = await fetch(link.href);
    return { href: link.href, attribute: link.getAttribute('href'), status: response.status };
  });
  record.faviconChecks = (record.faviconChecks || 0) + 1;
  if (icon.missing || icon.status !== 200 || icon.href !== new URL('static/favicon.svg', baseURL).href) {
    record.issues.push({ type: 'favicon-regression', phase, ...icon });
  }
}

// Reaching or playing the homepage game lifts it into its dialog by design; return it
// before interacting with the page behind it.
async function returnLiftedGame(page) {
  if (!await page.locator('.game-dialog[open]').count()) return;
  await page.keyboard.press('Escape');
  await page.locator('.game-dialog').waitFor({ state: 'detached' });
}

async function checkHomeFlows(page, record) {
  let stage = 'game-intro';
  try {
    const waitPhase = phase => page.waitForFunction(expected =>
      document.querySelector('.mindset-game')?.dataset.phase === expected, phase);
    await waitPhase('intro');
    await page.locator('.mindset-game [data-action="begin"]').click();
    stage = 'game-recall';
    await waitPhase('recall3positions');
    assert.equal(await page.locator('.mindset-game [data-action="confirm"]').isDisabled(), true);
    for (const position of [0, 1, 2]) await page.locator(`.mindset-game [data-position="${position}"]`).click();
    await page.locator('.mindset-game [data-action="confirm"]').click();
    stage = 'game-red-question';
    await waitPhase('red');
    record.issues.push(...(await page.evaluate(inspectLayout, stage)).issues);
    await page.locator('.mindset-game [data-quarter="br"]').click();
    for (const phase of ['reveal', 'focusTitle', 'lessonTitle', 'integrationTitle']) {
      stage = `game-${phase}`;
      await waitPhase(phase);
      record.issues.push(...(await page.evaluate(inspectLayout, stage)).issues);
      await page.locator('.mindset-game [data-action="next"]').click();
    }
    stage = 'game-final-photo';
    await waitPhase('finalPhoto');
    await page.waitForFunction(() => {
      const img = document.querySelector('.mindset-photo');
      return img?.complete && img.naturalWidth > 0;
    });
    await page.locator('.mindset-game [data-action="replay"]').click();
    await waitPhase('intro');
    record.gameCompleted = true;
  } catch (error) {
    record.issues.push({ type: 'home-game-flow', stage, message: error.message });
  }
  try {
    await returnLiftedGame(page);
    stage = 'gallery-open';
    const opener = page.locator('.archive-card [data-media="5"]');
    await opener.click();
    await page.waitForSelector('.gallery-dialog[open]');
    const firstTitle = await page.locator('.gallery-details h2').textContent();
    await page.waitForFunction(() => {
      const img = document.querySelector('.gallery-view img');
      return img?.complete && img.naturalWidth > 0;
    });
    record.issues.push(...(await page.evaluate(inspectLayout, stage)).issues);
    stage = 'gallery-next-and-back';
    await page.locator('[data-gallery-step="1"]').click();
    assert.notEqual(await page.locator('.gallery-details h2').textContent(), firstTitle);
    await page.locator('[data-gallery-step="-1"]').click();
    assert.equal(await page.locator('.gallery-details h2').textContent(), firstTitle);
    stage = 'gallery-close';
    await page.locator('.gallery-dialog [data-action="close-dialog"]').click();
    await page.waitForFunction(() => !document.querySelector('.gallery-dialog'));
    assert.equal(await opener.evaluate(el => document.activeElement === el), true, 'Gallery must restore opener focus');
    record.galleryReturned = true;
  } catch (error) {
    record.issues.push({ type: 'home-gallery-flow', stage, message: error.message });
    await page.keyboard.press('Escape');
  }
  try {
    stage = 'spa-archive-navigation';
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const desktopLink = page.locator('.desktop-nav a[data-route="archive"]');
    if (await desktopLink.isVisible()) await desktopLink.click();
    else {
      await page.locator('.menu-trigger').click();
      await page.locator('.mobile-nav a[data-route="archive"]').click();
    }
    await page.waitForFunction(() => document.body.dataset.route === 'archive');
    await checkFavicon(page, record, stage);
    stage = 'spa-browser-back';
    await page.goBack();
    await page.waitForFunction(expectedLang => document.body.dataset.route === 'home'
      && document.documentElement.lang === expectedLang
      && document.querySelector('.mindset-game')?.dataset.phase === 'intro'
      && document.querySelectorAll('.archive-card').length === 7, htmlLang(record.locale));
    await checkFavicon(page, record, stage);
    record.spaReturned = true;
  } catch (error) {
    record.issues.push({ type: 'home-spa-return', stage, message: error.message });
  }
}

async function runCase(context, route, locale, viewport) {
  const url = new URL(route === 'home' ? '/' : `/${route}/`, baseURL);
  url.searchParams.set('lang', locale);
  const record = { route, locale, viewport: `${viewport.width}x${viewport.height}`, url: url.href, issues: [], externalFailures: [] };
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const local = url => new URL(url).origin === baseURL.origin;
  page.on('pageerror', error => record.issues.push({ type: 'pageerror', message: error.message, stack: error.stack?.slice(0, 1200) }));
  page.on('console', message => {
    if (message.type() === 'error' && message.text().includes('Website enhancement could not load.')) {
      record.issues.push({ type: 'app-init-error', message: message.text() });
    }
  });
  page.on('response', response => {
    if (response.status() >= 400) {
      const issue = { type: response.status() === 404 ? 'local404' : 'http-error', status: response.status(), url: response.url() };
      if (local(response.url())) record.issues.push(issue);
      else record.externalFailures.push({ ...issue, type: 'external-http-error' });
    }
  });
  page.on('requestfailed', request => {
    const error = request.failure()?.errorText || 'Unknown failure';
    if (error.includes('ERR_ABORTED')) return;
    const issue = { type: 'request-failed', url: request.url(), error };
    if (local(request.url())) record.issues.push(issue);
    else record.externalFailures.push(issue);
  });
  try {
    const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 20000 });
    record.status = response?.status();
    await page.waitForFunction(({ expectedLang, route, locale }) => document.documentElement.lang === expectedLang
      && document.documentElement.classList.contains('ready') && document.body.dataset.route === route
      && document.querySelector('.language-trigger .language-code')?.textContent.trim() === locale.toUpperCase()
      && !!document.querySelector('main h1'), { expectedLang: htmlLang(locale), route, locale });
    record.documentLang = await page.locator('html').getAttribute('lang');
    await checkFavicon(page, record, 'initial');
    if (await page.locator('dialog[open]').count()) record.issues.push({ type: 'portal-not-bypassed' });
    const fontsReady = await page.evaluate(() => Promise.race([
      document.fonts.ready.then(() => true), new Promise(resolve => setTimeout(() => resolve(false), 6000)),
    ]));
    if (!fontsReady) record.externalFailures.push({ type: 'font-readiness-timeout' });
    await page.waitForTimeout(180);
    const top = await page.evaluate(inspectLayout, 'top');
    record.issues.push(...top.issues);
    record.images = await scrollAndCheckImages(page);
    for (const img of record.images) {
      if (!img.complete || !img.naturalWidth || !img.naturalHeight || img.decodeError) {
        record.issues.push({ type: img.complete ? 'broken-image' : 'image-load-timeout', ...img, local: local(img.src) });
      }
    }
    const bottom = await page.evaluate(inspectLayout, 'scrolled');
    record.issues.push(...bottom.issues);
    record.documentSize = { viewportWidth: bottom.viewportWidth, scrollWidth: bottom.scrollWidth, height: bottom.height };
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    await page.waitForTimeout(200);
    await returnLiftedGame(page);
    const menu = page.locator('.menu-trigger');
    if (await menu.isVisible()) {
      await menu.click();
      await page.waitForFunction(() => document.querySelector('.menu-trigger')?.getAttribute('aria-expanded') === 'true'
        && !document.querySelector('#mobile-nav')?.hidden);
      record.issues.push(...(await page.evaluate(inspectLayout, 'mobile-menu-open')).issues);
      record.mobileMenuChecked = true;
      await menu.click();
      await page.waitForFunction(() => document.querySelector('#mobile-nav')?.hidden === true);
      await page.mouse.move(viewport.width - 1, viewport.height - 1);
    }
    const representative = wantsScreenshot(route, locale, viewport.width);
    if (representative || (record.issues.length && failureScreenshots < 10)) {
      if (!representative) failureScreenshots++;
      // Lazy-image layout shifts can move reveal sections past the first scroll pass.
      for (const section of await page.locator('.reveal').all()) {
        if (await section.evaluate(el => !el.classList.contains('is-visible'))) {
          await section.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
          await page.waitForTimeout(120);
        }
      }
      await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
      await page.waitForTimeout(180);
      const name = `layout-identity-${route}-${locale}-${viewport.width}x${viewport.height}${representative ? '' : '-issue'}.png`;
      await page.screenshot({ path: path.join(output, name), fullPage: true, animations: 'disabled', timeout: 20000 });
      record.screenshot = `output/qa/${name}`;
    }
    if (route === 'home') await checkHomeFlows(page, record);
  } catch (error) {
    record.issues.push({ type: 'test-execution-error', message: error.message });
  } finally {
    await page.close();
  }
  record.issues = [...new Map(record.issues.map(issue => [JSON.stringify(issue), issue])).values()];
  results.push(record);
  if (record.issues.length) console.log(`CASE_ISSUES ${JSON.stringify({ route, locale, viewport: record.viewport, issues: record.issues, screenshot: record.screenshot })}`);
  if (results.length % 10 === 0) console.log(`PROGRESS ${results.length}/${expectedCases}; ${results.filter(result => result.issues.length).length} failing cases`);
}

await mkdir(output, { recursive: true });
const startedAt = new Date().toISOString();
const before = await sourceSnapshot();
const playwright = await loadPlaywright();
const browser = await playwright.chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1, isMobile: viewport.width < 600, hasTouch: viewport.width < 600,
      reducedMotion: 'no-preference', colorScheme: 'light', locale: 'en-US' });
    await context.addInitScript(origin => {
      if (location.origin === origin) sessionStorage.setItem('matthew-entered', '1');
    }, baseURL.origin);
    try {
      for (const locale of viewport.locales) {
        for (const route of routes) {
          if (!screenshotsOnly || wantsScreenshot(route, locale, viewport.width)) await runCase(context, route, locale, viewport);
        }
      }
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
assert.equal(results.length, expectedCases, 'Every selected case must execute');
const after = await sourceSnapshot();
const changedDuringRun = Object.keys(before).filter(file => before[file] !== after[file]);
const failures = results.filter(result => result.issues.length);
const countsByType = {};
for (const result of failures) for (const type of new Set(result.issues.map(issue => issue.type))) {
  countsByType[type] = (countsByType[type] || 0) + 1;
}
const summary = {
  startedAt, finishedAt: new Date().toISOString(), baseURL: baseURL.href,
  total: results.length, passed: results.length - failures.length, failed: failures.length,
  coverage: screenshotsOnly ? 'Representative screenshot rerun' : `${routes.length} routes x 10 locales x 2 viewports, plus ${routes.length} routes x de/ja at 320x844`,
  mobileMenusChecked: results.filter(result => result.mobileMenuChecked).length,
  homeGamesCompleted: results.filter(result => result.gameCompleted).length,
  homeGalleryReturns: results.filter(result => result.galleryReturned).length,
  homeSPAReturns: results.filter(result => result.spaReturned).length,
  faviconChecks: results.reduce((sum, result) => sum + (result.faviconChecks || 0), 0),
  imagesChecked: results.reduce((sum, result) => sum + (result.images?.length || 0), 0),
  countsByType, changedDuringRun, sourceHashes: after,
  screenshots: results.filter(result => result.screenshot).map(result => result.screenshot),
  externalFailures: results.filter(result => result.externalFailures.length).map(({ route, locale, viewport, externalFailures }) => ({ route, locale, viewport, externalFailures })),
  failures: failures.map(({ images, externalFailures, ...result }) => result),
};
console.log(`LAYOUT_RESULT ${JSON.stringify(summary)}`);
process.exitCode = failures.length ? 1 : 0;
