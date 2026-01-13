import React, { useMemo } from 'react';
import { marked } from 'marked';
import type { TextBlock as TextBlockType } from '../../types';

interface TextBlockProps {
  block: TextBlockType;
}

const TextBlock: React.FC<TextBlockProps> = ({ block }) => {
  // Convert markdown to HTML if needed
  const htmlContent = useMemo(() => {
    if (!block.content) return '';
    // Check if content looks like HTML (contains HTML tags)
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(block.content);
    // If it's already HTML, use it directly; otherwise parse as markdown
    return hasHtmlTags ? block.content : marked(block.content);
  }, [block.content]);

  return (
    <div className="text-lg md:text-xl text-gray-800 dark:text-zinc-200 space-y-8 leading-relaxed max-w-3xl">
      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

export default TextBlock;
