import { useState, useEffect, useCallback } from 'react';
import { getCategory, CATEGORY_COLOR } from '../utils/ai.js';

const ENDPOINT = 'https://paperswithcode.com/api/v1/papers/?ordering=-published&items_per_page=24';
const PROXY     = `https://api.allorigins.win/raw?url=${encodeURIComponent(ENDPOINT)}`;

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

async function load() {
  try {
    const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(6000) });
    if (res.ok) return res.json();
  } catch { /* proxy fallback */ }
  const res = await fetch(PROXY, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`PWC ${res.status}`);
  return res.json();
}

export function usePapersWithCode() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const data  = await load();
      const items = data?.results ?? [];

      const parsed = items
        .filter(p => p.title)
        .map(p => {
          const cat = getCategory(p.title);
          const ts  = p.published ? new Date(p.published).getTime() / 1000 : Date.now() / 1000;
          return {
            id:        `pwc-${p.id ?? p.arxiv_id ?? p.title.slice(0, 20)}`,
            title:     p.title,
            score:     Math.max(p.stars ?? 0, 1),
            url:       p.url_abs ?? `https://paperswithcode.com/paper/${p.arxiv_id}`,
            time:      formatDate(p.published),
            timestamp: ts,
            domain:    'paperswithcode.com',
            category:  cat,
            color:     CATEGORY_COLOR[cat],
            source:    'pwc',
            abstract:  p.abstract
              ? (p.abstract.length > 420 ? p.abstract.slice(0, 420) + '…' : p.abstract)
              : null,
            authors:   Array.isArray(p.authors) ? p.authors.slice(0, 3).join(', ') : null,
            githubUrl: p.github_link ?? null,
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      setStories(parsed);
    } catch (err) {
      console.warn('[PWC]', err.message);
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
