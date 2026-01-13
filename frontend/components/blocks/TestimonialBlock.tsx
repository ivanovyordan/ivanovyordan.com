import React from 'react';
import type { TestimonialBlock as TestimonialBlockType } from '../../types';

interface TestimonialBlockProps {
  block: TestimonialBlockType;
}

const TestimonialBlock: React.FC<TestimonialBlockProps> = ({ block }) => {
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-600 dark:text-zinc-400 text-center mb-12">
        What my clients say
      </h3>
      <div className="italic text-2xl md:text-3xl text-center text-gray-800 dark:text-zinc-200 max-w-3xl mx-auto border-t border-b border-gray-100 dark:border-zinc-900 py-16 font-serif leading-relaxed">
        "{block.quote}"
        <span className="block not-italic text-sm font-bold text-black dark:text-white mt-8 uppercase tracking-[0.2em]">
          — {block.author}
        </span>
      </div>
    </section>
  );
};

export default TestimonialBlock;
