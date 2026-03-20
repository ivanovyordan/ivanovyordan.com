import React, { useRef, useState } from 'react';
import type { NewsletterBlock as NewsletterBlockType } from '../../types';

interface NewsletterBlockProps {
  block: NewsletterBlockType;
}

const SENDFOX_FORM_URL = 'https://sendfox.com/form/m5xz6n/1kwpr4';

const NewsletterBlock: React.FC<NewsletterBlockProps> = ({ block }) => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Submit via XMLHttpRequest with the exact headers SendFox expects
    const xhr = new XMLHttpRequest();
    xhr.open('POST', SENDFOX_FORM_URL);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status === 422 && response.errors) {
          setErrorMessage(response.errors[0]);
          setStatus('error');
        } else if (xhr.status === 200) {
          setStatus('success');
          formRef.current?.reset();
        } else {
          setErrorMessage('Subscription failed. Please try again.');
          setStatus('error');
        }
      } catch {
        setErrorMessage('Unexpected response. Please try again.');
        setStatus('error');
      }
    };
    xhr.onerror = () => {
      setErrorMessage('Network error. Please try again.');
      setStatus('error');
    };
    xhr.send(formData);
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
        {status === 'success' ? (
          <p className="text-lg font-medium text-green-700 dark:text-green-400">
            Thanks for subscribing! Check your inbox to confirm.
          </p>
        ) : (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                id="sendfox_form_email"
                placeholder={block.placeholder || 'Your email address'}
                name="email"
                required
                className="flex-grow px-5 py-3 text-base border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 placeholder:text-gray-600 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white"
                aria-label="Email address for newsletter"
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 text-sm font-bold hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-offset-zinc-900 cursor-pointer disabled:opacity-50"
              >
                {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
            {status === 'error' && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            )}
            {/* honeypot */}
            <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
              <input type="text" name="a_password" tabIndex={-1} defaultValue="" autoComplete="off" />
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default NewsletterBlock;
