import { useState, useEffect, useCallback } from 'react';
import { getCategory, CATEGORY_COLOR, matchesAI } from '../utils/ai.js';

const TAGS = ['artificial-intelligence', 'machinelearning', 'llm'];
const BASE = 'https://dev.to/api/articles';

function timeAgoDevTo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}j`;
}

async function fetchDevTo() {
  const results = await Promise.allSettled(
    TAGS.map(tag =>
      fetch(`${BASE}?tag=${tag}&top=7&per_page=20`, {
        signal: AbortSignal.timeout(8000),
      })
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
    )
  );
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
}

export function useDevTo() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const articles = await fetchDevTo();
      const seen = new Set();
      const parsed = articles
        .filter(a => {
          if (!a?.title || seen.has(a.id)) return false;
          seen.add(a.id);
          return matchesAI(a.title) && (a.positive_reactions_count ?? 0) > 3;
        })
        .map(a => {
          const cat = getCategory(a.title);
          const ts  = a.published_at ? Math.floor(new Date(a.published_at).getTime() / 1000) : Math.floor(Date.now() / 1000);
          return {
            id:        `devto-${a.id}`,
            title:     a.title,
            score:     a.positive_reactions_count ?? 0,
            url:       a.url,
            time:      timeAgoDevTo(a.published_at),
            timestamp: ts,
            domain:    'dev.to',
            category:  cat,
            color:     CATEGORY_COLOR[cat],
            source:    'devto',
            comments:  a.comments_count ?? 0,
            abstract:  a.description
              ? (a.description.length > 420 ? a.description.slice(0, 420) + '…' : a.description)
              : null,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 25);

      setStories(parsed);
    } catch (err) {
      console.warn('[Dev.to]', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetch_]);

  return { stories, loading, refresh: fetch_ };
}
