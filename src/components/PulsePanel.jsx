import { useMemo } from 'react';
import { generateInsight } from '../utils/insight.js';
import { CATEGORY_COLOR, SOURCE_META } from '../utils/ai.js';
import { T } from '../i18n/index.js';

const CAT_LABELS_FR = { model: 'Modèles', research: 'Recherche', business: 'Business', tools: 'Outils', data: 'Data', other: 'Autre' };
const CAT_LABELS_EN = { model: 'Models',   research: 'Research',   business: 'Business', tools: 'Tools',  data: 'Data',  other: 'Other'  };

export default function PulsePanel({ stories, loading, stats, sourceStats, trendingKeywords, lang = 'fr' }) {
  const t = T[lang];
  const catLabels = lang === 'en' ? CAT_LABELS_EN : CAT_LABELS_FR;

  const insight = useMemo(
    () => generateInsight(stories, trendingKeywords, stats, sourceStats, lang),
    [stories, trendingKeywords, stats, sourceStats, lang]
  );

  const topCat = useMemo(() =>
    Object.entries(stats).sort((a, b) => b[1] - a[1])[0],
    [stats]
  );

  const freshCount = useMemo(() => {
    const cutoff = Date.now() / 1000 - 86400;
    return stories.filter(s => s.timestamp && s.timestamp > cutoff).length;
  }, [stories]);

  const maxKwCount = trendingKeywords[0]?.count ?? 1;

  if (loading && !stories.length) {
    return (
      <div>
        <div className="pulse-insight-box">
          <div className="sk sk-line" style={{ width: '96%' }} />
          <div className="sk sk-line" style={{ width: '88%' }} />
          <div className="sk sk-line" style={{ width: '72%', marginBottom: 0 }} />
        </div>
        <div className="pulse-stats-grid">
          {[80, 65, 75, 60].map((w, i) => (
            <div key={i} className="pulse-stat-card">
              <div className="sk sk-line" style={{ width: `${w}%`, height: 22, marginBottom: '.3rem' }} />
              <div className="sk sk-line" style={{ width: '55%', height: 9, marginBottom: 0 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pulse-panel">
      {/* Insight text */}
      <div className="pulse-insight-box">
        <div className="pulse-insight-header">
          <span className="pulse-insight-label">
            <span className="pulse-live-dot" />
            {lang === 'en' ? 'Live signal' : 'Signal en direct'}
          </span>
        </div>
        <p className="pulse-insight-text">{insight}</p>
      </div>

      {/* Stats grid */}
      <div className="pulse-stats-grid">
        <div className="pulse-stat-card">
          <div className="pulse-stat-value">{stories.length}</div>
          <div className="pulse-stat-label">{lang === 'en' ? 'total stories' : 'stories total'}</div>
        </div>
        <div className="pulse-stat-card">
          <div className="pulse-stat-value" style={{ color: topCat ? CATEGORY_COLOR[topCat[0]] : 'var(--purple)' }}>
            {topCat ? topCat[1] : 0}
          </div>
          <div className="pulse-stat-label">{topCat ? catLabels[topCat[0]] : '—'}</div>
        </div>
        <div className="pulse-stat-card">
          <div className="pulse-stat-value">{Object.keys(sourceStats).length}</div>
          <div className="pulse-stat-label">{lang === 'en' ? 'sources' : 'sources'}</div>
        </div>
        <div className="pulse-stat-card">
          <div className="pulse-stat-value" style={{ color: freshCount > 0 ? 'var(--teal)' : 'var(--text-muted)' }}>
            {freshCount}
          </div>
          <div className="pulse-stat-label">{lang === 'en' ? 'last 24 h' : 'dernières 24 h'}</div>
        </div>
      </div>

      {/* Source breakdown */}
      {Object.keys(sourceStats).length > 0 && (
        <div className="pulse-sources">
          {Object.entries(sourceStats)
            .sort((a, b) => b[1] - a[1])
            .map(([src, n]) => {
              const meta = SOURCE_META[src] ?? { label: src, color: 'var(--purple)' };
              const pct  = Math.round((n / stories.length) * 100);
              return (
                <div key={src} className="pulse-source-row">
                  <span className="pulse-source-name" style={{ color: meta.color }}>
                    {src === 'hn' ? 'Hacker News' : src === 'pwc' ? 'Papers W/C' : 'Reddit'}
                  </span>
                  <div className="pulse-source-bar-wrap">
                    <div className="pulse-source-bar" style={{ width: `${pct}%`, background: meta.color }} />
                  </div>
                  <span className="pulse-source-count">{n}</span>
                </div>
              );
            })}
        </div>
      )}

      {/* Top keywords */}
      {trendingKeywords.length > 0 && (
        <div className="pulse-keywords">
          <div className="pulse-section-label">{t.trendingKw}</div>
          {trendingKeywords.slice(0, 8).map(({ word, count }) => (
            <div key={word} className="pulse-kw-row">
              <span className="pulse-kw-word">{word}</span>
              <div className="pulse-kw-bar-wrap">
                <div
                  className="pulse-kw-bar"
                  style={{ width: `${Math.round((count / maxKwCount) * 100)}%` }}
                />
              </div>
              <span className="pulse-kw-count">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
