import React from 'react';
import { useLocation } from 'react-router-dom';
import { navigation } from '../collections';
import { getSiteConfig } from '../utils/site';
import { handleExternalLinkClick, trackBookingClick } from '../utils/analytics';

const Header: React.FC = () => {
  const location = useLocation();
  const site = getSiteConfig();
  // Pages are pre-rendered, so every link is a plain one: each page loads with
  // the kit's scripts (menu, motion) running on its own markup.
  const links = navigation;

  return (
    <header className="nav nav--split">
      <div className="wrap nav__bar">
        <a className="skip-link" href="#top">Skip to content</a>
        <nav className="nav__links" aria-label="Main">
          {links.map((item) => {
            const external = /^https?:\/\//.test(item.path);
            const current = !external && location.pathname === item.path;
            return (
              <div className="nav__item" key={item.path}>
                <a
                  className="nav__link"
                  href={item.path}
                  aria-current={current ? 'page' : undefined}
                  onClick={external ? () => handleExternalLinkClick(item.path, item.label) : undefined}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {item.label}
                </a>
              </div>
            );
          })}
        </nav>
        <a className="nav__logo" href="/">
          {site.name}
        </a>
        <div className="nav__actions">
          <a
            className="btn btn--primary"
            href={site.discoveryCallPage}
            onClick={() => trackBookingClick('header')}
          >
            Book a discovery call
          </a>
        </div>
        <button className="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M2 5h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
