// YouTube data access. Uses the YouTube Data API v3 when a key is configured,
// otherwise parses the public page data (ytInitialData / ytInitialPlayerResponse).
import type { ChannelData, ChannelStats, CommentItem, ListVideo, Settings, TagRank, VideoData } from '../shared/types.ts';
import { ageHoursFromIso, extractVideoId, hasChapters, median, parseIsoDuration } from '../shared/metrics.ts';
import {
  channelFromData,
  extractJsonVar,
  listVideosFromData,
  searchResultsFromData,
  transcriptFromJson3,
  videoFromPlayerResponse,
  watchExtrasFromData,
} from './ytparse.ts';
import { getCachedChannel, setCachedChannel } from './store.ts';
import { nativeSubtitles } from './native.ts';

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export class YouTubeError extends Error {}

const API = 'https://www.googleapis.com/youtube/v3';

export interface TranscriptResult {
  lang: string;
  auto: boolean;
  source: 'page' | 'yt-dlp';
  text: string;
  available: string[];
}

export class YouTube {
  private readonly getSettings: () => Promise<Settings>;

  constructor(getSettings: () => Promise<Settings>) {
    this.getSettings = getSettings;
  }

  // ---- HTTP helpers -----------------------------------------------------

  private async fetchHtml(url: string): Promise<string> {
    const u = new URL(url);
    u.searchParams.set('hl', 'en');
    const res = await fetch(u.toString(), {
      credentials: 'include',
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
    });
    if (!res.ok) throw new YouTubeError(`YouTube returned HTTP ${res.status} for ${u.pathname}`);
    const html = await res.text();
    if (/consent\.youtube\.com|action="https:\/\/consent\./.test(html) && !/ytInitialData/.test(html)) {
      throw new YouTubeError('YouTube asks for cookie consent. Open youtube.com in a tab, accept the consent dialog and retry.');
    }
    return html;
  }

  private async api<T = Any>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
    const s = await this.getSettings();
    if (!s.youtubeApiKey) throw new YouTubeError('YouTube Data API key is not configured');
    const u = new URL(`${API}/${path}`);
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') u.searchParams.set(k, String(v));
    u.searchParams.set('key', s.youtubeApiKey);
    const res = await fetch(u.toString());
    const json = (await res.json().catch(() => ({}))) as Any;
    if (!res.ok) {
      const msg = json?.error?.message ?? `HTTP ${res.status}`;
      if (/quota/i.test(msg)) throw new YouTubeError('YouTube Data API quota exceeded for today (falling back to page parsing where possible).');
      throw new YouTubeError(`YouTube Data API error: ${msg}`);
    }
    return json as T;
  }

  private async hasKey(): Promise<boolean> {
    return !!(await this.getSettings()).youtubeApiKey;
  }

  // ---- videos -----------------------------------------------------------

  async getVideo(idOrUrl: string): Promise<VideoData> {
    const id = extractVideoId(idOrUrl);
    if (!id) throw new YouTubeError(`Cannot find a video id in "${idOrUrl}"`);
    if (await this.hasKey()) {
      try {
        const [v] = await this.apiVideos([id]);
        if (v) {
          // Caption tracks come only from the page; fetch lazily in getTranscript.
          return v;
        }
      } catch (err) {
        if (!(err instanceof YouTubeError) || !/quota/i.test(err.message)) throw err;
      }
    }
    return this.pageVideo(id);
  }

  /** Full video details from the watch page (no API key needed). */
  async pageVideo(id: string): Promise<VideoData> {
    const url = `https://www.youtube.com/watch?v=${id}`;
    const html = await this.fetchHtml(url);
    const pr = extractJsonVar(html, 'ytInitialPlayerResponse');
    const video = videoFromPlayerResponse(pr, url);
    if (!video) throw new YouTubeError(`Could not read video data for ${id} (private, removed or blocked?)`);
    const data = extractJsonVar(html, 'ytInitialData');
    if (data) {
      const extras = watchExtrasFromData(data);
      video.likes = extras.likes;
      video.comments = extras.comments;
      video.subscribers = extras.subscribers;
      if (extras.channelHandle) video.channelHandle = extras.channelHandle;
    }
    return video;
  }

  /** Batch video details via the Data API (up to 50 ids). */
  async apiVideos(ids: string[]): Promise<VideoData[]> {
    const out: VideoData[] = [];
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      const json = await this.api('videos', { part: 'snippet,statistics,contentDetails', id: chunk.join(',') });
      for (const it of json.items ?? []) {
        const sn = it.snippet ?? {};
        const st = it.statistics ?? {};
        const description = sn.description;
        out.push({
          videoId: it.id,
          url: `https://www.youtube.com/watch?v=${it.id}`,
          title: sn.title ?? '',
          channelId: sn.channelId,
          channelName: sn.channelTitle,
          publishedAt: sn.publishedAt,
          description,
          tags: sn.tags ?? [],
          category: sn.categoryId,
          views: st.viewCount !== undefined ? Number(st.viewCount) : undefined,
          likes: st.likeCount !== undefined ? Number(st.likeCount) : undefined,
          comments: st.commentCount !== undefined ? Number(st.commentCount) : undefined,
          durationSec: parseIsoDuration(it.contentDetails?.duration),
          isLive: sn.liveBroadcastContent === 'live',
          thumbnailUrl: sn.thumbnails?.maxres?.url ?? sn.thumbnails?.high?.url,
          hasChapters: hasChapters(description),
        });
      }
    }
    // Attach channel subscriber counts (one call per 50 channels).
    const chIds = [...new Set(out.map((v) => v.channelId).filter((x): x is string => !!x))];
    if (chIds.length) {
      const subs = await this.apiChannelSubs(chIds).catch(() => ({}) as Record<string, { subscribers?: number; videoCount?: number; handle?: string }>);
      for (const v of out) {
        const c = v.channelId ? subs[v.channelId] : undefined;
        if (c) {
          v.subscribers = c.subscribers;
          v.channelVideoCount = c.videoCount;
          v.channelHandle = c.handle;
        }
      }
    }
    return out;
  }

  private async apiChannelSubs(ids: string[]): Promise<Record<string, { subscribers?: number; videoCount?: number; handle?: string }>> {
    const out: Record<string, { subscribers?: number; videoCount?: number; handle?: string }> = {};
    for (let i = 0; i < ids.length; i += 50) {
      const json = await this.api('channels', { part: 'snippet,statistics', id: ids.slice(i, i + 50).join(',') });
      for (const it of json.items ?? []) {
        out[it.id] = {
          subscribers: it.statistics?.subscriberCount !== undefined ? Number(it.statistics.subscriberCount) : undefined,
          videoCount: it.statistics?.videoCount !== undefined ? Number(it.statistics.videoCount) : undefined,
          handle: it.snippet?.customUrl,
        };
      }
    }
    return out;
  }

  private toList(v: VideoData): ListVideo {
    const ageHours = ageHoursFromIso(v.publishedAt);
    return {
      videoId: v.videoId,
      title: v.title,
      channelName: v.channelName,
      channelId: v.channelId,
      channelHandle: v.channelHandle,
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      publishedAt: v.publishedAt,
      ageHours,
      durationSec: v.durationSec,
      vph: v.views !== undefined && ageHours !== undefined ? v.views / Math.max(ageHours, 1) : undefined,
      isLive: v.isLive,
      subscribers: v.subscribers,
      description: v.description?.slice(0, 200),
    };
  }

  // ---- search -----------------------------------------------------------

  async search(query: string, maxResults = 15, order: 'relevance' | 'date' | 'viewCount' = 'relevance'): Promise<ListVideo[]> {
    maxResults = Math.max(1, Math.min(50, maxResults));
    if (await this.hasKey()) {
      try {
        const json = await this.api('search', { part: 'snippet', type: 'video', q: query, maxResults, order });
        const ids = (json.items ?? []).map((it: Any) => it.id?.videoId).filter(Boolean);
        const vids = await this.apiVideos(ids);
        const byId = new Map(vids.map((v) => [v.videoId, v]));
        return ids.map((id: string) => byId.get(id)).filter(Boolean).map((v: VideoData) => this.toList(v));
      } catch (err) {
        if (!(err instanceof YouTubeError) || !/quota/i.test(err.message)) throw err;
      }
    }
    const sp = order === 'date' ? '&sp=CAI%253D' : order === 'viewCount' ? '&sp=CAM%253D' : '';
    const html = await this.fetchHtml(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}${sp}`);
    const data = extractJsonVar(html, 'ytInitialData');
    if (!data) throw new YouTubeError('Could not parse search results page');
    return searchResultsFromData(data).slice(0, maxResults);
  }

  /** Search through the public results page only (no API quota). */
  async searchPage(query: string, maxResults = 20, order: 'relevance' | 'date' | 'viewCount' = 'relevance'): Promise<ListVideo[]> {
    const sp = order === 'date' ? '&sp=CAI%253D' : order === 'viewCount' ? '&sp=CAM%253D' : '';
    const html = await this.fetchHtml(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}${sp}`);
    const data = extractJsonVar(html, 'ytInitialData');
    if (!data) throw new YouTubeError('Could not parse search results page');
    return searchResultsFromData(data).slice(0, maxResults);
  }

  /** Position of `videoId` in YouTube search for each tag (vidIQ's "ranked tags"); cached for the session. */
  async tagRanks(videoId: string, tags: string[]): Promise<TagRank[]> {
    const key = 'tagRanks';
    const all = ((await chrome.storage.session.get(key))[key] ?? {}) as Record<string, TagRank & { t: number }>;
    const out: TagRank[] = [];
    for (const tag of tags.slice(0, 8)) {
      const ck = `${videoId}|${tag.toLowerCase()}`;
      const hit = all[ck];
      if (hit && Date.now() - hit.t < 6 * 3600 * 1000) {
        out.push({ tag, rank: hit.rank, checked: hit.checked });
        continue;
      }
      try {
        const res = await this.searchPage(tag, 20);
        const idx = res.findIndex((v) => v.videoId === videoId);
        const r: TagRank = { tag, rank: idx >= 0 ? idx + 1 : null, checked: res.length };
        all[ck] = { ...r, t: Date.now() };
        out.push(r);
      } catch (err) {
        out.push({ tag, rank: null, checked: 0 });
        if (err instanceof YouTubeError && /consent|HTTP 429/.test(err.message)) break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    const keys = Object.keys(all);
    if (keys.length > 500) keys.sort((a, b) => all[a].t - all[b].t).slice(0, keys.length - 500).forEach((k) => delete all[k]);
    await chrome.storage.session.set({ [key]: all });
    return out;
  }

  // ---- channels ---------------------------------------------------------

  /** Accepts "UC…", "@handle", or any channel/video URL. */
  async channelStats(channelRef: string, maxVideos = 25, useCache = true): Promise<ChannelStats> {
    const ref = normalizeChannelRef(channelRef);
    if (useCache) {
      const cached = await getCachedChannel(ref.key);
      if (cached && cached.videos.length >= Math.min(maxVideos, cached.videos.length)) return cached;
    }
    let stats: ChannelStats | undefined;
    if (await this.hasKey()) {
      try {
        stats = await this.apiChannelStats(ref, maxVideos);
      } catch (err) {
        if (!(err instanceof YouTubeError) || !/quota/i.test(err.message)) throw err;
      }
    }
    if (!stats) stats = await this.pageChannelStats(ref, maxVideos);
    const keys = [ref.key, stats.channel.channelId ?? '', stats.channel.handle ?? ''].filter(Boolean);
    await setCachedChannel(keys, stats);
    return stats;
  }

  private async apiChannelStats(ref: ChannelRef, maxVideos: number): Promise<ChannelStats> {
    const params: Record<string, string> = { part: 'snippet,statistics,contentDetails' };
    if (ref.kind === 'id') params.id = ref.value;
    else if (ref.kind === 'handle') params.forHandle = ref.value;
    else {
      // /c/name or /user/name — resolve through the page first
      const html = await this.fetchHtml(`https://www.youtube.com/${ref.value}`);
      const data = extractJsonVar(html, 'ytInitialData');
      const ch = channelFromData(data);
      if (!ch.channelId) throw new YouTubeError(`Could not resolve channel "${ref.value}"`);
      params.id = ch.channelId;
    }
    const json = await this.api('channels', params);
    const it = json.items?.[0];
    if (!it) throw new YouTubeError(`Channel not found: ${ref.value}`);
    const channel: ChannelData = {
      channelId: it.id,
      name: it.snippet?.title,
      handle: it.snippet?.customUrl,
      description: it.snippet?.description,
      subscribers: it.statistics?.subscriberCount !== undefined ? Number(it.statistics.subscriberCount) : undefined,
      videoCount: it.statistics?.videoCount !== undefined ? Number(it.statistics.videoCount) : undefined,
      url: `https://www.youtube.com/channel/${it.id}`,
    };
    const uploads = it.contentDetails?.relatedPlaylists?.uploads ?? `UU${String(it.id).slice(2)}`;
    const pl = await this.api('playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: Math.min(50, maxVideos) });
    const ids = (pl.items ?? []).map((p: Any) => p.contentDetails?.videoId).filter(Boolean);
    const vids = await this.apiVideos(ids);
    const videos = vids.map((v) => this.toList(v));
    return finishStats(channel, videos);
  }

  private async pageChannelStats(ref: ChannelRef, maxVideos: number): Promise<ChannelStats> {
    const base = ref.kind === 'id' ? `channel/${ref.value}` : ref.kind === 'handle' ? ref.value : ref.value;
    const html = await this.fetchHtml(`https://www.youtube.com/${base}/videos`);
    const data = extractJsonVar(html, 'ytInitialData');
    if (!data) throw new YouTubeError(`Could not parse channel page for ${ref.value}`);
    const channel = channelFromData(data, `https://www.youtube.com/${base}`);
    const videos = listVideosFromData(data)
      .filter((v) => !v.isLive && !v.isShort)
      .slice(0, maxVideos);
    return finishStats(channel, videos);
  }

  // ---- comments ---------------------------------------------------------

  async comments(idOrUrl: string, maxResults = 30): Promise<CommentItem[]> {
    const id = extractVideoId(idOrUrl);
    if (!id) throw new YouTubeError(`Cannot find a video id in "${idOrUrl}"`);
    if (!(await this.hasKey())) throw new YouTubeError('Reading comments requires a YouTube Data API key (Settings → YouTube Data API).');
    const json = await this.api('commentThreads', {
      part: 'snippet',
      videoId: id,
      maxResults: Math.max(1, Math.min(100, maxResults)),
      order: 'relevance',
      textFormat: 'plainText',
    });
    return (json.items ?? []).map((it: Any) => {
      const c = it.snippet?.topLevelComment?.snippet ?? {};
      return {
        author: c.authorDisplayName ?? '',
        text: c.textDisplay ?? c.textOriginal ?? '',
        likes: c.likeCount !== undefined ? Number(c.likeCount) : undefined,
        publishedText: c.publishedAt,
        replies: it.snippet?.totalReplyCount !== undefined ? Number(it.snippet.totalReplyCount) : undefined,
      };
    });
  }

  // ---- suggestions ------------------------------------------------------

  async suggestions(query: string, lang = 'en'): Promise<string[]> {
    const u = new URL('https://suggestqueries.google.com/complete/search');
    u.searchParams.set('client', 'firefox');
    u.searchParams.set('ds', 'yt');
    u.searchParams.set('hl', lang);
    u.searchParams.set('q', query);
    const res = await fetch(u.toString());
    if (!res.ok) throw new YouTubeError(`Suggestions request failed (HTTP ${res.status})`);
    const json = (await res.json()) as Any;
    return Array.isArray(json?.[1]) ? json[1].map((x: Any) => (Array.isArray(x) ? x[0] : x)).filter((x: Any) => typeof x === 'string') : [];
  }

  // ---- transcript -------------------------------------------------------

  async transcript(idOrUrl: string, preferredLangs: string[] = []): Promise<TranscriptResult> {
    const id = extractVideoId(idOrUrl);
    if (!id) throw new YouTubeError(`Cannot find a video id in "${idOrUrl}"`);
    const url = `https://www.youtube.com/watch?v=${id}`;
    let tracks: VideoData['captionTracks'] = [];
    let pageErr: string | undefined;
    try {
      const html = await this.fetchHtml(url);
      const pr = extractJsonVar(html, 'ytInitialPlayerResponse');
      tracks = videoFromPlayerResponse(pr, url)?.captionTracks ?? [];
    } catch (err) {
      pageErr = err instanceof Error ? err.message : String(err);
    }
    const available = tracks.map((t) => `${t.lang}${t.auto ? ' (auto)' : ''}`);
    const pick = pickTrack(tracks, preferredLangs);
    if (pick) {
      try {
        const res = await fetch(pick.url + '&fmt=json3', { credentials: 'include' });
        if (res.ok) {
          const text = (await res.text()).trim();
          if (text.startsWith('{')) {
            const t = transcriptFromJson3(JSON.parse(text));
            if (t) return { lang: pick.lang, auto: pick.auto, source: 'page', text: t, available };
          }
        }
      } catch {
        /* fall through to yt-dlp */
      }
    }
    // Fallback: yt-dlp through the native host
    const s = await this.getSettings();
    const ytdlp = s.localTools.find((t) => t.name === 'yt-dlp' && t.path);
    if (ytdlp) {
      const r = await nativeSubtitles(s.nativeHostName, ytdlp.path, url, preferredLangs.length ? preferredLangs : ['en']);
      if (r?.text) return { lang: r.lang, auto: r.auto, source: 'yt-dlp', text: r.text, available: r.available ?? available };
      throw new YouTubeError('yt-dlp found no subtitles for this video');
    }
    if (pageErr) throw new YouTubeError(`Could not load the video page: ${pageErr}`);
    if (!tracks.length) throw new YouTubeError('This video has no caption tracks. Configure yt-dlp in Settings → Local tools to extract subtitles anyway.');
    throw new YouTubeError('Caption download was blocked by YouTube. Configure yt-dlp in Settings → Local tools as a fallback.');
  }
}

// ---- helpers --------------------------------------------------------------

interface ChannelRef {
  kind: 'id' | 'handle' | 'path';
  value: string;
  key: string;
}

export function normalizeChannelRef(input: string): ChannelRef {
  let s = input.trim();
  try {
    if (/^https?:\/\//.test(s)) {
      const u = new URL(s);
      s = u.pathname.replace(/^\/+|\/+$/g, '');
      s = s.split('/').slice(0, 2).join('/');
      if (/^(watch|shorts)/.test(s)) throw new YouTubeError('Pass a channel (UC…, @handle or channel URL), not a video URL');
    }
  } catch (err) {
    if (err instanceof YouTubeError) throw err;
  }
  s = s.replace(/^\/+/, '');
  if (/^UC[\w-]{20,}$/.test(s)) return { kind: 'id', value: s, key: s };
  const m = s.match(/^channel\/(UC[\w-]{20,})/);
  if (m) return { kind: 'id', value: m[1], key: m[1] };
  if (/^@/.test(s)) {
    const h = s.split('/')[0];
    return { kind: 'handle', value: h, key: h.toLowerCase() };
  }
  if (/^(c|user)\//.test(s)) return { kind: 'path', value: s.split('/').slice(0, 2).join('/'), key: s.toLowerCase() };
  if (/^[\w.-]+$/.test(s)) return { kind: 'handle', value: '@' + s, key: ('@' + s).toLowerCase() };
  throw new YouTubeError(`Unrecognized channel reference: ${input}`);
}

function finishStats(channel: ChannelData, videos: ListVideo[]): ChannelStats {
  const viewsArr = videos.map((v) => v.views).filter((x): x is number => x !== undefined);
  const ages = videos.map((v) => v.ageHours ?? ageHoursFromIso(v.publishedAt)).filter((x): x is number => x !== undefined);
  let uploadsPerWeek: number | undefined;
  if (ages.length >= 2) {
    const span = Math.max(...ages) - Math.min(...ages);
    if (span > 0) uploadsPerWeek = ((ages.length - 1) / span) * 168;
  }
  return {
    channel,
    videos,
    medianViews: median(viewsArr),
    avgViews: viewsArr.length ? viewsArr.reduce((a, b) => a + b, 0) / viewsArr.length : undefined,
    uploadsPerWeek,
    fetchedAt: Date.now(),
  };
}

function pickTrack(tracks: NonNullable<VideoData['captionTracks']>, preferred: string[]) {
  if (!tracks.length) return undefined;
  const prefs = preferred.map((p) => p.toLowerCase());
  for (const p of prefs) {
    const manual = tracks.find((t) => t.lang.toLowerCase().startsWith(p) && !t.auto);
    if (manual) return manual;
  }
  for (const p of prefs) {
    const auto = tracks.find((t) => t.lang.toLowerCase().startsWith(p));
    if (auto) return auto;
  }
  return tracks.find((t) => !t.auto) ?? tracks[0];
}
