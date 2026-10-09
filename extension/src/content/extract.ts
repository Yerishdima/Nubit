// DOM-based extraction for the live YouTube page (works after SPA navigations).
import type { ChannelData, CommentItem, ListVideo, PageKind } from '../shared/types.ts';
import { isAgeText, isViewsText, parseCompactNumber, parseDuration, parseRelativeTimeHours } from '../shared/metrics.ts';
import { parseLikesFromStrings } from '../background/ytparse.ts';

export function pageKind(url: string = location.href): PageKind {
  const u = new URL(url);
  if (u.hostname.startsWith('studio.')) return 'studio';
  const p = u.pathname;
  if (p === '/watch') return 'watch';
  if (p === '/results') return 'search';
  if (p === '/' || p === '/feed/subscriptions' || p === '/feed/trending') return 'home';
  if (p.startsWith('/shorts/')) return 'shorts';
  if (/^\/(@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)/.test(p)) return 'channel';
  return 'other';
}

export function currentVideoId(url: string = location.href): string | undefined {
  const u = new URL(url);
  if (u.pathname === '/watch') return u.searchParams.get('v') ?? undefined;
  const m = u.pathname.match(/^\/shorts\/([\w-]{11})/);
  return m?.[1];
}

export function searchQuery(url: string = location.href): string | undefined {
  return new URL(url).searchParams.get('search_query') ?? undefined;
}

function text(el: Element | null | undefined): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function channelFromHref(href: string | null | undefined): { channelId?: string; channelHandle?: string } {
  if (!href) return {};
  const m1 = href.match(/\/channel\/(UC[\w-]{20,})/);
  if (m1) return { channelId: m1[1] };
  const m2 = href.match(/\/(@[^/?#]+)/);
  if (m2) return { channelHandle: m2[1] };
  return {};
}

export interface WatchDomExtras {
  likes?: number;
  subscribers?: number;
  comments?: number;
  channelName?: string;
  channelId?: string;
  channelHandle?: string;
}

export function domWatchExtras(): WatchDomExtras {
  const out: WatchDomExtras = {};
  const likeBtn = document.querySelector('like-button-view-model button[aria-label], #segmented-like-button button[aria-label], ytd-toggle-button-renderer#like-button button[aria-label]');
  const label = likeBtn?.getAttribute('aria-label');
  if (label) out.likes = parseLikesFromStrings([label]);
  if (out.likes === undefined) {
    const short = text(document.querySelector('like-button-view-model .yt-spec-button-shape-next__button-text-content, #segmented-like-button .yt-spec-button-shape-next__button-text-content'));
    if (short && /\d/.test(short)) out.likes = parseCompactNumber(short);
  }
  const subs = text(document.querySelector('ytd-watch-metadata #owner-sub-count, #owner #owner-sub-count'));
  if (subs) out.subscribers = parseCompactNumber(subs);
  const ownerLink = document.querySelector<HTMLAnchorElement>('ytd-watch-metadata #owner ytd-channel-name a, #owner ytd-channel-name a, ytd-video-owner-renderer ytd-channel-name a');
  if (ownerLink) {
    out.channelName = text(ownerLink) || undefined;
    Object.assign(out, channelFromHref(ownerLink.getAttribute('href')));
  }
  const cc = text(document.querySelector('ytd-comments-header-renderer #count, ytd-comments-header-renderer h2'));
  if (cc && /\d/.test(cc)) out.comments = parseCompactNumber(cc);
  return out;
}

export function domVisibleComments(max = 20): CommentItem[] {
  const out: CommentItem[] = [];
  for (const el of document.querySelectorAll('ytd-comment-thread-renderer')) {
    const author = text(el.querySelector('#author-text'));
    const body = text(el.querySelector('#content-text'));
    if (!body) continue;
    const likes = parseCompactNumber(text(el.querySelector('#vote-count-middle')));
    const when = text(el.querySelector('#published-time-text, .published-time-text'));
    out.push({ author, text: body.slice(0, 500), likes, publishedText: when || undefined });
    if (out.length >= max) break;
  }
  return out;
}

export const LIST_SELECTOR =
  'ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-playlist-video-renderer, yt-lockup-view-model';

export interface DomVideoItem {
  el: Element;
  video: ListVideo;
}

/** Extracts list-style video entries (search results, related, channel grid, home) from DOM elements. */
export function domListVideos(root: ParentNode = document, max = 200): DomVideoItem[] {
  const out: DomVideoItem[] = [];
  const seen = new Set<string>();
  for (const el of root.querySelectorAll(LIST_SELECTOR)) {
    if (out.length >= max) break;
    // A lockup nested inside a rich item is handled through the rich item.
    if (el.tagName === 'YT-LOCKUP-VIEW-MODEL' && el.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer')) continue;
    const v = domListVideo(el);
    if (!v || seen.has(v.videoId)) continue;
    seen.add(v.videoId);
    out.push({ el, video: v });
  }
  return out;
}

export function domListVideo(el: Element): ListVideo | undefined {
  const link =
    el.querySelector<HTMLAnchorElement>('a#thumbnail[href*="/watch?v="], a[href*="/watch?v="], a[href*="/shorts/"]') ?? null;
  const href = link?.getAttribute('href') ?? '';
  const id = href.match(/[?&]v=([\w-]{11})/)?.[1] ?? href.match(/\/shorts\/([\w-]{11})/)?.[1];
  if (!id) return undefined;
  const isShort = /\/shorts\//.test(href);
  const titleEl = el.querySelector('#video-title, a.yt-lockup-metadata-view-model-wiz__title, h3 a, .yt-lockup-metadata-view-model__title, h3');
  const title = (titleEl?.getAttribute('title') || titleEl?.getAttribute('aria-label') || text(titleEl) || '').trim();
  const chanLink = el.querySelector<HTMLAnchorElement>(
    'ytd-channel-name a, #channel-name a, .yt-content-metadata-view-model-wiz__metadata-text a, .yt-content-metadata-view-model__metadata-text a, a[href^="/@"], a[href*="/channel/"]',
  );
  let channelName = text(el.querySelector('ytd-channel-name #text, #channel-name #text, ytd-channel-name a')) || (chanLink ? text(chanLink) : '');
  const spans = Array.from(
    el.querySelectorAll(
      '#metadata-line span, span.inline-metadata-item, yt-content-metadata-view-model span, .yt-content-metadata-view-model-wiz__metadata-text, .yt-content-metadata-view-model__metadata-text, #metadata span',
    ),
  )
    .map((s) => text(s))
    .filter((s) => s && s !== '•');
  const viewsText = spans.find(isViewsText);
  const ageText = spans.find(isAgeText);
  if (!channelName) {
    channelName = spans.find((s) => s !== viewsText && s !== ageText && !/view|просмотр|перегляд|ago|назад|тому|watching/i.test(s) && !/^\d/.test(s)) ?? '';
  }
  const durText = Array.from(el.querySelectorAll('ytd-thumbnail-overlay-time-status-renderer span, .yt-badge-shape__text, badge-shape .yt-badge-shape__text, .ytd-thumbnail-overlay-time-status-renderer'))
    .map((s) => text(s))
    .find((s) => /^\d+:\d\d/.test(s));
  const live = !!el.querySelector('[overlay-style="LIVE"], .badge-style-type-live-now, ytd-badge-supported-renderer .badge-style-type-live-now') || /watching|смотр|дивля/i.test(viewsText ?? '');
  const v: ListVideo = {
    videoId: id,
    title,
    channelName: channelName || undefined,
    ...channelFromHref(chanLink?.getAttribute('href')),
    views: live ? undefined : parseCompactNumber(viewsText),
    publishedText: ageText,
    ageHours: parseRelativeTimeHours(ageText),
    durationSec: parseDuration(durText),
    isLive: live,
    isShort,
  };
  if (v.views !== undefined && v.ageHours !== undefined) v.vph = v.views / Math.max(v.ageHours, 1);
  return v;
}

export function domChannelHeader(): ChannelData {
  const ch: ChannelData = { url: location.href.split('?')[0] };
  const root = document.querySelector('#page-header, ytd-c4-tabbed-header-renderer, #channel-header, yt-page-header-renderer');
  const name = text(root?.querySelector('h1, #channel-name, yt-dynamic-text-view-model h1, .page-header-view-model-wiz__page-header-title'));
  if (name) ch.name = name;
  const m = location.pathname.match(/^\/(@[^/]+)/);
  if (m) ch.handle = m[1];
  const idm = location.pathname.match(/^\/channel\/(UC[\w-]{20,})/);
  if (idm) ch.channelId = idm[1];
  const metaLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const canon = metaLink?.getAttribute('href');
  if (!ch.channelId && canon) Object.assign(ch, channelFromHref(canon));
  const strings = Array.from(root?.querySelectorAll('span, yt-formatted-string') ?? []).map((s) => text(s));
  for (const s of strings) {
    if (ch.subscribers === undefined && /subscriber|подписчик|підписник/i.test(s) && /\d/.test(s)) ch.subscribers = parseCompactNumber(s);
    else if (ch.videoCount === undefined && /\bvideos?\b|видео|відео/i.test(s) && /^\s*[\d.,\s]+\s*(k|m|тыс|млн)?\.?\s*\S+$/i.test(s)) ch.videoCount = parseCompactNumber(s);
    else if (!ch.handle && /^@[\w.-]+$/.test(s)) ch.handle = s;
  }
  const desc = text(document.querySelector('#page-header yt-description-preview-view-model, #channel-header #description, yt-description-preview-view-model'));
  if (desc) ch.description = desc.slice(0, 500);
  return ch;
}
