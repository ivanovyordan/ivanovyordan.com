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
