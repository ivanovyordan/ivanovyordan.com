import React from 'react';
import type { AboutHeroBlock as AboutHeroBlockType } from '../../types';

interface AboutHeroBlockProps {
  block: AboutHeroBlockType;
  sidebarOnly?: boolean; // If true, only render sidebar part (for sidebar layout)
}

const AboutHeroBlock: React.FC<AboutHeroBlockProps> = ({ block, sidebarOnly = false }) => {
  const sidebarContent = (
    <>
      {block.headshot ? (
        <img
          src={block.headshot}
          alt="Headshot"
          className="w-full max-w-[280px] md:max-w-none aspect-[4/5] object-cover mb-8 border border-gray-200 dark:border-zinc-800"
        />
      ) : (
        <div className="w-full max-w-[280px] md:max-w-none aspect-[4/5] bg-gray-100 dark:bg-zinc-900 mb-8 flex items-center justify-center grayscale border border-gray-200 dark:border-zinc-800">
          <span className="text-gray-600 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            Headshot
          </span>
        </div>
      )}
      <div className="space-y-6">
        {block.location && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 dark:text-zinc-400 mb-1">
              Location
            </h4>
            <p className="text-sm font-bold dark:text-white">{block.location}</p>
          </div>
        )}
        {block.expertise && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 dark:text-zinc-400 mb-1">
              Expertise
            </h4>
            <p className="text-sm font-bold leading-snug dark:text-white">{block.expertise}</p>
          </div>
        )}
        {block.currently && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 dark:text-zinc-400 mb-1">
              Currently
            </h4>
            <p className="text-sm font-bold leading-snug dark:text-white">{block.currently}</p>
          </div>
        )}
      </div>
    </>
  );

  if (sidebarOnly) {
    return sidebarContent;
  }

  // Default: render full grid layout
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20">
      <div className="md:col-span-4 lg:col-span-3">{sidebarContent}</div>
      <div className="md:col-span-8 lg:col-span-9">
        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-10 tracking-tight dark:text-white">
          {block.title}
        </h1>
      </div>
    </div>
  );
};

export default AboutHeroBlock;
