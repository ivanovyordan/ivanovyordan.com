import React from 'react';
import type { CTASectionBlock as CTASectionBlockType } from '../../types';
import { getSiteConfig } from '../../utils/site';
import { isBookingHref, trackBookingClick } from '../../utils/analytics';
import Section from '../Section';

interface CTASectionBlockProps {
  block: CTASectionBlockType;
}

const isExternalHref = (href: string) => /^https?:\/\//i.test(href);

interface CtaLinkProps {
  href: string;
  className: string;
  trackingLocation: string;
  children: React.ReactNode;
}

/**
 * An external link opens in a new tab; an internal one (/coaching#book,
 * #book) stays in this tab and lets the browser scroll to the anchor.
 */
const CtaLink: React.FC<CtaLinkProps> = ({ href, className, trackingLocation, children }) => {
  const siteConfig = getSiteConfig();
  const external = isExternalHref(href);
  const booking = isBookingHref(href, siteConfig);
  return (
    <a
      href={href}
      onClick={booking ? () => trackBookingClick(trackingLocation) : undefined}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={className}
    >
      {children}
    </a>
  );
};

const CTASectionBlock: React.FC<CTASectionBlockProps> = ({ block }) => {
  const siteConfig = getSiteConfig();
  const href = block.buttonUrl || siteConfig.discoveryCallPage || siteConfig.discoveryCallUrl || '#';
  const id = block.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const at = block.highlight ? block.title.indexOf(block.highlight) : -1;
  const heading =
    at < 0 ? (
      block.title
    ) : (
      <>
        {block.title.slice(0, at)}
        <strong>{block.highlight}</strong>
        {block.title.slice(at + (block.highlight as string).length)}
      </>
    );

  const intro = (
    <div className="section-head">
      {!block.highlight && <h2 id={`${id}-h`}>{heading}</h2>}
      {block.description && <p>{block.description}</p>}
    </div>
  );

  const body = (
    <>
      {block.items && block.items.length > 0 && (
        <ul className="checks">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {block.pricing && (
        <p className="price">
          <span className="t-label muted">{block.pricing.label}</span>
          <span className="t-stat">{block.pricing.price}</span>
        </p>
      )}
      <div className="btn-row">
        {block.buttonText && (
          <CtaLink href={href} className="btn btn--primary" trackingLocation="cta_section">
            {block.buttonText}
          </CtaLink>
        )}
        {block.secondaryButtonText && block.secondaryButtonUrl && (
          <CtaLink
            href={block.secondaryButtonUrl}
            className="btn btn--secondary"
            trackingLocation="cta_section_secondary"
          >
            {block.secondaryButtonText}
          </CtaLink>
        )}
      </div>
    </>
  );

  const words = (
    <>
      {intro}
      {body}
    </>
  );
  const rest = (
    <>
      {block.description && <p>{block.description}</p>}
      {body}
    </>
  );

  if (block.quote) {
    return (
      <Section id={block.highlight ? 'approach' : id} labelledBy={`${id}-h`}>
        {block.highlight && (
          <h2 id={`${id}-h`} className="statement-title">
            {heading}
          </h2>
        )}
        <div className="grid grid--top">
          <div className="span-6 cta-words">{words}</div>
          <figure className="quote proof proof--panel span-6 start-7">
            <blockquote>{block.quote}</blockquote>
            <figcaption className="person">
              <span>
                <span className="person__name">{block.quoteAuthor}</span>
              </span>
            </figcaption>
            {block.quoteLinkUrl && (
              <a className="link" href={block.quoteLinkUrl} target="_blank" rel="noopener noreferrer">
                {block.quoteLinkText}
              </a>
            )}
          </figure>
        </div>
      </Section>
    );
  }

  if (block.image) {
    return (
      <Section id={id} labelledBy={`${id}-h`}>
        <div className="grid grid--top">
          <div className="span-6 cta-words">{words}</div>
          <div className="frame frame--photo cta-photo span-6 start-7">
            <img className="frame__img" src={block.image} alt={block.imageAlt || ''} loading="lazy" />
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section id={id} labelledBy={`${id}-h`}>
      <div className="grid grid--top">
        <div className="span-5 section-head">
          <h2 id={`${id}-h`}>{block.title}</h2>
        </div>
        <div className="span-7 start-6 cta-words">{rest}</div>
      </div>
    </Section>
  );
};

export default CTASectionBlock;
