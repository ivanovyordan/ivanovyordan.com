import React from 'react';

const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-black dark:focus:bg-white focus:text-white dark:focus:text-black focus:font-bold focus:rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white"
    >
      Skip to main content
    </a>
  );
};

export default SkipLink;
