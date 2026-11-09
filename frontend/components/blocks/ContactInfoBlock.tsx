import React from 'react';
import type { ContactInfoBlock as ContactInfoBlockType } from '../../types';
import { getSiteConfig } from '../../utils/site';
import { trackBookingClick, handleExternalLinkClick } from '../../utils/analytics';
import Section from '../Section';

interface ContactInfoBlockProps {
  block: ContactInfoBlockType;
}

const ContactInfoBlock: React.FC<ContactInfoBlockProps> = ({ block }) => {
  const siteConfig = getSiteConfig();
  // Use site.json as single source of truth, with block data as fallback
  const email = siteConfig.email || block.email;
  const socialLinks = siteConfig.social || block.social || [];

  const bookHref = block.officeHours?.url || siteConfig.discoveryCallPage || siteConfig.discoveryCallUrl || '#';
  const external = /^https?:\/\//i.test(bookHref);

  return (
    <Section id="reach" labelledBy="reach-h">
      <div className="section-head">
        <h2 id="reach-h">Other ways to reach me</h2>
      </div>
      <div className="grid grid--top">
        {email && (
          <div className="span-4 stack-4">
            <h3 className="t-label muted">Email</h3>
            <p>
              <a className="link" href={`mailto:${email}`}>
                Email me
              </a>
            </p>
          </div>
        )}
        {socialLinks.length > 0 && (
          <div className="span-4 stack-4">
            <h3 className="t-label muted">Find me online</h3>
            <ul className="stack-2">
              {socialLinks.map((item) => (
                <li key={item.url}>
                  <a
                    className="link"
                    href={item.url}
                    onClick={() => handleExternalLinkClick(item.url, item.label)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {block.officeHours && (
          <div className="span-4 stack-4">
            <h3 className="t-label muted">Discovery call</h3>
            {block.officeHours.description && <p>{block.officeHours.description}</p>}
            {block.officeHours.buttonText && (
              <a
                href={bookHref}
                onClick={() => trackBookingClick('contact_info')}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="btn btn--secondary"
              >
                {block.officeHours.buttonText}
              </a>
            )}
          </div>
        )}
      </div>
    </Section>
  );
};

export default ContactInfoBlock;
