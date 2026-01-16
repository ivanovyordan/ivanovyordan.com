import React, { useState, useEffect } from 'react';
import { config } from '../../config';
import { getSiteConfig } from '../../utils/site';
import type { GeminiAssistantBlock as GeminiAssistantBlockType } from '../../types';

interface GeminiAssistantBlockProps {
  block: GeminiAssistantBlockType;
}

const GeminiAssistantBlock: React.FC<GeminiAssistantBlockProps> = () => {
  const { url: API_URL, maxQuestions: MAX_QUESTIONS, localStorageKey: STORAGE_KEY } = config.assistant;
  const siteConfig = getSiteConfig();

  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsClient(true);
    const used = localStorage.getItem(STORAGE_KEY);
    if (used) {
      setQuestionsAsked(parseInt(used, 10));
    }
  }, [STORAGE_KEY]);

  const handleAsk = async () => {
    if (!query.trim()) return;
    if (questionsAsked >= MAX_QUESTIONS) return;

    // Immediate UI feedback
    setLoading(true);
    setThinking(true);
    setResponse('');
    setError('');

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        // Try to parse error as JSON, fallback to text
        try {
          const data = await res.json();
          if (res.status === 503) {
            // API quota exceeded or service unavailable
            setError(data.message || 'The AI service is temporarily unavailable. Please try again later.');
            return;
          }
          throw new Error(data.message || data.error || `Server responded with ${res.status}`);
        } catch {
          throw new Error(`Server responded with ${res.status}`);
        }
      }

      // Handle JSON response
      const data = await res.json();
      setResponse(data.text || '');
      setThinking(false);

      // Update local storage
      const newCount = questionsAsked + 1;
      setQuestionsAsked(newCount);
      localStorage.setItem(STORAGE_KEY, newCount.toString());
    } catch (err) {
      console.error(err);
      setError('Could not connect to the Digital Twin backend. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
      setThinking(false);
      setQuery('');
    }
  };

  const remainingCredits = Math.max(0, MAX_QUESTIONS - questionsAsked);
  const isLimitReached = remainingCredits <= 0;

  if (!isClient) return null;

  return (
    <div className="my-12 p-8 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 dark:text-white">Ask My Digital Twin</h4>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            Trained on my specific engineering philosophy. <span className="font-bold text-black dark:text-white">({remainingCredits} free questions remaining)</span>
          </p>
        </div>
      </div>

      {!isLimitReached ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="e.g., How do I explain technical debt?"
              className="flex-grow bg-transparent border border-gray-300 dark:border-zinc-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white placeholder:text-gray-500 dark:placeholder:text-zinc-500 transition-all"
            />
            <button
              onClick={handleAsk}
              disabled={loading || !query.trim()}
              className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[100px] cursor-pointer"
            >
              {loading ? '...' : 'Ask'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-zinc-800 p-8 text-center border border-gray-200 dark:border-zinc-700">
          <p className="text-lg font-serif font-bold mb-2 dark:text-white">Limit Reached</p>
          {siteConfig.bookingUrl ? (
            <a
              href={siteConfig.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-black dark:bg-white text-white dark:text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg cursor-pointer"
            >
              Book Strategy Session
            </a>
          ) : (
            <button className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg cursor-pointer">
              Book Strategy Session
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {thinking && !response && (
        <div className="mt-8 p-6 bg-gray-50 dark:bg-black/50 border-l-4 border-black dark:border-white text-gray-800 dark:text-zinc-200 text-sm leading-relaxed">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="font-bold uppercase text-[10px] tracking-widest text-gray-500 dark:text-zinc-400">{siteConfig.name} (AI)</span>
          </div>
          <p className="text-gray-600 dark:text-zinc-400 italic">Thinking...</p>
        </div>
      )}

      {response && !isLimitReached && (
        <div className="mt-8 p-6 bg-gray-50 dark:bg-black/50 border-l-4 border-black dark:border-white text-gray-800 dark:text-zinc-200 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-bold uppercase text-[10px] tracking-widest text-gray-500 dark:text-zinc-400">{siteConfig.name} (AI)</span>
          </div>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default GeminiAssistantBlock;
