import { useMemo, useCallback, useRef } from 'react';
import { useHackerNews }     from './useHackerNews.js';
import { useReddit }         from './useReddit.js';
import { usePapersWithCode } from './usePapersWithCode.js';
import { useDevTo }          from './useDevTo.js';
import { extractKeywords }   from '../utils/ai.js';

export function useAllSources() {
  const hn     = useHackerNews();
  const reddit = useReddit();
  const pwc    = usePapersWithCode();
  const devto  = useDevTo();

  /* Combine all sources and deduplicate by URL */
  const stories = useMemo(() => {
    const seen = new Set();
    return [...hn.stories, ...reddit.stories, ...pwc.stories, ...devto.stories]
      .filter(s => {
        if (seen.has(s.url)) return false;
        seen.add(s.url);
        return true;
      })
      .sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (Math.abs(scoreDiff) > 5) return scoreDiff;
        return (b.timestamp ?? 0) - (a.timestamp ?? 0);
      });
  }, [hn.stories, reddit.stories, pwc.stories, devto.stories]);

  /* Loading = all four haven't returned yet */
  const loading = hn.loading && reddit.loading && pwc.loading && devto.loading;

  const refresh = useCallback(() => {
    hn.refresh();
    reddit.refresh();
    pwc.refresh();
    devto.refresh();
  }, [hn.refresh, reddit.refresh, pwc.refresh, devto.refresh]);

  const stats = useMemo(() =>
    stories.reduce((acc, s) => { acc[s.category] = (acc[s.category] ?? 0) + 1; return acc; }, {}),
  [stories]);

  const sourceStats = useMemo(() =>
    stories.reduce((acc, s) => { acc[s.source] = (acc[s.source] ?? 0) + 1; return acc; }, {}),
  [stories]);

  const trendingKeywords = useMemo(() => extractKeywords(stories), [stories]);

  /* Discovery: cycle through unseen stories, reset when exhausted */
  const seenDiscovered = useRef(new Set());

  const discover = useCallback(() => {
    const pool = stories.filter(s => !seenDiscovered.current.has(s.id));
    if (pool.length < 6) { seenDiscovered.current.clear(); pool.push(...stories); }
    const picks     = [];
    const available = [...pool];
    while (picks.length < Math.min(8, available.length)) {
      const i = Math.floor(Math.random() * available.length);
      picks.push(available.splice(i, 1)[0]);
    }
    picks.forEach(s => seenDiscovered.current.add(s.id));
    return picks;
  }, [stories]);

  return {
    stories,
    loading,
    totalAnalyzed: (hn.totalAnalyzed ?? 0) + reddit.stories.length + pwc.stories.length + devto.stories.length,
    stats,
    sourceStats,
    trendingKeywords,
    refresh,
    discover,
  };
}
