import React, { useMemo } from 'react';
import { marked } from 'marked';
import type { HighlightBoxBlock as HighlightBoxBlockType } from '../../types';
import Section from '../Section';

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
    <Section>
      <div className="grid grid--top">
        <div className="span-5 section-head">
          <h2>{block.title}</h2>
        </div>
        <div className="span-7 start-6 prose prose--lead" dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    </Section>
  );
};

export default HighlightBoxBlock;
