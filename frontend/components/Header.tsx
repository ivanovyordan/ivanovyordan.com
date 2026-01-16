
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navigation } from '../collections';
import { getHeaderConfig } from '../utils/site';
import Container from './Container';
import { handleExternalLinkClick } from '../utils/analytics';

const Header: React.FC = () => {
  const location = useLocation();
  const headerConfig = getHeaderConfig();

  return (
    <header className="py-8 border-b border-gray-100 dark:border-zinc-900">
      <Container size="lg" className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Link
          to={headerConfig.branding.link}
          className="text-xl font-bold tracking-tight hover:opacity-70 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        >
          {headerConfig.branding.text}{' '}
          <span className="text-gray-500 dark:text-zinc-400">{headerConfig.branding.suffix}</span>
        </Link>
        <nav className="flex gap-6 items-center">
          {navigation.map((item) => {
            const isExternal = item.path.startsWith('http://') || item.path.startsWith('https://');
            const isActive = !isExternal && location.pathname === item.path;

            if (isExternal) {
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={() => handleExternalLinkClick(item.path, item.label)}
                  className="text-sm font-medium transition-colors focus:outline-none focus:underline text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </a>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors focus:outline-none focus:underline ${
                  isActive
                    ? 'text-black dark:text-white'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </Container>
    </header>
  );
};

export default Header;
