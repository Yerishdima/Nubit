// Small persistent stores: view-count snapshots (for "recent VPH") and a channel-stats cache.
import type { ChannelStats } from '../shared/types.ts';

interface Snapshot {
  t: number;
  v: number;
}

const SNAP_KEY = 'snapshots';
const MAX_VIDEOS = 400;
const MAX_PER_VIDEO = 24;
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;

type SnapshotMap = Record<string, Snapshot[]>;

let snapWriteChain: Promise<void> = Promise.resolve();

/** Records a view count and returns the recent views-per-hour if two snapshots ≥ 20 minutes apart exist. */
export function recordSnapshot(videoId: string, views: number): Promise<number | undefined> {
  const run = async () => {
    const now = Date.now();
    const all = ((await chrome.storage.local.get(SNAP_KEY))[SNAP_KEY] ?? {}) as SnapshotMap;
    const list = (all[videoId] ?? []).filter((s) => now - s.t < MAX_AGE_MS);
    const last = list[list.length - 1];
    if (!last || now - last.t > 5 * 60 * 1000 || last.v !== views) list.push({ t: now, v: views });
    while (list.length > MAX_PER_VIDEO) list.shift();
    all[videoId] = list;
    // prune
    const ids = Object.keys(all);
    if (ids.length > MAX_VIDEOS) {
      ids
        .sort((a, b) => (all[a][all[a].length - 1]?.t ?? 0) - (all[b][all[b].length - 1]?.t ?? 0))
        .slice(0, ids.length - MAX_VIDEOS)
        .forEach((id) => delete all[id]);
    }
    await chrome.storage.local.set({ [SNAP_KEY]: all });
    return recentVph(list);
  };
  const p = snapWriteChain.then(run, run);
  snapWriteChain = p.then(
    () => undefined,
    () => undefined,
  );
  return p;
}

function recentVph(list: Snapshot[]): number | undefined {
  if (list.length < 2) return undefined;
  const last = list[list.length - 1];
  // oldest snapshot within the last 24h that is at least 20 minutes older than the newest
  const candidates = list.filter((s) => last.t - s.t >= 20 * 60 * 1000 && last.t - s.t <= 24 * 3600 * 1000);
  if (!candidates.length) return undefined;
  const first = candidates[0];
  const hours = (last.t - first.t) / 3600000;
  if (hours <= 0) return undefined;
  return Math.max(0, (last.v - first.v) / hours);
}

// ---- channel cache (session storage: cleared when the browser closes) ------

const CH_KEY = 'channelCache';
const CH_TTL = 12 * 3600 * 1000;

export async function getCachedChannel(key: string): Promise<ChannelStats | undefined> {
  const all = ((await chrome.storage.session.get(CH_KEY))[CH_KEY] ?? {}) as Record<string, ChannelStats>;
  const hit = all[key];
  if (hit && Date.now() - hit.fetchedAt < CH_TTL) return hit;
  return undefined;
}

export async function setCachedChannel(keys: string[], stats: ChannelStats): Promise<void> {
  const all = ((await chrome.storage.session.get(CH_KEY))[CH_KEY] ?? {}) as Record<string, ChannelStats>;
  for (const k of keys) if (k) all[k] = stats;
  const ids = Object.keys(all);
  if (ids.length > 300) {
    ids.sort((a, b) => all[a].fetchedAt - all[b].fetchedAt).slice(0, ids.length - 300).forEach((id) => delete all[id]);
  }
  await chrome.storage.session.set({ [CH_KEY]: all });
}
