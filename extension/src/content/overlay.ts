// The analytics card injected on watch pages (rendered inside a shadow root).
import type { QuickActionId, TagRank, VideoData, VideoMetrics } from '../shared/types.ts';
import { formatAge, formatCompact, formatDuration, formatPercent, t } from '../shared/i18n.ts';
import { escapeHtml } from '../shared/markdown.ts';
import { outlierTier, vphTier } from '../shared/metrics.ts';
import css from './overlay.css';

export interface OverlayState {
  video?: VideoData;
  metrics?: VideoMetrics;
  vphRecent?: number;
  outlierPending?: boolean;
  outlierError?: string;
  tagRanks?: TagRank[];
  tagRanksPending?: boolean;
  channelKeywords?: string[];
}

export interface Overlay {
  update(state: OverlayState): void;
  remove(): void;
  toast(msg: string): void;
  readonly host: HTMLElement;
}

const HOST_ID = 'nubit-overlay-host';

function isDark(): boolean {
  return document.documentElement.hasAttribute('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
}

export function createOverlay(onAction: (action: QuickActionId | 'chat' | 'tagranks' | 'competitor') => void): Overlay {
  document.getElementById(HOST_ID)?.remove();
  const host = document.createElement('div');
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = css;
  shadow.appendChild(style);
  const root = document.createElement('div');
  shadow.appendChild(root);
  let state: OverlayState = {};
  let showChecks = false;

  const render = () => {
    host.setAttribute('data-theme', isDark() ? 'dark' : 'light');
    root.innerHTML = html(state, showChecks);
  };

  root.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action],[data-tag],[data-toggle]');
    if (!target) return;
    if (target.dataset.action) {
      onAction(target.dataset.action as QuickActionId | 'chat' | 'tagranks' | 'competitor');
    } else if (target.dataset.tag !== undefined) {
      const tag = target.dataset.tag === '*' ? (state.video?.tags ?? []).join(', ') : target.dataset.tag;
      navigator.clipboard.writeText(tag).then(() => {
        const prev = target.textContent;
        target.textContent = t('copied');
        setTimeout(() => (target.textContent = prev), 900);
      });
    } else if (target.dataset.toggle === 'checks') {
      showChecks = !showChecks;
      render();
    }
  });

  render();
  return {
    host,
    update(next) {
      state = next;
      render();
    },
    remove() {
      host.remove();
    },
    toast(msg) {
      const el = document.createElement('div');
      el.className = 'toast';
      el.textContent = msg;
      shadow.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    },
  };
}

function tile(key: string, value: string, sub?: string, tier?: string, title?: string): string {
  return `<div class="tile ${tier ?? ''}" ${title ? `title="${escapeHtml(title)}"` : ''}><div class="v">${value}</div><div class="k">${key}${sub ? ` <span class="s">${sub}</span>` : ''}</div></div>`;
}

function html(s: OverlayState, showChecks: boolean): string {
  const v = s.video;
  const m = s.metrics;
  if (!v) return `<div class="card"><div class="head"><span class="logo"></span><span class="title">${t('app_name')}</span><span class="pill">${t('loading')}</span></div></div>`;

  const seo = m?.seo;
  const seoClass = seo ? (seo.score >= 75 ? 'good' : seo.score >= 50 ? 'warn' : 'bad') : '';
  const tiles: string[] = [];
  tiles.push(tile(t('vph'), formatCompact(m?.vph), undefined, m?.vph !== undefined ? vphTier(m.vph) : undefined, t('vph_full')));
  tiles.push(tile(t('vph_recent'), s.vphRecent !== undefined ? formatCompact(s.vphRecent) + '/' + t('t_hour') : '—', undefined, s.vphRecent !== undefined ? vphTier(s.vphRecent) : 'low', t('vph_recent_full')));
  tiles.push(tile(t('views'), formatCompact(v.views)));
  tiles.push(tile(t('age'), formatAge(m?.ageHours), v.durationSec ? formatDuration(v.durationSec) : undefined));
  tiles.push(tile(t('likes'), formatCompact(v.likes), m?.likeRate !== undefined ? formatPercent(m.likeRate) : undefined));
  tiles.push(tile(t('comments'), formatCompact(v.comments), m?.commentRate !== undefined ? formatPercent(m.commentRate, 2) : undefined));
  let outlierVal = '—';
  let outlierTierCls: string | undefined;
  if (m?.outlier !== undefined) {
    outlierVal = (m.outlier >= 10 ? m.outlier.toFixed(0) : m.outlier.toFixed(1)) + '×';
    outlierTierCls = outlierTier(m.outlier);
  } else if (s.outlierPending) outlierVal = '…';
  tiles.push(
    tile(
      t('outlier'),
      outlierVal,
      m?.channelSampleSize ? `n=${m.channelSampleSize}` : undefined,
      outlierTierCls,
      s.outlierError ?? (m?.channelMedianViews ? `${t('outlier_full')} (${formatCompact(m.channelMedianViews)})` : t('outlier_full')),
    ),
  );
  tiles.push(tile(t('subscribers'), formatCompact(v.subscribers), m?.engagementRate !== undefined ? `${t('engagement').slice(0, 4)}. ${formatPercent(m.engagementRate)}` : undefined, undefined, t('engagement_full')));

  const checks = seo
    ? `<ul class="checks ${showChecks ? '' : 'hidden'}">${seo.checks
        .map(
          (c) =>
            `<li class="${c.ok ? 'ok' : 'no'}"><span class="ic">${c.ok ? '✓' : '✗'}</span><span>${escapeHtml(c.label)}${c.ok ? '' : `<span class="hint">${escapeHtml(c.hint)}</span>`}</span></li>`,
        )
        .join('')}</ul>`
    : '';

  const tags = v.tags ?? [];
  const ranks = new Map((s.tagRanks ?? []).map((r) => [r.tag.toLowerCase(), r]));
  const rankBadge = (tag: string) => {
    const r = ranks.get(tag.toLowerCase());
    if (!r) return '';
    return r.rank ? `<b class="rank ${r.rank <= 3 ? 'top' : ''}">#${r.rank}</b>` : `<b class="rank none">—</b>`;
  };
  const tagsHtml = tags.length
    ? `<div class="tags">${tags
        .slice(0, 40)
        .map((tag) => `<button class="tag" data-tag="${escapeHtml(tag)}" title="${t('copy')}">${escapeHtml(tag)}${rankBadge(tag)}</button>`)
        .join('')}${tags.length > 40 ? `<span class="small">+${tags.length - 40}</span>` : ''}</div>
       <div class="row"><span class="small">${t('tags')}: ${tags.length}</span><button class="link" data-tag="*">${t('copy_all_tags')}</button>
         <button class="link" data-action="tagranks" ${s.tagRanksPending ? 'disabled' : ''}>${s.tagRanksPending ? t('computing') : t('tag_ranks')}</button></div>
       ${s.tagRanks?.length ? `<div class="small">${t('tag_ranks_hint')}</div>` : ''}`
    : `<div class="muted">${t('no_tags')}</div>`;
  const chKw = s.channelKeywords?.length
    ? `<div class="small" style="margin-top:6px">${t('channel_tags')}: ${escapeHtml(s.channelKeywords.slice(0, 12).join(', '))}${s.channelKeywords.length > 12 ? ` +${s.channelKeywords.length - 12}` : ''}</div>`
    : '';

  const caps = v.captionTracks?.length
    ? `<div class="small">${t('captions')}: ${escapeHtml(
        v.captionTracks
          .slice(0, 6)
          .map((c) => `${c.lang}${c.auto ? ` (${t('auto')})` : ''}`)
          .join(', '),
      )}${v.captionTracks.length > 6 ? ` +${v.captionTracks.length - 6}` : ''}</div>`
    : '';

  return `<div class="card">
    <div class="head"><span class="logo"></span><span class="title">${t('app_name')}</span>${seo ? `<span class="pill ${seoClass}" title="${t('seo_score')}">SEO ${seo.score}</span>` : ''}</div>
    <div class="grid">${tiles.join('')}</div>
    ${seo ? `<div class="row"><span class="lbl">${t('seo_score')}</span><div class="bar"><i style="width:${seo.score}%"></i></div><button class="link" data-toggle="checks">${showChecks ? t('hide_checks') : t('show_checks')}</button></div>${checks}` : ''}
    ${tagsHtml}
    ${chKw}
    ${caps}
    <div class="actions">
      <button class="btn primary" data-action="analyze_video">${t('ai_analyze')}</button>
      <button class="btn" data-action="why_performing">${t('act_why_performing')}</button>
      <button class="btn" data-action="titles">${t('act_titles')}</button>
      <button class="btn" data-action="tags_description">${t('act_tags_description')}</button>
      <button class="btn" data-action="chat">${t('open_chat')}</button>
      <button class="btn" data-action="competitor" title="${t('tab_competitors')}">${t('add_competitor')}</button>
    </div>
  </div>`;
}
