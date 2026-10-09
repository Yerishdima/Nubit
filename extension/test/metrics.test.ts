import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeKeyword,
  computeMetrics,
  computeOutlier,
  extractVideoId,
  hasChapters,
  parseCompactNumber,
  parseDuration,
  parseIsoDuration,
  parseRelativeTimeHours,
  seoScore,
} from '../src/shared/metrics.ts';

test('parseCompactNumber handles en/ru/uk formats', () => {
  assert.equal(parseCompactNumber('1.2M views'), 1_200_000);
  assert.equal(parseCompactNumber('12,345 views'), 12_345);
  assert.equal(parseCompactNumber('1.2K'), 1_200);
  assert.equal(parseCompactNumber('12 345 просмотров'), 12_345);
  assert.equal(parseCompactNumber('1,2 млн просмотров'), 1_200_000);
  assert.equal(parseCompactNumber('3,4 тыс. просмотров'), 3_400);
  assert.equal(parseCompactNumber('1.234.567 Aufrufe'), 1_234_567);
  assert.equal(parseCompactNumber('No views'), 0);
  assert.equal(parseCompactNumber('Нет просмотров'), 0);
  assert.equal(parseCompactNumber('1,5 тис. переглядів'), 1_500);
  assert.equal(parseCompactNumber('1.23M subscribers'), 1_230_000);
  assert.equal(parseCompactNumber(''), undefined);
  assert.equal(parseCompactNumber('abc'), undefined);
});

test('parseRelativeTimeHours handles en/ru/uk units', () => {
  assert.equal(parseRelativeTimeHours('3 days ago'), 72);
  assert.equal(parseRelativeTimeHours('Streamed 2 weeks ago'), 336);
  assert.equal(parseRelativeTimeHours('1 year ago'), 8760);
  assert.equal(parseRelativeTimeHours('5 часов назад'), 5);
  assert.equal(parseRelativeTimeHours('3 года назад'), 3 * 8760);
  assert.equal(parseRelativeTimeHours('2 недели назад'), 336);
  assert.equal(parseRelativeTimeHours('7 дней назад'), 168);
  assert.equal(parseRelativeTimeHours('5 месяцев назад'), 5 * 730);
  assert.equal(parseRelativeTimeHours('1 минуту назад'), 1 / 60);
  assert.equal(parseRelativeTimeHours('2 години тому'), 2);
  assert.equal(parseRelativeTimeHours('4 дні тому'), 96);
  assert.equal(parseRelativeTimeHours('2 тижні тому'), 336);
  assert.equal(parseRelativeTimeHours('11 місяців тому'), 11 * 730);
  assert.equal(parseRelativeTimeHours('3 роки тому'), 3 * 8760);
  assert.equal(parseRelativeTimeHours('yesterday'), undefined);
});

test('durations', () => {
  assert.equal(parseDuration('12:34'), 754);
  assert.equal(parseDuration('1:02:03'), 3723);
  assert.equal(parseIsoDuration('PT1H2M3S'), 3723);
  assert.equal(parseIsoDuration('PT45S'), 45);
  assert.equal(parseIsoDuration('P1DT2H'), 93600);
});

test('extractVideoId', () => {
  assert.equal(extractVideoId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s'), 'dQw4w9WgXcQ');
  assert.equal(extractVideoId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractVideoId('nonsense'), undefined);
});

test('hasChapters detects timestamp lists', () => {
  assert.equal(hasChapters('Intro\n0:00 Start\n1:30 Part one\n5:00 Part two'), true);
  assert.equal(hasChapters('0:00 Start\n1:30 only two'), false);
  assert.equal(hasChapters(undefined), false);
});

test('seoScore rewards a well-formed video', () => {
  const good = seoScore(
    {
      videoId: 'x',
      url: '',
      title: 'How to grow a YouTube channel in 2026: 7 steps',
      description:
        'How to grow a YouTube channel in 2026 with 7 steps. ' +
        'x'.repeat(250) +
        '\n0:00 Intro\n1:00 Step one\n2:00 Step two\nhttps://example.com #youtube #growth',
      tags: ['grow youtube channel', 'youtube 2026', 'steps', 'channel growth', 'youtube tips', 'how to grow'],
      durationSec: 600,
    },
    'en',
  );
  assert.ok(good.score >= 90, `score ${good.score}`);
  const bad = seoScore({ videoId: 'y', url: '', title: 'VIDEO', description: '', tags: [] }, 'en');
  assert.ok(bad.score < 30, `score ${bad.score}`);
  assert.equal(bad.checks.find((c) => c.id === 'title_caps')?.ok, false);
});

test('computeMetrics and outlier', () => {
  const now = Date.parse('2026-10-09T12:00:00Z');
  const m = computeMetrics(
    { videoId: 'a', url: '', title: 't', views: 24_000, likes: 1_200, comments: 60, publishedAt: '2026-10-08T12:00:00Z' },
    'en',
    [1000, 2000, 3000, 4000, 100000],
    now,
  );
  assert.equal(Math.round(m.ageHours ?? 0), 24);
  assert.equal(Math.round(m.vph ?? 0), 1000);
  assert.equal(m.likeRate, 0.05);
  assert.equal(m.engagementRate, 1260 / 24000);
  assert.equal(m.channelMedianViews, 3000);
  assert.equal(m.outlier, 8);
  assert.equal(computeOutlier(100, [1, 2]), undefined);
});

test('analyzeKeyword produces bounded scores', () => {
  const a = analyzeKeyword('minecraft house', [
    { videoId: '1', title: 'Minecraft house tutorial', views: 2_000_000, ageHours: 24 * 400, subscribers: 5_000_000 },
    { videoId: '2', title: 'Best minecraft house', views: 50_000, ageHours: 24 * 30, subscribers: 20_000 },
    { videoId: '3', title: 'unrelated', views: 100, ageHours: 24 * 1000, subscribers: 100 },
  ]);
  assert.ok(a.competition >= 0 && a.competition <= 100);
  assert.ok(a.demand >= 0 && a.demand <= 100);
  assert.equal(a.exactInTitle, 2);
  assert.equal(a.smallChannelWinners.length, 1);
});

test('titleScore rewards keyword placement, hooks and numbers', async () => {
  const { titleScore, guessFocusKeyword } = await import('../src/shared/metrics.ts');
  const strong = titleScore('Как вырастить канал на YouTube в 2026: 7 шагов для новичков', 'вырастить канал', 'ru');
  const weak = titleScore('ВИДЕО!!! 😀😀😀', 'вырастить канал', 'ru');
  assert.ok(strong.score >= 85, `strong ${strong.score}`);
  assert.ok(weak.score < 30, `weak ${weak.score}`);
  assert.equal(strong.checks.find((c) => c.id === 'keyword_front')?.ok, true);
  assert.equal(titleScore('', 'x').score, 0);
  // without a keyword the keyword checks disappear
  assert.ok(!titleScore('Some title here for testing today', '').checks.some((c) => c.id.startsWith('keyword')));
  assert.equal(guessFocusKeyword('Как вырастить канал на YouTube: 7 шагов'), 'вырастить канал youtube');
});
