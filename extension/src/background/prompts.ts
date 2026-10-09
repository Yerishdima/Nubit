import type { Lang, PageContext, QuickActionId, Settings } from '../shared/types.ts';

const LANG_NAME: Record<Lang, string> = { ru: 'Russian', en: 'English' };

/**
 * The system prompt is deliberately static for a given settings snapshot (no dates, no page data):
 * a stable prefix keeps prompt caching effective and keeps replayed thinking blocks valid.
 */
export function buildSystemPrompt(s: Settings, capabilities: { nativeTools: string[]; customApis: string[]; youtubeApi: boolean }): string {
  const lines: string[] = [];
  lines.push(
    `You are Nubit, an expert YouTube growth analyst built into a Chrome extension. You help creators understand why videos perform, research keywords and topics, write titles/descriptions/tags, study competitors and plan content.`,
    ``,
    `You can see the page the user has open on YouTube (it is attached to messages as <page_context>), and you have tools to search YouTube, read video details, channel uploads, transcripts, comments and keyword suggestions.`,
    ``,
    `How to work:`,
    `- Lead with the insight, then the evidence. Be concrete: numbers, examples, rewritten titles. No filler, no generic advice that ignores the data.`,
    `- Use tools when the answer depends on data you do not have yet (competitors, channel baseline, transcript, comments). Do not call tools for things already in the page context. Prefer a few well-chosen calls; run independent calls in parallel.`,
    `- Metric definitions: VPH = views per hour since publish (lifetime average; "vphRecent" is measured by the extension between two visits). Outlier = views divided by the median views of the channel's recent uploads (≥2x means the video beat its own channel; <0.5x underperformed). Engagement = (likes + comments) / views; 3–6% is typical, >8% is strong. SEO score is a checklist (title length, keyword reuse, tags, chapters…), not a ranking prediction.`,
    `- "Demand" and "competition" from analyze_keyword are estimates derived from autocomplete and the top results — YouTube publishes no search volume. Say so when it matters.`,
    `- Titles: give 5–8 variants, ≤ 70 characters, specific, in the video's language; one short note on the angle of each. Avoid misleading clickbait.`,
    `- Tags: 10–20, mix exact phrase, broad topic and spelling variants. Descriptions: the first two lines carry the main keyword and the hook; then chapters, links, hashtags.`,
    `- When comparing videos or channels, use a compact table.`,
    `- Be honest about uncertainty and about missing data (e.g. comments need a YouTube Data API key; a private video cannot be read). Suggest the concrete setting to enable when a tool is unavailable.`,
    `- Format with short headings, bullet lists and tables. Keep answers compact.`,
    `- Respond in ${LANG_NAME[s.language]} unless the user writes in another language — then answer in the user's language. Keep video titles, tags and quotes in their original language.`,
  );
  lines.push(``, `Environment:`);
  lines.push(`- YouTube Data API key: ${capabilities.youtubeApi ? 'configured (comments, exact statistics and search available)' : 'not configured (public page data only; comments only from the open page)'}.`);
  lines.push(
    capabilities.nativeTools.length
      ? `- Local programs available through run_local_tool: ${capabilities.nativeTools.join(', ')}.`
      : `- No local programs configured (the user can add yt-dlp/ffmpeg in Settings → Local tools).`,
  );
  lines.push(
    capabilities.customApis.length
      ? `- Custom APIs available through call_custom_api: ${capabilities.customApis.join(', ')}.`
      : `- No custom APIs configured.`,
  );
  return lines.join('\n');
}

const ACTION_PROMPTS: Record<QuickActionId, Record<Lang, string>> = {
  analyze_video: {
    ru: 'Сделай полный разбор этого видео: как оно набирает (VPH, outlier относительно канала, вовлечённость), что в названии/описании/тегах работает и что нет, 3–5 конкретных улучшений. Если нужен контекст канала — получи его инструментом.',
    en: 'Give a full breakdown of this video: how it is performing (VPH, outlier vs the channel, engagement), what works and what does not in the title/description/tags, and 3–5 concrete improvements. Fetch channel context with a tool if needed.',
  },
  why_performing: {
    ru: 'Объясни, почему это видео набирает именно так (сильно лучше или хуже канала). Сравни с последними видео канала (инструмент get_channel_videos), посмотри тему, подачу названия, превью-слова, длительность. Дай вывод: что повторить, чего избегать.',
    en: 'Explain why this video performs the way it does (much better or worse than the channel). Compare with the channel\'s recent uploads (get_channel_videos), look at the topic, title framing, duration. Conclude: what to repeat, what to avoid.',
  },
  titles: {
    ru: 'Предложи 8 вариантов названия для этого видео под разные углы (польза, любопытство, цифры, вопрос, контраст). Коротко объясни логику каждого. Учитывай, что названия в поиске обрезаются после ~60 символов.',
    en: 'Propose 8 title options for this video with different angles (benefit, curiosity, numbers, question, contrast). Briefly explain each. Remember titles get cut after ~60 characters in search.',
  },
  tags_description: {
    ru: 'Напиши оптимизированное описание (первые 2 строки — ключевой запрос и крючок, затем структура, главы если уместно, хэштеги) и список из 15–20 тегов для этого видео. Если видео уже имеет описание и теги — укажи, что именно улучшено.',
    en: 'Write an optimized description (first 2 lines: main keyword and hook, then structure, chapters if relevant, hashtags) and a list of 15–20 tags for this video. If it already has them, point out what changed and why.',
  },
  keyword_research: {
    ru: 'Проанализируй этот поисковый запрос как тему для видео: спрос и конкуренция (analyze_keyword), кто в топе и почему, какие небольшие каналы пробились, 5–10 смежных запросов из подсказок, и рекомендация — стоит ли снимать и под каким углом.',
    en: 'Analyze this search query as a video topic: demand and competition (analyze_keyword), who ranks and why, which small channels broke through, 5–10 related queries from suggestions, and a recommendation on whether and how to make it.',
  },
  channel_review: {
    ru: 'Сделай разбор этого канала по последним видео: частота публикаций, медиана просмотров, какие видео стали outlier и что их объединяет (темы, форматы, названия), какие провалились, 5 рекомендаций по контент-плану.',
    en: 'Review this channel from its recent uploads: upload cadence, median views, which videos became outliers and what they share (topics, formats, titles), which flopped, and 5 content-plan recommendations.',
  },
  competitors: {
    ru: 'Найди 5–8 конкурирующих видео по теме этого видео (search_youtube), сравни их в таблице (просмотры, возраст, VPH, канал, длительность, угол названия) и скажи, чем это видео может выделиться.',
    en: 'Find 5–8 competing videos on this video\'s topic (search_youtube), compare them in a table (views, age, VPH, channel, duration, title angle) and say how this video can stand out.',
  },
  content_ideas: {
    ru: 'На основе контекста (канал или тема) предложи 10 идей для новых видео, которые с большой вероятностью наберут: для каждой — рабочее название, почему сработает (данные из поиска/подсказок), формат и длительность. Проверь спрос инструментами хотя бы для 3 лучших.',
    en: 'Based on the context (channel or topic), propose 10 new video ideas likely to perform: for each a working title, why it will work (search/suggestion data), format and length. Verify demand with tools for at least the top 3.',
  },
  summarize: {
    ru: 'Получи субтитры этого видео (get_transcript) и кратко перескажи: о чём видео, ключевые тезисы по таймкодам, главный вывод. Если субтитров нет — скажи, как их включить.',
    en: 'Get this video\'s transcript (get_transcript) and summarize it: what it is about, key points with timestamps, main takeaway. If there is no transcript, explain how to enable one.',
  },
};

export function actionPrompt(action: QuickActionId, lang: Lang): string {
  return ACTION_PROMPTS[action][lang];
}

/** Trims the page context to what the model needs and renders it as a tagged block. */
export function renderPageContext(ctx: PageContext | null | undefined): string {
  if (!ctx) return '<page_context>none (no YouTube tab is active)</page_context>';
  const c: Record<string, unknown> = {
    kind: ctx.kind,
    url: ctx.url,
    page_title: ctx.title,
    captured_at: ctx.capturedAt,
  };
  if (ctx.video) {
    const v = { ...ctx.video };
    if (v.description && v.description.length > 2000) v.description = v.description.slice(0, 2000) + ' …[truncated]';
    delete v.captionTracks;
    c.video = v;
    if (ctx.video.captionTracks?.length) c.caption_languages = ctx.video.captionTracks.map((t) => `${t.lang}${t.auto ? ' (auto)' : ''}`);
  }
  if (ctx.metrics) {
    const m = { ...ctx.metrics };
    if (m.seo) c.seo = { score: m.seo.score, failed_checks: m.seo.checks.filter((x) => !x.ok).map((x) => x.id) };
    delete m.seo;
    c.metrics = roundNumbers(m);
  }
  if (ctx.query) c.search_query = ctx.query;
  if (ctx.results?.length) c.search_results = ctx.results.slice(0, 20).map(compactListVideo);
  if (ctx.related?.length) c.related_videos = ctx.related.slice(0, 12).map(compactListVideo);
  if (ctx.channel) c.channel = ctx.channel;
  if (ctx.channelVideos?.length) c.channel_videos = ctx.channelVideos.slice(0, 30).map(compactListVideo);
  if (ctx.comments?.length) c.visible_comments = ctx.comments.slice(0, 20);
  return `<page_context>\n${JSON.stringify(c, null, 0)}\n</page_context>`;
}

function compactListVideo(v: PageContext['results'] extends (infer T)[] | undefined ? T : never) {
  return roundNumbers({
    id: v.videoId,
    title: v.title,
    channel: v.channelName,
    channel_id: v.channelId,
    views: v.views,
    age_hours: v.ageHours,
    vph: v.vph,
    duration_sec: v.durationSec,
    subscribers: v.subscribers,
    live: v.isLive || undefined,
    short: v.isShort || undefined,
  });
}

export function roundNumbers<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[k] = typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v;
  }
  return out as T;
}
