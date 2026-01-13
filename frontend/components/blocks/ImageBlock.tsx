import React from 'react';
import type { ImageBlock as ImageBlockType } from '../../types';

interface ImageBlockProps {
  block: ImageBlockType;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ block }) => {
  if (!block.src) return null;

  return (
    <figure className={block.fullWidth ? 'w-full' : 'my-8'}>
      <img
        src={block.src}
        alt={block.alt || ''}
        loading="lazy"
        decoding="async"
        className={`${
          block.fullWidth
            ? 'w-full'
            : block.width === 'narrow'
            ? 'max-w-md mx-auto'
            : block.width === 'medium'
            ? 'max-w-2xl mx-auto'
            : 'max-w-full'
        } ${block.rounded ? 'rounded-lg' : ''} ${block.shadow ? 'shadow-lg' : ''}`}
      />
      {block.caption && (
        <figcaption className="text-sm text-gray-600 dark:text-zinc-400 text-center mt-4 italic">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
};

export default ImageBlock;
