
import React from 'react';
import { Link } from 'react-router-dom';
import Container from '../components/Container';

const NotFound: React.FC = () => {
  return (
    <Container className="py-32 text-center">
      <h1 className="text-8xl font-serif font-bold text-gray-100 dark:text-zinc-900 mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-6 dark:text-white">Page Not Found</h2>
      <p className="text-gray-500 dark:text-zinc-500 mb-12 max-w-sm mx-auto">
        The page you are looking for doesn't exist or has been moved to a new location.
      </p>
      <Link 
        to="/" 
        className="inline-block bg-black dark:bg-white text-white dark:text-black px-10 py-4 font-bold hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors uppercase tracking-widest text-xs"
      >
        Return Home
      </Link>
    </Container>
  );
};

export default NotFound;
