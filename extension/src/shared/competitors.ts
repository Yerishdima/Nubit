// Pure helpers for competitor tracking (testable without chrome.*).
import type { ChannelStats, CompetitorAlert, CompetitorSnapshot, ListVideo } from './types.ts';
import { ageHoursFromIso } from './metrics.ts';

export const ALERT_MAX_AGE_HOURS = 14 * 24;
export const ALERT_MIN_OUTLIER = 2;
export const ALERT_MIN_VPH = 500;

export function competitorKey(c: { channelId?: string; handle?: string }): string {
  return (c.channelId ?? c.handle ?? '').toLowerCase();
}

/** Summarizes a channel's recent uploads for the competitors list. */
export function snapshotFromStats(key: string, stats: ChannelStats, now = Date.now()): CompetitorSnapshot {
  const med = stats.medianViews ?? 0;
  const videos = stats.videos
    .map((v) => ({ ...v, ageHours: v.ageHours ?? ageHoursFromIso(v.publishedAt, now), outlier: med && v.views !== undefined ? v.views / med : undefined }))
    .filter((v) => v.views !== undefined);
  const ages = videos.map((v) => v.ageHours).filter((x): x is number => x !== undefined);
  const top = [...videos].sort((a, b) => (b.outlier ?? 0) - (a.outlier ?? 0)).slice(0, 6);
  return {
    key,
    name: stats.channel.name ?? stats.channel.handle ?? key,
    channelId: stats.channel.channelId,
    handle: stats.channel.handle,
    subscribers: stats.channel.subscribers,
    medianViews: stats.medianViews,
    uploadsPerWeek: stats.uploadsPerWeek,
    lastUploadAgeHours: ages.length ? Math.min(...ages) : undefined,
    topVideos: top.map(compactVideo),
    fetchedAt: now,
  };
}

function compactVideo(v: ListVideo & { outlier?: number }): CompetitorSnapshot['topVideos'][number] {
  return { videoId: v.videoId, title: v.title, views: v.views, ageHours: v.ageHours, vph: v.vph, outlier: v.outlier };
}

/** Recent videos that beat the channel's baseline (new "trend alerts"). */
export function computeAlerts(snapshot: CompetitorSnapshot, stats: ChannelStats, known: Set<string>, now = Date.now()): CompetitorAlert[] {
  const med = stats.medianViews ?? 0;
  const out: CompetitorAlert[] = [];
  for (const v of stats.videos) {
    if (v.views === undefined || known.has(v.videoId)) continue;
    const age = v.ageHours ?? ageHoursFromIso(v.publishedAt, now);
    if (age === undefined || age > ALERT_MAX_AGE_HOURS) continue;
    const outlier = med ? v.views / med : undefined;
    const vph = v.vph ?? (age ? v.views / Math.max(age, 1) : undefined);
    if ((outlier ?? 0) >= ALERT_MIN_OUTLIER || (vph ?? 0) >= ALERT_MIN_VPH) {
      out.push({ channelKey: snapshot.key, channelName: snapshot.name, videoId: v.videoId, title: v.title, views: v.views, ageHours: age, vph, outlier, seenAt: now, unseen: true });
    }
  }
  return out.sort((a, b) => (b.outlier ?? 0) - (a.outlier ?? 0));
}
