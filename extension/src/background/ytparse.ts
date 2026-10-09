// Parsers for YouTube's embedded page data (ytInitialData / ytInitialPlayerResponse).
// Pure functions — no chrome.* access — so they can be unit-tested.
import type { ChannelData, ListVideo, VideoData } from '../shared/types.ts';
import { hasChapters, parseCompactNumber, parseDuration, parseRelativeTimeHours } from '../shared/metrics.ts';

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Extracts the JSON object assigned to `varName` in a YouTube HTML page. */
export function extractJsonVar(html: string, varName: string): unknown | undefined {
  const re = new RegExp(`(?:var\\s+)?${varName}\\s*=\\s*`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const start = m.index + m[0].length;
    if (html[start] !== '{') continue;
    const end = matchBrace(html, start);
    if (end < 0) continue;
    try {
      return JSON.parse(html.slice(start, end + 1));
    } catch {
      continue;
    }
  }
  return undefined;
}

/** Returns the index of the closing brace matching the opening brace at `start`. */
function matchBrace(s: string, start: number): number {
  let depth = 0;
  let inStr = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === '\\') i++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Collects every value stored under `key` anywhere in the object tree. */
export function deepFind(obj: unknown, key: string, maxDepth = 40, limit = 500): unknown[] {
  const out: unknown[] = [];
  const stack: Array<[unknown, number]> = [[obj, 0]];
  while (stack.length && out.length < limit) {
    const [cur, d] = stack.pop()!;
    if (!cur || typeof cur !== 'object' || d > maxDepth) continue;
    if (Array.isArray(cur)) {
      for (let i = cur.length - 1; i >= 0; i--) stack.push([cur[i], d + 1]);
      continue;
    }
    const rec = cur as Record<string, unknown>;
    if (key in rec) out.push(rec[key]);
    const keys = Object.keys(rec);
    for (let i = keys.length - 1; i >= 0; i--) stack.push([rec[keys[i]], d + 1]);
  }
  return out;
}

export function deepFindFirst(obj: unknown, key: string): unknown | undefined {
  return deepFind(obj, key, 40, 1)[0];
}

/** Collects string leaves (used for pattern matching on localized labels). */
export function collectStrings(obj: unknown, limit = 2000): string[] {
  const out: string[] = [];
  const stack: unknown[] = [obj];
  while (stack.length && out.length < limit) {
    const cur = stack.pop();
    if (typeof cur === 'string') {
      out.push(cur);
      continue;
    }
    if (!cur || typeof cur !== 'object') continue;
    if (Array.isArray(cur)) for (const v of cur) stack.push(v);
    else for (const v of Object.values(cur as Record<string, unknown>)) stack.push(v);
  }
  return out;
}

function runsText(x: Any): string | undefined {
  if (!x) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x.simpleText === 'string') return x.simpleText;
  if (Array.isArray(x.runs)) return x.runs.map((r: Any) => r.text ?? '').join('');
  if (typeof x.content === 'string') return x.content;
  return undefined;
}

export function videoFromPlayerResponse(pr: Any, pageUrl?: string): VideoData | undefined {
  const d = pr?.videoDetails;
  if (!d?.videoId) return undefined;
  const mf = pr?.microformat?.playerMicroformatRenderer;
  const thumbs = d.thumbnail?.thumbnails;
  const tracks = pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  const description: string | undefined = d.shortDescription ?? mf?.description?.simpleText;
  const video: VideoData = {
    videoId: d.videoId,
    url: pageUrl ?? `https://www.youtube.com/watch?v=${d.videoId}`,
    title: d.title ?? '',
    channelId: d.channelId,
    channelName: d.author,
    views: d.viewCount !== undefined ? Number(d.viewCount) : undefined,
    durationSec: d.lengthSeconds !== undefined ? Number(d.lengthSeconds) : undefined,
    tags: Array.isArray(d.keywords) ? d.keywords : [],
    description,
    isLive: !!d.isLiveContent,
    publishedAt: mf?.publishDate ?? mf?.uploadDate,
    category: mf?.category,
    thumbnailUrl: Array.isArray(thumbs) && thumbs.length ? thumbs[thumbs.length - 1].url : undefined,
    hasChapters: hasChapters(description),
  };
  if (Array.isArray(tracks)) {
    video.captionTracks = tracks
      .filter((t: Any) => t?.baseUrl)
      .map((t: Any) => ({
        lang: t.languageCode ?? '',
        name: runsText(t.name) ?? t.languageCode ?? '',
        url: t.baseUrl,
        auto: t.kind === 'asr',
      }));
  }
  if (mf?.ownerProfileUrl) {
    const m = String(mf.ownerProfileUrl).match(/\/(@[^/?]+)/);
    if (m) video.channelHandle = m[1];
  }
  return video;
}

function listVideoFromVideoRenderer(r: Any): ListVideo | undefined {
  if (!r?.videoId) return undefined;
  const owner = r.ownerText?.runs?.[0] ?? r.longBylineText?.runs?.[0] ?? r.shortBylineText?.runs?.[0];
  const browse = owner?.navigationEndpoint?.browseEndpoint;
  const viewText = runsText(r.viewCountText) ?? runsText(r.shortViewCountText);
  const publishedText = runsText(r.publishedTimeText);
  const isLive =
    !!r.badges?.some((b: Any) => /LIVE/.test(b?.metadataBadgeRenderer?.style ?? '')) ||
    (!!viewText && /watching|смотр|дивля/i.test(viewText));
  const v: ListVideo = {
    videoId: r.videoId,
    title: runsText(r.title) ?? '',
    channelName: owner?.text,
    channelId: browse?.browseId,
    channelHandle: browse?.canonicalBaseUrl ? String(browse.canonicalBaseUrl).replace(/^\//, '') : undefined,
    views: isLive ? undefined : parseCompactNumber(viewText),
    publishedText,
    ageHours: parseRelativeTimeHours(publishedText),
    durationSec: parseDuration(runsText(r.lengthText)),
    isLive,
    verified: !!r.ownerBadges?.some((b: Any) => /VERIFIED/.test(b?.metadataBadgeRenderer?.style ?? '')),
    description: r.detailedMetadataSnippets?.[0]?.snippetText ? runsText(r.detailedMetadataSnippets[0].snippetText) : undefined,
  };
  if (v.views !== undefined && v.ageHours !== undefined) v.vph = v.views / Math.max(v.ageHours, 1);
  return v;
}

function listVideoFromLockup(l: Any): ListVideo | undefined {
  if (!l?.contentId) return undefined;
  if (l.contentType && !/VIDEO|SHORTS/.test(l.contentType)) return undefined;
  const meta = l.metadata?.lockupMetadataViewModel;
  const title = runsText(meta?.title) ?? '';
  const rows: Any[] = meta?.metadata?.contentMetadataViewModel?.metadataRows ?? [];
  const parts: Any[] = rows.flatMap((row: Any) => row?.metadataParts ?? []);
  // Prefer the accessibility label ("6 days ago", "201 million views") over the compact text ("6d ago", "201M views").
  const texts: string[] = parts.map((p: Any) => (p?.accessibilityLabel as string | undefined) || runsText(p?.text) || '').filter(Boolean);
  const browseIds = deepFind(meta, 'browseEndpoint', 24, 3) as Any[];
  const viewText = texts.find((t) => /view|просмотр|перегляд/i.test(t));
  const ageText = texts.find((t) => /ago|назад|тому/i.test(t));
  const channelName = texts.find((t) => t !== viewText && t !== ageText && !/view|просмотр|перегляд|ago|назад|тому/i.test(t));
  const badges = deepFind(l.contentImage, 'thumbnailBadgeViewModel', 12, 10) as Any[];
  const lengthText = badges.map((b) => runsText(b?.text)).find((t) => t && /^\d+:\d\d/.test(t));
  const isLive = !!viewText && /watching|смотр|дивля/i.test(viewText);
  const v: ListVideo = {
    videoId: l.contentId,
    title,
    channelName,
    channelId: browseIds[0]?.browseId,
    channelHandle: browseIds[0]?.canonicalBaseUrl ? String(browseIds[0].canonicalBaseUrl).replace(/^\//, '') : undefined,
    views: isLive ? undefined : parseCompactNumber(viewText),
    publishedText: ageText,
    ageHours: parseRelativeTimeHours(ageText),
    durationSec: parseDuration(lengthText),
    isLive,
    isShort: /SHORTS/.test(l.contentType ?? ''),
  };
  if (v.views !== undefined && v.ageHours !== undefined) v.vph = v.views / Math.max(v.ageHours, 1);
  return v;
}

function listVideoFromCompact(r: Any): ListVideo | undefined {
  if (!r?.videoId) return undefined;
  const owner = r.longBylineText?.runs?.[0] ?? r.shortBylineText?.runs?.[0];
  const browse = owner?.navigationEndpoint?.browseEndpoint;
  const viewText = runsText(r.viewCountText);
  const publishedText = runsText(r.publishedTimeText);
  const isLive = !!viewText && /watching|смотр|дивля/i.test(viewText);
  const v: ListVideo = {
    videoId: r.videoId,
    title: runsText(r.title) ?? '',
    channelName: owner?.text,
    channelId: browse?.browseId,
    channelHandle: browse?.canonicalBaseUrl ? String(browse.canonicalBaseUrl).replace(/^\//, '') : undefined,
    views: isLive ? undefined : parseCompactNumber(viewText),
    publishedText,
    ageHours: parseRelativeTimeHours(publishedText),
    durationSec: parseDuration(runsText(r.lengthText)),
    isLive,
  };
  if (v.views !== undefined && v.ageHours !== undefined) v.vph = v.views / Math.max(v.ageHours, 1);
  return v;
}

/** All list-style videos (search results, channel uploads, related) found in a data tree. */
export function listVideosFromData(data: unknown): ListVideo[] {
  const out: ListVideo[] = [];
  const seen = new Set<string>();
  const push = (v: ListVideo | undefined) => {
    if (v && !seen.has(v.videoId)) {
      seen.add(v.videoId);
      out.push(v);
    }
  };
  for (const r of deepFind(data, 'videoRenderer')) push(listVideoFromVideoRenderer(r));
  for (const r of deepFind(data, 'gridVideoRenderer')) push(listVideoFromVideoRenderer(r));
  for (const r of deepFind(data, 'compactVideoRenderer')) push(listVideoFromCompact(r));
  for (const r of deepFind(data, 'lockupViewModel')) push(listVideoFromLockup(r));
  return out;
}

export function searchResultsFromData(data: Any): ListVideo[] {
  const root = data?.contents?.twoColumnSearchResultsRenderer ?? data;
  return listVideosFromData(root);
}

export interface WatchExtras {
  likes?: number;
  comments?: number;
  subscribers?: number;
  channelHandle?: string;
  related: ListVideo[];
}

const LIKE_WORD = /like|нравится|лайк|подоба|вподоба/i;

export function parseLikesFromStrings(strings: string[]): number | undefined {
  // "like this video along with 12,345 other people" and localized equivalents.
  for (const s of strings) {
    if (s.length > 160 || !LIKE_WORD.test(s)) continue;
    const m = s.match(/(\d[\d,.\s ]*)/);
    if (!m) continue;
    const n = parseCompactNumber(m[1]);
    if (n !== undefined && n > 0) return n;
  }
  return undefined;
}

export function watchExtrasFromData(data: Any): WatchExtras {
  const results = data?.contents?.twoColumnWatchNextResults?.results?.results ?? data;
  const primary = deepFindFirst(results, 'videoPrimaryInfoRenderer');
  const secondary = deepFindFirst(results, 'videoSecondaryInfoRenderer');
  const extras: WatchExtras = { related: [] };
  if (primary) extras.likes = parseLikesFromStrings(collectStrings(primary, 600));
  const commentCount = deepFindFirst(data, 'commentCount') as Any;
  if (commentCount) extras.comments = parseCompactNumber(runsText(commentCount));
  const subText = deepFindFirst(secondary ?? data, 'subscriberCountText') as Any;
  if (subText) extras.subscribers = parseCompactNumber(runsText(subText));
  const owner = deepFindFirst(secondary ?? data, 'videoOwnerRenderer') as Any;
  const base = owner?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl;
  if (base) extras.channelHandle = String(base).replace(/^\//, '');
  const sec = data?.contents?.twoColumnWatchNextResults?.secondaryResults;
  if (sec) extras.related = listVideosFromData(sec).slice(0, 30);
  return extras;
}

export function channelFromData(data: Any, url?: string): ChannelData {
  const meta = data?.metadata?.channelMetadataRenderer;
  const ch: ChannelData = {
    channelId: meta?.externalId,
    name: meta?.title,
    description: meta?.description,
    url: meta?.channelUrl ?? url,
  };
  const vanity: string | undefined = meta?.vanityChannelUrl;
  if (vanity) {
    const m = vanity.match(/\/(@[^/?]+)/);
    if (m) ch.handle = m[1];
  }
  if (typeof meta?.keywords === 'string' && meta.keywords.trim()) ch.keywords = parseChannelKeywords(meta.keywords);
  const header = data?.header ?? {};
  const strings = collectStrings(header, 400);
  for (const s of strings) {
    if (ch.subscribers === undefined && /subscriber|подписчик|підписник/i.test(s)) ch.subscribers = parseCompactNumber(s);
    else if (ch.videoCount === undefined && /\bvideos?\b|видео|відео/i.test(s) && /^\s*[\d.,\s]+\s*(k|m|тыс|млн)?\.?\s*\S+$/i.test(s))
      ch.videoCount = parseCompactNumber(s);
    else if (!ch.handle && /^@[\w.-]+$/.test(s)) ch.handle = s;
  }
  return ch;
}

/** `"multi word tag" single "another one"` → ["multi word tag", "single", "another one"]. */
export function parseChannelKeywords(raw: string): string[] {
  const out: string[] = [];
  const re = /"([^"]+)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) out.push((m[1] ?? m[2]).trim());
  return out.filter(Boolean);
}

/** Converts YouTube's json3 caption payload into readable timestamped text. */
export function transcriptFromJson3(json: Any, groupSec = 30): string {
  const events: Any[] = json?.events ?? [];
  const lines: string[] = [];
  let bucketStart = -1;
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) lines.push(`[${fmt(bucketStart)}] ${buf.join(' ').replace(/\s+/g, ' ').trim()}`);
    buf = [];
  };
  for (const ev of events) {
    if (!Array.isArray(ev?.segs)) continue;
    const text = ev.segs.map((s: Any) => s?.utf8 ?? '').join('').replace(/\n/g, ' ').trim();
    if (!text) continue;
    const t = Math.floor((ev.tStartMs ?? 0) / 1000);
    if (bucketStart < 0 || t - bucketStart >= groupSec) {
      flush();
      bucketStart = t;
    }
    buf.push(text);
  }
  flush();
  return lines.join('\n');
}

function fmt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
