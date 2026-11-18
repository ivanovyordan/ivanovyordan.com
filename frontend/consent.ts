import { getSiteConfig } from './utils/site';
import { hasAnalyticsConsent } from './utils/analytics';

/**
 * Analytics consent: shows the banner (CookieConsent.tsx) until the visitor
 * answers, and loads Google Analytics and the Facebook Pixel only after a yes.
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

const CONSENT_KEY = 'cookieConsent';

function hasAnswered(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) !== null;
  } catch {
    return false;
  }
}

function saveConsent(analytics: boolean): void {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics, timestamp: new Date().toISOString() }));
  } catch (error) {
    console.warn('Failed to save cookie consent:', error);
  }
}

function loadGoogleAnalytics(gaId: string): void {
  if (window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: any[]) {
    window.dataLayer!.push(args);
  };
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
  window.gtag('js', new Date());
  window.gtag('config', gaId, { page_path: window.location.pathname });
}

function loadFacebookPixel(pixelId: string): void {
  if (window.fbq) return;
  const script = document.createElement('script');
  script.innerHTML = `
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
  document.head.appendChild(script);
}

function loadAnalytics(): void {
  const { googleAnalyticsId, facebookPixelId } = getSiteConfig().analytics ?? {};
  if (googleAnalyticsId) loadGoogleAnalytics(googleAnalyticsId);
  if (facebookPixelId) loadFacebookPixel(facebookPixelId);
}

export function initConsent(): void {
  if (hasAnalyticsConsent()) {
    loadAnalytics();
    return;
  }

  const banner = document.querySelector<HTMLElement>('[data-consent]');
  if (!banner || hasAnswered()) return;
  banner.hidden = false;

  banner.addEventListener('click', (event) => {
    const choice = (event.target as Element).closest<HTMLElement>('[data-consent-choice]')?.dataset.consentChoice;
    if (!choice) return;
    const accepted = choice === 'accept';
    saveConsent(accepted);
    banner.hidden = true;
    if (accepted) loadAnalytics();
  });
}
