// Keyword research shared by the `analyze_keyword` tool and the Studio panel.
import type { Lang, ListVideo } from '../shared/types.ts';
import { analyzeKeyword, type KeywordAnalysis } from '../shared/metrics.ts';
import type { YouTube } from './youtube.ts';

export interface KeywordReport extends KeywordAnalysis {
  suggestions: string[];
  topResults: ListVideo[];
}

export async function keywordReport(youtube: YouTube, query: string, lang: Lang, maxResults = 20): Promise<KeywordReport> {
  const [results, suggestions] = await Promise.all([
    youtube.search(query, maxResults, 'relevance'),
    youtube.suggestions(query, lang).catch(() => [] as string[]),
  ]);
  const a = analyzeKeyword(query, results);
  return { ...a, suggestions, topResults: results.slice(0, 12) };
}

/** Tags (keywords) of the given videos, read from their watch pages. */
export async function videoTags(youtube: YouTube, ids: string[], limit = 6): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  await Promise.all(
    ids.slice(0, limit).map(async (id) => {
      try {
        const v = await youtube.pageVideo(id);
        out[id] = v.tags ?? [];
      } catch {
        out[id] = [];
      }
    }),
  );
  return out;
}
