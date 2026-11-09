import React from 'react';
import type { HeroBlock as HeroBlockType } from '../../types';
import { getSiteConfig } from '../../utils/site';
import { trackBookingClick } from '../../utils/analytics';
import Section from '../Section';

interface HeroBlockProps {
  block: HeroBlockType;
}

const Arrow: React.FC = () => (
  <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
    <path className="m-arrow__stem" d="M1 6h8" />
    <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
  </svg>
);

const HeroBlock: React.FC<HeroBlockProps> = ({ block }) => {
  const site = getSiteConfig();

  // The split hero: exactly the first screen, words left, the portrait right.
  if (block.image) {
    return (
      <section className="hero hero--split" aria-labelledby="hero-h">
        <div className="wrap">
          <div className="hero-text grid hero-split">
            <div className="hero-copy span-6">
              <h1 id="hero-h">{block.title}</h1>
              {block.subtitle && <p className="t-lead">{block.subtitle}</p>}
              <div className="btn-row">
                {block.buttonText && (
                  <a
                    className="btn btn--primary"
                    href={site.discoveryCallPage}
                    onClick={() => trackBookingClick('hero')}
                  >
                    {block.buttonText}
                    <Arrow />
                  </a>
                )}
                {block.secondaryText && block.secondaryUrl && (
                  <a className="btn btn--secondary" href={block.secondaryUrl}>
                    {block.secondaryText}
                  </a>
                )}
              </div>
              {block.facts && block.facts.length > 0 && (
                <dl className="hero-facts">
                  {block.facts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            <div className="hero-visual frame frame--photo span-6 start-7">
              <img
                className="frame__img"
                src={block.image}
                alt={block.imageAlt || ''}
                fetchPriority="high"
                style={{ objectPosition: '50% 30%' }}
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // An inner page's head: the h1 and its line, as long as they are.
  return (
    <Section className="page-head">
      <div className="section-head">
        {block.badge && <p className="t-label muted">{block.badge}</p>}
        <h1>{block.title}</h1>
        {block.subtitle && <p>{block.subtitle}</p>}
        {block.buttonText && (
          <div className="btn-row">
            <a className="btn btn--primary" href={getSiteConfig().discoveryCallPage || '/coaching#book'}>
              {block.buttonText}
            </a>
          </div>
        )}
      </div>
    </Section>
  );
};

export default HeroBlock;
