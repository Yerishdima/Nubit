// Keyword panel on YouTube search results pages (vidIQ-style "keyword score" card).
import type { QuickActionId, RuntimeMessage } from '../shared/types.ts';
import type { KeywordReport } from '../background/keyword.ts';
import { formatAge, formatCompact, getLang, t } from '../shared/i18n.ts';
import { escapeHtml } from '../shared/markdown.ts';
import css from './overlay.css';

const HOST_ID = 'nubit-search-host';
const cache = new Map<string, KeywordReport>();

let host: HTMLElement | null = null;
let root: HTMLElement | null = null;
let currentQuery = '';

const L = {
  ru: {
    title: 'Анализ запроса',
    demand: 'Спрос',
    competition: 'Конкуренция',
    exact: 'точных совпадений в названиях',
    median: 'медиана просмотров в топе',
    age: 'медианный возраст',
    recent: 'свежих (< 6 мес)',
    winners: 'Небольшие каналы в топе',
    related: 'Похожие запросы',
    ai: 'ИИ-анализ запроса',
    ideas: 'Идеи для видео',
    loading: 'считаю…',
    note: 'Оценки по автоподсказкам и топу выдачи; YouTube не публикует объём поиска.',
    subs: 'подп.',
  },
  en: {
    title: 'Keyword analysis',
    demand: 'Demand',
    competition: 'Competition',
    exact: 'exact matches in titles',
    median: 'median views in the top',
    age: 'median age',
    recent: 'recent (< 6 mo)',
    winners: 'Small channels ranking',
    related: 'Related queries',
    ai: 'AI keyword research',
    ideas: 'Video ideas',
    loading: 'computing…',
    note: 'Estimates from autocomplete and the top results; YouTube publishes no search volume.',
    subs: 'subs',
  },
} as const;

function s(k: keyof (typeof L)['ru']): string {
  return L[getLang()][k];
}

function isDark(): boolean {
  return document.documentElement.hasAttribute('dark');
}

function meter(label: string, value: number | undefined, invert = false): string {
  const v = value ?? 0;
  const tier = invert ? (v >= 70 ? 'bad' : v >= 40 ? 'warn' : 'good') : v >= 70 ? 'good' : v >= 40 ? 'warn' : 'bad';
  return `<div class="row" style="margin-top:6px"><span class="lbl" style="width:95px">${label}</span><div class="bar"><i style="width:${Math.max(2, Math.min(100, v))}%"></i></div><span class="pill ${tier}">${value === undefined ? '—' : Math.round(v)}</span></div>`;
}

function render(state: { query: string; loading?: boolean; error?: string; report?: KeywordReport }): void {
  if (!root || !host) return;
  host.setAttribute('data-theme', isDark() ? 'dark' : 'light');
  const r = state.report;
  const body = state.loading
    ? `<div class="muted">${s('loading')}</div>`
    : state.error
      ? `<div class="muted">${escapeHtml(state.error)}</div>`
      : r
        ? `${meter(s('demand'), r.demand)}${meter(s('competition'), r.competition, true)}
           <div class="small" style="margin-top:8px">${r.exactInTitle}/${r.resultCount} ${s('exact')} · ${s('median')}: ${formatCompact(r.medianViews)} · ${s('age')}: ${formatAge(r.medianAgeDays !== undefined ? r.medianAgeDays * 24 : undefined)} · ${Math.round(r.recentShare * 100)}% ${s('recent')}</div>
           ${
             r.smallChannelWinners.length
               ? `<div class="small" style="margin-top:8px">${s('winners')}:</div><div class="tags">${r.smallChannelWinners
                   .slice(0, 4)
                   .map((v) => `<a class="tag" href="/watch?v=${v.videoId}" title="${escapeHtml(v.title)}">${escapeHtml(v.title.slice(0, 40))}${v.title.length > 40 ? '…' : ''} · ${formatCompact(v.views)} · ${formatCompact(v.subscribers)} ${s('subs')}</a>`)
                   .join('')}</div>`
               : ''
           }
           ${
             r.suggestions.length
               ? `<div class="small" style="margin-top:8px">${s('related')}:</div><div class="tags">${r.suggestions
                   .slice(0, 14)
                   .map((q) => `<a class="tag" href="/results?search_query=${encodeURIComponent(q)}">${escapeHtml(q)}</a>`)
                   .join('')}</div>`
               : ''
           }
           <div class="small" style="margin-top:8px">${s('note')}</div>`
        : '';
  root.innerHTML = `<div class="card">
    <div class="head"><span class="logo"></span><span class="title">${t('app_name')} · ${s('title')}: «${escapeHtml(state.query)}»</span></div>
    ${body}
    <div class="actions">
      <button class="btn primary" data-action="keyword_research">${s('ai')}</button>
      <button class="btn" data-action="content_ideas">${s('ideas')}</button>
    </div>
  </div>`;
}

function mount(): void {
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = css;
    shadow.appendChild(style);
    root = document.createElement('div');
    shadow.appendChild(root);
    root.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
      if (!el) return;
      chrome.runtime.sendMessage({ type: 'openSidePanel', action: el.dataset.action as QuickActionId } satisfies RuntimeMessage).catch(() => undefined);
    });
  }
  const target = document.querySelector('ytd-search #container, ytd-search #contents, ytd-two-column-search-results-renderer #primary, #primary');
  if (target && host.parentElement !== target) target.prepend(host);
  else if (!target && !host.isConnected) setTimeout(mount, 700);
}

export async function showSearchPanel(query: string): Promise<void> {
  currentQuery = query;
  mount();
  const cached = cache.get(query);
  render({ query, loading: !cached, report: cached });
  if (cached) return;
  try {
    const res = (await chrome.runtime.sendMessage({ type: 'analyzeKeyword', query, lang: getLang() } satisfies RuntimeMessage)) as KeywordReport | { error: string } | null;
    if (currentQuery !== query) return;
    if (!res || 'error' in res) throw new Error(res && 'error' in res ? res.error : 'no response');
    cache.set(query, res);
    render({ query, report: res });
  } catch (err) {
    if (currentQuery === query) render({ query, error: err instanceof Error ? err.message : String(err) });
  }
}

export function hideSearchPanel(): void {
  currentQuery = '';
  host?.remove();
}
