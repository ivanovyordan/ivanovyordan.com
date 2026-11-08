import { getSiteConfig } from './site';

/** The markdown variant of a route: "/" is "/index.md", "/blog/x" is "/blog/x.md". */
export function getMarkdownPath(path: string): string {
  return path === '/' ? '/index.md' : `${path}.md`;
}

// Utility to get routes for SEO purposes
export function getCanonicalUrl(path: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  // For build time, check environment variable, then site config, then default
  const envUrl = import.meta.env.VITE_SITE_URL as string;
  const siteConfig = getSiteConfig();
  const baseUrl = envUrl || siteConfig.siteUrl || 'https://ivanovyordan.com';
  return `${baseUrl}${path}`;
}
