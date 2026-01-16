import React, { useState, useEffect } from 'react';
import type { NewsletterBlock as NewsletterBlockType } from '../../types';
import { getSiteConfig } from '../../utils/site';

interface NewsletterBlockProps {
  block: NewsletterBlockType;
}

const NewsletterBlock: React.FC<NewsletterBlockProps> = ({ block }) => {
  const siteConfig = getSiteConfig();
  const [email, setEmail] = useState('');
  const [nonce, setNonce] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Fetch nonce from Listmonk if using Listmonk service
  useEffect(() => {
    const newsletterConfig = siteConfig.newsletter;
    if (newsletterConfig?.service === 'listmonk' && newsletterConfig.listmonk?.baseUrl) {
      // Fetch nonce from Listmonk's subscription form endpoint
      const fetchNonce = async () => {
        try {
          const baseUrl = newsletterConfig.listmonk?.baseUrl;
          if (!baseUrl) return;
          const response = await fetch(`${baseUrl}/subscription/form`, {
            method: 'GET',
            mode: 'cors',
          });
          if (response.ok) {
            const html = await response.text();
            // Extract nonce from the HTML form - try multiple patterns
            const nonceMatch =
              html.match(/name="nonce"\s+value="([^"]+)"/) ||
              html.match(/<input[^>]*name="nonce"[^>]*value="([^"]+)"/i) ||
              html.match(/nonce["\s]*[:=]["\s]*([^"'\s]+)/i);
            if (nonceMatch && nonceMatch[1]) {
              setNonce(nonceMatch[1]);
            }
          }
        } catch (error) {
          console.error('Failed to fetch Listmonk nonce:', error);
          // Continue without nonce - Listmonk may handle it or generate it server-side
        }
      };
      fetchNonce();
    }
  }, [siteConfig.newsletter]);

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
        // Listmonk form submission
        const baseUrl = newsletterConfig.listmonk?.baseUrl || newsletterConfig.url;
        // Remove trailing slash and /subscription/form if already present
        const cleanBaseUrl = baseUrl.replace(/\/subscription\/form\/?$/, '').replace(/\/$/, '');
        const formUrl = `${cleanBaseUrl}/subscription/form`;

        // Build form data
        const formData = new FormData();
        formData.append('email', email);
        if (nonce) {
          formData.append('nonce', nonce);
        }

        // Add list subscriptions (hidden - always subscribe to all configured lists)
        if (newsletterConfig.listmonk?.lists) {
          newsletterConfig.listmonk.lists.forEach((list) => {
            // Only subscribe to lists that are marked as checked in config
            if (list.checked !== false) {
              formData.append('l', list.id);
            }
          });
        }

        const response = await fetch(formUrl, {
          method: 'POST',
          body: formData,
          mode: 'cors',
          credentials: 'omit',
        });

        if (response.ok) {
          // Listmonk returns HTML on success, check for success indicators
          const html = await response.text();
          if (html.includes('success') || html.includes('subscribed') || response.status === 200) {
            setStatus('success');
            setMessage('Successfully subscribed! Please check your email to confirm.');
            setEmail('');
            // Refresh nonce for next submission
            if (newsletterConfig.listmonk?.baseUrl) {
              const nonceResponse = await fetch(`${newsletterConfig.listmonk.baseUrl}/subscription/form`);
              const nonceHtml = await nonceResponse.text();
              const nonceMatch = nonceHtml.match(/name="nonce"\s+value="([^"]+)"/);
              if (nonceMatch) {
                setNonce(nonceMatch[1]);
              }
            }
          } else {
            setStatus('error');
            setMessage('Subscription failed. Please try again.');
          }
        } else {
          setStatus('error');
          setMessage('Subscription failed. Please try again.');
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
