import React from 'react';
import type { NewsletterBlock as NewsletterBlockType } from '../../types';

interface NewsletterBlockProps {
  block: NewsletterBlockType;
}

const NewsletterBlock: React.FC<NewsletterBlockProps> = ({ block }) => {
  return (
    <section className="bg-gray-50 dark:bg-zinc-900 p-10 md:p-16 border border-gray-100 dark:border-zinc-800 mb-24">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 font-serif dark:text-white">
          {block.title}
        </h2>
        <p className="text-lg text-gray-700 dark:text-zinc-300 mb-8">
          {block.description}
        </p>
        <div className="flex justify-center">
          <iframe
            src="https://www.datagibberish.com/embed?transparent=1"
            width="480"
            height="150"
            style={{ border: 0, background: 'transparent' }}
            frameBorder={0}
            scrolling="no"
          />
        </div>
      </div>
    </section>
  );
};

export default NewsletterBlock;
