import { useEffect, useRef, useState } from 'react';
import { CATEGORY_COLOR, SOURCE_META } from '../utils/ai.js';
import { T } from '../i18n/index.js';

export default function StoryCards({ stories, loading, lang = 'fr', onDiscover, isDiscoverMode, onOpenModal }) {
  const t        = T[lang];
  const cardRefs = useRef([]);
  const [search, setSearch] = useState('');

  const displayed = search
    ? stories.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    : stories;

  useEffect(() => {
    const gsap = window.gsap;
    if (!gsap || !displayed.length) return;
    const els = cardRefs.current.filter(Boolean);
    const ctx = gsap.context(() => {
      gsap.fromTo(els,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: .38, stagger: .06, ease: 'power2.out', delay: .04 }
      );
    });
    return () => ctx.revert();
  }, [displayed]);

  if (loading) {
    return (
      <div>
        <div className="cards-toolbar">
          <div className="sk" style={{ height: 32, borderRadius: 8, flex: 1 }} />
          <div className="sk" style={{ height: 32, width: 90, borderRadius: 8 }} />
        </div>
        <div className="story-cards">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="sk-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', marginBottom: '.4rem' }}>
                <div className="sk sk-line" style={{ flex: 1 }} />
                <div className="sk" style={{ width: 32, height: 18, borderRadius: 20 }} />
              </div>
              <div className="sk sk-line" style={{ width: '55%', height: 9, marginBottom: 0 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="cards-toolbar">
        <div className="search-wrap">
          <svg className="search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            className="search-input"
            type="text"
            placeholder={t.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
        </div>
        <button
          className={`discover-btn${isDiscoverMode ? ' active' : ''}`}
          onClick={onDiscover}
          title={t.discoverHint}
        >
          🎲 {t.discover}
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>{t.noResults}</p>
        </div>
      ) : (
        <div className="story-cards">
          {displayed.slice(0, 6).map((s, i) => {
            const src = SOURCE_META[s.source] ?? SOURCE_META.hn;
            return (
              <button
                key={s.id}
                className="story-card"
                style={{ '--card-accent': CATEGORY_COLOR[s.category] }}
                ref={el => (cardRefs.current[i] = el)}
                onClick={() => onOpenModal(s)}
              >
                <div className="card-top">
                  <span className="card-title">{s.title}</span>
                  <span className="score-badge">↑{s.score}</span>
                </div>
                <div className="card-meta">
                  <div className="card-cat" style={{ background: s.color }} />
                  <span className="card-domain">{s.domain}</span>
                  <span>·</span>
                  <span>{s.time}</span>
                  <span className="source-badge" style={{ background: src.color + '22', color: src.color, borderColor: src.color + '44' }}>
                    {s.source === 'reddit' && s.subreddit ? `r/${s.subreddit}` : src.label}
                  </span>
                  {s.comments > 0 && <span className="card-comments">💬 {s.comments}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
