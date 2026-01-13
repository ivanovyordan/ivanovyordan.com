import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import type { AccordionBlock as AccordionBlockType } from '../../types';

interface AccordionBlockProps {
  block: AccordionBlockType;
}

const AccordionBlock: React.FC<AccordionBlockProps> = ({ block }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(block.defaultOpen !== undefined ? block.defaultOpen : null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!block.items || block.items.length === 0) {
    return null;
  }

  return (
    <div className="my-8">
      {block.title && (
        <h2 className="text-2xl md:text-3xl font-serif font-bold mb-6 dark:text-white">
          {block.title}
        </h2>
      )}
      <div className="space-y-2">
        {block.items.map((item, index) => {
          const htmlContent = useMemo(() => {
            if (!item.answer) return '';
            const hasHtmlTags = /<[a-z][\s\S]*>/i.test(item.answer);
            return hasHtmlTags ? item.answer : marked(item.answer);
          }, [item.answer]);

          return (
            <div
              key={index}
              className="border border-gray-200 dark:border-zinc-800 rounded-sm overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-inset cursor-pointer"
                aria-expanded={openIndex === index}
              >
                <span className="font-bold text-lg dark:text-white pr-4">{item.question}</span>
                <svg
                  className={`w-5 h-5 text-gray-600 dark:text-zinc-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-zinc-300"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AccordionBlock;
