import React from 'react';
import { navigation } from '../collections';
import { getFooterConfig, getSiteConfig } from '../utils/site';
import { handleExternalLinkClick, trackBookingClick } from '../utils/analytics';

const Footer: React.FC = () => {
  const footer = getFooterConfig();
  const site = getSiteConfig();
  const year = new Date().getFullYear();
  const pages = navigation.filter((item) => !/^https?:\/\//.test(item.path) && item.path !== '/');
  const elsewhere = [
    ...(site.newsletter ? [{ label: site.newsletter.name, url: site.newsletter.url }] : []),
    ...(site.social || []).map((item) => ({ label: item.label, url: item.url })),
  ];

  return (
    <footer className="footer closing g2m" id="contact" aria-labelledby="close-h" style={{ '--h': 1 } as React.CSSProperties}>
      <div className="wrap">
        <div className="closing__cta close--type">
          <div className="section-head">
            <h2 id="close-h">Book a discovery call</h2>
            <p>Thirty minutes, free. Tell me what you're stuck on and I'll tell you if I can help.</p>
          </div>
          <a
            className="btn btn--primary btn--xl"
            href={site.discoveryCallPage}
            onClick={() => trackBookingClick('footer')}
          >
            Book a discovery call
            <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
              <path className="m-arrow__stem" d="M1 6h8" />
              <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
            </svg>
          </a>
        </div>
        <div className="closing__links">
          <div className="grid">
            <div className="span-6 stack-4">
              <a className="nav__logo" href="/">
                {site.name}
              </a>
              <p className="footer__lede">{footer.copyright.tagline}</p>
            </div>
            <div className="span-3 start-7 footer__col">
              <h3>Pages</h3>
              <ul>
                {pages.map((item) => (
                  <li key={item.path}>
                    <a href={item.path}>{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="span-3 footer__col">
              <h3>Elsewhere</h3>
              <ul>
                {site.email && (
                  <li>
                    <a href={`mailto:${site.email}`}>Email</a>
                  </li>
                )}
                {elsewhere.map((item) => (
                  <li key={item.url}>
                    <a
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
          </div>
          <div className="footer__legal">
            <span>&copy; {year} {footer.copyright.name}</span>
            <span className="footer__links">
              <a href="/privacy">Privacy</a>
              <a href="/tos">Terms</a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
