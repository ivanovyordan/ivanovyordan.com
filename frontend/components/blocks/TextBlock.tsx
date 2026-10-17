import React, { useMemo } from 'react';
import { Marked, type Tokens } from 'marked';
import type { TextBlock as TextBlockType } from '../../types';

interface TextBlockProps {
  block: TextBlockType;
}

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const isExternalHref = (href: string) => /^https?:\/\//i.test(href);

/**
 * Markdown for text blocks. An external link opens in a new tab with
 * rel="noopener noreferrer"; an internal link (/coaching, #anchor, mailto:)
 * stays in this one.
 */
const markdown = new Marked({
  renderer: {
    link({ href, title, tokens }: Tokens.Link) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
      const targetAttrs = isExternalHref(href)
        ? ' target="_blank" rel="noopener noreferrer"'
        : '';
      return `<a href="${escapeAttr(href)}"${titleAttr}${targetAttrs}>${text}</a>`;
    },
  },
});

const TextBlock: React.FC<TextBlockProps> = ({ block }) => {
  // Convert markdown to HTML if needed
  const htmlContent = useMemo(() => {
    if (!block.content) return '';
    // Check if content looks like HTML (contains HTML tags)
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(block.content);
    // If it's already HTML, use it directly; otherwise parse as markdown
    return hasHtmlTags ? block.content : (markdown.parse(block.content) as string);
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
