import { config } from './config';
import { getSiteConfig } from './utils/site';
import { trackAIQuestionAsked } from './utils/analytics';

/**
 * The digital twin: wires the server-rendered section (GeminiAssistantBlock.tsx).
 * Loaded by client.ts the first time the section nears the screen.
 */

const { url: API_URL, maxQuestions: MAX_QUESTIONS, localStorageKey: STORAGE_KEY } = config.assistant;

interface AIResponse {
  text?: string;
}

function loadQuestionsAsked(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveQuestionsAsked(count: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(count));
  } catch {
    // Storage blocked: the limit is then enforced by the server only.
  }
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (response.status === 503) {
      return data.message || 'The AI service is temporarily unavailable. Please try again later.';
    }
    return data.message || data.error || `Server responded with ${response.status}`;
  } catch {
    return `Server responded with ${response.status}`;
  }
}

async function fetchAIResponse(query: string, honeypot: string): Promise<string> {
  const response = await fetch(`${API_URL}/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, website: honeypot }), // website is the honeypot field
  });
  if (!response.ok) throw new Error(await parseErrorResponse(response));
  return ((await response.json()) as AIResponse).text || '';
}

function paragraph(text: string, className?: string): HTMLParagraphElement {
  const p = document.createElement('p');
  if (className) p.className = className;
  p.textContent = text;
  return p;
}

export function initTwin(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('[data-twin-form]');
  const limit = root.querySelector<HTMLElement>('[data-twin-limit]');
  const answer = root.querySelector<HTMLElement>('[data-twin-answer]');
  const credits = root.querySelector<HTMLElement>('[data-twin-credits]');
  const input = form?.querySelector<HTMLInputElement>('input[name="query"]');
  const honeypot = form?.querySelector<HTMLInputElement>('input[name="website"]');
  const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!form || !limit || !answer || !credits || !input || !honeypot || !submit) return;

  const name = getSiteConfig().name;
  let asked = loadQuestionsAsked();
  let loading = false;

  const sync = () => {
    const left = Math.max(0, MAX_QUESTIONS - asked);
    const limited = asked >= MAX_QUESTIONS;
    credits.textContent = `${left} free ${left === 1 ? 'question' : 'questions'} left`;
    form.hidden = limited;
    limit.hidden = !limited;
    if (limited) answer.replaceChildren();
    submit.disabled = loading || !input.value.trim();
  };

  input.addEventListener('input', sync);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = input.value;
    if (!query.trim() || loading || asked >= MAX_QUESTIONS) return;

    loading = true;
    submit.textContent = 'Asking';
    answer.replaceChildren(paragraph('Thinking...', 'muted'));
    sync();

    try {
      const text = await fetchAIResponse(query, honeypot.value);
      asked += 1;
      saveQuestionsAsked(asked);
      answer.replaceChildren(paragraph(`${name}'s digital twin`, 't-label muted'), paragraph(text));
      trackAIQuestionAsked();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not reach my digital twin. Please try again later.';
      answer.replaceChildren(paragraph(message, 'twin-answer__error'));
    } finally {
      loading = false;
      input.value = '';
      submit.textContent = 'Ask my digital twin';
      sync();
    }
  });

  sync();
}
