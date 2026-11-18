import React from 'react';
import { getSiteConfig } from '../utils/site';

/**
 * The analytics consent banner, rendered hidden. consent.ts shows it when the
 * visitor has not answered yet. Without a tracking id there is nothing to ask.
 */
const CookieConsent: React.FC = () => {
  const analytics = getSiteConfig().analytics;
  if (!analytics?.googleAnalyticsId && !analytics?.facebookPixelId) return null;

  return (
    <div className="consent" role="region" aria-label="Analytics cookies" data-consent hidden>
      <p>I use analytics cookies to see which articles help. Okay to turn them on?</p>
      <div className="consent__actions">
        <button type="button" className="btn btn--primary btn--sm" data-consent-choice="accept">
          Allow analytics
        </button>
        <button type="button" className="btn btn--secondary btn--sm" data-consent-choice="decline">
          No thanks
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
