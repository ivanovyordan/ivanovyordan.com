import React from 'react';
import BlockRenderer from './BlockRenderer';
import type { ColumnsBlock as ColumnsBlockType } from '../../types';

interface ColumnsBlockProps {
  block: ColumnsBlockType;
}

const ColumnsBlock: React.FC<ColumnsBlockProps> = ({ block }) => {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-8',
    lg: 'gap-12',
  };

  const gap = gapClasses[block.gap || 'md'];
  const gridCols =
    block.columns === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridCols} ${gap} my-8`}>
      {block.items.map((item, idx) => (
        <div key={idx}>
          <BlockRenderer block={item} />
        </div>
      ))}
    </div>
  );
};

export default ColumnsBlock;
