import React from 'react';
import type { HeadingBlock as HeadingBlockType } from '../../types';

interface HeadingBlockProps {
  block: HeadingBlockType;
}

const HeadingBlock: React.FC<HeadingBlockProps> = ({ block }) => {
  const level = block.level || 2;
  const HeadingTag = `h${level}` as keyof React.ElementType;
  const classes = {
    1: 'text-4xl md:text-6xl font-serif font-bold mb-10 tracking-tight dark:text-white',
    2: 'text-2xl md:text-3xl font-bold text-black dark:text-white pt-6 font-serif',
    3: 'text-xl md:text-2xl font-bold text-black dark:text-white pt-4 font-serif',
    4: 'text-lg md:text-xl font-bold text-black dark:text-white pt-4',
    5: 'text-base md:text-lg font-bold text-black dark:text-white pt-4',
    6: 'text-sm md:text-base font-bold text-black dark:text-white pt-4',
  };

  return React.createElement(HeadingTag, { className: classes[level as keyof typeof classes] }, block.text);
};

export default HeadingBlock;
