import React from 'react';
import type { SidebarBlock as SidebarBlockType } from '../../types';
import AboutHeroBlock from './AboutHeroBlock';
import BlockRenderer from './BlockRenderer';

interface SidebarBlockProps {
  block: SidebarBlockType;
}

const SidebarBlock: React.FC<SidebarBlockProps> = ({ block }) => {
  const aboutHero = block.sidebar?._block === 'about-hero' ? block.sidebar : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20">
      {/* Sidebar */}
      <div className="md:col-span-4 lg:col-span-3">
        {aboutHero ? (
          <AboutHeroBlock block={aboutHero} sidebarOnly={true} />
        ) : block.sidebar ? (
          <BlockRenderer block={block.sidebar} />
        ) : null}
      </div>
      {/* Content column */}
      <div className="md:col-span-8 lg:col-span-9">
        {aboutHero && (
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-10 tracking-tight dark:text-white">
            {aboutHero.title}
          </h1>
        )}
        {block.content.map((item, idx) => (
          <BlockRenderer key={idx} block={item} />
        ))}
      </div>
    </div>
  );
};

export default SidebarBlock;
