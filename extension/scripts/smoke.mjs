// Smoke test: loads the built extension into Chromium, opens the options page and side panel,
// and renders a fake YouTube watch page (network to youtube.com is intercepted) to verify the
// overlay card and thumbnail badges. Usage: xvfb-run node scripts/smoke.mjs
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '..', 'dist');
const out = process.env.SMOKE_OUT ?? path.resolve(here, '..', '..', '.smoke');
mkdirSync(out, { recursive: true });

const player = {
  videoDetails: {
    videoId: 'abcdefghijk',
    title: 'How to grow a channel in 2026: 7 steps',
    lengthSeconds: '754',
    keywords: ['youtube growth', 'grow channel', 'youtube tips', 'seo', 'vph', 'tags'],
    channelId: 'UC1234567890123456789012',
    author: 'Nubit Channel',
    viewCount: '123456',
    shortDescription: 'How to grow a channel in 2026 with 7 steps.\n0:00 Intro\n1:00 Step one\n2:00 Step two\nhttps://example.com #youtube',
  },
  microformat: { playerMicroformatRenderer: { publishDate: new Date(Date.now() - 50 * 3600 * 1000).toISOString(), category: 'Education', ownerProfileUrl: 'http://www.youtube.com/@nubit' } },
  captions: { playerCaptionsTracklistRenderer: { captionTracks: [{ baseUrl: 'https://www.youtube.com/api/timedtext?x=1', languageCode: 'en', name: { simpleText: 'English' } }] } },
};
const initialData = { contents: { twoColumnWatchNextResults: { results: { results: { contents: [] } } } }, currentVideoEndpoint: { watchEndpoint: { videoId: 'abcdefghijk' } } };

const related = (id, title, views, age) => `
  <ytd-compact-video-renderer>
    <ytd-thumbnail style="display:block;position:relative;width:168px;height:94px;background:#ccc"><a id="thumbnail" href="/watch?v=${id}"><img></a></ytd-thumbnail>
    <div><a id="video-title" href="/watch?v=${id}">${title}</a><div id="metadata-line"><span class="inline-metadata-item">${views}</span><span class="inline-metadata-item">${age}</span></div></div>
  </ytd-compact-video-renderer>`;

const watchHtml = `<!doctype html><html><head><title>Test video - YouTube</title>
<script>var ytInitialPlayerResponse = ${JSON.stringify(player)};var ytInitialData = ${JSON.stringify(initialData)};</script>
<style>body{font-family:Arial;margin:0} #columns{display:flex;gap:20px;padding:20px} #primary{flex:1} #secondary{width:400px}</style>
</head><body>
<div id="movie_player"></div>
<div id="columns"><div id="primary"><div id="primary-inner"><div style="height:360px;background:#000"></div>
<div id="below"><ytd-watch-metadata><h1>How to grow a channel in 2026: 7 steps</h1>
 <div id="owner"><ytd-channel-name><a href="/@nubit">Nubit Channel</a></ytd-channel-name> <span id="owner-sub-count">1.23M subscribers</span></div>
 <like-button-view-model><button aria-label="like this video along with 12,345 other people">12K</button></like-button-view-model>
</ytd-watch-metadata>
<ytd-comments-header-renderer><h2 id="count">2,345 Comments</h2></ytd-comments-header-renderer>
<ytd-comment-thread-renderer><span id="author-text">@viewer</span><span id="content-text">Great video, thanks!</span><span id="vote-count-middle">12</span></ytd-comment-thread-renderer>
</div></div></div>
<div id="secondary"><div id="secondary-inner">
${related('rel00000001', 'Related one', '10K views', '1 day ago')}
${related('rel00000002', 'Related two', '1.2M views', '3 years ago')}
${related('rel00000003', 'Live thing', '1,234 watching', '')}
</div></div></div>
</body></html>`;

const searchHtml = `<!doctype html><html><head><title>cats - YouTube Search</title></head><body>
<ytd-search><div id="contents">
<ytd-video-renderer>
  <ytd-thumbnail style="display:block;position:relative;width:360px;height:202px;background:#ccc"><a id="thumbnail" href="/watch?v=srch0000001"><img></a></ytd-thumbnail>
  <div><a id="video-title" title="Funny cats compilation" href="/watch?v=srch0000001">Funny cats compilation</a>
  <ytd-channel-name><a href="/@cats">Cats TV</a></ytd-channel-name>
  <div id="metadata-line"><span class="inline-metadata-item">2.3M views</span><span class="inline-metadata-item">2 weeks ago</span></div></div>
</ytd-video-renderer>
</div></ytd-search></body></html>`;

const context = await chromium.launchPersistentContext('', {
  headless: false,
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`, '--no-sandbox'],
  viewport: { width: 1280, height: 900 },
});

const failures = [];
const check = (cond, msg) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${msg}`);
  if (!cond) failures.push(msg);
};

try {
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 15000 });
  const extId = sw.url().split('/')[2];
  console.log('extension id:', extId);
  const swErrors = [];
  sw.on('console', (m) => {
    if (m.type() === 'error') swErrors.push(m.text());
  });

  // Fake YouTube network
  await context.route('https://www.youtube.com/**', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/watch') return route.fulfill({ contentType: 'text/html', body: watchHtml });
    if (u.pathname === '/results') return route.fulfill({ contentType: 'text/html', body: searchHtml });
    return route.fulfill({ status: 204, body: '' });
  });

  // 1. Options page
  const opt = await context.newPage();
  const optErrors = [];
  opt.on('pageerror', (e) => optErrors.push(String(e)));
  await opt.goto(`chrome-extension://${extId}/options.html`);
  await opt.waitForSelector('#ext-id');
  check((await opt.textContent('#ext-id')) === extId, 'options page shows the extension id');
  await opt.fill('#anthropicApiKey', 'sk-ant-test');
  await opt.selectOption('#language', 'en');
  await opt.click('#save');
  await opt.waitForFunction(() => document.getElementById('save-result')?.textContent === 'Saved');
  check(true, 'options page saves settings');
  // custom provider preset (Atlas API)
  await opt.click('#add-atlas');
  await opt.waitForSelector('.cp');
  check((await opt.inputValue('.cp input[data-f="baseUrl"]')) === 'https://aiberloga.website/v1', 'Atlas preset fills the base URL');
  check((await opt.inputValue('#provider')).startsWith('custom:'), 'adding a provider selects it in the dropdown');
  await opt.fill('.cp input[data-f="apiKey"]', 'atlas-key');
  await opt.fill('.cp input[data-f="model"]', 'gpt-5');
  await opt.click('#save');
  await opt.waitForFunction(() => document.getElementById('save-result')?.textContent === 'Saved');
  const stored = await opt.evaluate(async () => (await chrome.storage.local.get('settings')).settings);
  check(stored.provider === 'custom' && stored.customProviders?.[0]?.name === 'Atlas API' && stored.customProviders[0].protocol === 'responses' && stored.activeCustomProviderId === stored.customProviders[0].id, 'custom provider is saved and active');
  await opt.screenshot({ path: path.join(out, 'options.png'), fullPage: true });
  check(optErrors.length === 0, `options page has no JS errors (${optErrors.join('; ')})`);
  // back to Claude for the rest of the checks
  await opt.selectOption('#provider', 'anthropic');
  await opt.click('#save');
  await opt.waitForFunction(() => document.getElementById('save-result')?.textContent === 'Saved');

  // 2. Side panel page
  const panel = await context.newPage();
  const panelErrors = [];
  panel.on('pageerror', (e) => panelErrors.push(String(e)));
  await panel.goto(`chrome-extension://${extId}/sidepanel.html`);
  await panel.waitForSelector('.welcome');
  check((await panel.textContent('#send')) === 'Send', 'side panel renders with English texts');
  check(!(await panel.isVisible('#nokey')), 'side panel hides the "no key" notice when a key is set');
  await panel.screenshot({ path: path.join(out, 'sidepanel.png') });
  check(panelErrors.length === 0, `side panel has no JS errors (${panelErrors.join('; ')})`);

  // 3. Fake watch page → overlay + badges
  const yt = await context.newPage();
  const ytErrors = [];
  yt.on('pageerror', (e) => ytErrors.push(String(e)));
  yt.on('console', (m) => {
    if (m.type() === 'error' && /Nubit/.test(m.text())) ytErrors.push(m.text());
  });
  await yt.goto('https://www.youtube.com/watch?v=abcdefghijk');
  await yt.waitForSelector('#nubit-overlay-host', { timeout: 15000 });
  await yt.waitForFunction(
    () => {
      const host = document.getElementById('nubit-overlay-host');
      return !!host?.shadowRoot?.querySelector('.grid');
    },
    null,
    { timeout: 15000 },
  );
  await yt.waitForTimeout(2500);
  const cardText = await yt.evaluate(() => document.getElementById('nubit-overlay-host')?.shadowRoot?.textContent ?? '');
  console.log('card text:', cardText.replace(/\s+/g, ' ').slice(0, 400));
  check(/SEO \d+/.test(cardText), 'overlay shows an SEO score');
  check(/123/.test(cardText), 'overlay shows the view count');
  check(/12\.3K|12K/.test(cardText), 'overlay shows likes from the DOM');
  check(/1\.23M/.test(cardText), 'overlay shows subscribers from the DOM');
  check(/youtube growth/.test(cardText), 'overlay lists tags');
  check((await yt.evaluate(() => document.getElementById('nubit-overlay-host')?.parentElement?.id)) === 'secondary-inner', 'overlay is mounted in the sidebar');
  const badges = await yt.$$eval('.nubit-badge.vph', (els) => els.map((e) => e.textContent));
  console.log('badges:', badges);
  check(badges.length === 2, 'VPH badges on related videos (live stream skipped)');

  // page context through the background
  const ctx = await sw.evaluate(async () => {
    const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });
    return chrome.tabs.sendMessage(tabs[0].id, { type: 'getPageContext' });
  });
  check(ctx?.kind === 'watch' && ctx.video?.videoId === 'abcdefghijk', 'page context is served to the background');
  check(ctx?.video?.likes === 12345 && ctx?.comments?.length === 1, 'page context includes likes and visible comments');
  check(typeof ctx?.metrics?.vph === 'number' && ctx.metrics.vph > 2000, `page context has VPH (${ctx?.metrics?.vph})`);
  await yt.screenshot({ path: path.join(out, 'watch.png'), fullPage: true });

  // 4. Fake search page → badges + context
  await yt.goto('https://www.youtube.com/results?search_query=cats');
  await yt.waitForSelector('.nubit-badge.vph', { timeout: 15000 });
  const sctx = await sw.evaluate(async () => {
    const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });
    return chrome.tabs.sendMessage(tabs[0].id, { type: 'getPageContext' });
  });
  check(sctx?.kind === 'search' && sctx.query === 'cats' && sctx.results?.length === 1, 'search context has the query and results');
  check(sctx?.results?.[0]?.views === 2_300_000 && sctx.results[0].channelHandle === '@cats', 'search result parsed from DOM');
  await yt.screenshot({ path: path.join(out, 'search.png') });
  check(ytErrors.length === 0, `youtube page has no extension errors (${ytErrors.join('; ')})`);

  // 5. Provider wiring inside the service worker (network is unavailable here, so we expect a
  //    clean connection error from the Anthropic SDK rather than a crash).
  //    (sent from the options page: a service worker does not receive its own runtime messages)
  const test = await opt.evaluate(() => chrome.runtime.sendMessage({ type: 'testProvider' }));
  console.log('testProvider:', JSON.stringify(test));
  check(test && test.ok === false && typeof test.message === 'string' && !/is not defined|undefined/.test(test.message), 'Anthropic SDK runs in the service worker and reports a readable error');
  check(swErrors.length === 0, `service worker logged no errors (${swErrors.join('; ')})`);
} catch (err) {
  failures.push(String(err));
  console.error(err);
} finally {
  await context.close();
}
console.log(failures.length ? `\n${failures.length} failure(s)` : '\nALL SMOKE CHECKS PASSED');
process.exit(failures.length ? 1 : 0);
