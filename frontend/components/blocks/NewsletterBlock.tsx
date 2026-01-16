import React, { useState } from 'react';
import type { NewsletterBlock as NewsletterBlockType } from '../../types';
import { getSiteConfig } from '../../utils/site';
import config from '../../config';

interface NewsletterBlockProps {
  block: NewsletterBlockType;
}

const NewsletterBlock: React.FC<NewsletterBlockProps> = ({ block }) => {
  const siteConfig = getSiteConfig();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Note: Nonce is optional - Listmonk can generate it server-side if not provided
  // We skip fetching it to avoid unnecessary requests and errors

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const newsletterConfig = siteConfig.newsletter;
    if (!newsletterConfig?.url) {
      setStatus('error');
      setMessage('Newsletter service not configured.');
      return;
    }

    try {
      if (newsletterConfig.service === 'listmonk') {
        // Listmonk form submission via proxy endpoint to avoid CORS issues
        const baseUrl = newsletterConfig.listmonk?.baseUrl || newsletterConfig.url;
        // Remove trailing slash and /subscription/form if already present
        const cleanBaseUrl = baseUrl.replace(/\/subscription\/form\/?$/, '').replace(/\/$/, '');
        const apiUrl = config.assistant.url;

        // Build form data
        // Note: Nonce is optional - Listmonk will generate it server-side if not provided
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

        // Get welcome email template ID from config
        const templateId = newsletterConfig.listmonk?.welcomeEmailTemplateId;
        const subscribeUrl = new URL(`${apiUrl}/api/newsletter/subscribe`);
        subscribeUrl.searchParams.set('baseUrl', cleanBaseUrl);
        if (templateId) {
          subscribeUrl.searchParams.set('templateId', String(templateId));
        }

        const response = await fetch(subscribeUrl.toString(), {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStatus('success');
            setMessage(data.message || 'Successfully subscribed! Please check your email to confirm.');
            setEmail('');
          } else {
            setStatus('error');
            setMessage(data.message || 'Subscription failed. Please try again.');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          setStatus('error');
          setMessage(errorData.message || 'Subscription failed. Please try again.');
        }
      } else if (newsletterConfig.service === 'custom' && newsletterConfig.url) {
        // Custom API endpoint
        const response = await fetch(newsletterConfig.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(newsletterConfig.apiKey && { Authorization: `Bearer ${newsletterConfig.apiKey}` }),
          },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          setStatus('success');
          setMessage('Successfully subscribed!');
          setEmail('');
        } else {
          setStatus('error');
          setMessage('Subscription failed. Please try again.');
        }
      } else {
        // For Mailchimp/ConvertKit, redirect to their signup page
        window.open(newsletterConfig.url, '_blank');
        setStatus('success');
        setMessage('Redirecting to signup page...');
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
        <p className="text-lg text-gray-700 dark:text-zinc-300 mb-8">{block.description}</p>
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
