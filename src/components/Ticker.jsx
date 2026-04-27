import { useState, useEffect } from 'react';

const ARXIV = 'https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=10';
const PROXY  = `https://api.allorigins.win/raw?url=${encodeURIComponent(ARXIV)}`;

function parseArxiv(xml) {
  const doc     = new DOMParser().parseFromString(xml, 'application/xml');
  const entries = [...doc.querySelectorAll('entry')];
  return entries.map(e => ({
    title:   e.querySelector('title')?.textContent?.trim().replace(/\s+/g, ' ') ?? '',
    authors: [...e.querySelectorAll('author name')]
      .slice(0, 2)
      .map(a => a.textContent.trim())
      .join(', '),
  })).filter(p => p.title);
}

async function loadPapers() {
  try {
    const res = await fetch(ARXIV, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return parseArxiv(await res.text());
  } catch { /* fall through to proxy */ }
  const res = await fetch(PROXY, { signal: AbortSignal.timeout(8000) });
  return parseArxiv(await res.text());
}

export default function Ticker({ lang = 'fr' }) {
  const label = lang === 'en' ? 'arXiv AI' : 'arXiv IA';
  const [papers, setPapers] = useState([]);

  useEffect(() => {
    loadPapers().then(setPapers).catch(err => console.error('[arXiv]', err));
    const id = setInterval(() => {
      loadPapers().then(setPapers).catch(() => {});
    }, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!papers.length) {
    return (
      <div className="ticker">
        <span className="ticker-label">{label}</span>
        <div className="sk sk-line" style={{ flex: 1, margin: '0 2rem', height: 10 }} />
      </div>
    );
  }

  const items = [...papers, ...papers];

  return (
    <div className="ticker">
      <span className="ticker-label">{label}</span>
      <div className="ticker-track">
        {items.map((p, i) => (
          <span key={i} className="ticker-item">
            📄&nbsp;<strong>{p.title.length > 90 ? p.title.slice(0, 90) + '…' : p.title}</strong>
            {p.authors && (
              <span className="ticker-authors">&nbsp;— {p.authors}</span>
            )}
            {i < items.length - 1 && <span className="ticker-sep">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
