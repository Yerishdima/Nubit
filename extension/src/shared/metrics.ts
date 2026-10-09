// Pure functions: parsing YouTube's localized texts and computing metrics.
import type { Lang, ListVideo, SeoScore, VideoData, VideoMetrics } from './types.ts';

const SUFFIX: Record<string, number> = {
  k: 1e3, m: 1e6, b: 1e9,
  тыс: 1e3, млн: 1e6, млрд: 1e9,
  тис: 1e3,
};

/** "1.2M views", "12 345 просмотров", "1,2 млн просмотров", "No views" → number. */
export function parseCompactNumber(text: string | undefined | null): number | undefined {
  if (!text) return undefined;
  const t = text.replace(/ | /g, ' ').trim().toLowerCase();
  if (!t) return undefined;
  if (/^(no|нет|немає)(?!\p{L})/u.test(t)) return 0;
  const m = t.match(/(\d[\d\s.,]*)\s*(k|m|b|тыс|млн|млрд|тис)?(?![a-zа-яіїє])/);
  if (!m) return undefined;
  const numStr = m[1].replace(/\s/g, '').replace(/[.,]$/, '');
  const suffix = m[2];
  let num: number;
  if (suffix) {
    num = parseFloat(numStr.replace(',', '.'));
  } else {
    num = parseInt(numStr.replace(/[.,]/g, ''), 10);
  }
  if (!isFinite(num)) return undefined;
  return Math.round(num * (suffix ? SUFFIX[suffix] : 1));
}

// Order matters: Ukrainian "годин" (hour) must be tested before Russian "год" (year).
const UNIT_HOURS: Array<[RegExp, number]> = [
  [/sec|сек/, 1 / 3600],
  [/min|мин|хв/, 1 / 60],
  [/hour|годин|час/, 1],
  [/day|дн|день|дні/, 24],
  [/week|нед|тиж/, 168],
  [/month|мес|міс/, 730],
  [/year|год|лет|рік|рок/, 8760],
];

/** "3 days ago", "Streamed 2 weeks ago", "5 часов назад", "4 дні тому" → hours. */
export function parseRelativeTimeHours(text: string | undefined | null): number | undefined {
  if (!text) return undefined;
  const t = text.toLowerCase();
  const n = t.match(/(\d+)/);
  if (!n) return undefined;
  for (const [re, h] of UNIT_HOURS) if (re.test(t)) return parseInt(n[1], 10) * h;
  return undefined;
}

/** "12:34", "1:02:03" → seconds. */
export function parseDuration(text: string | undefined | null): number | undefined {
  if (!text) return undefined;
  const parts = text.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some((p) => !isFinite(p))) return undefined;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

/** ISO 8601 duration "PT1H2M3S" → seconds. */
export function parseIsoDuration(iso: string | undefined | null): number | undefined {
  if (!iso) return undefined;
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return undefined;
  return (+(m[1] || 0)) * 86400 + (+(m[2] || 0)) * 3600 + (+(m[3] || 0)) * 60 + (+(m[4] || 0));
}

export function isViewsText(text: string): boolean {
  return /view|просмотр|перегляд/i.test(text) && !/watching|смотр[ия]т|дивляться/i.test(text);
}

export function isAgeText(text: string): boolean {
  return /\bago\b|назад|тому/i.test(text) && /\d/.test(text);
}

export function ageHoursFromIso(iso: string | undefined, now = Date.now()): number | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  if (!isFinite(t)) return undefined;
  return Math.max(0, (now - t) / 3600000);
}

export function computeVph(views: number | undefined, ageHours: number | undefined): number | undefined {
  if (views === undefined || ageHours === undefined) return undefined;
  return views / Math.max(ageHours, 1);
}

export function median(values: number[]): number | undefined {
  const v = values.filter((x) => isFinite(x)).sort((a, b) => a - b);
  if (v.length === 0) return undefined;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export function computeOutlier(views: number | undefined, channelViews: number[], excludeSelf?: number): number | undefined {
  if (views === undefined) return undefined;
  const others = excludeSelf === undefined ? channelViews : channelViews.filter((v) => v !== excludeSelf);
  if (others.length < 3) return undefined;
  const med = median(others);
  if (!med) return undefined;
  return views / med;
}

export function listVideoVph(v: ListVideo): number | undefined {
  const age = v.ageHours ?? ageHoursFromIso(v.publishedAt);
  return computeVph(v.views, age);
}

/** Counts timestamp lines like "0:00 Intro" in a description (YouTube chapters). */
export function hasChapters(description: string | undefined): boolean {
  if (!description) return false;
  const lines = description.split('\n').filter((l) => /^\s*\(?\d{1,2}:\d{2}(?::\d{2})?\)?\s*[-–—:]?\s*\S/.test(l));
  return lines.length >= 3 && lines.some((l) => /^\s*\(?0?0:00/.test(l));
}

const STOP = new Set(
  'the a an and or of to in on for with at by from is are was were be this that it как и в на с по для от до из не что это или у о а но за же к ты вы мы я'.split(' '),
);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function overlap(a: string[], b: string): number {
  if (a.length === 0) return 0;
  const hay = b.toLowerCase();
  const hit = a.filter((w) => hay.includes(w)).length;
  return hit / a.length;
}

const SEO_LABELS: Record<string, { ru: [string, string]; en: [string, string] }> = {
  title_len: {
    ru: ['Длина названия 30–70 символов', 'Короткие названия хуже объясняют тему, длинные обрезаются в выдаче.'],
    en: ['Title is 30–70 characters', 'Short titles under-explain; long ones get cut off in results.'],
  },
  title_caps: {
    ru: ['Название не капсом', 'Сплошные заглавные снижают доверие и CTR.'],
    en: ['Title is not ALL CAPS', 'All-caps titles reduce trust and CTR.'],
  },
  desc_len: {
    ru: ['Описание ≥ 250 символов', 'Подробное описание даёт YouTube больше контекста для ранжирования.'],
    en: ['Description ≥ 250 characters', 'A fuller description gives YouTube more ranking context.'],
  },
  desc_keywords: {
    ru: ['Слова из названия есть в описании', 'Повторите ключевые слова названия в первых строках описания.'],
    en: ['Title keywords appear in the description', 'Repeat the title keywords in the first lines of the description.'],
  },
  tags_count: {
    ru: ['5–30 тегов', 'Добавьте теги: точные, широкие и варианты написания.'],
    en: ['5–30 tags', 'Add tags: exact, broad, and spelling variants.'],
  },
  tags_keywords: {
    ru: ['Слова из названия есть в тегах', 'Первые теги должны повторять главный запрос из названия.'],
    en: ['Title keywords appear in tags', 'The first tags should repeat the main query from the title.'],
  },
  chapters: {
    ru: ['Есть главы (таймкоды)', 'Главы попадают в поиск и улучшают удержание.'],
    en: ['Has chapters (timestamps)', 'Chapters surface in search and improve retention.'],
  },
  hashtags: {
    ru: ['Есть хэштеги', '1–3 хэштега в описании показываются над названием.'],
    en: ['Has hashtags', '1–3 hashtags in the description show above the title.'],
  },
  duration: {
    ru: ['Длительность ≥ 8 минут', 'От 8 минут доступны mid-roll рекламные вставки.'],
    en: ['Duration ≥ 8 minutes', 'From 8 minutes mid-roll ads become available.'],
  },
  links: {
    ru: ['Есть ссылки / призыв к действию', 'Добавьте ссылки на плейлисты, соцсети или следующий шаг для зрителя.'],
    en: ['Has links / call to action', 'Add links to playlists, socials or the next step for the viewer.'],
  },
};

export function seoScore(video: VideoData, lang: Lang = 'ru'): SeoScore {
  const title = video.title ?? '';
  const desc = video.description ?? '';
  const tags = video.tags ?? [];
  const tw = words(title);
  const letters = title.replace(/[^\p{L}]/gu, '');
  const capsRatio = letters.length ? letters.replace(/[^\p{Lu}]/gu, '').length / letters.length : 0;

  const raw: Array<[string, boolean, number]> = [
    ['title_len', title.length >= 30 && title.length <= 70, 12],
    ['title_caps', capsRatio < 0.6, 5],
    ['desc_len', desc.length >= 250, 13],
    ['desc_keywords', overlap(tw, desc) >= 0.5, 15],
    ['tags_count', tags.length >= 5 && tags.length <= 30, 12],
    ['tags_keywords', overlap(tw, tags.join(' ')) >= 0.5, 15],
    ['chapters', video.hasChapters ?? hasChapters(desc), 10],
    ['hashtags', /#\p{L}/u.test(desc), 5],
    ['links', /https?:\/\//.test(desc), 8],
  ];
  // Duration is only known for published videos; skip the check for drafts.
  if (video.durationSec !== undefined) raw.push(['duration', video.durationSec >= 480, 5]);
  const checks = raw.map(([id, ok, weight]) => ({
    id,
    ok,
    weight,
    label: SEO_LABELS[id][lang][0],
    hint: SEO_LABELS[id][lang][1],
  }));
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
  return { score: Math.round((got / total) * 100), checks };
}

// ---- title analyzer (for the Studio assistant) ------------------------------

const TITLE_LABELS: Record<string, { ru: [string, string]; en: [string, string] }> = {
  length: {
    ru: ['Длина 30–70 символов', 'В поиске и рекомендациях название обрезается после ~60–70 символов.'],
    en: ['30–70 characters long', 'Titles get cut after ~60–70 characters in search and recommendations.'],
  },
  keyword: {
    ru: ['Ключевой запрос есть в названии', 'Поставьте главный запрос как можно ближе к началу.'],
    en: ['Contains the focus keyword', 'Put the main query as close to the start as possible.'],
  },
  keyword_front: {
    ru: ['Ключевой запрос в первых 40 символах', 'Первые слова видны всегда, даже если название обрезано.'],
    en: ['Keyword within the first 40 characters', 'The first words are always visible, even when the title is cut.'],
  },
  number: {
    ru: ['Есть число или год', 'Конкретика («7 способов», «2026») повышает кликабельность.'],
    en: ['Has a number or a year', 'Specifics ("7 ways", "2026") raise click-through.'],
  },
  hook: {
    ru: ['Есть крючок (вопрос, «как», «почему», контраст, скобки)', 'Дайте причину кликнуть: обещание результата, интрига, сравнение.'],
    en: ['Has a hook (question, "how", "why", contrast, brackets)', 'Give a reason to click: a promised result, intrigue, a comparison.'],
  },
  words: {
    ru: ['5–12 слов', 'Слишком короткое название не объясняет тему, слишком длинное теряет фокус.'],
    en: ['5–12 words', 'Too short under-explains the topic; too long loses focus.'],
  },
  style: {
    ru: ['Без капса, спама из «!» и эмодзи', 'Один восклицательный знак и не более одного эмодзи.'],
    en: ['No ALL CAPS, exclamation spam or emoji spam', 'At most one exclamation mark and one emoji.'],
  },
  unique: {
    ru: ['Слова не повторяются', 'Повторы занимают место, которое могли бы занять новые слова для поиска.'],
    en: ['No repeated words', 'Repeats waste space that could carry new search words.'],
  },
};

const HOOK_RE =
  /\?|:|—|–| - |\(|\[|\bhow\b|\bwhy\b|\bwhat\b|\bbest\b|\btop\b|\bvs\.?\b|\bsecret|\bmistake|\bnever\b|\bstop\b|\bbefore\b|\bкак\b|\bпочему\b|\bчто\b|\bлучш|\bтоп\b|\bсекрет|\bошибк|\bникогда\b|\bпротив\b|\bvs\b|\bпрежде\b|\bбез\b|\bза \d/iu;

export function titleScore(title: string, focusKeyword = '', lang: Lang = 'ru'): SeoScore {
  const t = title.trim();
  const kw = focusKeyword.trim().toLowerCase();
  const lower = t.toLowerCase();
  const ws = t.split(/\s+/).filter(Boolean);
  const letters = t.replace(/[^\p{L}]/gu, '');
  const capsRatio = letters.length ? letters.replace(/[^\p{Lu}]/gu, '').length / letters.length : 0;
  const emojiCount = (t.match(/\p{Extended_Pictographic}/gu) ?? []).length;
  const exclam = (t.match(/!/g) ?? []).length;
  const normalized = ws.map((w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')).filter((w) => w.length > 2);
  const hasKw = kw ? lower.includes(kw) || overlap(words(kw), lower) >= 0.75 : false;
  const raw: Array<[string, boolean, number]> = [
    ['length', t.length >= 30 && t.length <= 70, 20],
    ['keyword', hasKw, 15],
    ['keyword_front', hasKw && (lower.indexOf(kw) >= 0 ? lower.indexOf(kw) < 40 : overlap(words(kw), lower.slice(0, 40)) >= 0.75), 10],
    ['number', /\d/.test(t), 10],
    ['hook', HOOK_RE.test(t), 15],
    ['words', ws.length >= 5 && ws.length <= 12, 10],
    ['style', capsRatio < 0.6 && exclam <= 1 && emojiCount <= 1, 10],
    ['unique', new Set(normalized).size === normalized.length, 10],
  ];
  // Without a focus keyword the keyword checks are not applicable.
  const applicable = kw ? raw : raw.filter(([id]) => !id.startsWith('keyword'));
  const checks = applicable.map(([id, ok, weight]) => ({ id, ok, weight, label: TITLE_LABELS[id][lang][0], hint: TITLE_LABELS[id][lang][1] }));
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
  return { score: t ? Math.round((got / total) * 100) : 0, checks };
}

/** A reasonable default focus keyword: the first few meaningful words of the title. */
export function guessFocusKeyword(title: string): string {
  const ws = title
    .replace(/[|:—–\-()[\]"«»]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w.toLowerCase()) && !/^[\d!?.,]+$/.test(w));
  return ws.slice(0, 3).join(' ').toLowerCase();
}

export function computeMetrics(video: VideoData, lang: Lang = 'ru', channelViews?: number[], now = Date.now()): VideoMetrics {
  const ageHours = ageHoursFromIso(video.publishedAt, now);
  const vph = computeVph(video.views, ageHours);
  const views = video.views;
  const likeRate = views && video.likes !== undefined ? video.likes / views : undefined;
  const commentRate = views && video.comments !== undefined ? video.comments / views : undefined;
  const engagementRate =
    views && (video.likes !== undefined || video.comments !== undefined)
      ? ((video.likes ?? 0) + (video.comments ?? 0)) / views
      : undefined;
  const m: VideoMetrics = { ageHours, vph, likeRate, commentRate, engagementRate, seo: seoScore(video, lang) };
  if (channelViews && channelViews.length >= 3) {
    m.channelMedianViews = median(channelViews);
    m.channelSampleSize = channelViews.length;
    m.outlier = computeOutlier(views, channelViews);
  }
  return m;
}

export interface KeywordAnalysis {
  query: string;
  resultCount: number;
  exactInTitle: number;
  avgViews?: number;
  medianViews?: number;
  medianAgeDays?: number;
  recentShare: number;
  bigChannelShare?: number;
  smallChannelWinners: ListVideo[];
  /** 0–100, higher = harder to rank. */
  competition: number;
  /** 0–100, higher = more signs of demand (estimate, not official search volume). */
  demand: number;
}

export function analyzeKeyword(query: string, results: ListVideo[]): KeywordAnalysis {
  const q = query.toLowerCase().trim();
  const vids = results.filter((r) => r.views !== undefined);
  const viewsArr = vids.map((r) => r.views as number);
  const ages = vids.map((r) => r.ageHours ?? ageHoursFromIso(r.publishedAt)).filter((x): x is number => x !== undefined);
  const exactInTitle = results.filter((r) => r.title.toLowerCase().includes(q)).length;
  const recent = ages.filter((h) => h < 24 * 180).length;
  const recentShare = ages.length ? recent / ages.length : 0;
  const withSubs = results.filter((r) => r.subscribers !== undefined);
  const bigChannelShare = withSubs.length ? withSubs.filter((r) => (r.subscribers as number) >= 100000).length / withSubs.length : undefined;
  const avgViews = viewsArr.length ? viewsArr.reduce((a, b) => a + b, 0) / viewsArr.length : undefined;
  const medViews = median(viewsArr);
  const medAge = median(ages);
  const smallChannelWinners = results
    .filter((r) => r.subscribers !== undefined && r.subscribers < 50000 && (r.views ?? 0) > 10000)
    .slice(0, 5);

  // Competition: how strong the top results are.
  const logViews = medViews ? Math.log10(Math.max(medViews, 1)) : 0; // 0..7
  let competition = Math.min(100, (logViews / 6) * 60);
  if (bigChannelShare !== undefined) competition += bigChannelShare * 25;
  else competition += 10;
  competition += (exactInTitle / Math.max(results.length, 1)) * 15;
  competition = Math.round(Math.min(100, competition));

  // Demand: signs that people watch this topic — views on recent uploads, number of exact matches.
  let demand = 0;
  if (avgViews) demand += Math.min(60, (Math.log10(Math.max(avgViews, 1)) / 6) * 60);
  demand += recentShare * 25;
  demand += Math.min(15, exactInTitle * 1.5);
  demand = Math.round(Math.min(100, demand));

  return {
    query,
    resultCount: results.length,
    exactInTitle,
    avgViews,
    medianViews: medViews,
    medianAgeDays: medAge !== undefined ? medAge / 24 : undefined,
    recentShare,
    bigChannelShare,
    smallChannelWinners,
    competition,
    demand,
  };
}

/** Views-per-hour badge tier used for colouring. */
export function vphTier(vph: number): 'low' | 'mid' | 'high' | 'hot' {
  if (vph >= 1000) return 'hot';
  if (vph >= 100) return 'high';
  if (vph >= 10) return 'mid';
  return 'low';
}

export function outlierTier(x: number): 'low' | 'mid' | 'high' | 'hot' {
  if (x >= 5) return 'hot';
  if (x >= 2) return 'high';
  if (x >= 0.8) return 'mid';
  return 'low';
}

export function extractVideoId(input: string): string | undefined {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1, 12) || undefined;
    const v = u.searchParams.get('v');
    if (v) return v.slice(0, 11);
    const m = u.pathname.match(/\/(?:shorts|embed|live|v)\/([\w-]{11})/);
    if (m) return m[1];
  } catch {
    /* not a URL */
  }
  const m = s.match(/(?:v=|\/)([\w-]{11})(?:[?&#]|$)/);
  return m?.[1];
}
