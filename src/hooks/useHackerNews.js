import { useState, useEffect, useCallback } from 'react';
import { matchesAI, getCategory, CATEGORY_COLOR, timeAgo, getDomain } from '../utils/ai.js';

export { getCategory, CATEGORY_COLOR };

const BASE = 'https://hacker-news.firebaseio.com/v0';

export function useHackerNews() {
  const [stories,       setStories]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [totalAnalyzed, setTotalAnalyzed] = useState(0);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/topstories.json`);
      const ids  = await res.json();
      const top  = ids.slice(0, 200);
      setTotalAnalyzed(top.length);

      const items = await Promise.all(
        top.map(id =>
          fetch(`${BASE}/item/${id}.json`).then(r => r.json()).catch(() => null)
        )
      );

      const filtered = items
        .filter(it => it?.title && matchesAI(it.title))
        .map(it => {
          const cat = getCategory(it.title);
          return {
            id:        it.id,
            title:     it.title,
            score:     it.score     ?? 0,
            url:       it.url       ?? `https://news.ycombinator.com/item?id=${it.id}`,
            time:      timeAgo(it.time),
            timestamp: it.time,            /* unix seconds */
            domain:    getDomain(it.url),
            category:  cat,
            color:     CATEGORY_COLOR[cat],
            source:    'hn',
            comments:  it.descendants ?? 0,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

      setStories(filtered);
    } catch (err) {
      console.error('[HN]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetch_]);

  return { stories, loading, totalAnalyzed, refresh: fetch_ };
}
