// Tools the model can call. Each tool validates its input against its JSON schema before running.
import type { CommentItem, JsonSchema, Lang, PageContext, Settings, ToolDef } from '../shared/types.ts';
import { computeMetrics, extractVideoId } from '../shared/metrics.ts';
import { roundNumbers } from './prompts.ts';
import { keywordReport } from './keyword.ts';
import { getCompetitorsState } from './competitors.ts';
import { YouTube, YouTubeError } from './youtube.ts';
import { nativeExec, NativeHostError } from './native.ts';

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface ToolContext {
  settings: Settings;
  lang: Lang;
  tabId: number | null;
  youtube: YouTube;
  getPageContext: (tabId: number | null) => Promise<PageContext | null>;
}

export interface Tool {
  def: ToolDef;
  /** Human-readable one-liner for the UI. */
  summary: (input: Any, lang: Lang) => string;
  run: (input: Any, ctx: ToolContext) => Promise<string>;
}

/** Returns an error message if `input` does not match the schema, otherwise null. */
export function validateInput(schema: JsonSchema, input: unknown): string | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'input must be an object';
  const obj = input as Record<string, unknown>;
  for (const key of schema.required ?? []) if (obj[key] === undefined) return `missing required field "${key}"`;
  for (const [key, val] of Object.entries(obj)) {
    const prop = schema.properties[key];
    if (!prop) continue; // tolerate extra fields
    if (val === undefined || val === null) continue;
    const t = prop.type;
    const ok =
      (t === 'string' && typeof val === 'string') ||
      ((t === 'number' || t === 'integer') && typeof val === 'number' && isFinite(val)) ||
      (t === 'boolean' && typeof val === 'boolean') ||
      (t === 'array' && Array.isArray(val)) ||
      (t === 'object' && typeof val === 'object');
    if (!ok) return `field "${key}" must be of type ${t}`;
    if (prop.enum && typeof val === 'string' && !prop.enum.includes(val)) return `field "${key}" must be one of ${prop.enum.join(', ')}`;
    if (t === 'array' && prop.items && (val as unknown[]).some((x) => typeof x !== prop.items!.type)) return `field "${key}" items must be ${prop.items.type}`;
  }
  return null;
}

const MAX_TEXT = 16000;

function clip(text: string, max = MAX_TEXT): string {
  return text.length > max ? text.slice(0, max) + `\n…[truncated ${text.length - max} characters]` : text;
}

function json(x: unknown): string {
  return clip(JSON.stringify(x, (_k, v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v)));
}

function listRow(v: Any) {
  return roundNumbers({
    id: v.videoId,
    title: v.title,
    channel: v.channelName,
    channel_id: v.channelId ?? v.channelHandle,
    subscribers: v.subscribers,
    views: v.views,
    likes: v.likes,
    comments: v.comments,
    age_hours: v.ageHours,
    published: v.publishedAt ?? v.publishedText,
    vph: v.vph,
    duration_sec: v.durationSec,
    live: v.isLive || undefined,
    short: v.isShort || undefined,
  });
}

function errorText(err: unknown): string {
  if (err instanceof YouTubeError || err instanceof NativeHostError) return `Error: ${err.message}`;
  if (err instanceof Error) return `Error: ${err.message}`;
  return `Error: ${String(err)}`;
}

const T = (ru: string, en: string) => (lang: Lang) => (lang === 'ru' ? ru : en);

export function buildTools(settings: Settings): Tool[] {
  const tools: Tool[] = [];

  tools.push({
    def: {
      name: 'get_page_context',
      description:
        'Returns fresh data about the YouTube page currently open in the browser (video details and metrics, search results, channel, visible comments). Use when the context attached to the message is missing or stale.',
      input_schema: { type: 'object', properties: {}, additionalProperties: false },
    },
    summary: (_i, l) => T('Читаю открытую страницу', 'Reading the open page')(l),
    run: async (_input, ctx) => {
      const pc = await ctx.getPageContext(ctx.tabId);
      if (!pc) return 'No YouTube tab is active (open a video, search or channel on youtube.com).';
      return json(pc);
    },
  });

  tools.push({
    def: {
      name: 'get_video',
      description:
        'Full details and metrics for one video: title, channel, views, likes, comments, publish date, duration, tags, description, VPH, engagement, SEO score, and outlier vs the channel (when include_channel is true).',
      input_schema: {
        type: 'object',
        properties: {
          video: { type: 'string', description: 'Video id or URL' },
          include_channel: { type: 'boolean', description: 'Also fetch the channel baseline (median views) to compute the outlier score. Default true.' },
        },
        required: ['video'],
        additionalProperties: false,
      },
    },
    summary: (i, l) => T(`Данные видео ${i.video}`, `Video data ${i.video}`)(l),
    run: async (input, ctx) => {
      try {
        const v = await ctx.youtube.getVideo(input.video);
        let channelViews: number[] | undefined;
        let channelInfo: Any;
        if (input.include_channel !== false && (v.channelId || v.channelHandle)) {
          try {
            const st = await ctx.youtube.channelStats(v.channelId ?? v.channelHandle!, 25);
            channelViews = st.videos.filter((x) => x.videoId !== v.videoId).map((x) => x.views).filter((x): x is number => x !== undefined);
            channelInfo = { subscribers: st.channel.subscribers ?? v.subscribers, median_views: st.medianViews, uploads_per_week: st.uploadsPerWeek, sample: st.videos.length };
            if (!v.subscribers) v.subscribers = st.channel.subscribers;
          } catch (err) {
            channelInfo = { error: errorText(err) };
          }
        }
        const metrics = computeMetrics(v, ctx.lang, channelViews);
        const out = {
          ...v,
          description: v.description ? clip(v.description, 3000) : undefined,
          captionTracks: undefined,
          caption_languages: v.captionTracks?.map((t) => `${t.lang}${t.auto ? ' (auto)' : ''}`),
          metrics: { ...metrics, seo: metrics.seo ? { score: metrics.seo.score, failed: metrics.seo.checks.filter((c) => !c.ok).map((c) => c.id) } : undefined },
          channel: channelInfo,
        };
        return json(out);
      } catch (err) {
        return errorText(err);
      }
    },
  });

  tools.push({
    def: {
      name: 'search_youtube',
      description: 'Searches YouTube and returns videos with views, age, VPH, duration and channel. Use for competitors, topic research and checking what ranks for a query.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          max_results: { type: 'integer', description: '1–30, default 15', minimum: 1, maximum: 30 },
          order: { type: 'string', enum: ['relevance', 'date', 'viewCount'], description: 'Default relevance' },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
    summary: (i, l) => T(`Поиск YouTube: «${i.query}»`, `YouTube search: "${i.query}"`)(l),
    run: async (input, ctx) => {
      try {
        const res = await ctx.youtube.search(input.query, Math.min(30, input.max_results ?? 15), input.order ?? 'relevance');
        return json({ query: input.query, count: res.length, results: res.map(listRow) });
      } catch (err) {
        return errorText(err);
      }
    },
  });

  tools.push({
    def: {
      name: 'get_channel_videos',
      description:
        "A channel's recent uploads with views/age/VPH plus the channel baseline: median and average views, uploads per week, subscribers. Use to judge whether a video is an outlier and to review a channel.",
      input_schema: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel id (UC…), @handle, or channel URL' },
          max_results: { type: 'integer', description: '5–50, default 25', minimum: 5, maximum: 50 },
        },
        required: ['channel'],
        additionalProperties: false,
      },
    },
    summary: (i, l) => T(`Видео канала ${i.channel}`, `Channel uploads ${i.channel}`)(l),
    run: async (input, ctx) => {
      try {
        const st = await ctx.youtube.channelStats(input.channel, Math.min(50, input.max_results ?? 25));
        const med = st.medianViews;
        const videos = st.videos.map((v) => ({ ...listRow(v), outlier: med && v.views !== undefined ? Math.round((v.views / med) * 100) / 100 : undefined }));
        return json({
          channel: st.channel,
          median_views: st.medianViews,
          avg_views: st.avgViews,
          uploads_per_week: st.uploadsPerWeek,
          sample_size: st.videos.length,
          videos,
        });
      } catch (err) {
        return errorText(err);
      }
    },
  });

  tools.push({
    def: {
      name: 'get_transcript',
      description:
        'Returns the transcript (subtitles) of a video as timestamped text. Prefers manual captions in the requested languages, falls back to auto-generated ones, then to yt-dlp if configured. Long transcripts are paginated with offset_chars.',
      input_schema: {
        type: 'object',
        properties: {
          video: { type: 'string', description: 'Video id or URL' },
          languages: { type: 'array', items: { type: 'string' }, description: 'Preferred language codes in order, e.g. ["ru","en"]' },
          offset_chars: { type: 'integer', description: 'Start offset for long transcripts (default 0)', minimum: 0 },
        },
        required: ['video'],
        additionalProperties: false,
      },
    },
    summary: (i, l) => T(`Субтитры видео ${i.video}`, `Transcript of ${i.video}`)(l),
    run: async (input, ctx) => {
      try {
        const langs: string[] = input.languages?.length ? input.languages : [ctx.lang, 'en'];
        const r = await ctx.youtube.transcript(input.video, langs);
        const offset = input.offset_chars ?? 0;
        const slice = r.text.slice(offset, offset + MAX_TEXT);
        const more = r.text.length > offset + MAX_TEXT;
        return (
          `language: ${r.lang}${r.auto ? ' (auto-generated)' : ''}; source: ${r.source}; available: ${r.available.join(', ') || 'unknown'}; total_chars: ${r.text.length}` +
          (more ? `; next_offset_chars: ${offset + MAX_TEXT}` : '') +
          `\n\n${slice}`
        );
      } catch (err) {
        return errorText(err);
      }
    },
  });

  tools.push({
    def: {
      name: 'get_comments',
      description:
        'Top comments of a video (author, text, likes). Needs a YouTube Data API key; without it only comments already visible on the open page are available via get_page_context.',
      input_schema: {
        type: 'object',
        properties: {
          video: { type: 'string', description: 'Video id or URL' },
          max_results: { type: 'integer', description: '1–100, default 30', minimum: 1, maximum: 100 },
        },
        required: ['video'],
        additionalProperties: false,
      },
    },
    summary: (i, l) => T(`Комментарии к ${i.video}`, `Comments of ${i.video}`)(l),
    run: async (input, ctx) => {
      try {
        const list: CommentItem[] = await ctx.youtube.comments(input.video, input.max_results ?? 30);
        return json({ count: list.length, comments: list.map((c) => ({ ...c, text: clip(c.text, 600) })) });
      } catch (err) {
        // Fallback: comments visible on the open page, if it is the same video.
        const id = extractVideoId(input.video);
        const pc = await ctx.getPageContext(ctx.tabId).catch(() => null);
        if (pc && pc.video?.videoId === id && pc.comments?.length) {
          return json({ note: 'From the open page (no API key): only comments already loaded on screen.', count: pc.comments.length, comments: pc.comments });
        }
        return errorText(err);
      }
    },
  });

  tools.push({
    def: {
      name: 'suggest_keywords',
      description:
        'YouTube autocomplete suggestions for a query — what people actually type. With expand=true also queries the phrase followed by each letter to get long-tail variants.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          language: { type: 'string', description: 'Interface language code for suggestions, e.g. "ru" or "en". Default: extension language.' },
          expand: { type: 'boolean', description: 'Also fetch "<query> a", "<query> b", … (long-tail). Default false.' },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
    summary: (i, l) => T(`Подсказки по запросу «${i.query}»`, `Suggestions for "${i.query}"`)(l),
    run: async (input, ctx) => {
      try {
        const lang = input.language ?? ctx.lang;
        const base = await ctx.youtube.suggestions(input.query, lang);
        const set = new Set(base);
        if (input.expand) {
          const letters = /[Ѐ-ӿ]/.test(input.query) ? 'какчпсвднт'.split('') : 'abcdefhimpstw'.split('');
          const extra = await Promise.all(letters.map((ch) => ctx.youtube.suggestions(`${input.query} ${ch}`, lang).catch(() => [] as string[])));
          for (const list of extra) for (const s of list) set.add(s);
        }
        return json({ query: input.query, suggestions: [...set] });
      } catch (err) {
        return errorText(err);
      }
    },
  });

  tools.push({
    def: {
      name: 'analyze_keyword',
      description:
        'Keyword/topic analysis: searches the query, summarizes the top results (median views, age, how many titles contain the exact phrase, small channels that still rank), fetches autocomplete suggestions, and returns demand and competition estimates (0–100).',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          language: { type: 'string', description: 'Language code for suggestions. Default: extension language.' },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
    summary: (i, l) => T(`Анализ запроса «${i.query}»`, `Keyword analysis "${i.query}"`)(l),
    run: async (input, ctx) => {
      try {
        const r = await keywordReport(ctx.youtube, input.query, input.language ?? ctx.lang);
        return json({
          ...r,
          smallChannelWinners: r.smallChannelWinners.map(listRow),
          topResults: undefined,
          top_results: r.topResults.map(listRow),
          note: 'demand/competition are heuristic estimates (YouTube publishes no search volume).',
        });
      } catch (err) {
        return errorText(err);
      }
    },
  });

  tools.push({
    def: {
      name: 'get_competitors',
      description:
        "The user's tracked competitor channels with their baseline (median views, uploads per week, subscribers), their best recent videos by outlier score, and recent alerts (new videos that beat the channel's baseline). Use for daily ideas, trend spotting and benchmarking.",
      input_schema: { type: 'object', properties: {}, additionalProperties: false },
    },
    summary: (_i, l) => T('Читаю список конкурентов', 'Reading tracked competitors')(l),
    run: async () => {
      const st = await getCompetitorsState();
      if (!st.competitors.length) return 'No competitors tracked yet. The user can add channels with the "+ Competitor" button on a video or channel page.';
      return json({
        competitors: Object.values(st.snapshots).map((s) => roundNumbers({ name: s.name, handle: s.handle, channel_id: s.channelId, subscribers: s.subscribers, median_views: s.medianViews, uploads_per_week: s.uploadsPerWeek, last_upload_age_hours: s.lastUploadAgeHours, top_recent_videos: s.topVideos.map((v) => roundNumbers({ id: v.videoId, title: v.title, views: v.views, age_hours: v.ageHours, vph: v.vph, outlier: v.outlier })) })),
        alerts: st.alerts.slice(0, 30).map((a) => roundNumbers({ channel: a.channelName, id: a.videoId, title: a.title, views: a.views, age_hours: a.ageHours, vph: a.vph, outlier: a.outlier })),
      });
    },
  });

  // Custom APIs registered by the user.
  const apis = settings.customApis.filter((a) => a.name && a.baseUrl);
  if (apis.length) {
    tools.push({
      def: {
        name: 'call_custom_api',
        description:
          'Calls one of the HTTP APIs the user registered in settings. Available APIs:\n' +
          apis.map((a) => `- "${a.name}": base ${a.baseUrl}. ${a.description}`).join('\n'),
        input_schema: {
          type: 'object',
          properties: {
            api: { type: 'string', enum: apis.map((a) => a.name), description: 'API name' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], description: 'Default GET' },
            path: { type: 'string', description: 'Path appended to the base URL, e.g. "/v1/search"' },
            query: { type: 'object', description: 'Query-string parameters' },
            body: { type: 'object', description: 'JSON body for POST/PUT/PATCH' },
          },
          required: ['api', 'path'],
          additionalProperties: false,
        },
      },
      summary: (i, l) => T(`Вызов API ${i.api}: ${i.path}`, `API call ${i.api}: ${i.path}`)(l),
      run: async (input) => {
        const api = apis.find((a) => a.name === input.api);
        if (!api) return `Error: unknown API "${input.api}"`;
        try {
          const u = new URL(String(input.path).replace(/^\//, ''), api.baseUrl.replace(/\/?$/, '/'));
          for (const [k, v] of Object.entries(input.query ?? {})) u.searchParams.set(k, String(v));
          const origin = `${u.protocol}//${u.host}/*`;
          const allowed = await chrome.permissions.contains({ origins: [origin] }).catch(() => false);
          if (!allowed) return `Error: the extension has no permission for ${u.host}. Open Settings → Custom APIs and press "Grant access" for "${api.name}".`;
          const method = (input.method ?? 'GET').toUpperCase();
          const headers: Record<string, string> = { ...api.headers };
          if (input.body && !headers['Content-Type'] && !headers['content-type']) headers['Content-Type'] = 'application/json';
          const res = await fetch(u.toString(), {
            method,
            headers,
            body: input.body && method !== 'GET' ? JSON.stringify(input.body) : undefined,
          });
          const text = await res.text();
          return `HTTP ${res.status}\n${clip(text, 20000)}`;
        } catch (err) {
          return errorText(err);
        }
      },
    });
  }

  // Local programs via the native host.
  const local = settings.localTools.filter((t) => t.name && t.path);
  if (local.length) {
    tools.push({
      def: {
        name: 'run_local_tool',
        description:
          "Runs a program installed on the user's computer (through the Nubit native host) and returns stdout/stderr. Available programs:\n" +
          local.map((t) => `- "${t.name}": ${t.description || t.path}`).join('\n') +
          '\nPass arguments as an array (no shell). Keep outputs small (use --print / -j / --quiet flags). Example: yt-dlp with ["--skip-download","--print","%(title)s","<url>"].',
        input_schema: {
          type: 'object',
          properties: {
            tool: { type: 'string', enum: local.map((t) => t.name) },
            args: { type: 'array', items: { type: 'string' }, description: 'Command-line arguments' },
            timeout_sec: { type: 'integer', description: 'Default 120, max 600', minimum: 1, maximum: 600 },
          },
          required: ['tool', 'args'],
          additionalProperties: false,
        },
      },
      summary: (i, l) => T(`Запуск ${i.tool} ${(i.args ?? []).join(' ').slice(0, 80)}`, `Running ${i.tool} ${(i.args ?? []).join(' ').slice(0, 80)}`)(l),
      run: async (input, ctx) => {
        const tool = local.find((t) => t.name === input.tool);
        if (!tool) return `Error: unknown tool "${input.tool}"`;
        try {
          const r = await nativeExec(ctx.settings.nativeHostName, tool.path, input.args ?? [], {
            timeoutMs: Math.min(600, input.timeout_sec ?? 120) * 1000,
            maxOutput: 60000,
          });
          return `exit code: ${r.code}${r.timedOut ? ' (timed out)' : ''}\n--- stdout ---\n${clip(r.stdout, 30000)}\n--- stderr ---\n${clip(r.stderr, 6000)}`;
        } catch (err) {
          return errorText(err);
        }
      },
    });
  }

  return tools;
}
