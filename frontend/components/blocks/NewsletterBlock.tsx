import React, { useState } from 'react';
import type { NewsletterBlock as NewsletterBlockType, SiteConfig } from '../../types';
import { getSiteConfig } from '../../utils/site';
import config from '../../config';
import { trackNewsletterSubscribe } from '../../utils/analytics';

interface NewsletterBlockProps {
  block: NewsletterBlockType;
}

type NewsletterConfig = NonNullable<SiteConfig['newsletter']>;

interface SubscriptionResponse {
  success?: boolean;
  message?: string;
}

/**
 * Validate newsletter configuration
 */
function validateNewsletterConfig(
  newsletterConfig: NewsletterConfig | undefined
): string | null {
  if (!newsletterConfig?.listmonk?.baseUrl) {
    return 'Newsletter service not configured.';
  }
  if (!newsletterConfig?.listmonk?.listId) {
    return 'Newsletter list not configured.';
  }
  return null;
}

/**
 * Submit subscription via backend API
 */
async function submitSubscription(
  apiUrl: string,
  email: string,
  newsletterConfig: NewsletterConfig,
  honeypot: string
): Promise<SubscriptionResponse> {
  const response = await fetch(`${apiUrl}/email-list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      listId: newsletterConfig.listmonk?.listId,
      baseUrl: newsletterConfig.listmonk?.baseUrl,
      templateId: newsletterConfig.listmonk?.welcomeEmailTemplateId,
      website: honeypot, // Honeypot field for bot detection
    }),
  });

  if (response.ok) {
    const data = (await response.json()) as SubscriptionResponse;
    return {
      success: data.success ?? true,
      message: data.message || 'Successfully subscribed!',
    };
  }

  const errorData = (await response.json().catch(() => ({}))) as SubscriptionResponse;
  return {
    success: false,
    message: errorData.message || 'Subscription failed. Please try again.',
  };
}

const NewsletterBlock: React.FC<NewsletterBlockProps> = ({ block }) => {
  const siteConfig = getSiteConfig();
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const newsletterConfig = siteConfig.newsletter;
    const configError = validateNewsletterConfig(newsletterConfig);
    if (configError) {
      setStatus('error');
      setMessage(configError);
      return;
    }

    if (!newsletterConfig) {
      return;
    }

    try {
      const apiUrl = config.assistant.url;
      const result = await submitSubscription(apiUrl, email, newsletterConfig, honeypot);

      setStatus(result.success ? 'success' : 'error');
      setMessage(result.message || 'An error occurred. Please try again later.');

      if (result.success) {
        setEmail('');
        trackNewsletterSubscribe();
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again later.');
      console.error('Newsletter subscription error:', error);
    }
  };

  return (
    <section className="bg-gray-50 dark:bg-zinc-900 p-10 md:p-16 border border-gray-100 dark:border-zinc-800 mb-24">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 font-serif dark:text-white">
          {block.title}
        </h2>
        <p className="text-lg text-gray-700 dark:text-zinc-300 mb-8">
          {block.description}
        </p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={block.placeholder || 'Your email address'}
              className="flex-grow px-5 py-3 text-base border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 placeholder:text-gray-600 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white"
              required
              disabled={status === 'loading'}
              aria-label="Email address for newsletter"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 text-sm font-bold hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-offset-zinc-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>
          {message && (
            <div
              className={`text-sm ${
                status === 'success'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
              role="alert"
              aria-live="polite"
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </section>
  );
};

export default NewsletterBlock;
