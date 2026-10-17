import { useEffect } from 'react';
import { applyRouteMeta, type RouteMeta } from '../utils/meta';

interface SEOProps {
  meta: RouteMeta;
}

/**
 * Keeps <head> in step with the route after hydration and on client-side
 * navigation. The build-time pre-render writes the same tags into the HTML,
 * so a crawler without JavaScript sees them too.
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
