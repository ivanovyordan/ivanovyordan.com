import React, { useEffect } from 'react';
import type { NewsletterBlock as NewsletterBlockType } from '../../types';

interface NewsletterBlockProps {
  block: NewsletterBlockType;
}

const NewsletterBlock: React.FC<NewsletterBlockProps> = ({ block }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.sendfox.com/js/form.js';
    script.charset = 'utf-8';
    script.onload = () => {
      // form.js uses DOMContentLoaded to initialize, but that event has
      // already fired by the time useEffect runs in a React SPA.
      // Dispatch it manually so the form handler gets attached.
      if (document.readyState !== 'loading') {
        document.dispatchEvent(new Event('DOMContentLoaded'));
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
      delete (window as unknown as Record<string, unknown>).SENDFOX_FORM_LOADED;
    };
  }, []);

  return (
    <section className="bg-gray-50 dark:bg-zinc-900 p-10 md:p-16 border border-gray-100 dark:border-zinc-800 mb-24">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 font-serif dark:text-white">
          {block.title}
        </h2>
        <p className="text-lg text-gray-700 dark:text-zinc-300 mb-8">
          {block.description}
        </p>
        <form
          method="post"
          action="https://sendfox.com/form/m5xz6n/1kwpr4"
          className="sendfox-form flex flex-col gap-4"
          id="1kwpr4"
          data-async="true"
          data-recaptcha="true"
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
              className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 text-sm font-bold hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-offset-zinc-900 cursor-pointer"
            >
              Subscribe
            </button>
          </div>
          {/* no botz please */}
          <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
            <input type="text" name="a_password" tabIndex={-1} defaultValue="" autoComplete="off" />
          </div>
        </form>
      </div>
    </section>
  );
};

export default NewsletterBlock;
