import React from 'react';
import type { ImageBlock as ImageBlockType } from '../../types';
import Section from '../Section';

interface ImageBlockProps {
  block: ImageBlockType;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ block }) => {
  if (!block.src) return null;

  return (
    <Section>
      <div className="frame frame--photo image-block">
        <img src={block.src} alt={block.alt || ''} loading="lazy" decoding="async" />
      </div>
    </Section>
  );
};

export default ImageBlock;
