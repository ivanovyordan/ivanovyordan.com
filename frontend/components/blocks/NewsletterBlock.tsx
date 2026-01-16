import React, { useState } from 'react';
import type { NewsletterBlock as NewsletterBlockType, SiteConfig } from '../../types';
import { getSiteConfig } from '../../utils/site';
import config from '../../config';

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
  if (!newsletterConfig?.url) {
    return 'Newsletter service not configured.';
  }
  return null;
}

/**
 * Clean base URL by removing trailing slashes and subscription form path
 */
function cleanBaseUrl(baseUrl: string): string {
  return baseUrl
    .replace(/\/subscription\/form\/?$/, '')
    .replace(/\/$/, '');
}

/**
 * Get listmonk base URL
 */
function getListmonkBaseUrl(newsletterConfig: NewsletterConfig): string {
  return newsletterConfig.listmonk?.baseUrl || newsletterConfig.url || '';
}

/**
 * Build form data for listmonk subscription
 */
function buildListmonkFormData(
  email: string,
  newsletterConfig: NewsletterConfig
): FormData {
  const formData = new FormData();
  formData.append('email', email);

  // Add list subscriptions (hidden - always subscribe to all configured lists)
  if (newsletterConfig.listmonk?.lists) {
    newsletterConfig.listmonk.lists.forEach((list) => {
      // Only subscribe to lists that are marked as checked in config
      if (list.checked !== false) {
        formData.append('l', list.id);
      }
    });
  }

  return formData;
}

/**
 * Build subscription URL with query parameters
 */
function buildSubscriptionUrl(
  apiUrl: string,
  baseUrl: string,
  templateId?: number
): URL {
  const subscribeUrl = new URL(`${apiUrl}/email-list`);
  subscribeUrl.searchParams.set('baseUrl', baseUrl);
  if (templateId !== undefined) {
    subscribeUrl.searchParams.set('templateId', String(templateId));
  }
  return subscribeUrl;
}

/**
 * Submit listmonk subscription
 */
async function submitListmonkSubscription(
  apiUrl: string,
  email: string,
  newsletterConfig: NewsletterConfig
): Promise<SubscriptionResponse> {
  const baseUrl = getListmonkBaseUrl(newsletterConfig);
  const cleanBaseUrlValue = cleanBaseUrl(baseUrl);
  const formData = buildListmonkFormData(email, newsletterConfig);
  const templateId = newsletterConfig.listmonk?.welcomeEmailTemplateId;
  const subscribeUrl = buildSubscriptionUrl(apiUrl, cleanBaseUrlValue, templateId);

  const response = await fetch(subscribeUrl.toString(), {
    method: 'POST',
    body: formData,
  });

  if (response.ok) {
    const data = (await response.json()) as SubscriptionResponse;
    return {
      success: data.success ?? true,
      message:
        data.message ||
        'Successfully subscribed! Please check your email to confirm.',
    };
  }

  const errorData = (await response.json().catch(() => ({}))) as SubscriptionResponse;
  return {
    success: false,
    message: errorData.message || 'Subscription failed. Please try again.',
  };
}

/**
 * Submit custom API subscription
 */
async function submitCustomSubscription(
  url: string,
  email: string,
  apiKey?: string
): Promise<SubscriptionResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email }),
  });

  if (response.ok) {
    return {
      success: true,
      message: 'Successfully subscribed!',
    };
  }

  return {
    success: false,
    message: 'Subscription failed. Please try again.',
  };
}

/**
 * Handle external redirect subscription (Mailchimp/ConvertKit)
 */
function handleExternalRedirect(url: string): SubscriptionResponse {
  window.open(url, '_blank');
  return {
    success: true,
    message: 'Redirecting to signup page...',
  };
}

/**
 * Process newsletter subscription based on service type
 */
async function processSubscription(
  email: string,
  newsletterConfig: NewsletterConfig,
  apiUrl: string
): Promise<SubscriptionResponse> {
  if (newsletterConfig.service === 'listmonk') {
    return submitListmonkSubscription(apiUrl, email, newsletterConfig);
  }

  if (newsletterConfig.service === 'custom' && newsletterConfig.url) {
    return submitCustomSubscription(
      newsletterConfig.url,
      email,
      newsletterConfig.apiKey
    );
  }

  // For Mailchimp/ConvertKit, redirect to their signup page
  if (newsletterConfig.url) {
    return handleExternalRedirect(newsletterConfig.url);
  }

  return {
    success: false,
    message: 'Newsletter service not configured.',
  };
}

const NewsletterBlock: React.FC<NewsletterBlockProps> = ({ block }) => {
  const siteConfig = getSiteConfig();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
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
      const result = await processSubscription(
        email,
        newsletterConfig,
        apiUrl
      );

      setStatus(result.success ? 'success' : 'error');
      setMessage(result.message || 'An error occurred. Please try again later.');

      if (result.success) {
        setEmail('');
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
