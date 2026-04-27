const CAT_FR = { model: 'Modèles', research: 'Recherche', business: 'Business', tools: 'Outils', data: 'Data', other: 'Autre' };
const CAT_EN = { model: 'Models',  research: 'Research',  business: 'Business', tools: 'Tools',  data: 'Data',  other: 'Other'  };

/* Varied openers so the insight feels fresh on each load */
const OPENERS_FR = [
  (cat, pct) => `${cat} concentre l'attention en ce moment — ${pct}% du flux total.`,
  (cat, pct) => `Tendance forte : ${cat} représente ${pct}% des sujets du moment.`,
  (cat, pct) => `Signal clair : ${cat} domine la veille avec ${pct}% des articles.`,
];
const OPENERS_EN = [
  (cat, pct) => `${cat} is the main signal right now — ${pct}% of the feed.`,
  (cat, pct) => `Strong trend: ${cat} accounts for ${pct}% of current topics.`,
  (cat, pct) => `Clear signal: ${cat} leads the board with ${pct}% of all articles.`,
];

export function generateInsight(stories, keywords, stats, sourceStats, lang = 'fr') {
  if (!stories.length) return '';

  /* Skip "other" — it's a catch-all and not meaningful as the headline */
  const meaningful = Object.entries(stats)
    .filter(([cat]) => cat !== 'other')
    .sort((a, b) => b[1] - a[1]);

  /* Fallback to "other" only if it's the only category */
  const [topCat, topCount] = meaningful.length
    ? meaningful[0]
    : Object.entries(stats).sort((a, b) => b[1] - a[1])[0] ?? ['other', 0];

  const topStory   = stories[0];
  const topKws     = keywords.slice(0, 3).map(k => k.word);
  const pct        = Math.round((topCount / stories.length) * 100);
  const now        = Date.now() / 1000;
  const freshCount = stories.filter(s => s.timestamp && now - s.timestamp < 86400).length;
  const shortTitle = topStory.title.length > 58
    ? topStory.title.slice(0, 58) + '…'
    : topStory.title;

  /* Rotate opener based on how many stories are loaded (deterministic variety) */
  const openerIdx = stories.length % 3;

  if (lang === 'en') {
    const catLabel = CAT_EN[topCat] ?? topCat;
    const opener   = OPENERS_EN[openerIdx](catLabel, pct);
    const middle   = `Top pick: "${shortTitle}" ↑${topStory.score}.`;
    const ending   = freshCount > 5
      ? `${freshCount} fresh stories in the last 24 h across ${Object.keys(sourceStats).length} sources.`
      : topKws.length
        ? `Hot topics: ${topKws.join(', ')}.`
        : `${Object.keys(sourceStats).length} active sources tracked.`;
    return `${opener} ${middle} ${ending}`;
  }

  const catLabel = CAT_FR[topCat] ?? topCat;
  const opener   = OPENERS_FR[openerIdx](catLabel, pct);
  const middle   = `En tête : "${shortTitle}" ↑${topStory.score}.`;
  const ending   = freshCount > 5
    ? `${freshCount} articles dans les dernières 24 h sur ${Object.keys(sourceStats).length} sources.`
    : topKws.length
      ? `Sujets chauds : ${topKws.join(', ')}.`
      : `${Object.keys(sourceStats).length} sources actives surveillées.`;
  return `${opener} ${middle} ${ending}`;
}

/* Generate a multi-line summary for the story modal.
   Uses the abstract when available (PWC, Dev.to), otherwise
   builds a contextual description from metadata. */
const SRC_FR = {
  hn:     "Discussion Hacker News",
  reddit: "Fil Reddit",
  pwc:    "Article scientifique (Papers With Code)",
  devto:  "Article Dev.to",
  arxiv:  "Pré-publication arXiv",
};
const SRC_EN = {
  hn:     "Hacker News discussion",
  reddit: "Reddit thread",
  pwc:    "Research paper (Papers With Code)",
  devto:  "Dev.to article",
  arxiv:  "arXiv preprint",
};
const CAT_DESC_FR = {
  model:    "les modèles d'IA et leurs capacités",
  research: "la recherche académique en IA",
  business: "l'écosystème business / financements IA",
  tools:    "les outils, agents et frameworks dev",
  data:     "les jeux de données et le training",
  other:    "l'actualité IA générale",
};
const CAT_DESC_EN = {
  model:    "AI models and their capabilities",
  research: "academic AI research",
  business: "the AI business / funding ecosystem",
  tools:    "dev tools, agents and frameworks",
  data:     "datasets and model training",
  other:    "general AI news",
};

export function generateSummary(story, lang = 'fr') {
  if (story.abstract && story.abstract.length > 40) return story.abstract;

  const srcMap = lang === 'en' ? SRC_EN : SRC_FR;
  const catMap = lang === 'en' ? CAT_DESC_EN : CAT_DESC_FR;
  const src    = srcMap[story.source] ?? story.source;
  const cat    = catMap[story.category] ?? catMap.other;
  const sub    = story.source === 'reddit' && story.subreddit ? ` (r/${story.subreddit})` : '';

  const engagement = story.comments > 50
    ? (lang === 'en' ? 'sparking active community debate' : 'générant un débat actif dans la communauté')
    : story.score > 200
      ? (lang === 'en' ? 'gaining strong traction' : 'gagnant une forte attention')
      : (lang === 'en' ? 'getting attention from the community' : 'attirant l\'attention de la communauté');

  if (lang === 'en') {
    return `${src}${sub} covering ${cat}, posted ${story.time} ago on ${story.domain}. With ${story.score} upvotes${story.comments ? ` and ${story.comments} comments` : ''}, this story is ${engagement}. Click "Read more" below to access the full content.`;
  }
  return `${src}${sub} traitant de ${cat}, publié il y a ${story.time} sur ${story.domain}. Avec ${story.score} votes positifs${story.comments ? ` et ${story.comments} commentaires` : ''}, ce contenu est ${engagement}. Cliquez sur "En savoir plus" pour accéder au contenu complet.`;
}
