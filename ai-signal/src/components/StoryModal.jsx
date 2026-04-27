import { useEffect } from 'react';
import { CATEGORY_COLOR, SOURCE_META } from '../utils/ai.js';
import { generateSummary } from '../utils/insight.js';
import { T } from '../i18n/index.js';

const CAT_FR = { model: 'Modèle', research: 'Recherche', business: 'Business', tools: 'Outil', data: 'Data', other: 'Autre' };
const CAT_EN = { model: 'Model',  research: 'Research',  business: 'Business', tools: 'Tool',  data: 'Data',  other: 'Other' };

export default function StoryModal({ story, stories, onClose, lang = 'fr' }) {
  const t      = T[lang];
  const catMap = lang === 'en' ? CAT_EN : CAT_FR;
  const src    = SOURCE_META[story.source] ?? SOURCE_META.hn;

  /* Close on Escape */
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  /* Related stories: same category, different id, top 3 */
  const related = stories
    .filter(s => s.category === story.category && s.id !== story.id)
    .slice(0, 3);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-meta">
            <span
              className="modal-source-badge"
              style={{ background: src.color + '22', color: src.color, borderColor: src.color + '44' }}
            >
              {story.source === 'reddit' && story.subreddit ? `r/${story.subreddit}` : src.label}
            </span>
            <span
              className="modal-cat-badge"
              style={{ background: CATEGORY_COLOR[story.category] + '18', color: CATEGORY_COLOR[story.category], borderColor: CATEGORY_COLOR[story.category] + '35' }}
            >
              {catMap[story.category]}
            </span>
            <span className="modal-time">{story.time}</span>
          </div>
          <button className="modal-close" onClick={onClose} title="Fermer (Échap)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Title */}
        <h2 className="modal-title">
          <a href={story.url} target="_blank" rel="noopener noreferrer">{story.title}</a>
        </h2>

        {/* Score row */}
        <div className="modal-score-row">
          <span className="modal-score">↑ {story.score}</span>
          {story.comments > 0 && <span className="modal-comments">💬 {story.comments}</span>}
          <span className="modal-domain">{story.domain}</span>
          {story.authors && <span className="modal-authors">{story.authors}</span>}
        </div>

        {/* Auto-generated summary (always shown) */}
        <div className="modal-abstract">
          <div className="modal-section-label">{lang === 'en' ? 'Summary' : 'Résumé'}</div>
          <p>{generateSummary(story, lang)}</p>
        </div>

        {/* GitHub link (Papers With Code) */}
        {story.githubUrl && (
          <a className="modal-github-link" href={story.githubUrl} target="_blank" rel="noopener noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            Code GitHub
          </a>
        )}

        {/* CTA */}
        <a className="modal-open-btn" href={story.url} target="_blank" rel="noopener noreferrer">
          {lang === 'en' ? 'Read more' : 'En savoir plus'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>

        {/* Related stories */}
        {related.length > 0 && (
          <div className="modal-related">
            <div className="modal-section-label">
              {lang === 'en' ? 'Related stories' : 'Stories similaires'}
            </div>
            <div className="modal-related-list">
              {related.map(r => (
                <button
                  key={r.id}
                  className="modal-related-item"
                  onClick={() => {
                    /* propagate to parent to swap the modal */
                    onClose(r);
                  }}
                >
                  <span
                    className="modal-related-dot"
                    style={{ background: CATEGORY_COLOR[r.category] }}
                  />
                  <span className="modal-related-title">{r.title}</span>
                  <span className="modal-related-score">↑{r.score}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
