import React from 'react';
import type { CTASectionBlock as CTASectionBlockType } from '../../types';
import { getSiteConfig } from '../../utils/site';

interface CTASectionBlockProps {
  block: CTASectionBlockType;
}

const CTASectionBlock: React.FC<CTASectionBlockProps> = ({ block }) => {
  const siteConfig = getSiteConfig();
  return (
    <section className="bg-gray-50 dark:bg-zinc-900 p-10 md:p-16 border border-gray-100 dark:border-zinc-800 mb-24">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4 dark:text-white">
          {block.title}
        </h2>
        {block.description && (
          <p className="text-lg text-gray-700 dark:text-zinc-300 mb-8">
            {block.description}
          </p>
        )}
        {block.pricing && (
          <div className="max-w-xs mx-auto mb-8">
            <div className="p-8 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800">
              <p className="text-sm uppercase tracking-widest text-gray-600 dark:text-zinc-400 font-bold mb-2">
                {block.pricing.label}
              </p>
              <p className="text-5xl font-bold text-black dark:text-white">{block.pricing.price}</p>
            </div>
          </div>
        )}
        {block.buttonText && (
          <a
            href={siteConfig.bookingUrl || block.buttonUrl || '#'}
            target={siteConfig.bookingUrl || block.buttonUrl ? "_blank" : undefined}
            rel={siteConfig.bookingUrl || block.buttonUrl ? "noopener noreferrer" : undefined}
            className={`${
              block.pricing
                ? 'w-full bg-black dark:bg-white text-white dark:text-black py-4 font-bold hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors uppercase tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white cursor-pointer inline-block max-w-xs'
                : 'inline-block bg-black dark:bg-white text-white dark:text-black px-12 py-5 text-lg font-bold hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors uppercase tracking-[0.2em] focus:outline-none focus:ring-4 focus:ring-black/20 dark:focus:ring-white/20 cursor-pointer'
            }`}
          >
            {block.buttonText}
          </a>
        )}
      </div>
    </section>
  );
};

export default CTASectionBlock;
