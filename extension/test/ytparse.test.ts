import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  channelFromData,
  extractJsonVar,
  listVideosFromData,
  parseLikesFromStrings,
  searchResultsFromData,
  transcriptFromJson3,
  videoFromPlayerResponse,
  watchExtrasFromData,
} from '../src/background/ytparse.ts';

const player = {
  videoDetails: {
    videoId: 'abcdefghijk',
    title: 'Test video',
    lengthSeconds: '754',
    keywords: ['a', 'b'],
    channelId: 'UC123456789012345678901',
    author: 'Chan',
    viewCount: '12345',
    shortDescription: 'desc\n0:00 a\n1:00 b\n2:00 c',
    isLiveContent: false,
    thumbnail: { thumbnails: [{ url: 'small' }, { url: 'big' }] },
  },
  microformat: { playerMicroformatRenderer: { publishDate: '2026-10-01T10:00:00-07:00', category: 'Gaming', ownerProfileUrl: 'http://www.youtube.com/@chan' } },
  captions: {
    playerCaptionsTracklistRenderer: {
      captionTracks: [
        { baseUrl: 'https://www.youtube.com/api/timedtext?x=1', languageCode: 'en', name: { simpleText: 'English' } },
        { baseUrl: 'https://www.youtube.com/api/timedtext?x=2', languageCode: 'ru', kind: 'asr', name: { runs: [{ text: 'Russian (auto)' }] } },
      ],
    },
  },
};

test('extractJsonVar finds objects with nested braces and strings', () => {
  const html = `<script>var ytInitialPlayerResponse = {"a":"}{","b":{"c":[1,2,{"d":"x\\"y"}]}};var x = 1;</script><script>window["ytInitialData"] = {"e":1};</script>`;
  assert.deepEqual(extractJsonVar(html, 'ytInitialPlayerResponse'), { a: '}{', b: { c: [1, 2, { d: 'x"y' }] } });
  assert.equal(extractJsonVar(html, 'missing'), undefined);
});

test('videoFromPlayerResponse maps fields', () => {
  const v = videoFromPlayerResponse(player, 'https://www.youtube.com/watch?v=abcdefghijk')!;
  assert.equal(v.videoId, 'abcdefghijk');
  assert.equal(v.views, 12345);
  assert.equal(v.durationSec, 754);
  assert.equal(v.channelHandle, '@chan');
  assert.equal(v.thumbnailUrl, 'big');
  assert.equal(v.hasChapters, true);
  assert.equal(v.captionTracks?.length, 2);
  assert.equal(v.captionTracks?.[1].auto, true);
  assert.equal(v.captionTracks?.[1].name, 'Russian (auto)');
});

const searchData = {
  contents: {
    twoColumnSearchResultsRenderer: {
      primaryContents: {
        sectionListRenderer: {
          contents: [
            {
              itemSectionRenderer: {
                contents: [
                  {
                    videoRenderer: {
                      videoId: 'vid00000001',
                      title: { runs: [{ text: 'First ' }, { text: 'video' }] },
                      viewCountText: { simpleText: '1.2M views' },
                      publishedTimeText: { simpleText: '3 days ago' },
                      lengthText: { simpleText: '10:00' },
                      ownerText: { runs: [{ text: 'Owner', navigationEndpoint: { browseEndpoint: { browseId: 'UCowner', canonicalBaseUrl: '/@owner' } } }] },
                      ownerBadges: [{ metadataBadgeRenderer: { style: 'BADGE_STYLE_TYPE_VERIFIED' } }],
                    },
                  },
                  {
                    videoRenderer: {
                      videoId: 'vid00000002',
                      title: { runs: [{ text: 'Live now' }] },
                      viewCountText: { runs: [{ text: '1,234' }, { text: ' watching' }] },
                      badges: [{ metadataBadgeRenderer: { style: 'BADGE_STYLE_TYPE_LIVE_NOW' } }],
                    },
                  },
                  {
                    lockupViewModel: {
                      contentId: 'vid00000003',
                      contentType: 'LOCKUP_CONTENT_TYPE_VIDEO',
                      metadata: {
                        lockupMetadataViewModel: {
                          title: { content: 'Lockup video' },
                          metadata: {
                            contentMetadataViewModel: {
                              metadataRows: [
                                { metadataParts: [{ text: { content: 'Some Channel', commandRuns: [{ onTap: { innertubeCommand: { browseEndpoint: { browseId: 'UClock', canonicalBaseUrl: '/@lock' } } } }] } }] },
                                { metadataParts: [{ text: { content: '45K views' } }, { text: { content: '2 weeks ago' } }] },
                              ],
                            },
                          },
                        },
                      },
                      contentImage: { thumbnailViewModel: { overlays: [{ thumbnailOverlayBadgeViewModel: { thumbnailBadges: [{ thumbnailBadgeViewModel: { text: '4:20' } }] } }] } },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    },
  },
};

test('searchResultsFromData parses videoRenderer, live and lockup entries', () => {
  const r = searchResultsFromData(searchData);
  assert.equal(r.length, 3);
  assert.equal(r[0].title, 'First video');
  assert.equal(r[0].views, 1_200_000);
  assert.equal(r[0].ageHours, 72);
  assert.equal(Math.round(r[0].vph!), Math.round(1_200_000 / 72));
  assert.equal(r[0].channelId, 'UCowner');
  assert.equal(r[0].channelHandle, '@owner');
  assert.equal(r[0].verified, true);
  assert.equal(r[0].durationSec, 600);
  assert.equal(r[1].isLive, true);
  assert.equal(r[1].views, undefined);
  assert.equal(r[2].title, 'Lockup video');
  assert.equal(r[2].views, 45_000);
  assert.equal(r[2].channelName, 'Some Channel');
  assert.equal(r[2].channelId, 'UClock');
  assert.equal(r[2].durationSec, 260);
});

test('watchExtrasFromData reads likes, comments, subscribers, related', () => {
  const data = {
    contents: {
      twoColumnWatchNextResults: {
        results: {
          results: {
            contents: [
              { videoPrimaryInfoRenderer: { videoActions: { x: { accessibilityText: 'like this video along with 12,345 other people' } } } },
              {
                videoSecondaryInfoRenderer: {
                  owner: { videoOwnerRenderer: { subscriberCountText: { simpleText: '1.23M subscribers' }, navigationEndpoint: { browseEndpoint: { canonicalBaseUrl: '/@chan' } } } },
                },
              },
              { itemSectionRenderer: { contents: [{ commentsEntryPointHeaderRenderer: { commentCount: { simpleText: '2,345' } } }] } },
            ],
          },
        },
        secondaryResults: {
          secondaryResults: {
            results: [
              { compactVideoRenderer: { videoId: 'rel00000001', title: { simpleText: 'Related' }, viewCountText: { simpleText: '10K views' }, publishedTimeText: { simpleText: '1 day ago' }, lengthText: { simpleText: '1:00' } } },
            ],
          },
        },
      },
    },
  };
  const ex = watchExtrasFromData(data);
  assert.equal(ex.likes, 12345);
  assert.equal(ex.subscribers, 1_230_000);
  assert.equal(ex.comments, 2345);
  assert.equal(ex.channelHandle, '@chan');
  assert.equal(ex.related.length, 1);
  assert.equal(ex.related[0].views, 10_000);
});

test('parseLikesFromStrings ignores strings without numbers', () => {
  assert.equal(parseLikesFromStrings(['Like', 'Dislike this video', 'Поставить отметку "Нравится", как и ещё 1 234 человек']), 1234);
  assert.equal(parseLikesFromStrings(['Like', 'Dislike']), undefined);
});

test('channelFromData reads metadata and header strings', () => {
  const ch = channelFromData({
    metadata: { channelMetadataRenderer: { title: 'My Channel', externalId: 'UCabc', vanityChannelUrl: 'http://www.youtube.com/@mychannel', description: 'd' } },
    header: { pageHeaderRenderer: { content: { metadataRows: [{ parts: [{ text: { content: '@mychannel' } }, { text: { content: '1.2M subscribers' } }, { text: { content: '345 videos' } }] }] } } },
  });
  assert.equal(ch.name, 'My Channel');
  assert.equal(ch.channelId, 'UCabc');
  assert.equal(ch.handle, '@mychannel');
  assert.equal(ch.subscribers, 1_200_000);
  assert.equal(ch.videoCount, 345);
});

test('listVideosFromData dedupes by id', () => {
  const data = { a: { videoRenderer: { videoId: 'dup00000001', title: { simpleText: 'x' } } }, b: { videoRenderer: { videoId: 'dup00000001', title: { simpleText: 'x' } } } };
  assert.equal(listVideosFromData(data).length, 1);
});

test('transcriptFromJson3 groups segments into 30s buckets', () => {
  const t = transcriptFromJson3({
    events: [
      { tStartMs: 0, segs: [{ utf8: 'Hello' }, { utf8: ' world' }] },
      { tStartMs: 10000, segs: [{ utf8: 'again' }] },
      { tStartMs: 35000, segs: [{ utf8: 'later' }] },
      { tStartMs: 3700000, segs: [{ utf8: 'hour' }] },
    ],
  });
  assert.equal(t, '[0:00] Hello world again\n[0:35] later\n[1:01:40] hour');
});
