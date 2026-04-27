export const AI_KEYWORDS = [
  'ai', 'llm', 'gpt', 'machine learning', 'deep learning', 'neural',
  'claude', 'openai', 'mistral', 'gemini', 'llama', 'transformer',
  'diffusion', ' ml ', 'chatgpt', 'copilot', 'anthropic', 'hugging face',
  'langchain', 'rag', 'embedding', 'vector', 'data science', 'midjourney',
  'sora', 'whisper', 'multimodal', 'finetuning', 'fine-tuning',
  'reinforcement learning', 'rlhf', 'agentic', 'foundation model',
  'inference', 'training', 'benchmark', 'reasoning', 'alignment',
  'safety', 'synthetic data', 'attention', 'moe', 'mixture of experts',
];

export const matchesAI = (title) => {
  if (!title) return false;
  const l = title.toLowerCase();
  return AI_KEYWORDS.some(kw => l.includes(kw));
};

export const getCategory = (title) => {
  const l = title.toLowerCase();
  if (['gpt', 'claude', 'gemini', 'mistral', 'llama', 'llm', 'chatgpt', 'copilot', 'phi', 'deepseek', 'grok', 'qwen', 'yi-', 'falcon'].some(k => l.includes(k))) return 'model';
  if (['research', 'paper', 'arxiv', 'study', 'benchmark', 'survey', 'we show', 'we present', 'we propose', 'evaluation'].some(k => l.includes(k))) return 'research';
  if (['startup', 'funding', 'launch', 'product', 'raises', 'acqui', 'ipo', 'billion', 'million', 'valuation', 'series'].some(k => l.includes(k))) return 'business';
  if (['tool', 'api', 'agent', 'framework', 'library', 'open source', 'github', 'deploy', 'inference', 'plugin', 'sdk', 'cli'].some(k => l.includes(k))) return 'tools';
  if (['data', 'dataset', 'training', 'finetune', 'fine-tune', 'synthetic'].some(k => l.includes(k))) return 'data';
  return 'other';
};

export const CATEGORY_COLOR = {
  model:    '#7C3AED',
  research: '#0D9488',
  business: '#F97316',
  tools:    '#3B82F6',
  data:     '#EC4899',
  other:    '#64748B',
};

export const SOURCE_META = {
  hn:     { label: 'HN',     color: '#F97316', full: 'Hacker News' },
  reddit: { label: 'Reddit', color: '#FF4500', full: 'Reddit' },
  arxiv:  { label: 'arXiv',  color: '#B31B1B', full: 'arXiv' },
  pwc:    { label: 'PWC',    color: '#21C55D', full: 'Papers With Code' },
  devto:  { label: 'Dev.to', color: '#3B49DF', full: 'Dev.to' },
};

export const timeAgo = (unix) => {
  const s = Math.floor(Date.now() / 1000 - unix);
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}j`;
};

export const getDomain = (url) => {
  if (!url) return 'ycombinator.com';
  try { return new URL(url).hostname.replace('www.', ''); } catch { return 'link'; }
};

/* Extract top trending keywords from a list of story titles */
export const extractKeywords = (stories, max = 15) => {
  const stop = new Set([
    'the','a','an','and','or','for','in','on','at','to','of','is','are','was',
    'with','by','as','that','this','from','it','be','has','have','not','but',
    'how','why','what','when','new','using','use','used','now','can','will',
    'its','our','your','their','which','more','than','about','into','over',
    'just','out','also','some','all','after','very','only','been','would',
    'make','made','get','gets','does','do','did','may','should','could','upon',
    'open','large','small','big','simple','good','best','fast','better','first',
  ]);
  const freq = {};
  stories.forEach(s => {
    (s.title.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? []).forEach(w => {
      if (!stop.has(w)) freq[w] = (freq[w] ?? 0) + 1;
    });
  });
  return Object.entries(freq)
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word, count]) => ({ word, count }));
};
