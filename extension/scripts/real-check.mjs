// Loads the built extension into Chromium and exercises it on real YouTube pages (needs network access to youtube.com).
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const out = path.resolve(dist, '..', '..', '.smoke');
const context = await chromium.launchPersistentContext('', {
  headless: false,
  executablePath: '/opt/pw-browsers/chromium',
  args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`, '--no-sandbox', '--lang=en-US'],
  viewport: { width: 1400, height: 1000 },
  locale: 'en-US',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
});
const log = (...a) => console.log(...a);
try {
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 15000 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && /Nubit/.test(m.text())) errors.push(m.text()); });
  const ctxOf = async () => sw.evaluate(async () => { const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' }); return chrome.tabs.sendMessage(tabs[0].id, { type: 'getPageContext' }); });

  await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { waitUntil: 'domcontentloaded', timeout: 60000 });
  log('url:', page.url());
  if (/google\.com\/sorry/.test(page.url())) { log('BLOCKED by Google captcha'); process.exit(2); }
  const consent = await page.$('button[aria-label*="Accept"], button:has-text("Accept all"), tp-yt-paper-button:has-text("Accept all")');
  if (consent) { log('consent dialog: clicking'); await consent.click().catch(() => {}); await page.waitForTimeout(3000); }
  await page.waitForTimeout(6000);
  const host = await page.$('#nubit-overlay-host');
  log('overlay host:', !!host, 'parent:', host && (await page.evaluate(() => document.getElementById('nubit-overlay-host')?.parentElement?.id)));
  await page.waitForTimeout(6000);
  const text = await page.evaluate(() => document.getElementById('nubit-overlay-host')?.shadowRoot?.querySelector('.card')?.textContent?.replace(/\s+/g, ' ') ?? '');
  log('card:', text.slice(0, 500));
  const badges = await page.$$eval('.nubit-badge', (els) => els.map((e) => e.className.replace('nubit-badge ', '') + ':' + e.textContent));
  log('badges on watch:', badges.length, badges.slice(0, 6));
  const ctx = await ctxOf();
  log('ctx.video:', ctx?.video && { id: ctx.video.videoId, views: ctx.video.views, likes: ctx.video.likes, comments: ctx.video.comments, subs: ctx.video.subscribers, handle: ctx.video.channelHandle, chId: ctx.video.channelId, tags: ctx.video.tags?.length, caps: ctx.video.captionTracks?.length, published: ctx.video.publishedAt });
  log('ctx.metrics:', ctx?.metrics && { vph: Math.round(ctx.metrics.vph ?? 0), outlier: ctx.metrics.outlier, median: ctx.metrics.channelMedianViews, seo: ctx.metrics.seo?.score, n: ctx.metrics.channelSampleSize });
  log('related:', ctx?.related?.length, (ctx?.related ?? []).slice(0, 2).map((r) => [r.videoId, r.title.slice(0, 30), r.views, r.ageHours && Math.round(r.ageHours), r.channelName]));
  await page.evaluate(() => window.scrollBy(0, 1500));
  await page.waitForTimeout(4000);
  const ctx2 = await ctxOf();
  log('after scroll: comments:', ctx2?.comments?.length, 'comment count:', ctx2?.video?.comments, 'likes:', ctx2?.video?.likes);
  await page.screenshot({ path: path.join(out, 'real-watch.png') });

  await page.goto('https://www.youtube.com/results?search_query=minecraft+house+tutorial', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000);
  const sb = await page.$$eval('.nubit-badge', (els) => els.map((e) => e.textContent));
  log('search badges:', sb.length, sb.slice(0, 8));
  const sctx = await ctxOf();
  log('search ctx:', sctx?.query, sctx?.results?.length, (sctx?.results ?? []).slice(0, 3).map((r) => [r.videoId, r.title.slice(0, 30), r.views, r.ageHours && Math.round(r.ageHours), r.channelHandle ?? r.channelId, r.durationSec]));
  const sp = await page.evaluate(() => document.getElementById('nubit-search-host')?.shadowRoot?.textContent?.replace(/\s+/g, ' ') ?? '');
  log('search panel:', sp.slice(0, 300));
  await page.screenshot({ path: path.join(out, 'real-search.png') });

  await page.goto('https://www.youtube.com/@MrBeast/videos', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000);
  const cb = await page.$$eval('.nubit-badge', (els) => els.map((e) => e.textContent));
  log('channel badges:', cb.length, cb.slice(0, 8));
  const cctx = await ctxOf();
  log('channel ctx:', cctx?.channel, cctx?.channelVideos?.length, (cctx?.channelVideos ?? []).slice(0, 2).map((r) => [r.videoId, r.title.slice(0, 30), r.views, r.ageHours && Math.round(r.ageHours)]));
  log('channel pill:', !!(await page.$('#nubit-channel-pill')));
  await page.screenshot({ path: path.join(out, 'real-channel.png') });

  await page.goto('https://www.youtube.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000);
  const hb = await page.$$eval('.nubit-badge', (els) => els.map((e) => e.textContent));
  log('home badges:', hb.length, hb.slice(0, 8));
  const hctx = await ctxOf();
  log('home ctx results:', hctx?.results?.length, (hctx?.results ?? []).slice(0, 2).map((r) => [r.videoId, r.title.slice(0, 30), r.views, r.ageHours && Math.round(r.ageHours), r.channelName]));
  await page.screenshot({ path: path.join(out, 'real-home.png') });
  log('errors:', errors);
} finally {
  await context.close();
}
