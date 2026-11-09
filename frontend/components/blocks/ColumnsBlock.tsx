import React from 'react';
import BlockRenderer from './BlockRenderer';
import type { ColumnsBlock as ColumnsBlockType } from '../../types';
import Section from '../Section';

interface ColumnsBlockProps {
  block: ColumnsBlockType;
}

const ColumnsBlock: React.FC<ColumnsBlockProps> = ({ block }) => {
  const span = block.columns === 2 ? 'span-6' : 'span-4';

  return (
    <Section>
      <div className="grid grid--top">
        {block.items.map((item, idx) => (
          <div className={span} key={idx}>
            <BlockRenderer block={item} bare />
          </div>
        ))}
      </div>
    </Section>
  );
};

export default ColumnsBlock;
