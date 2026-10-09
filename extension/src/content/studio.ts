// YouTube Studio assistant: a floating panel next to the upload / edit dialog with live title & SEO
// scoring, keyword demand check, tag suggestions and AI generation with one-click insertion.
import type { Lang, PageContext, PanelEvent, PanelRequest, QuickActionId, RuntimeMessage, Settings, StudioDraft } from '../shared/types.ts';
import type { KeywordReport } from '../background/keyword.ts';
import { loadSettings, onSettingsChanged, providerReady, saveSettings } from '../shared/settings.ts';
import type { ImageAttachment } from '../shared/types.ts';
import { formatCompact, setLang } from '../shared/i18n.ts';
import { escapeHtml } from '../shared/markdown.ts';
import { guessFocusKeyword, seoScore, titleScore } from '../shared/metrics.ts';
import css from './studio.css';

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const SEL = {
  title: ['#title-textarea #textbox', '#title-textarea [contenteditable="true"]', 'ytcp-video-title #textbox', '#title-wrapper #textbox'],
  description: ['#description-textarea #textbox', '#description-textarea [contenteditable="true"]', '#description-wrapper #textbox'],
  tagsInput: ['#tags-container #text-input', '#tags-container input', 'ytcp-free-text-chip-bar #text-input', 'ytcp-free-text-chip-bar input'],
  tagsChips: ['#tags-container ytcp-chip', 'ytcp-free-text-chip-bar ytcp-chip', '#tags-container .chip'],
};

const L = {
  ru: {
    title: 'Nubit · оптимизация',
    kw: 'Ключевой запрос',
    check: 'Проверить спрос',
    checking: 'проверяю…',
    demand: 'Спрос',
    competition: 'Конкуренция',
    exact: 'точных совпадений в топе',
    suggestions: 'Люди ищут',
    compTags: 'Теги конкурентов',
    loadTags: 'Теги из топ-видео',
    addAll: 'Добавить все',
    titleSec: 'Название',
    descSec: 'Описание',
    tagsSec: 'Теги',
    chars: 'симв.',
    words: 'слов',
    preview: 'Так увидят в поиске',
    show: 'проверки',
    ai: 'ИИ',
    gen_titles: '✨ Названия',
    gen_description: '✨ Описание',
    gen_tags: '✨ Теги',
    gen_compare: '⚔ Сравнить с конкурентами',
    insert: 'Вставить',
    append: 'В конец',
    stop: 'Стоп',
    chat: 'Чат',
    noKey: 'Добавьте API-ключ в настройках Nubit, чтобы включить ИИ.',
    settings: 'Настройки',
    running: 'генерирую…',
    inserted: 'Вставлено',
    copied: 'Скопировано в буфер обмена',
    noTagsField: 'Поле тегов не найдено: откройте «Показать ещё» → Теги. Теги скопированы в буфер.',
    standout: 'Выделяемость',
    fixes: 'Что поправить',
    alternatives: 'Альтернативы',
    competitors: 'Топ по запросу',
    tagsCount: 'тегов',
    noTitle: 'Начните вводить название — оценка появится здесь.',
    openSettings: 'Открыть настройки',
    gen_magic: '🪄 Заполнить всё',
    gen_thumb: '🖼 Оценить превью',
    templates: 'Шаблоны тегов',
    tpl_apply: 'Применить',
    tpl_save: 'Сохранить текущие теги как шаблон',
    tpl_name: 'Название шаблона:',
    tpl_del: 'Удалить шаблон',
    noThumb: 'Превью не найдено: загрузите картинку в поле «Значок» и повторите.',
    thumbLoading: 'читаю превью…',
    magicDone: 'Заполнено: название, описание и теги. Проверьте и отредактируйте.',
    thumbText: 'Текст на превью',
    strengths: 'Сильные стороны',
    issues: 'Проблемы',
    textIdeas: 'Идеи текста',
    tool_score: 'Optimize Score',
    tool_thumb: 'Превью',
    tool_compare: 'Конкуренты',
    tool_magic: 'Magic Fill',
    tool_titlescore: 'Название',
    optimize: 'Optimize Score (0–100)',
    optimize_hint: 'Веса как у vidIQ: название 48 %, превью 48 %, описание 2,5 %, теги 1 %. Превью учитывается после оценки «🖼 Оценить превью».',
    desc_hint: 'Первые 150 символов видны в поиске — поставьте туда ключевой запрос и крючок; дальше структура, главы, ссылки, 3 хэштега.',
    thumb_hint: 'Загрузите превью в поле «Значок», затем нажмите кнопку — модель оценит читаемость, контраст, текст, эмоцию и даст правки.',
    compare_hint: 'ИИ найдёт топ‑видео по вашему запросу и скажет, насколько название выделится, что поправить и предложит альтернативы.',
    magic_hint: 'Одна кнопка: ИИ заполнит название, описание и теги на основе черновика и спроса. Всё можно отредактировать.',
    comp_need_kw: 'Сначала проверьте спрос по ключевому запросу (вкладка IQ).',
  },
  en: {
    title: 'Nubit · optimization',
    kw: 'Focus keyword',
    check: 'Check demand',
    checking: 'checking…',
    demand: 'Demand',
    competition: 'Competition',
    exact: 'exact matches in the top results',
    suggestions: 'People search for',
    compTags: 'Competitor tags',
    loadTags: 'Tags from top videos',
    addAll: 'Add all',
    titleSec: 'Title',
    descSec: 'Description',
    tagsSec: 'Tags',
    chars: 'chars',
    words: 'words',
    preview: 'Search preview',
    show: 'checks',
    ai: 'AI',
    gen_titles: '✨ Titles',
    gen_description: '✨ Description',
    gen_tags: '✨ Tags',
    gen_compare: '⚔ Compare with competitors',
    insert: 'Insert',
    append: 'Append',
    stop: 'Stop',
    chat: 'Chat',
    noKey: 'Add an API key in Nubit settings to enable the AI.',
    settings: 'Settings',
    running: 'generating…',
    inserted: 'Inserted',
    copied: 'Copied to clipboard',
    noTagsField: 'Tags field not found: open "Show more" → Tags. The tags were copied to the clipboard.',
    standout: 'Stand-out score',
    fixes: 'What to fix',
    alternatives: 'Alternatives',
    competitors: 'Top results',
    tagsCount: 'tags',
    noTitle: 'Start typing a title — the score will appear here.',
    openSettings: 'Open settings',
    gen_magic: '🪄 Magic fill',
    gen_thumb: '🖼 Review thumbnail',
    templates: 'Tag templates',
    tpl_apply: 'Apply',
    tpl_save: 'Save current tags as a template',
    tpl_name: 'Template name:',
    tpl_del: 'Delete template',
    noThumb: 'No thumbnail found: upload one in the Thumbnail field and retry.',
    thumbLoading: 'reading the thumbnail…',
    magicDone: 'Filled in: title, description and tags. Review and edit.',
    thumbText: 'Text on thumbnail',
    strengths: 'Strengths',
    issues: 'Issues',
    textIdeas: 'Text ideas',
    tool_score: 'Optimize Score',
    tool_thumb: 'Thumbnail',
    tool_compare: 'Competitors',
    tool_magic: 'Magic Fill',
    tool_titlescore: 'Title',
    optimize: 'Optimize Score (0–100)',
    optimize_hint: 'vidIQ-like weights: title 48 %, thumbnail 48 %, description 2.5 %, tags 1 %. The thumbnail counts after "🖼 Review thumbnail".',
    desc_hint: 'The first 150 characters show in search — put the keyword and the hook there; then structure, chapters, links, 3 hashtags.',
    thumb_hint: 'Upload a thumbnail in the Thumbnail field, then press the button — the model rates legibility, contrast, text, emotion and suggests fixes.',
    compare_hint: 'The AI finds the top videos for your keyword and tells how much your title stands out, what to fix, and proposes alternatives.',
    magic_hint: 'One click: the AI fills in the title, description and tags from the draft and demand data. Everything stays editable.',
    comp_need_kw: 'Check demand for the focus keyword first (IQ tab).',
  },
} as const;

type Keys = keyof (typeof L)['ru'];

interface AiResult {
  status: 'idle' | 'running' | 'done' | 'error';
  text: string;
  progress?: string;
  parsed?: Any;
  error?: string;
}

interface State {
  draft: StudioDraft;
  focusKeyword: string;
  focusEdited: boolean;
  report?: KeywordReport;
  reportFor?: string;
  reportLoading?: boolean;
  reportError?: string;
  compTags?: Array<{ tag: string; n: number }>;
  compTagsLoading?: boolean;
  showTitleChecks: boolean;
  showSeoChecks: boolean;
  ai: Partial<Record<QuickActionId, AiResult>>;
  running?: QuickActionId;
}

let settings: Settings;
let lang: Lang = 'ru';
let host: HTMLElement | null = null;
let root: HTMLElement | null = null;
let toastEl: HTMLElement | null = null;
let port: chrome.runtime.Port | null = null;
let kwInputFocused = false;
const state: State = {
  draft: { title: '', description: '', tags: [] },
  focusKeyword: '',
  focusEdited: false,
  showTitleChecks: false,
  showSeoChecks: false,
  ai: {},
};

const t = (k: Keys): string => L[lang][k];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function q<T extends Element = HTMLElement>(list: readonly string[]): T | null {
  for (const s of list) {
    const el = document.querySelector<T>(s);
    if (el) return el;
  }
  return null;
}

function readEditable(el: HTMLElement | null): string {
  if (!el) return '';
  return (el.innerText ?? el.textContent ?? '').replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function readTags(): string[] {
  for (const s of SEL.tagsChips) {
    const chips = document.querySelectorAll(s);
    if (chips.length) {
      return Array.from(chips)
        .map((c) => (c.querySelector('#chip-text, .chip-text, span')?.textContent ?? c.textContent ?? '').trim())
        .filter(Boolean);
    }
  }
  return [];
}

function readDraft(): StudioDraft | null {
  const titleEl = q(SEL.title);
  if (!titleEl) return null;
  const title = readEditable(titleEl);
  const description = readEditable(q(SEL.description));
  const tags = readTags();
  return { title, description, tags };
}

// ---- inserting into Studio fields -------------------------------------------

function setEditable(el: HTMLElement, text: string): void {
  el.focus();
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  sel?.removeAllRanges();
  sel?.addRange(range);
  let ok = false;
  try {
    ok = document.execCommand('insertText', false, text);
  } catch {
    ok = false;
  }
  if (!ok || readEditable(el) !== text.trim()) {
    el.textContent = text;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
  }
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.blur();
}

async function addTags(tags: string[]): Promise<number> {
  const input = q<HTMLInputElement>(SEL.tagsInput);
  const seen = new Set(readTags().map((x) => x.toLowerCase()));
  const fresh: string[] = [];
  for (const raw of tags) {
    const x = raw.trim();
    if (!x || seen.has(x.toLowerCase())) continue;
    seen.add(x.toLowerCase());
    fresh.push(x);
  }
  if (!input) {
    await navigator.clipboard.writeText(fresh.join(', ')).catch(() => undefined);
    toast(t('noTagsField'));
    return 0;
  }
  let added = 0;
  for (const tag of fresh) {
    const before = readTags().length;
    input.focus();
    input.value = tag;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const press = (type: string) => input.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    press('keydown');
    press('keypress');
    press('keyup');
    await sleep(80);
    if (readTags().length === before) {
      // Fallback: the chip bar splits on commas typed into the field.
      input.value = tag + ',';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(80);
    }
    if (readTags().length > before) added++;
  }
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return added;
}

async function insert(field: 'title' | 'description' | 'tags', value: string | string[], mode: 'replace' | 'append' = 'replace'): Promise<boolean> {
  if (field === 'tags') {
    const n = await addTags(Array.isArray(value) ? value : String(value).split(/[,\n]/));
    if (n) toast(`${t('inserted')}: ${n}`);
    return n > 0;
  }
  const el = q(field === 'title' ? SEL.title : SEL.description);
  if (!el) {
    await navigator.clipboard.writeText(String(value)).catch(() => undefined);
    toast(t('copied'));
    return false;
  }
  const text = Array.isArray(value) ? value.join('\n') : value;
  setEditable(el, mode === 'append' && readEditable(el) ? `${readEditable(el)}\n\n${text}` : text);
  toast(t('inserted'));
  refreshDraft();
  return true;
}

// ---- rendering ---------------------------------------------------------------

function isDark(): boolean {
  return document.documentElement.hasAttribute('dark') || getComputedStyle(document.body).backgroundColor === 'rgb(31, 31, 31)' || getComputedStyle(document.body).colorScheme === 'dark';
}

function pillClass(score: number): string {
  return score >= 75 ? 'good' : score >= 50 ? 'warn' : 'bad';
}

function meter(label: string, value: number | undefined): string {
  const v = value ?? 0;
  return `<div class="meter"><span>${label}</span><div class="bar"><i style="width:${Math.max(2, Math.min(100, v))}%"></i></div><span class="v">${value === undefined ? '—' : Math.round(v)}</span></div>`;
}

function checksHtml(checks: Array<{ ok: boolean; label: string; hint: string }>): string {
  return `<ul class="checks">${checks
    .map((c) => `<li class="${c.ok ? 'ok' : 'no'}"><span class="ic">${c.ok ? '✓' : '✗'}</span><span>${escapeHtml(c.label)}${c.ok ? '' : `<span class="hint">${escapeHtml(c.hint)}</span>`}</span></li>`)
    .join('')}</ul>`;
}

function chip(text: string, action: string, extra = '', added = false): string {
  return `<button class="chip ${added ? 'added' : ''}" data-act="${action}" data-val="${escapeHtml(text)}" ${added ? 'disabled' : ''}>${escapeHtml(text)}${extra}</button>`;
}

type ToolId = 'score' | 'titles' | 'description' | 'thumbnail' | 'tags' | 'compare' | 'magic';

const TOOLS: Array<{ id: ToolId; icon: string; label: Keys; action?: QuickActionId }> = [
  { id: 'score', icon: 'IQ', label: 'tool_score' },
  { id: 'titles', icon: 'T', label: 'titleSec', action: 'studio_titles' },
  { id: 'description', icon: '≡', label: 'descSec', action: 'studio_description' },
  { id: 'thumbnail', icon: '🖼', label: 'tool_thumb', action: 'studio_thumbnail' },
  { id: 'tags', icon: '#', label: 'tagsSec', action: 'studio_tags' },
  { id: 'compare', icon: '⚔', label: 'tool_compare', action: 'studio_compare' },
  { id: 'magic', icon: '🪄', label: 'tool_magic', action: 'studio_magic_fill' },
];

let activeTool: ToolId | null = 'score';

interface Scores {
  title: number;
  description: number;
  tags: number;
  thumbnail?: number;
  optimize: number;
  seo: ReturnType<typeof seoScore>;
  titleChecks: ReturnType<typeof titleScore>;
}

/** Optimize score with vidIQ-like weights (title 48 %, thumbnail 48 %, description 2.5 %, tags 1 %); unknown parts are renormalized. */
function computeScores(): Scores {
  const d = state.draft;
  const kw = state.focusKeyword;
  const titleChecks = titleScore(d.title, kw, lang);
  const seo = seoScore({ videoId: 'draft', url: '', title: d.title, description: d.description, tags: d.tags }, lang);
  const desc = d.description;
  const kwInFirst = kw ? desc.slice(0, 150).toLowerCase().includes(kw) : /\S/.test(desc.slice(0, 150));
  const description = Math.min(100, Math.round(Math.min(desc.length, 300) / 300 * 60 + (kwInFirst ? 25 : 0) + (/#\p{L}/u.test(desc) ? 5 : 0) + (/https?:\/\//.test(desc) ? 5 : 0) + (/\n\s*\d{1,2}:\d{2}/.test(desc) ? 5 : 0)));
  const kwInTags = kw ? d.tags.some((x) => x.toLowerCase().includes(kw)) : d.tags.length > 0;
  const tags = Math.min(100, Math.round(Math.min(d.tags.length, 15) / 15 * 70 + (kwInTags ? 30 : 0)));
  const th = state.ai.studio_thumbnail?.parsed?.score;
  const thumbnail = typeof th === 'number' ? Math.max(0, Math.min(100, th)) : undefined;
  const parts: Array<[number, number]> = [[titleChecks.score, 48], [description, 2.5], [tags, 1]];
  if (thumbnail !== undefined) parts.push([thumbnail, 48]);
  const wsum = parts.reduce((a, [, w]) => a + w, 0);
  const optimize = d.title ? Math.round(parts.reduce((a, [v, w]) => a + v * w, 0) / wsum) : 0;
  return { title: titleChecks.score, description, tags, thumbnail, optimize, seo, titleChecks };
}

function render(): void {
  if (!root || !host) return;
  host.setAttribute('data-theme', isDark() ? 'dark' : 'light');
  const d = state.draft;
  const sc = computeScores();
  const ready = providerReady(settings);

  const toolbar = `<div class="toolbar">
    <button class="tool logo-btn" title="Nubit">N</button>
    ${TOOLS.map((tl) => {
      const running = tl.action && state.running === tl.action;
      if (tl.id === 'score') {
        return `<button class="tool score ${pillClass(sc.optimize)} ${activeTool === 'score' ? 'active' : ''}" data-act="tool" data-val="score" title="${t('tool_score')}"><span>${d.title ? sc.optimize : '—'}</span><small>IQ</small></button>`;
      }
      return `<button class="tool ${activeTool === tl.id ? 'active' : ''}" data-act="tool" data-val="${tl.id}" title="${t(tl.label)}">${tl.icon}${running ? '<span class="dotb"></span>' : ''}</button>`;
    }).join('')}
    <div class="sep"></div>
    <button class="tool" data-act="chat" title="${t('chat')}">💬</button>
  </div>`;

  let panel = '';
  if (activeTool) {
    const tool = TOOLS.find((x) => x.id === activeTool)!;
    const body = toolBody(activeTool, sc, ready);
    panel = `<div class="panel">
      <div class="head"><span class="title">${t(tool.label)}</span>
        ${state.running ? `<button class="btn small" data-act="stop">${t('stop')}</button>` : ''}
        <button class="icon" data-act="tool" data-val="${activeTool}" title="✕">✕</button></div>
      <div class="body">${body}</div>
      <div class="toast" id="toast"></div>
    </div>`;
  }
  root.innerHTML = toolbar + panel;
  toastEl = root.querySelector('#toast');
  const kwInput = root.querySelector<HTMLInputElement>('#kw');
  if (kwInput) {
    kwInput.addEventListener('input', () => {
      state.focusKeyword = kwInput.value.trim().toLowerCase();
      state.focusEdited = true;
    });
    kwInput.addEventListener('focus', () => (kwInputFocused = true));
    kwInput.addEventListener('blur', () => {
      kwInputFocused = false;
      render();
    });
    kwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        checkKeyword();
      }
    });
  }
  updateTitleBadge(sc);
}

function aiButton(action: QuickActionId, label: Keys, ready: boolean, primary = true): string {
  return `<button class="btn ${primary ? 'primary' : ''}" data-act="ai" data-val="${action}" ${!ready || state.running ? 'disabled' : ''}>${t(label)}</button>`;
}

function noKeyHtml(ready: boolean): string {
  return ready ? '' : `<div class="muted" style="margin-bottom:6px">${t('noKey')} <button class="btn small" data-act="settings">${t('openSettings')}</button></div>`;
}

function toolBody(tool: ToolId, sc: Scores, ready: boolean): string {
  const d = state.draft;
  const kw = state.focusKeyword;
  const existing = new Set(d.tags.map((x) => x.toLowerCase()));
  switch (tool) {
    case 'score': {
      const r = state.report && state.reportFor === kw ? state.report : undefined;
      return `<div class="sec">
        <div class="big ${pillClass(sc.optimize)}"><span class="n">${d.title ? sc.optimize : '—'}</span><span class="l">${t('optimize')}</span></div>
        ${meter(t('titleSec'), d.title ? sc.title : undefined)}
        ${meter(t('tool_thumb'), sc.thumbnail)}
        ${meter(t('descSec'), d.description ? sc.description : undefined)}
        ${meter(t('tagsSec'), d.tags.length ? sc.tags : undefined)}
        <div class="muted" style="margin-top:4px">${t('optimize_hint')}</div>
      </div>
      <div class="sec"><h4>SEO <span class="pill ${pillClass(sc.seo.score)}">${sc.seo.score}</span></h4>
        <div class="row"><div class="bar"><i style="width:${sc.seo.score}%"></i></div><button class="btn small" data-act="toggleSeo">${t('show')}</button></div>
        ${state.showSeoChecks ? checksHtml(sc.seo.checks) : ''}
      </div>
      <div class="sec"><h4>${t('kw')}</h4>
        <div class="row"><input class="kw" id="kw" value="${escapeHtml(kw)}" placeholder="${escapeHtml(guessFocusKeyword(d.title) || '…')}" />
          <button class="btn" data-act="check" ${!kw || state.reportLoading ? 'disabled' : ''}>${state.reportLoading ? t('checking') : t('check')}</button></div>
        ${state.reportError ? `<div class="err">${escapeHtml(state.reportError)}</div>` : ''}
        ${
          r
            ? `${meter(t('demand'), r.demand)}${meter(t('competition'), r.competition)}
               <div class="muted">${r.exactInTitle}/${r.resultCount} ${t('exact')}${r.medianViews ? ` · ${formatCompact(r.medianViews)} views median` : ''}</div>
               ${r.suggestions.length ? `<div class="muted" style="margin-top:6px">${t('suggestions')}:</div><div class="chips">${r.suggestions.slice(0, 12).map((x) => chip(x, 'addtag', '', existing.has(x.toLowerCase()))).join('')}</div>` : ''}`
            : ''
        }
      </div>`;
    }
    case 'titles': {
      const titleWords = d.title.split(/\s+/).filter(Boolean).length;
      return `<div class="sec">
        <div class="big ${pillClass(sc.title)}"><span class="n">${d.title ? sc.title : '—'}</span><span class="l">${d.title.length} ${t('chars')} · ${titleWords} ${t('words')}</span></div>
        ${d.title ? `<div class="row"><div class="bar"><i style="width:${sc.title}%"></i></div><button class="btn small" data-act="toggleTitle">${t('show')}</button></div>${state.showTitleChecks ? checksHtml(sc.titleChecks.checks) : ''}
          <div class="preview"><div class="muted">${t('preview')}</div><div class="pt">${escapeHtml(d.title.length > 60 ? d.title.slice(0, 57).trimEnd() + '…' : d.title)}</div>${d.description ? `<div class="pd">${escapeHtml(d.description.split('\n').slice(0, 2).join('\n').slice(0, 150))}</div>` : ''}</div>` : `<div class="muted">${t('noTitle')}</div>`}
      </div>
      <div class="sec">${noKeyHtml(ready)}<div class="actions">${aiButton('studio_titles', 'gen_titles', ready)}</div>${resultHtml('studio_titles', state.ai.studio_titles, existing)}</div>`;
    }
    case 'description':
      return `<div class="sec">
        <div class="big ${pillClass(sc.description)}"><span class="n">${d.description ? sc.description : '—'}</span><span class="l">${d.description.length} ${t('chars')}</span></div>
        <div class="muted">${t('desc_hint')}</div>
      </div>
      <div class="sec">${noKeyHtml(ready)}<div class="actions">${aiButton('studio_description', 'gen_description', ready)}</div>${resultHtml('studio_description', state.ai.studio_description, existing)}</div>`;
    case 'thumbnail':
      return `<div class="sec"><div class="muted">${t('thumb_hint')}</div></div>
      <div class="sec">${noKeyHtml(ready)}<div class="actions">${aiButton('studio_thumbnail', 'gen_thumb', ready)}</div>${resultHtml('studio_thumbnail', state.ai.studio_thumbnail, existing)}</div>`;
    case 'tags': {
      const tpls = settings.tagTemplates ?? [];
      const r = state.report && state.reportFor === kw ? state.report : undefined;
      return `<div class="sec">
        <div class="big ${pillClass(sc.tags)}"><span class="n">${d.tags.length}</span><span class="l">${t('tagsCount')} · ${d.tags.join(',').length}/500 ${t('chars')}</span></div>
        ${d.tags.length ? `<div class="chips">${d.tags.slice(0, 30).map((x) => `<span class="chip added">${escapeHtml(x)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="sec"><h4>${t('templates')}</h4>
        <div class="row">
          <select class="kw" id="tpl"><option value="">${t('templates')}…</option>${tpls.map((x, i) => `<option value="${i}">${escapeHtml(x.name)} (${x.tags.length})</option>`).join('')}</select>
          <button class="btn small" data-act="tpl-apply">${t('tpl_apply')}</button>
          <button class="btn small" data-act="tpl-del" title="${t('tpl_del')}">✕</button>
        </div>
        ${d.tags.length ? `<div class="row" style="margin-top:4px"><button class="btn small" data-act="tpl-save">${t('tpl_save')}</button></div>` : ''}
      </div>
      <div class="sec"><h4>${t('compTags')}</h4>
        <div class="row"><button class="btn small" data-act="comptags" ${state.compTagsLoading || !r ? 'disabled' : ''}>${state.compTagsLoading ? t('checking') : t('loadTags')}</button>
          ${state.compTags?.length ? `<button class="btn small" data-act="addfreq">${t('addAll')} (≥2)</button>` : ''}</div>
        ${!r ? `<div class="muted" style="margin-top:4px">${t('comp_need_kw')}</div>` : ''}
        ${state.compTags?.length ? `<div class="chips">${state.compTags.slice(0, 24).map((x) => chip(x.tag, 'addtag', ` <b>${x.n}</b>`, existing.has(x.tag.toLowerCase()))).join('')}</div>` : ''}
      </div>
      <div class="sec">${noKeyHtml(ready)}<div class="actions">${aiButton('studio_tags', 'gen_tags', ready)}</div>${resultHtml('studio_tags', state.ai.studio_tags, existing)}</div>`;
    }
    case 'compare':
      return `<div class="sec"><div class="muted">${t('compare_hint')}</div></div>
      <div class="sec">${noKeyHtml(ready)}<div class="actions">${aiButton('studio_compare', 'gen_compare', ready)}</div>${resultHtml('studio_compare', state.ai.studio_compare, existing)}</div>`;
    case 'magic':
      return `<div class="sec"><div class="muted">${t('magic_hint')}</div></div>
      <div class="sec">${noKeyHtml(ready)}<div class="actions">${aiButton('studio_magic_fill', 'gen_magic', ready)}</div>${resultHtml('studio_magic_fill', state.ai.studio_magic_fill, existing)}</div>`;
  }
}

// ---- title score badge inside the Studio title field (like vidIQ's Title Score) ----

let badgeStyleInjected = false;

function updateTitleBadge(sc: Scores): void {
  const editable = q(SEL.title);
  if (!editable) {
    document.getElementById('nubit-title-score')?.remove();
    return;
  }
  const container = (editable.closest('#title-textarea') as HTMLElement | null) ?? editable.parentElement;
  if (!container) return;
  if (!badgeStyleInjected) {
    const st = document.createElement('style');
    st.textContent = `#nubit-title-score{position:absolute;right:10px;top:-11px;z-index:5;font:600 11px/1 Roboto,Arial,sans-serif;padding:4px 8px;border-radius:999px;background:#eee;color:#444;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.2)}
#nubit-title-score.good{background:#16a34a;color:#fff}#nubit-title-score.warn{background:#f59e0b;color:#fff}#nubit-title-score.bad{background:#dc2626;color:#fff}`;
    document.documentElement.appendChild(st);
    badgeStyleInjected = true;
  }
  let badge = document.getElementById('nubit-title-score');
  if (!badge || badge.parentElement !== container) {
    badge?.remove();
    badge = document.createElement('div');
    badge.id = 'nubit-title-score';
    badge.addEventListener('click', () => {
      activeTool = 'titles';
      render();
    });
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    container.appendChild(badge);
  }
  const score = state.draft.title ? sc.title : undefined;
  badge.className = score === undefined ? '' : score > 80 ? 'good' : score > 40 ? 'warn' : 'bad';
  badge.textContent = `${t('tool_titlescore')} ${score === undefined ? '—' : score}`;
}

function resultHtml(action: QuickActionId, r: AiResult | undefined, existing: Set<string>): string {
  if (!r || r.status === 'idle') return '';
  if (r.status === 'running') return `<div class="result"><div class="status"><span class="dot"></span>${escapeHtml(r.progress ?? t('running'))}</div>${r.text ? `<div class="muted" style="margin-top:4px">${escapeHtml(r.text.slice(-160))}</div>` : ''}</div>`;
  if (r.status === 'error') return `<div class="result"><div class="err">${escapeHtml(r.error ?? 'error')}</div></div>`;
  const p = r.parsed;
  if (!p) return `<div class="result"><pre class="desc">${escapeHtml(r.text)}</pre></div>`;
  if (action === 'studio_titles' && Array.isArray(p.titles)) {
    return `<div class="result">${p.titles
      .map((x: Any) => {
        const title = typeof x === 'string' ? x : String(x.title ?? '');
        const sc = titleScore(title, state.focusKeyword, lang).score;
        return `<div class="item"><div class="t">${escapeHtml(title)}<div class="a">${escapeHtml(String(x.angle ?? ''))}</div><div class="n">${title.length} ${t('chars')} · ${sc}</div></div><button class="btn small" data-act="insert" data-field="title" data-val="${escapeHtml(title)}">${t('insert')}</button></div>`;
      })
      .join('')}</div>`;
  }
  if (action === 'studio_description' && typeof p.description === 'string') {
    return `<div class="result"><pre class="desc">${escapeHtml(p.description)}</pre><div class="actions"><button class="btn small primary" data-act="insert" data-field="description" data-mode="replace">${t('insert')}</button><button class="btn small" data-act="insert" data-field="description" data-mode="append">${t('append')}</button></div></div>`;
  }
  if (action === 'studio_tags' && Array.isArray(p.tags)) {
    const tags = p.tags.map((x: Any) => String(x)).filter(Boolean);
    return `<div class="result"><div class="row"><span class="muted">${tags.length} ${t('tagsCount')} · ${tags.join(', ').length} ${t('chars')}</span><span style="flex:1"></span><button class="btn small primary" data-act="addtags" data-val="${escapeHtml(JSON.stringify(tags))}">${t('addAll')}</button></div>
      <div class="chips">${tags.map((x: string) => chip(x, 'addtag', '', existing.has(x.toLowerCase()))).join('')}</div></div>`;
  }
  if (action === 'studio_magic_fill' && (p.title || p.description || p.tags)) {
    return `<div class="result"><div class="muted">${t('magicDone')}</div>${p.title ? `<div class="item"><div class="t">${escapeHtml(String(p.title))}</div><button class="btn small" data-act="insert" data-field="title" data-val="${escapeHtml(String(p.title))}">${t('insert')}</button></div>` : ''}</div>`;
  }
  if (action === 'studio_thumbnail' && (typeof p.score === 'number' || p.verdict)) {
    const score = Number(p.score ?? 0);
    const list = (title: string, arr: Any) => (Array.isArray(arr) && arr.length ? `<div class="muted" style="margin-top:6px">${title}:</div><ol class="fixes">${arr.map((x: Any) => `<li>${escapeHtml(String(x))}</li>`).join('')}</ol>` : '');
    return `<div class="result"><div class="row"><span class="pill ${pillClass(score)}">${t('gen_thumb').replace(/^\S+\s/, '')} ${score}</span></div>
      <div style="margin-top:6px">${escapeHtml(String(p.verdict ?? ''))}</div>
      ${p.text_on_thumbnail ? `<div class="muted" style="margin-top:4px">${t('thumbText')}: «${escapeHtml(String(p.text_on_thumbnail))}»</div>` : ''}
      ${list(t('strengths'), p.strengths)}${list(t('issues'), p.issues)}${list(t('fixes'), p.suggestions)}${list(t('textIdeas'), p.text_ideas)}
    </div>`;
  }
  if (action === 'studio_compare' && (typeof p.score === 'number' || p.verdict)) {
    const score = Number(p.score ?? 0);
    return `<div class="result"><div class="row"><span class="pill ${pillClass(score)}">${t('standout')} ${score}</span></div>
      <div style="margin-top:6px">${escapeHtml(String(p.verdict ?? ''))}</div>
      ${Array.isArray(p.fixes) && p.fixes.length ? `<div class="muted" style="margin-top:6px">${t('fixes')}:</div><ol class="fixes">${p.fixes.map((f: Any) => `<li>${escapeHtml(String(f))}</li>`).join('')}</ol>` : ''}
      ${Array.isArray(p.alternatives) && p.alternatives.length ? `<div class="muted">${t('alternatives')}:</div>${p.alternatives.map((a: Any) => `<div class="item"><div class="t">${escapeHtml(String(a))}</div><button class="btn small" data-act="insert" data-field="title" data-val="${escapeHtml(String(a))}">${t('insert')}</button></div>`).join('')}` : ''}
      ${Array.isArray(p.competitors) && p.competitors.length ? `<div class="muted" style="margin-top:6px">${t('competitors')}:</div><table class="cmp">${p.competitors.slice(0, 10).map((c: Any) => `<tr><td>${escapeHtml(String(c.title ?? ''))}<div class="muted">${escapeHtml(String(c.channel ?? ''))}</div></td><td class="num">${formatCompact(Number(c.views) || undefined)}<br>${c.vph ? formatCompact(Number(c.vph)) + '/h' : ''}</td></tr>`).join('')}</table>` : ''}
    </div>`;
  }
  return `<div class="result"><pre class="desc">${escapeHtml(r.text)}</pre></div>`;
}

function toast(msg: string): void {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl?.classList.remove('show'), 1800);
}

// ---- actions -------------------------------------------------------------------

async function checkKeyword(): Promise<void> {
  const kw = state.focusKeyword.trim();
  if (!kw) return;
  state.reportLoading = true;
  state.reportError = undefined;
  render();
  try {
    const res = (await chrome.runtime.sendMessage({ type: 'analyzeKeyword', query: kw, lang } satisfies RuntimeMessage)) as KeywordReport | { error: string };
    if (!res || 'error' in res) throw new Error(res && 'error' in res ? res.error : 'no response');
    state.report = res;
    state.reportFor = kw;
    state.compTags = undefined;
  } catch (err) {
    state.reportError = err instanceof Error ? err.message : String(err);
  } finally {
    state.reportLoading = false;
    render();
  }
}

async function loadCompetitorTags(): Promise<void> {
  const r = state.report;
  if (!r) return;
  state.compTagsLoading = true;
  render();
  try {
    const ids = r.topResults.slice(0, 6).map((v) => v.videoId);
    const res = (await chrome.runtime.sendMessage({ type: 'getVideoTags', videoIds: ids } satisfies RuntimeMessage)) as Record<string, string[]> | { error: string } | null;
    if (!res) throw new Error('no response');
    if (typeof (res as { error?: unknown }).error === 'string') throw new Error((res as { error: string }).error);
    const freq = new Map<string, { tag: string; n: number }>();
    for (const tags of Object.values(res as Record<string, string[]>)) {
      for (const tag of new Set(tags.map((x) => x.trim()).filter(Boolean))) {
        const key = tag.toLowerCase();
        const cur = freq.get(key) ?? { tag, n: 0 };
        cur.n++;
        freq.set(key, cur);
      }
    }
    state.compTags = [...freq.values()].sort((a, b) => b.n - a.n || a.tag.length - b.tag.length);
  } catch (err) {
    state.reportError = err instanceof Error ? err.message : String(err);
  } finally {
    state.compTagsLoading = false;
    render();
  }
}

function ensurePort(): chrome.runtime.Port {
  if (port) return port;
  port = chrome.runtime.connect({ name: 'chat' });
  port.onMessage.addListener(onPanelEvent);
  port.onDisconnect.addListener(() => {
    port = null;
    if (state.running) {
      const r = state.ai[state.running];
      if (r && r.status === 'running') {
        r.status = 'error';
        r.error = 'disconnected';
      }
      state.running = undefined;
      render();
    }
  });
  port.postMessage({ type: 'hello', tabId: null } satisfies PanelRequest);
  return port;
}

function runAi(action: QuickActionId, images?: ImageAttachment[]): void {
  if (state.running) return;
  const tool = TOOLS.find((x) => x.action === action);
  if (tool) activeTool = tool.id;
  state.ai[action] = { status: 'running', text: '' };
  state.running = action;
  render();
  ensurePort().postMessage({ type: 'send', tabId: null, text: '', action, history: [], includeContext: true, images } satisfies PanelRequest);
}

const THUMB_SEL = [
  'ytcp-thumbnail-uploader img',
  'ytcp-thumbnails-compact-editor-uploader img',
  'ytcp-video-thumbnail-with-info img',
  '#thumbnail-editor img',
  'ytcp-thumbnail-editor img',
  '#still-picture img',
  'ytcp-uploads-dialog img[src*="ytimg"]',
  'img[src^="blob:"]',
];

/** Reads the current thumbnail from the Studio form as a base64 image. */
async function captureThumbnail(): Promise<ImageAttachment | null> {
  const imgs = THUMB_SEL.flatMap((s) => Array.from(document.querySelectorAll<HTMLImageElement>(s))).filter((i) => i.src && !/data:image\/svg/.test(i.src));
  if (!imgs.length) return null;
  imgs.sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight);
  const src = imgs[0].src;
  const toB64 = async (blob: Blob): Promise<ImageAttachment> => {
    const buf = new Uint8Array(await blob.arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    const mediaType = (/^image\/(jpeg|png|webp|gif)$/.test(blob.type) ? blob.type : 'image/jpeg') as ImageAttachment['mediaType'];
    return { mediaType, data: btoa(bin) };
  };
  try {
    const res = await fetch(src);
    if (res.ok) return await toB64(await res.blob());
  } catch {
    /* cross-origin: go through the background */
  }
  if (/^https?:/.test(src)) {
    const r = (await chrome.runtime.sendMessage({ type: 'fetchImage', url: src } satisfies RuntimeMessage).catch(() => null)) as { mediaType: string; data: string } | { error: string } | null;
    if (r && 'data' in r) return { mediaType: r.mediaType as ImageAttachment['mediaType'], data: r.data };
  }
  // Last resort: draw the element onto a canvas (works for same-origin / CORS-enabled images).
  try {
    const c = document.createElement('canvas');
    c.width = imgs[0].naturalWidth || imgs[0].width;
    c.height = imgs[0].naturalHeight || imgs[0].height;
    c.getContext('2d')!.drawImage(imgs[0], 0, 0);
    const dataUrl = c.toDataURL('image/jpeg', 0.9);
    return { mediaType: 'image/jpeg', data: dataUrl.split(',')[1] };
  } catch {
    return null;
  }
}

async function runThumbnailReview(): Promise<void> {
  if (state.running) return;
  state.ai.studio_thumbnail = { status: 'running', text: '', progress: t('thumbLoading') };
  state.running = 'studio_thumbnail';
  render();
  const img = await captureThumbnail();
  if (!img) {
    state.ai.studio_thumbnail = { status: 'error', text: '', error: t('noThumb') };
    state.running = undefined;
    render();
    return;
  }
  state.running = undefined;
  runAi('studio_thumbnail', [img]);
}

function onPanelEvent(ev: PanelEvent): void {
  const action = state.running;
  if (!action) return;
  const r = state.ai[action]!;
  switch (ev.type) {
    case 'delta':
      r.text += ev.text;
      render();
      break;
    case 'tool_status':
      r.progress = ev.summary;
      render();
      break;
    case 'assistant':
      if (ev.message.role === 'assistant' && ev.message.content.trim()) r.text = ev.message.content;
      break;
    case 'error':
      r.status = 'error';
      r.error = ev.text;
      break;
    case 'notice':
      if (ev.text === 'aborted') {
        r.status = 'error';
        r.error = t('stop');
      }
      break;
    case 'done':
      if (r.status === 'running') {
        r.status = 'done';
        r.parsed = parseJson(r.text);
      }
      state.running = undefined;
      render();
      if (action === 'studio_magic_fill' && r.status === 'done' && r.parsed) void applyMagicFill(r.parsed);
      break;
  }
}

async function applyMagicFill(p: Any): Promise<void> {
  if (typeof p.title === 'string' && p.title.trim()) await insert('title', p.title.trim());
  if (typeof p.description === 'string' && p.description.trim()) await insert('description', p.description.trim());
  if (Array.isArray(p.tags) && p.tags.length) await insert('tags', p.tags.map((x: Any) => String(x)));
  refreshDraft();
}

function parseJson(text: string): Any | undefined {
  const cleaned = text.replace(/```(?:json)?/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) return undefined;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return undefined;
  }
}

async function onClick(e: Event): Promise<void> {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!el) return;
  const val = el.dataset.val ?? '';
  switch (el.dataset.act) {
    case 'tool':
      activeTool = activeTool === (val as ToolId) ? null : (val as ToolId);
      chrome.storage.local.set({ studioTool: activeTool }).catch(() => undefined);
      render();
      break;
    case 'chat':
      chrome.runtime.sendMessage({ type: 'openSidePanel' } satisfies RuntimeMessage).catch(() => undefined);
      break;
    case 'settings':
      chrome.runtime.openOptionsPage();
      break;
    case 'check':
      checkKeyword();
      break;
    case 'comptags':
      loadCompetitorTags();
      break;
    case 'addfreq':
      await insert('tags', (state.compTags ?? []).filter((x) => x.n >= 2).map((x) => x.tag));
      refreshDraft();
      break;
    case 'addtag':
      await insert('tags', [val]);
      refreshDraft();
      break;
    case 'addtags':
      await insert('tags', JSON.parse(val) as string[]);
      refreshDraft();
      break;
    case 'insert': {
      const field = el.dataset.field as 'title' | 'description';
      const mode = (el.dataset.mode as 'replace' | 'append') ?? 'replace';
      const value = field === 'description' ? (state.ai.studio_description?.parsed?.description as string) ?? '' : val;
      await insert(field, value, mode);
      break;
    }
    case 'toggleTitle':
      state.showTitleChecks = !state.showTitleChecks;
      render();
      break;
    case 'toggleSeo':
      state.showSeoChecks = !state.showSeoChecks;
      render();
      break;
    case 'ai':
      if (val === 'studio_thumbnail') void runThumbnailReview();
      else runAi(val as QuickActionId);
      break;
    case 'tpl-apply': {
      const idx = Number(root?.querySelector<HTMLSelectElement>('#tpl')?.value ?? '');
      const tpl = settings.tagTemplates?.[idx];
      if (tpl) {
        await insert('tags', tpl.tags);
        refreshDraft();
      }
      break;
    }
    case 'tpl-save': {
      const name = window.prompt(t('tpl_name'), state.focusKeyword || '')?.trim();
      if (!name) break;
      const list = (settings.tagTemplates ?? []).filter((x) => x.name !== name);
      list.push({ name, tags: [...state.draft.tags] });
      settings = { ...settings, tagTemplates: list };
      await saveSettings(settings);
      render();
      break;
    }
    case 'tpl-del': {
      const idx = Number(root?.querySelector<HTMLSelectElement>('#tpl')?.value ?? '');
      if (!Number.isFinite(idx) || !settings.tagTemplates?.[idx]) break;
      const list = settings.tagTemplates.filter((_x, i) => i !== idx);
      settings = { ...settings, tagTemplates: list };
      await saveSettings(settings);
      render();
      break;
    }
    case 'stop':
      port?.postMessage({ type: 'abort' } satisfies PanelRequest);
      break;
  }
}

// ---- lifecycle -------------------------------------------------------------------

let lastDraftKey = '';

function refreshDraft(): void {
  const d = readDraft();
  if (!d) {
    if (host?.isConnected) host.remove();
    document.getElementById('nubit-title-score')?.remove();
    return;
  }
  if (!host?.isConnected) mount();
  const key = JSON.stringify(d);
  if (key === lastDraftKey) return;
  lastDraftKey = key;
  state.draft = d;
  if (!state.focusEdited) state.focusKeyword = guessFocusKeyword(d.title);
  if (!kwInputFocused) render();
}

function mount(): void {
  if (!host) {
    host = document.createElement('div');
    host.id = 'nubit-studio-host';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = css;
    shadow.appendChild(style);
    root = document.createElement('div');
    root.className = 'wrap';
    shadow.appendChild(root);
    root.addEventListener('click', (e) => void onClick(e));
  }
  document.body.appendChild(host);
  render();
}

async function init(): Promise<void> {
  settings = await loadSettings();
  lang = settings.language;
  setLang(lang);
  const savedTool = (await chrome.storage.local.get('studioTool')).studioTool;
  if (savedTool === null || typeof savedTool === 'string') activeTool = savedTool as ToolId | null;
  onSettingsChanged((s) => {
    settings = s;
    lang = s.language;
    setLang(lang);
    render();
  });
  document.addEventListener('input', () => setTimeout(refreshDraft, 50), true);
  setInterval(refreshDraft, 1200);
  refreshDraft();

  chrome.runtime.onMessage.addListener((msg: RuntimeMessage, _sender, sendResponse) => {
    if (msg.type === 'getPageContext') {
      const d = readDraft();
      const ctx: PageContext = { kind: 'studio', url: location.href, title: document.title, capturedAt: new Date().toISOString() };
      if (d) {
        ctx.draft = {
          ...d,
          focusKeyword: state.focusKeyword || guessFocusKeyword(d.title) || undefined,
          titleScore: titleScore(d.title, state.focusKeyword, lang).score,
          seoScore: seoScore({ videoId: 'draft', url: '', title: d.title, description: d.description, tags: d.tags }, lang).score,
        };
      }
      sendResponse(ctx);
      return true;
    }
    if (msg.type === 'studioInsert') {
      insert(msg.field, msg.value, msg.mode ?? 'replace').then((ok) => sendResponse({ ok }), (err) => sendResponse({ error: String(err) }));
      return true;
    }
    return undefined;
  });
}

init().catch((err) => console.error('[Nubit] studio init failed', err));
