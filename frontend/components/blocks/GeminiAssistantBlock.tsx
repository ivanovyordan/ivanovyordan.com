import React, { useState, useEffect } from 'react';
import { config } from '../../config';
import { getSiteConfig } from '../../utils/site';
import type { GeminiAssistantBlock as GeminiAssistantBlockType } from '../../types';
import { trackAIQuestionAsked, trackBookingClick } from '../../utils/analytics';
import Section from '../Section';

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
        : 'Could not reach my digital twin. Please try again later.';
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
    <Section id="twin" labelledBy="twin-h">
      <div className="section-head">
        <h2 id="twin-h">Ask my digital twin</h2>
        <p>
          It answers the way I would. {remainingCredits} free {remainingCredits === 1 ? 'question' : 'questions'} left.
        </p>
      </div>

      {!isLimitReachedValue ? (
        <form
          className="form twin-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
        >
          {/* Honeypot field - hidden from users, catches bots */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            className="twin-form__trap"
          />
          <div className="field">
            <label htmlFor="twin-question">Your question</label>
            <input
              id="twin-question"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="For example, how do I log and share my wins?"
            />
          </div>
          <button className="btn btn--primary" type="submit" disabled={loading || !query.trim()}>
            {loading ? 'Asking' : 'Ask my digital twin'}
          </button>
        </form>
      ) : (
        <div className="stack-4">
          <p className="t-lead">That's your {MAX_QUESTIONS} questions.</p>
          <p>
            Full access comes with the annual{' '}
            {siteConfig.newsletter ? (
              <a className="link" href={siteConfig.newsletter.url} target="_blank" rel="noopener noreferrer">
                {siteConfig.newsletter.name}
              </a>
            ) : (
              'Data Gibberish'
            )}{' '}
            subscription. If you'd rather work on your case with me, book a discovery call.
          </p>
          <a
            className="btn btn--primary"
            href={siteConfig.discoveryCallPage || siteConfig.discoveryCallUrl || siteConfig.bookingUrl || '#'}
            onClick={() => trackBookingClick('ai_assistant_limit')}
          >
            Book a discovery call
          </a>
        </div>
      )}

      <div role="status" aria-live="polite" className="twin-answer">
        {error && <p className="twin-answer__error">{error}</p>}
        {thinking && !response && <p className="muted">Thinking...</p>}
        {response && !isLimitReachedValue && (
          <>
            <p className="t-label muted">{siteConfig.name}&apos;s digital twin</p>
            <p>{response}</p>
          </>
        )}
      </div>
    </Section>
  );
};

export default GeminiAssistantBlock;
