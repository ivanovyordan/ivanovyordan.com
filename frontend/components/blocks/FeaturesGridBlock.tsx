import React from 'react';
import type { FeaturesGridBlock as FeaturesGridBlockType } from '../../types';

interface FeaturesGridBlockProps {
  block: FeaturesGridBlockType;
}

const FeaturesGridBlock: React.FC<FeaturesGridBlockProps> = ({ block }) => {
  return (
    <div className="mb-24">
      <h2 className="text-3xl md:text-4xl font-bold mb-10 font-serif dark:text-white">
        {block.title}
      </h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {block.items.map((item, idx) => (
          <li
            key={idx}
            className="border-2 border-gray-200 dark:border-zinc-800 p-8 hover:border-black dark:hover:border-white transition-colors bg-white dark:bg-zinc-900/40"
          >
            <h4 className="text-xl font-bold mb-3 dark:text-white">{item.title}</h4>
            <p className="text-lg text-gray-700 dark:text-zinc-300 leading-relaxed">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FeaturesGridBlock;
