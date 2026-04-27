import { useState, useCallback } from 'react';

const ENDPOINT = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

export function useGemini(apiKey, lang = 'fr') {
  const [insight,   setInsight]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [error,     setError]     = useState(false);
  const [errorMsg,  setErrorMsg]  = useState('');

  const fetchInsight = useCallback(async (titles) => {
    if (!titles.length) return;

    if (!apiKey) {
      setInsight(''); setError(false); setErrorMsg('');
      return;
    }

    setLoading(true); setError(false); setErrorMsg(''); setInsight('');

    const prompt = lang === 'en'
      ? `In max 3 sentences, explain the business impact of these AI trends for a small business or startup: ${titles.join(' | ')}`
      : `En 3 phrases maximum, explique l'impact business de ces tendances IA pour une PME ou startup française : ${titles.join(' | ')}`;

    try {
      const res = await fetch(ENDPOINT(apiKey), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 350 },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text) throw new Error('Empty response');

      setInsight(text.trim());
      setUpdatedAt(new Date());
    } catch (err) {
      console.error('[Gemini]', err);
      const raw = err.message ?? '';
      let hint = raw;
      if (raw.includes('API_KEY_INVALID') || raw.includes('API key not valid') || raw.includes('INVALID_ARGUMENT')) {
        hint = lang === 'en'
          ? 'Invalid API key. Check or regenerate it.'
          : 'Clé API invalide. Vérifiez-la ou régénérez-en une.';
      } else if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('quota') || raw.includes('429')) {
        hint = lang === 'en'
          ? 'Gemini quota exceeded. Try again in a few minutes.'
          : 'Quota Gemini dépassé. Réessayez dans quelques minutes.';
      } else if (raw.includes('Failed to fetch') || raw.includes('NetworkError')) {
        hint = lang === 'en'
          ? 'Cannot reach API. Check your connection.'
          : 'Impossible de joindre l\'API. Vérifiez votre connexion.';
      }
      setError(true);
      setErrorMsg(hint);
      setInsight('');
    } finally {
      setLoading(false);
    }
  }, [apiKey, lang]);

  return { insight, loading, updatedAt, error, errorMsg, fetchInsight };
}
