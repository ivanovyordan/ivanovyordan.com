import React from 'react';
import type { FeaturesGridBlock as FeaturesGridBlockType } from '../../types';
import Section from '../Section';

interface FeaturesGridBlockProps {
  block: FeaturesGridBlockType;
}

const FeaturesGridBlock: React.FC<FeaturesGridBlockProps> = ({ block }) => {
  return (
    <Section>
      <div className="section-head">
        <h2>{block.title}</h2>
      </div>
      <div className="grid">
        {block.items.map((item) => (
          <article className="card card--open span-6" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </Section>
  );
};

export default FeaturesGridBlock;
