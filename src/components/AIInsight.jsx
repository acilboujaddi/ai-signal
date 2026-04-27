import { useEffect, useRef, useState } from 'react';
import { useGemini } from '../hooks/useGemini.js';
import { T }         from '../i18n/index.js';

function useTypewriter(text, speed = 16) {
  const [shown, setShown] = useState('');
  const [done,  setDone]  = useState(true);
  useEffect(() => {
    if (!text) { setShown(''); setDone(true); return; }
    setShown(''); setDone(false); let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) { setDone(true); clearInterval(id); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { shown, done };
}

function minsAgo(date, lang) {
  if (!date) return '';
  const m = Math.floor((Date.now() - date) / 60000);
  if (lang === 'en') return m < 1 ? 'just now' : `${m} min ago`;
  return m < 1 ? 'à l\'instant' : `il y a ${m} min`;
}

export default function AIInsight({ topStories, hnLoading, apiKey, onSaveKey, lang = 'fr' }) {
  const t = T[lang];
  const { insight, loading, updatedAt, error, errorMsg, fetchInsight } = useGemini(apiKey, lang);
  const { shown, done } = useTypewriter(insight);
  const [timeStr,    setTimeStr]    = useState('');
  const [copied,     setCopied]     = useState(false);
  const [keyInput,   setKeyInput]   = useState('');
  const [showChange, setShowChange] = useState(false);

  const fetchedRef    = useRef(false);
  const lastApiKeyRef = useRef(apiKey);
  const lastLangRef   = useRef(lang);

  /* Fetch when stories ready, or when apiKey/lang changes */
  useEffect(() => {
    const keyChanged  = lastApiKeyRef.current !== apiKey;
    const langChanged = lastLangRef.current   !== lang;
    if (keyChanged || langChanged) {
      lastApiKeyRef.current = apiKey;
      lastLangRef.current   = lang;
      fetchedRef.current    = false;
    }
    if (!topStories.length || hnLoading || fetchedRef.current || !apiKey) return;
    fetchedRef.current = true;
    fetchInsight(topStories.slice(0, 3).map(s => s.title));
  }, [topStories, hnLoading, fetchInsight, apiKey, lang]);

  /* 5-min auto-refresh */
  useEffect(() => {
    if (!topStories.length || hnLoading || !apiKey) return;
    const id = setInterval(() => {
      fetchedRef.current = false;
      fetchInsight(topStories.slice(0, 3).map(s => s.title));
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [topStories, hnLoading, fetchInsight, apiKey]);

  /* Relative time */
  useEffect(() => {
    if (!updatedAt) return;
    setTimeStr(minsAgo(updatedAt, lang));
    const id = setInterval(() => setTimeStr(minsAgo(updatedAt, lang)), 30_000);
    return () => clearInterval(id);
  }, [updatedAt, lang]);

  const copyInsight = () => {
    if (!insight) return;
    navigator.clipboard?.writeText(insight).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    const k = keyInput.trim();
    if (k) { onSaveKey(k); setKeyInput(''); setShowChange(false); }
  };

  const showSkel = loading || (hnLoading && !insight && !error);

  const studioHref = "https://aistudio.google.com/app/apikey";
  const studioLink = <a href={studioHref} target="_blank" rel="noopener noreferrer">{t.errLink} ↗</a>;

  /* ── No key: setup prompt ── */
  if (!apiKey) {
    return (
      <div className="apikey-prompt">
        <p>{t.keyNoKeyLine1}<br />{t.keyNoKeyLine2} {studioLink}.</p>
        <form className="apikey-form" onSubmit={handleSaveKey}>
          <input className="apikey-input" type="password" placeholder={t.keyPlaceholder}
            value={keyInput} onChange={e => setKeyInput(e.target.value)} autoComplete="off" />
          <button type="submit" className="btn btn-primary btn-sm" disabled={!keyInput.trim()}>
            {t.keyActivate}
          </button>
        </form>
      </div>
    );
  }

  /* ── Change-key form ── */
  if (showChange) {
    return (
      <div className="apikey-prompt">
        <p>{t.keyNewKey}</p>
        <form className="apikey-form" onSubmit={handleSaveKey}>
          <input className="apikey-input" type="password" placeholder={t.keyPlaceholder}
            value={keyInput} onChange={e => setKeyInput(e.target.value)} autoFocus />
          <button type="submit" className="btn btn-primary btn-sm" disabled={!keyInput.trim()}>
            {t.keySave}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowChange(false)}>
            {t.keyCancel}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="insight-box">
        <div className="insight-header">
          <span className="insight-title">{t.insightTitle}</span>
          <div className="insight-actions">
            {insight && !loading && (
              <button className={`btn-icon${copied ? ' copied' : ''}`} onClick={copyInsight} title={copied ? t.copiedTip : t.copyTip}>
                {copied
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                }
              </button>
            )}
            <button className="btn-icon" onClick={() => setShowChange(true)} title={t.shieldTip}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </button>
          </div>
        </div>

        {showSkel && (
          <>
            <div className="sk sk-line" style={{ width: '95%' }} />
            <div className="sk sk-line" style={{ width: '87%' }} />
            <div className="sk sk-line" style={{ width: '70%', marginBottom: 0 }} />
          </>
        )}

        {!showSkel && error && (
          <div>
            <p className="insight-error">⚠ {errorMsg || 'Erreur Gemini'}</p>
            <p className="insight-error-hint">
              {t.errHintPre} {studioLink} {t.errHintMid}{' '}
              <button style={{ background: 'none', border: 'none', color: 'var(--purple)', cursor: 'pointer', font: 'inherit', padding: 0, textDecoration: 'underline' }} onClick={() => setShowChange(true)}>{t.errChange}</button>.
            </p>
          </div>
        )}

        {!showSkel && !error && (
          <p className="insight-text">
            {shown}{!done && <span className="cursor" />}
          </p>
        )}
      </div>

      {!showSkel && !error && insight && (
        <div className="insight-footer">
          <div className="insight-badge">
            <span className="badge-dot" />
            <span className="badge-gemini">{t.insightBadge}</span>
            {updatedAt && <span>· {timeStr}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
