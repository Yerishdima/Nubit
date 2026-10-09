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


const studioHtml = `<!doctype html><html><head><title>Video details - YouTube Studio</title></head><body style="background:#fff">
<ytcp-video-metadata-editor>
  <div id="title-textarea"><div id="textbox" contenteditable="true" style="border:1px solid #ccc;padding:8px;min-height:24px"></div></div>
  <div id="description-textarea"><div id="textbox" contenteditable="true" style="border:1px solid #ccc;padding:8px;min-height:60px"></div></div>
  <div id="tags-container"><div id="chips"></div><input id="text-input" placeholder="Add tag"></div>
</ytcp-video-metadata-editor>
<script>
  // Minimal imitation of Studio's chip bar: Enter or a trailing comma turns the input into a chip.
  const input = document.getElementById('text-input');
  const chips = document.getElementById('chips');
  const add = (v) => { v = v.trim(); if (!v) return; const c = document.createElement('ytcp-chip'); c.innerHTML = '<span id="chip-text"></span>'; c.querySelector('#chip-text').textContent = v; chips.appendChild(c); input.value = ''; };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(input.value); });
  input.addEventListener('input', () => { if (input.value.endsWith(',')) add(input.value.slice(0, -1)); });
</script>
</body></html>`;

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
  await context.route('https://studio.youtube.com/**', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname.startsWith('/video/')) return route.fulfill({ contentType: 'text/html', body: studioHtml });
    return route.fulfill({ status: 204, body: '' });
  });
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
  // built-in Atlas provider
  await opt.selectOption('#provider', 'atlas');
  check(await opt.isVisible('#atlasApiKey'), 'Atlas provider block is shown');
  await opt.fill('#atlasApiKey', 'atlas-test-key');
  await opt.waitForFunction(() => /models|моделей|Could not|Не удалось/.test(document.getElementById('atlas-status')?.textContent ?? ''), null, { timeout: 30000 }).catch(() => null);
  console.log('atlas status:', await opt.textContent('#atlas-status'));
  await opt.evaluate(() => { const s = document.getElementById('atlasModel'); s.add(new Option('test-model', 'test-model')); s.value = 'test-model'; });
  await opt.click('#save');
  await opt.waitForFunction(() => document.getElementById('save-result')?.textContent === 'Saved');
  const atlasStored = await opt.evaluate(async () => (await chrome.storage.local.get('settings')).settings);
  check(atlasStored.provider === 'atlas' && atlasStored.atlasApiKey === 'atlas-test-key' && atlasStored.atlasModel === 'test-model' && atlasStored.atlasProtocol === 'responses', 'Atlas provider saved with key, model and protocol');

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
  // competitors tab
  await panel.click('#tab-competitors');
  await panel.waitForSelector('#competitors:not(.hidden)');
  check(/No tracked channels|Пока нет/.test(await panel.textContent('#comp-list')), 'competitors tab shows the empty state');
  await panel.click('#tab-chat');
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
  check(/\+ Competitor|\+ Конкурент/.test(cardText), 'overlay has the "+ Competitor" button');
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
  await yt.waitForSelector('#nubit-search-host', { timeout: 10000 });
  await yt.waitForFunction(() => !/computing|считаю/.test(document.getElementById('nubit-search-host')?.shadowRoot?.textContent ?? ''), null, { timeout: 40000 }).catch(() => null);
  const spText = await yt.evaluate(() => document.getElementById('nubit-search-host')?.shadowRoot?.textContent?.replace(/\s+/g, ' ') ?? '');
  console.log('search panel:', spText.slice(0, 200));
  check(/Keyword analysis|Анализ запроса/.test(spText), 'search page shows the keyword panel');
  await yt.screenshot({ path: path.join(out, 'search.png') });
  check(ytErrors.length === 0, `youtube page has no extension errors (${ytErrors.join('; ')})`);

  // 4b. Fake YouTube Studio editor → assistant panel, live scores, insertion
  const st = await context.newPage();
  const stErrors = [];
  st.on('pageerror', (e) => stErrors.push(String(e)));
  await st.goto('https://studio.youtube.com/video/abcdefghijk/edit');
  await st.waitForSelector('#nubit-studio-host', { timeout: 15000 });
  await st.click('#title-textarea #textbox');
  await st.keyboard.type('Как вырастить канал на YouTube в 2026: 7 шагов для новичков');
  await st.waitForFunction(() => /SEO \d+/.test(document.getElementById('nubit-studio-host')?.shadowRoot?.textContent ?? ''), null, { timeout: 10000 });
  const stText = () => st.evaluate(() => document.getElementById('nubit-studio-host')?.shadowRoot?.textContent ?? '');
  let txt = await stText();
  check(/Название \d+|Title \d+/.test(txt), 'studio panel shows a live title score');
  check(/вырастить канал youtube/.test(txt) || (await st.evaluate(() => document.getElementById('nubit-studio-host').shadowRoot.querySelector('#kw').value)) === 'вырастить канал youtube', 'studio panel guesses the focus keyword from the title');
  // insertion through the background relay (what the AI / side panel use)
  const ins = await sw.evaluate(async () => {
    const tabs = await chrome.tabs.query({ url: 'https://studio.youtube.com/*' });
    const a = await chrome.tabs.sendMessage(tabs[0].id, { type: 'studioInsert', field: 'description', value: 'Первая строка с ключом.\nВторая строка.\n\n0:00 Интро\n1:00 Часть\n2:00 Финал\n#youtube' });
    const b = await chrome.tabs.sendMessage(tabs[0].id, { type: 'studioInsert', field: 'tags', value: ['youtube', 'рост канала', 'youtube'] });
    const ctx = await chrome.tabs.sendMessage(tabs[0].id, { type: 'getPageContext' });
    return { a, b, ctx };
  });
  const descText = await st.evaluate(() => document.querySelector('#description-textarea #textbox').innerText);
  check(ins.a?.ok === true && /Первая строка/.test(descText) && /#youtube/.test(descText), 'description inserted into the Studio field');
  const chipTexts = await st.$$eval('#chips ytcp-chip', (els) => els.map((e) => e.textContent.trim()));
  check(ins.b?.ok === true && chipTexts.length === 2 && chipTexts.includes('рост канала'), `tags inserted as chips (${chipTexts.join(', ')})`);
  check(ins.ctx?.kind === 'studio' && ins.ctx.draft?.tags?.length === 2 && ins.ctx.draft.title.startsWith('Как вырастить') && typeof ins.ctx.draft.seoScore === 'number', 'studio page context carries the draft');
  txt = await stText();
  check(/SEO \d+/.test(txt), 'studio panel updates after insertion');
  await st.screenshot({ path: path.join(out, 'studio.png'), fullPage: true });
  check(stErrors.length === 0, `studio page has no JS errors (${stErrors.join('; ')})`);

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
