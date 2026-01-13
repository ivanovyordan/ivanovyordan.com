import React from 'react';
import type { HeroBlock as HeroBlockType } from '../../types';

interface HeroBlockProps {
  block: HeroBlockType;
}

const HeroBlock: React.FC<HeroBlockProps> = ({ block }) => {
  // Check if this is a centered hero (like coaching page)
  const isCentered = block.badge !== undefined;

  return (
    <section className={isCentered ? "text-center mb-24" : "mb-24"}>
      {block.badge && (
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-600 dark:text-zinc-400 mb-6 block">
          {block.badge}
        </span>
      )}
      <h1 className={isCentered
        ? "text-5xl md:text-7xl font-serif font-bold mb-10 leading-tight tracking-tight dark:text-white"
        : "text-4xl md:text-6xl font-serif font-bold mb-8 leading-tight tracking-tight dark:text-white whitespace-pre-line"
      }>
        {block.title}
      </h1>
      {block.subtitle && (
        <p className={isCentered
          ? "text-2xl md:text-3xl text-gray-700 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed"
          : "text-xl md:text-2xl text-gray-700 dark:text-zinc-300 leading-relaxed max-w-3xl"
        }>
          {block.subtitle}
        </p>
      )}
    </section>
  );
};

export default HeroBlock;
