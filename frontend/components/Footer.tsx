
import React from 'react';
import { Link } from 'react-router-dom';
import { getFooterConfig, getSiteConfig } from '../utils/site';
import Container from './Container';

const Footer: React.FC = () => {
  const footerConfig = getFooterConfig();
  const siteConfig = getSiteConfig();
  const currentYear = new Date().getFullYear();

  // Use site.json social links as single source of truth
  const socialLinks = siteConfig.social || [];

  return (
    <footer className="py-12 mt-20 border-t border-gray-100 dark:border-zinc-900 bg-gray-50/30 dark:bg-zinc-900/10">
      <Container size="lg" className="text-center">
        <p className="text-gray-600 dark:text-zinc-400 text-sm">
          &copy; {currentYear} {footerConfig.copyright.name}
          {footerConfig.copyright.tagline && `. ${footerConfig.copyright.tagline}`}
        </p>
        {socialLinks.length > 0 && (
          <div className="mt-4 flex justify-center gap-6">
            {socialLinks.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                className="text-xs text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white uppercase tracking-widest font-bold focus:outline-none focus:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
        <div className="mt-3 flex justify-center items-center gap-4">
          <Link
            to="/privacy"
            className="text-[10px] text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 uppercase tracking-widest font-bold focus:outline-none focus:underline"
          >
            Privacy Policy
          </Link>
          <span className="text-gray-400 dark:text-zinc-600 text-[10px]" aria-hidden="true">|</span>
          <Link
            to="/tos"
            className="text-[10px] text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 uppercase tracking-widest font-bold focus:outline-none focus:underline"
          >
            Terms of Service
          </Link>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
