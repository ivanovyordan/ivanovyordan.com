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

const Analytics: React.FC = () => {
  const siteConfig = getSiteConfig();
  const location = useLocation();

  useEffect(() => {
    // Check cookie consent
    const consent = localStorage.getItem('cookieConsent');
    const hasConsent = consent ? JSON.parse(consent).analytics === true : false;

    if (!hasConsent) {
      return; // Don't load analytics without consent
    }

    // Google Analytics 4
    if (siteConfig.analytics?.googleAnalyticsId) {
      const gaId = siteConfig.analytics.googleAnalyticsId;

      // Load gtag script if not already loaded
      if (!window.gtag) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
          window.dataLayer!.push(args);
        }
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', gaId, {
          page_path: location.pathname,
        });
      } else {
        // Update page path on navigation
        window.gtag('config', gaId, {
          page_path: location.pathname,
        });
      }
    }

    // Facebook Pixel
    if (siteConfig.analytics?.facebookPixelId) {
      const pixelId = siteConfig.analytics.facebookPixelId;

      // Load Facebook Pixel if not already loaded
      if (!window.fbq) {
        const fbScript = document.createElement('script');
        fbScript.innerHTML = `
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
        document.head.appendChild(fbScript);
      } else {
        // Track page view on navigation
        window.fbq('track', 'PageView');
      }
    }
  }, [location.pathname, siteConfig.analytics]);

  // Re-run when consent changes (handled by page reload in CookieConsent)

  return null;
};

export default Analytics;
