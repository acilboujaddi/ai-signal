import { useState, useEffect, useRef, useCallback } from 'react';
import { useAllSources }  from './hooks/useAllSources.js';
import { CATEGORY_COLOR, SOURCE_META } from './utils/ai.js';
import { T }              from './i18n/index.js';
import PulsePanel  from './components/PulsePanel.jsx';
import BubbleChart from './components/BubbleChart.jsx';
import StoryCards  from './components/StoryCards.jsx';
import StoryModal  from './components/StoryModal.jsx';
import Ticker      from './components/Ticker.jsx';
import './styles/main.css';

/* ── Time window config ────────────────────────────────────── */
const TIME_WINDOWS = {
  '24h': 86400,
  '7d':  604800,
  '30d': 2592000,
  all:   Infinity,
};

/* ── Local hooks ────────────────────────────────────────────── */
function useCountUp(target, ms = 1800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!target) return;
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min((Date.now() - start) / ms, 1);
      setN(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, ms]);
  return n;
}

function useTheme() {
  const [dark, setDark] = useState(() => {
    try { const s = localStorage.getItem('ai-signal-theme'); if (s) return s === 'dark'; } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('ai-signal-theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);
  return [dark, setDark];
}

function useLang() {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('ai-signal-lang') ?? 'fr'; } catch { return 'fr'; }
  });
  const set = useCallback((l) => {
    setLang(l);
    try { localStorage.setItem('ai-signal-lang', l); } catch {}
  }, []);
  return [lang, set];
}

/* ── App ─────────────────────────────────────────────────────── */
export default function App() {
  const { stories, loading, totalAnalyzed, stats, sourceStats, trendingKeywords, refresh, discover } = useAllSources();
  const [dark, setDark]               = useTheme();
  const [lang, setLang]               = useLang();
  const [activeCategory, setCategory] = useState(null);
  const [activeKeyword,  setKeyword]  = useState(null);
  const [timeWindow,     setTimeWin]  = useState('all');
  const [cooldown,       setCooldown] = useState(0);
  const [refreshing,     setRefreshing] = useState(false);
  const [discoveredStories, setDiscovered] = useState(null);
  const [modalStory,     setModal]    = useState(null);
  const count    = useCountUp(totalAnalyzed || 0, 1800);
  const didMount = useRef(false);
  const t        = T[lang];

  /* Cooldown countdown */
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleRefresh = useCallback(() => {
    if (cooldown > 0 || loading) return;
    refresh(); setCooldown(30); setDiscovered(null);
  }, [refresh, cooldown, loading]);

  /* Flash top bar on new data */
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    setRefreshing(true);
    const id = setTimeout(() => setRefreshing(false), 700);
    return () => clearTimeout(id);
  }, [stories]);

  /* GSAP entrance */
  useEffect(() => {
    const gsap = window.gsap;
    if (!gsap) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-title-row', { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: .85, ease: 'power3.out', delay: .08 });
      gsap.fromTo('.hero-subtitle',  { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .65, ease: 'power2.out', delay: .28 });
      gsap.fromTo('.cat-stats',      { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .55, ease: 'power2.out', delay: .36 });
      gsap.fromTo('.counter-block',  { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .65, ease: 'power2.out', delay: .42 });
      gsap.fromTo('.panel',          { opacity: 0, y: 28  }, { opacity: 1, y: 0, duration: .6, stagger: .12, ease: 'power2.out', delay: .52 });
    });
    return () => ctx.revert();
  }, []);

  /* Filter helpers */
  const toggleCategory = (cat) => { setCategory(c => c === cat ? null : cat); setDiscovered(null); setKeyword(null); };
  const toggleKeyword  = (kw)  => { setKeyword(k => k === kw ? null : kw); setDiscovered(null); setCategory(null); };
  const clearFilters   = () => { setCategory(null); setKeyword(null); setDiscovered(null); };
  const handleDiscover = () => { setDiscovered(discover()); setCategory(null); setKeyword(null); };

  /* Modal: onClose optionally receives a next story to swap to */
  const handleModalClose = useCallback((nextStory) => {
    if (nextStory && typeof nextStory === 'object' && nextStory.id) {
      setModal(nextStory);
    } else {
      setModal(null);
    }
  }, []);

  /* Apply time window filter first */
  const now = Date.now() / 1000;
  const timeFiltered = timeWindow === 'all'
    ? stories
    : stories.filter(s => s.timestamp && now - s.timestamp <= TIME_WINDOWS[timeWindow]);

  /* Then apply category / keyword / discover filter */
  const filteredStories = discoveredStories ?? timeFiltered.filter(s =>
    (!activeCategory || s.category === activeCategory) &&
    (!activeKeyword  || s.title.toLowerCase().includes(activeKeyword.toLowerCase()))
  );

  const hasFilter = activeCategory || activeKeyword || discoveredStories;
  const timeLabels = { '24h': '24 h', '7d': lang === 'en' ? '7 d' : '7 j', '30d': lang === 'en' ? '30 d' : '30 j', all: '∞' };

  return (
    <>
      <div className={`refresh-bar${refreshing ? ' active' : ''}`} />

      {/* ── HERO ── */}
      <header className="hero">
        <div className="hero-left">
          <div className="hero-title-row">
            <h1 className="hero-title">AI Signal</h1>
            <span className="pulse-dot" />
          </div>
          <p className="hero-subtitle">{t.tagline}</p>

          {/* Category chips */}
          {!loading && stories.length > 0 && (
            <div className="cat-stats">
              <button
                className={`cat-chip${!hasFilter ? ' chip-active' : ''}`}
                style={!hasFilter ? { borderColor: '#7C3AED', color: '#7C3AED', background: 'rgba(124,58,237,.09)' } : {}}
                onClick={clearFilters}
              >
                {t.all} ({timeFiltered.length})
              </button>
              {Object.entries(stats)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, n]) => {
                  const filtered_n = timeFiltered.filter(s => s.category === cat).length;
                  if (!filtered_n) return null;
                  return (
                    <button
                      key={cat}
                      className={`cat-chip${activeCategory === cat ? ' chip-active' : ''}`}
                      style={activeCategory === cat ? { borderColor: CATEGORY_COLOR[cat], color: CATEGORY_COLOR[cat], background: CATEGORY_COLOR[cat] + '14' } : {}}
                      onClick={() => toggleCategory(cat)}
                    >
                      <span className="cat-chip-dot" style={{ background: CATEGORY_COLOR[cat] }} />
                      {t.catLabels[cat]} ({filtered_n})
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        <div className="hero-right counter-block">
          <div>
            <div className="counter-num">{count.toLocaleString('fr-FR')}</div>
            <div className="counter-label">{t.analyzed}</div>
          </div>
          <div className="hero-actions">
            {/* Time filter */}
            <div className="time-filter">
              {Object.keys(TIME_WINDOWS).map(w => (
                <button
                  key={w}
                  className={`toggle-opt${timeWindow === w ? ' on' : ''}`}
                  onClick={() => setTimeWin(w)}
                >
                  {timeLabels[w]}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              className={`refresh-btn${loading ? ' spinning' : ''}`}
              disabled={cooldown > 0 || loading}
              onClick={handleRefresh}
              title={t.refresh}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              {cooldown > 0 ? `${cooldown}s` : t.refresh}
            </button>

            {/* Lang */}
            <div className="theme-toggle">
              <button className={`toggle-opt${lang === 'fr' ? ' on' : ''}`} onClick={() => setLang('fr')}>FR</button>
              <button className={`toggle-opt${lang === 'en' ? ' on' : ''}`} onClick={() => setLang('en')}>EN</button>
            </div>

            {/* Theme */}
            <div className="theme-toggle">
              <button className={`toggle-opt${!dark ? ' on' : ''}`} onClick={() => setDark(false)}>☀</button>
              <button className={`toggle-opt${dark ? ' on' : ''}`}  onClick={() => setDark(true)}>◗</button>
            </div>
          </div>
        </div>
      </header>

      {/* ── TRENDING KEYWORDS BAR ── */}
      {!loading && trendingKeywords.length > 0 && (
        <div className="keywords-bar">
          <span className="keywords-label">{t.trendingKw}</span>
          <div className="keywords-list">
            {trendingKeywords.map(({ word, count }) => (
              <button
                key={word}
                className={`kw-chip${activeKeyword === word ? ' kw-active' : ''}`}
                onClick={() => toggleKeyword(word)}
                title={`${count} stories`}
              >
                {word}
                <span className="kw-count">{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN GRID ── */}
      <div className="main-grid">
        {/* Left: Pulse panel */}
        <aside className="panel panel-left">
          <div className="panel-label">{lang === 'en' ? 'Live Pulse' : 'Pulse IA'}</div>
          <PulsePanel
            stories={timeFiltered}
            loading={loading}
            stats={stats}
            sourceStats={sourceStats}
            trendingKeywords={trendingKeywords}
            lang={lang}
          />
        </aside>

        {/* Center: Bubble chart */}
        <main className="panel panel-center">
          <div className="panel-label">
            {t.trendingLabel}
            {!loading && (
              <>
                <span className="panel-label-count">{timeFiltered.length} stories</span>
                {activeCategory && <span className="panel-label-filter">· {t.catLabels[activeCategory]}</span>}
                {activeKeyword  && <span className="panel-label-filter">· "{activeKeyword}"</span>}
              </>
            )}
          </div>
          <BubbleChart
            stories={timeFiltered}
            loading={loading}
            activeCategory={activeCategory}
            onCategoryChange={toggleCategory}
            onStoryClick={setModal}
          />
        </main>

        {/* Right: Story cards */}
        <aside className="panel panel-right">
          <div className="panel-label">
            {discoveredStories ? t.discoverNew : t.topStories}
            {hasFilter && !discoveredStories && (
              <span className="panel-label-filter">
                — {activeCategory ? t.catLabels[activeCategory] : `"${activeKeyword}"`}
              </span>
            )}
          </div>
          <StoryCards
            stories={filteredStories}
            allStories={stories}
            loading={loading}
            lang={lang}
            onDiscover={handleDiscover}
            isDiscoverMode={!!discoveredStories}
            onOpenModal={setModal}
          />
        </aside>
      </div>

      {/* ── SOURCE STATS BAR ── */}
      {!loading && Object.keys(sourceStats).length > 0 && (
        <div className="source-bar">
          <span className="source-bar-label">{t.sources}</span>
          {Object.entries(sourceStats).map(([src, n]) => (
            <span key={src} className={`source-pill source-${src}`}>
              {SOURCE_META[src]?.full ?? src} · {n}
            </span>
          ))}
        </div>
      )}

      <Ticker lang={lang} />

      {/* ── STORY MODAL ── */}
      {modalStory && (
        <StoryModal
          story={modalStory}
          stories={stories}
          onClose={handleModalClose}
          lang={lang}
        />
      )}
    </>
  );
}
