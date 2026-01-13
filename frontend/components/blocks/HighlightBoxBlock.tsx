import React, { useMemo } from 'react';
import { marked } from 'marked';
import type { HighlightBoxBlock as HighlightBoxBlockType } from '../../types';

interface HighlightBoxBlockProps {
  block: HighlightBoxBlockType;
}

const HighlightBoxBlock: React.FC<HighlightBoxBlockProps> = ({ block }) => {
  // Convert markdown to HTML if needed
  const htmlContent = useMemo(() => {
    if (!block.content) return '';
    // Check if content looks like HTML (contains HTML tags)
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(block.content);
    // If it's already HTML, use it directly; otherwise parse as markdown
    return hasHtmlTags ? block.content : marked(block.content);
  }, [block.content]);

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 p-10 md:p-16 border-l-8 border-black dark:border-white border border-gray-100 dark:border-zinc-800 mb-24">
      <h3 className="text-2xl font-bold mb-6 font-serif dark:text-white">{block.title}</h3>
      <div
        className="text-xl md:text-2xl text-gray-700 dark:text-zinc-200 leading-relaxed prose prose-xl dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

export default HighlightBoxBlock;
