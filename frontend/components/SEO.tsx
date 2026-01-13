import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { PageContent } from '../types';
import { getSiteConfig } from '../utils/site';
import { getCanonicalUrl } from '../utils/routes';

interface SEOProps {
  page?: PageContent;
}

const SEO: React.FC<SEOProps> = ({ page }) => {
  const siteConfig = getSiteConfig();
  const location = useLocation();

  useEffect(() => {
    const title = page?.seo?.title || page?.title || siteConfig.seo.defaultTitle;
    const description = page?.seo?.description || siteConfig.seo.defaultDescription;
    const ogImage = page?.seo?.ogImage;
    const canonicalUrl = getCanonicalUrl(location.pathname);

    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Update or create link tags
    const updateLinkTag = (rel: string, href: string, type?: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        if (type) link.setAttribute('type', type);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('title', title);

    // Canonical URL
    updateLinkTag('canonical', canonicalUrl);

    // RSS/Atom feeds
    updateLinkTag('alternate', getCanonicalUrl('/feed.xml'), 'application/rss+xml');
    updateLinkTag('alternate', getCanonicalUrl('/atom.xml'), 'application/atom+xml');

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:url', canonicalUrl, true);
    updateMetaTag('og:site_name', siteConfig.name, true);
    if (ogImage) {
      updateMetaTag('og:image', ogImage, true);
      updateMetaTag('og:image:width', '1200', true);
      updateMetaTag('og:image:height', '630', true);
    } else {
      // Use default OG image if available
      const defaultOgImage = `${getCanonicalUrl('/')}/images/og-default.jpg`;
      updateMetaTag('og:image', defaultOgImage, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    if (ogImage) {
      updateMetaTag('twitter:image', ogImage);
    } else {
      const defaultOgImage = `${getCanonicalUrl('/')}/images/og-default.jpg`;
      updateMetaTag('twitter:image', defaultOgImage);
    }

    // Structured Data (JSON-LD)
    let existingSchema = document.querySelector('script[type="application/ld+json"]');
    if (!existingSchema) {
      existingSchema = document.createElement('script');
      existingSchema.setAttribute('type', 'application/ld+json');
      document.head.appendChild(existingSchema);
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.name,
      description: siteConfig.seo.defaultDescription,
      url: getCanonicalUrl('/'),
      author: {
        '@type': 'Person',
        name: siteConfig.name,
      },
    };

    existingSchema.textContent = JSON.stringify(schema);
  }, [page, siteConfig, location.pathname]);

  return null;
};

export default SEO;
