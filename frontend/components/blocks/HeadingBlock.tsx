import React from 'react';
import type { HeadingBlock as HeadingBlockType } from '../../types';
import Section from '../Section';

interface HeadingBlockProps {
  block: HeadingBlockType;
}

const HeadingBlock: React.FC<HeadingBlockProps> = ({ block }) => {
  const level = Math.min(Math.max(block.level || 2, 1), 6);
  const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  return (
    <Section>
      <div className="section-head">
        <HeadingTag>{block.text}</HeadingTag>
      </div>
    </Section>
  );
};

export default HeadingBlock;
