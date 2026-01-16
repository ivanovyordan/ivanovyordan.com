import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSiteConfig } from '../utils/site';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

interface CookieConsent {
  analytics?: boolean;
}

/**
 * Check if user has given consent for analytics
 */
function hasAnalyticsConsent(): boolean {
  const consent = localStorage.getItem('cookieConsent');
  if (!consent) {
    return false;
  }

  try {
    const parsed = JSON.parse(consent) as CookieConsent;
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

/**
 * Initialize Google Analytics data layer
 */
function initializeDataLayer(): void {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
}

/**
 * Create gtag function
 */
function createGtagFunction(): (...args: any[]) => void {
  return function gtag(...args: any[]) {
    window.dataLayer!.push(args);
  };
}

/**
 * Load Google Analytics script
 */
function loadGoogleAnalyticsScript(gaId: string): void {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
}

/**
 * Initialize Google Analytics
 */
function initializeGoogleAnalytics(gaId: string, pagePath: string): void {
  if (!window.gtag) {
    initializeDataLayer();
    window.gtag = createGtagFunction();
    loadGoogleAnalyticsScript(gaId);
    window.gtag('js', new Date());
  }

  window.gtag('config', gaId, {
    page_path: pagePath,
  });
}

/**
 * Create Facebook Pixel script content
 */
function createFacebookPixelScript(pixelId: string): string {
  return `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
}

/**
 * Load Facebook Pixel script
 */
function loadFacebookPixelScript(pixelId: string): void {
  const fbScript = document.createElement('script');
  fbScript.innerHTML = createFacebookPixelScript(pixelId);
  document.head.appendChild(fbScript);
}

/**
 * Initialize Facebook Pixel
 */
function initializeFacebookPixel(pixelId: string): void {
  if (!window.fbq) {
    loadFacebookPixelScript(pixelId);
  } else {
    // Track page view on navigation
    window.fbq('track', 'PageView');
  }
}

/**
 * Setup Google Analytics if configured
 */
function setupGoogleAnalytics(
  googleAnalyticsId: string | undefined,
  pagePath: string
): void {
  if (googleAnalyticsId) {
    initializeGoogleAnalytics(googleAnalyticsId, pagePath);
  }
}

/**
 * Setup Facebook Pixel if configured
 */
function setupFacebookPixel(facebookPixelId: string | undefined): void {
  if (facebookPixelId) {
    initializeFacebookPixel(facebookPixelId);
  }
}

/**
 * Initialize all analytics services
 */
function initializeAnalytics(
  googleAnalyticsId: string | undefined,
  facebookPixelId: string | undefined,
  pagePath: string
): void {
  setupGoogleAnalytics(googleAnalyticsId, pagePath);
  setupFacebookPixel(facebookPixelId);
}

const Analytics: React.FC = () => {
  const siteConfig = getSiteConfig();
  const location = useLocation();

  useEffect(() => {
    if (!hasAnalyticsConsent()) {
      return; // Don't load analytics without consent
    }

    initializeAnalytics(
      siteConfig.analytics?.googleAnalyticsId,
      siteConfig.analytics?.facebookPixelId,
      location.pathname
    );
  }, [location.pathname, siteConfig.analytics]);

  return null;
};

export default Analytics;
