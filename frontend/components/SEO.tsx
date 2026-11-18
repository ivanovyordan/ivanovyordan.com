import { useEffect } from 'react';
import { applyRouteMeta, type RouteMeta } from '../utils/meta';

interface SEOProps {
  meta: RouteMeta;
}

/**
 * Keeps <head> in step with the route in the dev server, which renders in the
 * browser. The build-time pre-render writes the same tags into the HTML, and the
 * production site ships no client React, so this does nothing there.
 */
const SEO: React.FC<SEOProps> = ({ meta }) => {
  const key = JSON.stringify(meta);
  useEffect(() => {
    applyRouteMeta(meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
};

export default SEO;
