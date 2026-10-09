// Competitor tracking: periodic refresh, alerts and the action badge.
import type { Competitor, CompetitorAlert, CompetitorSnapshot, Settings } from '../shared/types.ts';
import { loadSettings, saveSettings } from '../shared/settings.ts';
import { competitorKey, computeAlerts, snapshotFromStats } from '../shared/competitors.ts';
import type { YouTube } from './youtube.ts';

const SNAP_KEY = 'competitorSnapshots';
const ALERTS_KEY = 'competitorAlerts';
export const ALARM = 'nubit-competitors';
const MAX_ALERTS = 120;

export interface CompetitorsState {
  competitors: Competitor[];
  snapshots: Record<string, CompetitorSnapshot>;
  alerts: CompetitorAlert[];
}

export async function getCompetitorsState(): Promise<CompetitorsState> {
  const s = await loadSettings();
  const stored = await chrome.storage.local.get([SNAP_KEY, ALERTS_KEY]);
  return {
    competitors: s.competitors,
    snapshots: (stored[SNAP_KEY] ?? {}) as Record<string, CompetitorSnapshot>,
    alerts: (stored[ALERTS_KEY] ?? []) as CompetitorAlert[],
  };
}

export async function addCompetitor(youtube: YouTube, channel: string): Promise<{ ok: boolean; message: string; competitor?: Competitor }> {
  const s = await loadSettings();
  if (s.competitors.length >= 30) return { ok: false, message: 'limit:30' };
  const stats = await youtube.channelStats(channel, 25);
  const c: Competitor = { channelId: stats.channel.channelId, handle: stats.channel.handle, name: stats.channel.name ?? stats.channel.handle ?? channel, addedAt: Date.now() };
  const key = competitorKey(c);
  if (!key) return { ok: false, message: 'unresolved' };
  if (s.competitors.some((x) => competitorKey(x) === key)) return { ok: true, message: 'exists', competitor: c };
  s.competitors.push(c);
  await saveSettings(s);
  const snapshots = ((await chrome.storage.local.get(SNAP_KEY))[SNAP_KEY] ?? {}) as Record<string, CompetitorSnapshot>;
  snapshots[key] = snapshotFromStats(key, stats);
  await chrome.storage.local.set({ [SNAP_KEY]: snapshots });
  ensureAlarm();
  return { ok: true, message: 'added', competitor: c };
}

export async function removeCompetitor(key: string): Promise<void> {
  const s = await loadSettings();
  s.competitors = s.competitors.filter((x) => competitorKey(x) !== key);
  await saveSettings(s);
  const stored = await chrome.storage.local.get([SNAP_KEY, ALERTS_KEY]);
  const snapshots = (stored[SNAP_KEY] ?? {}) as Record<string, CompetitorSnapshot>;
  delete snapshots[key];
  const alerts = ((stored[ALERTS_KEY] ?? []) as CompetitorAlert[]).filter((a) => a.channelKey !== key);
  await chrome.storage.local.set({ [SNAP_KEY]: snapshots, [ALERTS_KEY]: alerts });
  await updateBadge(alerts);
}

/** Re-fetches every tracked channel, records new alerts and updates the badge. */
export async function refreshCompetitors(youtube: YouTube, settings?: Settings): Promise<CompetitorsState> {
  const s = settings ?? (await loadSettings());
  const stored = await chrome.storage.local.get([SNAP_KEY, ALERTS_KEY]);
  const snapshots = (stored[SNAP_KEY] ?? {}) as Record<string, CompetitorSnapshot>;
  let alerts = (stored[ALERTS_KEY] ?? []) as CompetitorAlert[];
  const known = new Set(alerts.map((a) => a.videoId));
  for (const c of s.competitors) {
    const key = competitorKey(c);
    if (!key) continue;
    try {
      const stats = await youtube.channelStats(c.channelId ?? c.handle!, 25, false);
      const snap = snapshotFromStats(key, stats);
      snapshots[key] = snap;
      // Videos older than the first snapshot are history, not news: only alert on uploads after we started tracking.
      const fresh = computeAlerts(snap, stats, known).filter((a) => a.ageHours === undefined || Date.now() - a.ageHours * 3600000 >= c.addedAt - 24 * 3600000);
      for (const a of fresh) known.add(a.videoId);
      alerts = [...fresh, ...alerts];
    } catch {
      /* keep the previous snapshot */
    }
  }
  alerts = alerts.slice(0, MAX_ALERTS);
  await chrome.storage.local.set({ [SNAP_KEY]: snapshots, [ALERTS_KEY]: alerts });
  await updateBadge(alerts);
  return { competitors: s.competitors, snapshots, alerts };
}

export async function markAlertsSeen(): Promise<void> {
  const alerts = ((await chrome.storage.local.get(ALERTS_KEY))[ALERTS_KEY] ?? []) as CompetitorAlert[];
  for (const a of alerts) a.unseen = false;
  await chrome.storage.local.set({ [ALERTS_KEY]: alerts });
  await updateBadge(alerts);
}

async function updateBadge(alerts: CompetitorAlert[]): Promise<void> {
  const n = alerts.filter((a) => a.unseen).length;
  try {
    await chrome.action.setBadgeBackgroundColor({ color: '#ea580c' });
    await chrome.action.setBadgeText({ text: n ? String(n) : '' });
  } catch {
    /* no action API in some contexts */
  }
}

export function ensureAlarm(): void {
  chrome.alarms.get(ALARM).then((a) => {
    if (!a) chrome.alarms.create(ALARM, { periodInMinutes: 360, delayInMinutes: 5 });
  });
}
