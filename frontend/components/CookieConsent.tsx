import React, { useState, useEffect } from 'react';
import { getSiteConfig } from '../utils/site';

interface CookieConsentData {
  analytics: boolean;
  timestamp: string;
}

/**
 * Check if user has already given consent
 */
function hasConsent(): boolean {
  const consent = localStorage.getItem('cookieConsent');
  return consent !== null;
}

/**
 * Create consent object
 */
function createConsentObject(analytics: boolean): CookieConsentData {
  return {
    analytics,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Save consent to localStorage
 */
function saveConsent(consent: CookieConsentData): void {
  localStorage.setItem('cookieConsent', JSON.stringify(consent));
}

/**
 * Check if analytics are configured
 */
function hasAnalyticsConfigured(
  googleAnalyticsId?: string,
  facebookPixelId?: string
): boolean {
  return Boolean(googleAnalyticsId || facebookPixelId);
}

/**
 * Handle accept action
 */
function handleAcceptConsent(): void {
  const consent = createConsentObject(true);
  saveConsent(consent);
  // Reload to enable analytics
  window.location.reload();
}

/**
 * Handle decline action
 */
function handleDeclineConsent(): void {
  const consent = createConsentObject(false);
  saveConsent(consent);
}

const CookieConsent: React.FC = () => {
  const siteConfig = getSiteConfig();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!hasConsent()) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    handleAcceptConsent();
    setShowBanner(false);
  };

  const handleDecline = () => {
    handleDeclineConsent();
    setShowBanner(false);
  };

  const hasAnalytics = hasAnalyticsConfigured(
    siteConfig.analytics?.googleAnalyticsId,
    siteConfig.analytics?.facebookPixelId
  );

  if (!showBanner || !hasAnalytics) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 shadow-lg p-4 md:p-6"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3
            id="cookie-consent-title"
            className="text-lg font-bold mb-2 dark:text-white"
          >
            Cookie Consent
          </h3>
          <p
            id="cookie-consent-description"
            className="text-sm text-gray-700 dark:text-zinc-300"
          >
            We use cookies and similar technologies to analyse site usage and
            improve your experience. By clicking "Accept", you consent to our
            use of analytics cookies. You can change your preferences at any
            time.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            aria-label="Decline cookies"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white transition-colors"
            aria-label="Accept cookies"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
