// Isolated-world content script: orchestrates page detection, the watch overlay, badges and page context.
import type { ChannelStats, PageContext, QuickActionId, RuntimeMessage, Settings, TagRank, VideoData, VideoMetrics } from '../shared/types.ts';
import { loadSettings, onSettingsChanged } from '../shared/settings.ts';
import { setLang } from '../shared/i18n.ts';
import { computeMetrics } from '../shared/metrics.ts';
import { videoFromPlayerResponse, watchExtrasFromData } from '../background/ytparse.ts';
import { askMain } from './bridge.ts';
import { currentVideoId, domChannelHeader, domListVideos, domVisibleComments, domWatchExtras, pageKind, searchQuery } from './extract.ts';
import { createOverlay, type Overlay, type OverlayState } from './overlay.ts';
import { startBadges } from './badges.ts';

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

let settings: Settings;
let overlay: Overlay | null = null;
let overlayState: OverlayState = {};
let currentUrl = '';
let navToken = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function init(): Promise<void> {
  settings = await loadSettings();
  setLang(settings.language);
  onSettingsChanged((s) => {
    settings = s;
    setLang(s.language);
    if (!s.showOverlay) {
      overlay?.remove();
      overlay = null;
    }
    handleNavigation(true);
  });

  const badges = startBadges({ enabled: () => settings.showBadges, outliers: () => settings.computeOutliers });

  const onNav = () => {
    badges.rescan();
    handleNavigation();
  };
  document.addEventListener('yt-navigate-finish', onNav);
  document.addEventListener('yt-page-data-updated', onNav);
  window.addEventListener('popstate', onNav);
  setInterval(() => {
    if (location.href !== currentUrl) onNav();
  }, 1000);
  onNav();

  chrome.runtime.onMessage.addListener((msg: RuntimeMessage, _sender, sendResponse) => {
    if (msg.type === 'getPageContext') {
      buildPageContext().then(sendResponse, () => sendResponse(null));
      return true;
    }
    return undefined;
  });
}

function openPanel(action?: QuickActionId): void {
  chrome.runtime.sendMessage({ type: 'openSidePanel', action } satisfies RuntimeMessage).catch(() => undefined);
}

async function handleNavigation(force = false): Promise<void> {
  if (!force && location.href === currentUrl) return;
  currentUrl = location.href;
  const token = ++navToken;
  const kind = pageKind();
  if (kind !== 'watch') {
    overlay?.remove();
    overlay = null;
    overlayState = {};
    return;
  }
  if (!settings.showOverlay) return;
  await watchFlow(token);
}

async function watchFlow(token: number): Promise<void> {
  const videoId = currentVideoId();
  if (!videoId) return;
  overlayState = {};
  if (!overlay) overlay = createOverlay((a) => (a === 'chat' ? openPanel() : a === 'tagranks' ? void checkTagRanks() : openPanel(a)));
  overlay.update(overlayState);
  mountOverlay(token);

  // 1. Player response from the MAIN world (retry until it matches the current video).
  let video: VideoData | undefined;
  let data: Any = null;
  for (let i = 0; i < 20 && token === navToken; i++) {
    const res = await askMain<{ playerResponse: Any; data: Any }>('watch');
    const v = res?.playerResponse ? videoFromPlayerResponse(res.playerResponse, location.href) : undefined;
    if (v && v.videoId === videoId) {
      video = v;
      data = res?.data;
      break;
    }
    await sleep(500);
  }
  if (token !== navToken) return;
  if (!video) {
    // Last resort: fetch the page through the background (slower, but works).
    return;
  }

  // 2. Extras from the page data (if it belongs to this video) and from the DOM.
  const dataVideoId = data?.currentVideoEndpoint?.watchEndpoint?.videoId;
  if (data && (!dataVideoId || dataVideoId === videoId)) {
    const ex = watchExtrasFromData(data);
    if (ex.likes !== undefined) video.likes = ex.likes;
    if (ex.comments !== undefined) video.comments = ex.comments;
    if (ex.subscribers !== undefined) video.subscribers = ex.subscribers;
    if (ex.channelHandle) video.channelHandle = ex.channelHandle;
  }
  const applyDom = () => {
    const d = domWatchExtras();
    if (d.likes !== undefined) video!.likes = d.likes;
    if (d.subscribers !== undefined) video!.subscribers = d.subscribers;
    if (d.comments !== undefined) video!.comments = d.comments;
    if (d.channelHandle) video!.channelHandle = d.channelHandle;
    if (d.channelId && !video!.channelId) video!.channelId = d.channelId;
  };
  applyDom();

  const refresh = () => {
    overlayState.video = video;
    overlayState.metrics = computeMetrics(video!, settings.language, channelViews);
    overlay?.update(overlayState);
  };
  let channelViews: number[] | undefined;
  refresh();

  // 3. Recent VPH from stored snapshots.
  if (video.views !== undefined) {
    chrome.runtime
      .sendMessage({ type: 'getRecentVph', videoId, views: video.views } satisfies RuntimeMessage)
      .then((r: { vph?: number } | null) => {
        if (token !== navToken || !r || r.vph === undefined) return;
        overlayState.vphRecent = r.vph;
        overlay?.update(overlayState);
      })
      .catch(() => undefined);
  }

  // 4. Outlier vs channel.
  if (settings.computeOutliers && (video.channelId || video.channelHandle)) {
    overlayState.outlierPending = true;
    refresh();
    chrome.runtime
      .sendMessage({ type: 'getChannelStats', channel: video.channelId ?? video.channelHandle! } satisfies RuntimeMessage)
      .then((res: ChannelStats | { error: string } | null) => {
        if (token !== navToken) return;
        overlayState.outlierPending = false;
        if (!res || 'error' in res) {
          overlayState.outlierError = res && 'error' in res ? res.error : undefined;
        } else {
          channelViews = res.videos.filter((x) => x.videoId !== videoId).map((x) => x.views).filter((x): x is number => x !== undefined);
          if (video!.subscribers === undefined) video!.subscribers = res.channel.subscribers;
          overlayState.channelKeywords = res.channel.keywords;
        }
        refresh();
      })
      .catch(() => {
        overlayState.outlierPending = false;
        refresh();
      });
  }

  // 5. Likes / comments often render after the player: poll the DOM for a while.
  for (let i = 0; i < 12 && token === navToken; i++) {
    await sleep(1500);
    const before = JSON.stringify([video.likes, video.comments, video.subscribers]);
    applyDom();
    if (JSON.stringify([video.likes, video.comments, video.subscribers]) !== before) refresh();
    mountOverlay(token);
  }
}

async function checkTagRanks(): Promise<void> {
  const v = overlayState.video;
  if (!v?.tags?.length || overlayState.tagRanksPending) return;
  overlayState.tagRanksPending = true;
  overlay?.update(overlayState);
  try {
    const res = (await chrome.runtime.sendMessage({ type: 'tagRanks', videoId: v.videoId, tags: v.tags.slice(0, 8) } satisfies RuntimeMessage)) as TagRank[] | { error: string } | null;
    if (Array.isArray(res) && overlayState.video?.videoId === v.videoId) overlayState.tagRanks = res;
  } finally {
    overlayState.tagRanksPending = false;
    overlay?.update(overlayState);
  }
}

/** Places the overlay card at the top of the sidebar (or under the player on narrow layouts). */
function mountOverlay(token: number): void {
  if (!overlay || token !== navToken) return;
  const host = overlay.host;
  const secondary = document.querySelector('#secondary-inner');
  const below = document.querySelector('#below');
  const target = secondary && secondary.clientWidth > 0 ? secondary : below;
  if (!target) {
    if (!host.isConnected) setTimeout(() => mountOverlay(token), 700);
    return;
  }
  if (host.parentElement !== target || target.firstElementChild !== host) target.prepend(host);
}

async function buildPageContext(): Promise<PageContext> {
  const kind = pageKind();
  const ctx: PageContext = { kind, url: location.href, title: document.title.replace(/ - YouTube$/, ''), capturedAt: new Date().toISOString() };
  if (kind === 'watch') {
    if (overlayState.video && overlayState.video.videoId === currentVideoId()) {
      ctx.video = overlayState.video;
      const m: VideoMetrics | undefined = overlayState.metrics;
      ctx.metrics = m ? { ...m, vphRecent: overlayState.vphRecent } : undefined;
    } else {
      const res = await askMain<{ playerResponse: Any; data: Any }>('watch');
      const v = res?.playerResponse ? videoFromPlayerResponse(res.playerResponse, location.href) : undefined;
      if (v) {
        Object.assign(v, compact(domWatchExtras()));
        ctx.video = v;
        ctx.metrics = computeMetrics(v, settings.language);
      }
    }
    ctx.related = domListVideos(document.querySelector('#secondary') ?? document, 30).map((x) => x.video);
    ctx.comments = domVisibleComments(20);
  } else if (kind === 'search') {
    ctx.query = searchQuery();
    ctx.results = domListVideos(document.querySelector('ytd-search, #contents') ?? document, 40).map((x) => x.video);
  } else if (kind === 'channel') {
    ctx.channel = domChannelHeader();
    ctx.channelVideos = domListVideos(document, 60).map((x) => x.video);
  } else if (kind === 'home') {
    ctx.results = domListVideos(document, 30).map((x) => x.video);
  } else if (kind === 'shorts') {
    const id = currentVideoId();
    if (id) ctx.video = { videoId: id, url: `https://www.youtube.com/shorts/${id}`, title: ctx.title, isShort: true };
  }
  return ctx;
}

function compact<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) (out as Any)[k] = v;
  return out;
}

init().catch((err) => console.error('[Nubit] init failed', err));
