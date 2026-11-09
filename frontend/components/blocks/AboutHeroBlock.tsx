import React from 'react';
import type { AboutHeroBlock as AboutHeroBlockType } from '../../types';
import Section from '../Section';

interface AboutHeroBlockProps {
  block: AboutHeroBlockType;
  sidebarOnly?: boolean; // If true, only render sidebar part (for sidebar layout)
}

const Facts: React.FC<{ block: AboutHeroBlockType }> = ({ block }) => (
  <div className="about-side stack-5">
    {block.headshot && (
      <div className="frame frame--photo about-side__photo">
        <img className="frame__img" src={block.headshot} alt="Yordan Ivanov, smiling, in a tan polo shirt" />
      </div>
    )}
    <dl className="about-side__facts">
      {block.location && (
        <div>
          <dt>Location</dt>
          <dd>{block.location}</dd>
        </div>
      )}
      {block.expertise && (
        <div>
          <dt>Expertise</dt>
          <dd>{block.expertise}</dd>
        </div>
      )}
      {block.currently && (
        <div>
          <dt>Currently</dt>
          <dd>{block.currently}</dd>
        </div>
      )}
    </dl>
  </div>
);

const AboutHeroBlock: React.FC<AboutHeroBlockProps> = ({ block, sidebarOnly = false }) => {
  if (sidebarOnly) {
    return <Facts block={block} />;
  }

  return (
    <Section className="page-head">
      <div className="grid grid--top">
        <div className="span-8 about-head__title">
          <h1>{block.title}</h1>
        </div>
        <div className="span-4">
          <Facts block={block} />
        </div>
      </div>
    </Section>
  );
};

export default AboutHeroBlock;
