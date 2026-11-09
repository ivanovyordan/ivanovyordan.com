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
  try {
    const consent = localStorage.getItem('cookieConsent');
    return consent !== null;
  } catch {
    // Handle cases where localStorage is disabled or throws
    return false;
  }
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
  try {
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
  } catch (error) {
    // Handle cases where localStorage is disabled or quota exceeded
    console.warn('Failed to save cookie consent:', error);
  }
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
    <div className="consent" role="region" aria-label="Analytics cookies">
      <p>I use analytics cookies to see which articles help. Okay to turn them on?</p>
      <div className="consent__actions">
        <button type="button" className="btn btn--primary btn--sm" onClick={handleAccept}>
          Allow analytics
        </button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={handleDecline}>
          No thanks
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
