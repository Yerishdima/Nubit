import { chromium } from 'playwright';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const out = '/home/user/Nubit/.smoke';
const context = await chromium.launchPersistentContext('', { headless: false, executablePath: '/opt/pw-browsers/chromium', args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`, '--no-sandbox', '--lang=en-US'], viewport: { width: 1400, height: 1000 }, locale: 'en-US' });
try {
  let [sw] = context.serviceWorkers(); if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 15000 });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && /Nubit/.test(m.text())) errors.push(m.text()); });
  await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('url:', page.url(), 'title:', await page.title());
  // consent dialog?
  const consent = await page.$('button[aria-label*="Accept"], tp-yt-paper-button:has-text("Accept all"), button:has-text("Accept all"), form[action*="consent"] button');
  if (consent) { console.log('consent dialog found, clicking'); await consent.click().catch(() => {}); await page.waitForTimeout(3000); }
  const host = await page.waitForSelector('#nubit-overlay-host', { timeout: 30000 }).catch(() => null);
  console.log('overlay host:', !!host);
  await page.waitForTimeout(8000);
  const text = await page.evaluate(() => document.getElementById('nubit-overlay-host')?.shadowRoot?.querySelector('.card')?.textContent?.replace(/\s+/g, ' ') ?? '');
  console.log('card:', text.slice(0, 600));
  const badges = await page.$$eval('.nubit-badge', (els) => els.map((e) => e.className.replace('nubit-badge ', '') + ':' + e.textContent));
  console.log('badges:', badges.length, badges.slice(0, 8));
  const ctx = await sw.evaluate(async () => { const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' }); return chrome.tabs.sendMessage(tabs[0].id, { type: 'getPageContext' }); });
  console.log('context video:', ctx?.video && { id: ctx.video.videoId, title: ctx.video.title, views: ctx.video.views, likes: ctx.video.likes, comments: ctx.video.comments, subs: ctx.video.subscribers, handle: ctx.video.channelHandle, tags: ctx.video.tags?.length, caps: ctx.video.captionTracks?.length, published: ctx.video.publishedAt });
  console.log('context metrics:', ctx?.metrics && { vph: ctx.metrics.vph, outlier: ctx.metrics.outlier, median: ctx.metrics.channelMedianViews, seo: ctx.metrics.seo?.score });
  console.log('related:', ctx?.related?.length, ctx?.related?.slice(0, 3));
  console.log('comments:', ctx?.comments?.length);
  await page.screenshot({ path: out + '/real-watch.png', fullPage: false });
  // search page
  await page.goto('https://www.youtube.com/results?search_query=minecraft+house+tutorial', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  const sb = await page.$$eval('.nubit-badge', (els) => els.map((e) => e.textContent));
  console.log('search badges:', sb.length, sb.slice(0, 10));
  const sctx = await sw.evaluate(async () => { const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' }); return chrome.tabs.sendMessage(tabs[0].id, { type: 'getPageContext' }); });
  console.log('search ctx:', sctx?.query, sctx?.results?.length, sctx?.results?.slice(0, 3));
  await page.screenshot({ path: out + '/real-search.png', fullPage: false });
  // channel stats via background
  const ch = await sw.evaluate(async () => { try { const { YouTube } = await import('./background.js').catch(() => ({})); } catch {} return null; });
  const st = await page.evaluate(() => chrome?.runtime ? null : null).catch(() => null);
  const stats = await sw.evaluate(() => new Promise((res) => { chrome.runtime.sendMessage({ type: 'getChannelStats', channel: '@MrBeast' }, res); })).catch((e) => String(e));
  console.log('errors:', errors);
} finally { await context.close(); }
