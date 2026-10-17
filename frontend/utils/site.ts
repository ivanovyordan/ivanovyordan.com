import type { HeaderConfig, FooterConfig, SiteConfig } from '../types';
import headerData from '../content/header.json';
import footerData from '../content/footer.json';
import siteData from '../content/site.json';

export function getHeaderConfig(): HeaderConfig {
  return headerData as HeaderConfig;
}

export function getFooterConfig(): FooterConfig {
  return footerData as FooterConfig;
}

export function getSiteConfig(): SiteConfig {
  return siteData as SiteConfig;
}

/** Default <title>: the SEO override if set, otherwise "name - tagline". */
export function getDefaultTitle(): string {
  const site = getSiteConfig();
  if (site.seo?.defaultTitle) return site.seo.defaultTitle;
  return site.tagline ? `${site.name} - ${site.tagline}` : site.name;
}

/** Default meta description: the SEO override if set, otherwise the site description. */
export function getDefaultDescription(): string {
  const site = getSiteConfig();
  return site.seo?.defaultDescription || site.description || "";
}
