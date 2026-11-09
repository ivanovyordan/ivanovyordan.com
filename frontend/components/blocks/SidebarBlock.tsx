import React from 'react';
import type { SidebarBlock as SidebarBlockType } from '../../types';
import AboutHeroBlock from './AboutHeroBlock';
import BlockRenderer from './BlockRenderer';
import Section from '../Section';

interface SidebarBlockProps {
  block: SidebarBlockType;
}

const SidebarBlock: React.FC<SidebarBlockProps> = ({ block }) => {
  const aboutHero = block.sidebar?._block === 'about-hero' ? block.sidebar : null;

  return (
    <Section className="page-head">
      <div className="grid grid--top">
        <div className="span-7 start-6 sidebar-content">
          {aboutHero && <h1>{aboutHero.title}</h1>}
          {block.content.map((item, idx) => (
            <BlockRenderer key={idx} block={item} bare />
          ))}
        </div>
        <div className="span-4">
          {aboutHero ? (
            <AboutHeroBlock block={aboutHero} sidebarOnly={true} />
          ) : block.sidebar ? (
            <BlockRenderer block={block.sidebar} bare />
          ) : null}
        </div>
      </div>
    </Section>
  );
};

export default SidebarBlock;
