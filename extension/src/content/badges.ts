// VPH / outlier badges on video thumbnails (home, search, related, channel grids).
import type { ChannelStats, ListVideo, RuntimeMessage } from '../shared/types.ts';
import { formatCompact, t } from '../shared/i18n.ts';
import { outlierTier, vphTier } from '../shared/metrics.ts';
import { domListVideo, LIST_SELECTOR, pageKind } from './extract.ts';
import badgeCss from './badges.css';

const PROCESSED = 'data-nubit';
const channelMedians = new Map<string, Promise<number | undefined>>();
let outlierBudget = 0;

export interface BadgeOptions {
  enabled: () => boolean;
  outliers: () => boolean;
}

export function startBadges(opts: BadgeOptions): { rescan: () => void } {
  const style = document.createElement('style');
  style.id = 'nubit-badge-style';
  style.textContent = badgeCss;
  document.documentElement.appendChild(style);

  let timer: number | undefined;
  const schedule = () => {
    if (timer) return;
    timer = window.setTimeout(() => {
      timer = undefined;
      scan(opts);
    }, 400);
  };
  const mo = new MutationObserver(schedule);
  mo.observe(document.documentElement, { childList: true, subtree: true });
  schedule();
  return {
    rescan: () => {
      outlierBudget = 40;
      schedule();
    },
  };
}

function scan(opts: BadgeOptions): void {
  if (!opts.enabled()) return;
  const kind = pageKind();
  const els = document.querySelectorAll(`${LIST_SELECTOR}:not([${PROCESSED}])`);
  let n = 0;
  for (const el of els) {
    if (n++ > 150) break;
    if (el.tagName === 'YT-LOCKUP-VIEW-MODEL' && el.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer')) {
      el.setAttribute(PROCESSED, 'skip');
      continue;
    }
    const v = domListVideo(el);
    if (!v) continue; // metadata not rendered yet — retry on the next mutation
    el.setAttribute(PROCESSED, v.videoId);
    decorate(el, v, opts.outliers() && (kind === 'search' || kind === 'watch' || kind === 'channel'));
  }
}

function thumbContainer(el: Element): HTMLElement | null {
  const c = el.querySelector<HTMLElement>('ytd-thumbnail, yt-thumbnail-view-model, a#thumbnail, .yt-lockup-view-model-wiz__content-image, .yt-lockup-view-model__content-image');
  return c;
}

function decorate(el: Element, v: ListVideo, withOutlier: boolean): void {
  if (v.isLive || v.vph === undefined) return;
  const container = thumbContainer(el);
  if (!container) return;
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  container.querySelector('.nubit-badges')?.remove();
  const wrap = document.createElement('div');
  wrap.className = 'nubit-badges';
  const vph = document.createElement('span');
  vph.className = `nubit-badge vph tier-${vphTier(v.vph)}`;
  vph.textContent = `${formatCompact(v.vph)}/${t('t_hour')}`;
  vph.title = `${t('vph_full')}: ${Math.round(v.vph)}`;
  wrap.appendChild(vph);
  container.appendChild(wrap);

  if (withOutlier && v.views !== undefined && (v.channelId || v.channelHandle) && outlierBudget > 0) {
    outlierBudget--;
    const key = v.channelId ?? v.channelHandle!;
    channelMedian(key).then((median) => {
      if (!median || !wrap.isConnected) return;
      const x = (v.views as number) / median;
      const o = document.createElement('span');
      o.className = `nubit-badge outlier tier-${outlierTier(x)}`;
      o.textContent = (x >= 10 ? x.toFixed(0) : x.toFixed(1)) + '×';
      o.title = `${t('outlier_full')} (${formatCompact(median)})`;
      wrap.appendChild(o);
    });
  }
}

function channelMedian(key: string): Promise<number | undefined> {
  let p = channelMedians.get(key);
  if (!p) {
    p = (async () => {
      try {
        const res = (await chrome.runtime.sendMessage({ type: 'getChannelStats', channel: key } satisfies RuntimeMessage)) as ChannelStats | { error: string } | null;
        if (!res || 'error' in res) return undefined;
        return res.medianViews;
      } catch {
        return undefined;
      }
    })();
    channelMedians.set(key, p);
  }
  return p;
}
