import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { PageContent } from '../types';
import { getSiteConfig } from '../utils/site';
import { getCanonicalUrl } from '../utils/routes';

interface SEOProps {
  page?: PageContent;
}

interface SchemaData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

/**
 * Get page title from page or fallback to site default
 */
function getPageTitle(
  page: PageContent | undefined,
  defaultTitle: string
): string {
  return page?.seo?.title || page?.title || defaultTitle;
}

/**
 * Get page description from page or fallback to site default
 */
function getPageDescription(
  page: PageContent | undefined,
  defaultDescription: string
): string {
  return page?.seo?.description || defaultDescription;
}

/**
 * Update or create a meta tag
 */
export function updateMetaTag(
  name: string,
  content: string,
  property = false
): void {
  const attribute = property ? 'property' : 'name';
  let meta = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

/**
 * Update or create a link tag
 */
function updateLinkTag(rel: string, href: string, type?: string): void {
  let link = document.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    if (type) link.setAttribute('type', type);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/**
 * Update document title
 */
function updateDocumentTitle(title: string): void {
  document.title = title;
}

/**
 * Update basic meta tags
 */
function updateBasicMetaTags(title: string, description: string): void {
  updateMetaTag('description', description);
  updateMetaTag('title', title);
}

/**
 * Update canonical URL
 */
function updateCanonicalUrl(canonicalUrl: string): void {
  updateLinkTag('canonical', canonicalUrl);
}

/**
 * Update RSS/Atom feed links
 */
function updateFeedLinks(): void {
  updateLinkTag('alternate', getCanonicalUrl('/feed.xml'), 'application/rss+xml');
  updateLinkTag('alternate', getCanonicalUrl('/atom.xml'), 'application/atom+xml');
}

/**
 * Extract first image from page sections
 */
function getFirstImageFromSections(sections: PageContent['sections'] | undefined): string | undefined {
  if (!sections) return undefined;

  for (const section of sections) {
    // Check common image block types
    if (section._block === 'image' && section.src) {
      return section.src as string;
    }
    if (section._block === 'about-hero' && section.headshot) {
      return section.headshot as string;
    }
    // Check for nested content in sidebar blocks
    if (section._block === 'sidebar') {
      const sidebarImage = section.sidebar?._block === 'image' ? section.sidebar.src : undefined;
      if (sidebarImage) return sidebarImage as string;
    }
  }

  return undefined;
}

/**
 * Get Open Graph image URL (returns undefined if no image)
 */
function getOpenGraphImage(
  ogImage: string | undefined,
  sections: PageContent['sections'] | undefined
): string | undefined {
  // First try explicit OG image
  if (ogImage) {
    return makeAbsoluteUrl(ogImage);
  }

  // Then try to find first image in sections
  const sectionImage = getFirstImageFromSections(sections);
  if (sectionImage) {
    return makeAbsoluteUrl(sectionImage);
  }

  return undefined;
}

/**
 * Make a URL absolute
 */
function makeAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const baseUrl = getCanonicalUrl('/');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl.replace(/\/$/, '')}${cleanPath}`;
}

/**
 * Update Open Graph meta tags
 */
function updateOpenGraphTags(
  title: string,
  description: string,
  canonicalUrl: string,
  siteName: string,
  ogImage: string | undefined,
  sections: PageContent['sections'] | undefined
): void {
  updateMetaTag('og:title', title, true);
  updateMetaTag('og:description', description, true);
  updateMetaTag('og:type', 'website', true);
  updateMetaTag('og:url', canonicalUrl, true);
  updateMetaTag('og:site_name', siteName, true);

  const imageUrl = getOpenGraphImage(ogImage, sections);
  if (imageUrl) {
    updateMetaTag('og:image', imageUrl, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
  }
}

/**
 * Update Twitter Card meta tags
 */
function updateTwitterCardTags(
  title: string,
  description: string,
  ogImage: string | undefined,
  sections: PageContent['sections'] | undefined
): void {
  const imageUrl = getOpenGraphImage(ogImage, sections);
  updateMetaTag('twitter:card', imageUrl ? 'summary_large_image' : 'summary');
  updateMetaTag('twitter:title', title);
  updateMetaTag('twitter:description', description);

  if (imageUrl) {
    updateMetaTag('twitter:image', imageUrl);
  }
}

/**
 * Get or create structured data script element
 */
function getOrCreateSchemaScript(): HTMLScriptElement {
  let existingSchema = document.querySelector(
    'script[type="application/ld+json"]'
  ) as HTMLScriptElement | null;
  if (!existingSchema) {
    existingSchema = document.createElement('script');
    existingSchema.setAttribute('type', 'application/ld+json');
    document.head.appendChild(existingSchema);
  }
  return existingSchema;
}

/**
 * Create website schema data
 */
function createWebsiteSchema(
  siteName: string,
  defaultDescription: string
): SchemaData {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    description: defaultDescription,
    url: getCanonicalUrl('/'),
    author: {
      '@type': 'Person',
      name: siteName,
    },
  };
}

/**
 * Update structured data
 */
function updateStructuredData(
  siteName: string,
  defaultDescription: string
): void {
  const schemaScript = getOrCreateSchemaScript();
  const schema = createWebsiteSchema(siteName, defaultDescription);
  schemaScript.textContent = JSON.stringify(schema);
}

/**
 * Initialize all SEO meta tags and structured data
 */
function initializeSEO(
  page: PageContent | undefined,
  siteConfig: ReturnType<typeof getSiteConfig>,
  pathname: string
): void {
  const title = getPageTitle(page, siteConfig.seo.defaultTitle);
  const description = getPageDescription(page, siteConfig.seo.defaultDescription);
  const ogImage = page?.seo?.ogImage;
  const sections = page?.sections;
  const canonicalUrl = getCanonicalUrl(pathname);

  updateDocumentTitle(title);
  updateBasicMetaTags(title, description);
  updateCanonicalUrl(canonicalUrl);
  updateFeedLinks();
  updateOpenGraphTags(
    title,
    description,
    canonicalUrl,
    siteConfig.name,
    ogImage,
    sections
  );
  updateTwitterCardTags(title, description, ogImage, sections);
  updateStructuredData(siteConfig.name, siteConfig.seo.defaultDescription);
}

const SEO: React.FC<SEOProps> = ({ page }) => {
  const siteConfig = getSiteConfig();
  const location = useLocation();

  useEffect(() => {
    initializeSEO(page, siteConfig, location.pathname);
  }, [page, siteConfig, location.pathname]);

  return null;
};

export default SEO;
