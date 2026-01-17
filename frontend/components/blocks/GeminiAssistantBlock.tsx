import React, { useState, useEffect } from 'react';
import { config } from '../../config';
import { getSiteConfig } from '../../utils/site';
import type { GeminiAssistantBlock as GeminiAssistantBlockType } from '../../types';
import { trackAIQuestionAsked } from '../../utils/analytics';

interface GeminiAssistantBlockProps {
  block: GeminiAssistantBlockType;
}

interface AIResponse {
  text?: string;
  error?: string;
  message?: string;
}

/**
 * Load questions asked from local storage
 */
function loadQuestionsAsked(storageKey: string): number {
  const used = localStorage.getItem(storageKey);
  return used ? parseInt(used, 10) : 0;
}

/**
 * Check if query is valid
 */
function isValidQuery(query: string): boolean {
  return query.trim().length > 0;
}

/**
 * Check if limit is reached
 */
function isLimitReached(questionsAsked: number, maxQuestions: number): boolean {
  return questionsAsked >= maxQuestions;
}

/**
 * Calculate remaining credits
 */
function calculateRemainingCredits(
  questionsAsked: number,
  maxQuestions: number
): number {
  return Math.max(0, maxQuestions - questionsAsked);
}

/**
 * Create API request
 */
function createAIRequest(apiUrl: string, query: string, honeypot: string): Request {
  return new Request(`${apiUrl}/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, website: honeypot }), // website is honeypot field
  });
}

/**
 * Parse error response
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (response.status === 503) {
      return (
        data.message ||
        'The AI service is temporarily unavailable. Please try again later.'
      );
    }
    return data.message || data.error || `Server responded with ${response.status}`;
  } catch {
    return `Server responded with ${response.status}`;
  }
}

/**
 * Handle API error response
 */
async function handleAPIError(response: Response): Promise<string> {
  return parseErrorResponse(response);
}

/**
 * Parse successful response
 */
async function parseSuccessResponse(response: Response): Promise<string> {
  const data = (await response.json()) as AIResponse;
  return data.text || '';
}

/**
 * Save questions asked to local storage
 */
function saveQuestionsAsked(storageKey: string, count: number): void {
  localStorage.setItem(storageKey, count.toString());
}

/**
 * Increment questions asked count
 */
function incrementQuestionsAsked(currentCount: number): number {
  return currentCount + 1;
}

/**
 * Fetch AI response from API
 */
async function fetchAIResponse(apiUrl: string, query: string, honeypot: string): Promise<string> {
  const request = createAIRequest(apiUrl, query, honeypot);
  const response = await fetch(request);

  if (!response.ok) {
    const errorMessage = await handleAPIError(response);
    throw new Error(errorMessage);
  }

  return parseSuccessResponse(response);
}


/**
 * Handle AI question submission
 */
async function handleAIQuestion(
  query: string,
  apiUrl: string,
  storageKey: string,
  currentQuestionsAsked: number,
  honeypot: string,
  setQuestionsAsked: (count: number) => void,
  setResponse: (text: string) => void,
  setError: (error: string) => void,
  setThinking: (thinking: boolean) => void
): Promise<void> {
  if (!isValidQuery(query)) {
    return;
  }

  try {
    const responseText = await fetchAIResponse(apiUrl, query, honeypot);
    setResponse(responseText);
    setThinking(false);

    const newCount = incrementQuestionsAsked(currentQuestionsAsked);
    setQuestionsAsked(newCount);
    saveQuestionsAsked(storageKey, newCount);

    // Track successful question
    trackAIQuestionAsked();
  } catch (err) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : 'Could not connect to the Digital Twin backend. Please ensure the backend server is running.';
    setError(errorMessage);
  }
}

const GeminiAssistantBlock: React.FC<GeminiAssistantBlockProps> = () => {
  const { url: API_URL, maxQuestions: MAX_QUESTIONS, localStorageKey: STORAGE_KEY } =
    config.assistant;
  const siteConfig = getSiteConfig();

  const [query, setQuery] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Honeypot field - should remain empty
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsClient(true);
    const count = loadQuestionsAsked(STORAGE_KEY);
    setQuestionsAsked(count);
  }, [STORAGE_KEY]);

  const handleAsk = async () => {
    if (!isValidQuery(query)) return;
    if (isLimitReached(questionsAsked, MAX_QUESTIONS)) return;

    // Immediate UI feedback
    setLoading(true);
    setThinking(true);
    setResponse('');
    setError('');

    try {
      await handleAIQuestion(
        query,
        API_URL,
        STORAGE_KEY,
        questionsAsked,
        honeypot,
        setQuestionsAsked,
        setResponse,
        setError,
        setThinking
      );
    } finally {
      setLoading(false);
      setThinking(false);
      setQuery('');
    }
  };

  const remainingCredits = calculateRemainingCredits(questionsAsked, MAX_QUESTIONS);
  const isLimitReachedValue = isLimitReached(questionsAsked, MAX_QUESTIONS);

  if (!isClient) return null;

  return (
    <div className="my-12 p-8 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 dark:text-white">
            Ask My Digital Twin
          </h4>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            Trained on my specific engineering philosophy.{' '}
            <span className="font-bold text-black dark:text-white">
              ({remainingCredits} free questions remaining)
            </span>
          </p>
        </div>
      </div>

      {!isLimitReachedValue ? (
        <div className="space-y-4">
          {/* Honeypot field - hidden from users, catches bots */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute -left-[9999px] opacity-0 h-0 w-0 pointer-events-none"
          />
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
          <p className="text-lg font-serif font-bold mb-2 dark:text-white">
            Limit Reached
          </p>
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
            <span className="font-bold uppercase text-[10px] tracking-widest text-gray-500 dark:text-zinc-400">
              {siteConfig.name} (AI)
            </span>
          </div>
          <p className="text-gray-600 dark:text-zinc-400 italic">Thinking...</p>
        </div>
      )}

      {response && !isLimitReachedValue && (
        <div className="mt-8 p-6 bg-gray-50 dark:bg-black/50 border-l-4 border-black dark:border-white text-gray-800 dark:text-zinc-200 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-bold uppercase text-[10px] tracking-widest text-gray-500 dark:text-zinc-400">
              {siteConfig.name} (AI)
            </span>
          </div>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default GeminiAssistantBlock;
