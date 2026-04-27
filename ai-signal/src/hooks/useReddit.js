import { useState, useEffect, useCallback } from 'react';
import { getCategory, CATEGORY_COLOR, timeAgo, getDomain, matchesAI } from '../utils/ai.js';

/* Five high-signal AI subreddits combined in one request */
const SUBS   = 'MachineLearning+LocalLLaMA+artificial+Singularity+mlops';
const DIRECT = `https://www.reddit.com/r/${SUBS}/hot.json?limit=60&raw_json=1`;
const PROXY  = `https://api.allorigins.win/raw?url=${encodeURIComponent(DIRECT)}`;

async function fetchReddit() {
  /* Try direct first — works in most browsers for public subreddits */
  try {
    const res = await fetch(DIRECT, { signal: AbortSignal.timeout(6000) });
    if (res.ok) return res.json();
  } catch { /* fall through */ }

  /* CORS proxy fallback */
  const res = await fetch(PROXY, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Reddit proxy ${res.status}`);
  return res.json();
}

export function useReddit() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const data  = await fetchReddit();
      const posts = data?.data?.children ?? [];

      const parsed = posts
        .filter(p => !p.data.stickied && p.data.score > 10 && matchesAI(p.data.title))
        .map(p => {
          const d = p.data;
          const cat = getCategory(d.title);
          return {
            id:        `reddit-${d.id}`,
            title:     d.title,
            score:     d.score,
            url:       d.url?.startsWith('http') ? d.url : `https://reddit.com${d.permalink}`,
            time:      timeAgo(d.created_utc),
            domain:    getDomain(d.url?.startsWith('http') ? d.url : `https://reddit.com${d.permalink}`),
            category:  cat,
            color:     CATEGORY_COLOR[cat],
            source:    'reddit',
            subreddit: d.subreddit,
            comments:  d.num_comments ?? 0,
            timestamp: d.created_utc,     /* unix seconds */
          };
        })
        .sort((a, b) => b.score - a.score);

      setStories(parsed);
    } catch (err) {
      console.warn('[Reddit]', err.message);
      /* Fail silently — HN alone is still valuable */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetch_]);

  return { stories, loading, refresh: fetch_ };
}
