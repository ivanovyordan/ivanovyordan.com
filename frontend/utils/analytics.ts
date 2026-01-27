/**
 * Analytics tracking utility
 * Respects cookie consent and provides type-safe event tracking
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

interface CookieConsent {
  analytics?: boolean;
}

/**
 * Check if user has given consent for analytics
 */
function hasAnalyticsConsent(): boolean {
  try {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      return false;
    }

    const parsed = JSON.parse(consent) as CookieConsent;
    // Guard against null/undefined parsed values and missing analytics property
    if (!parsed || typeof parsed !== 'object') {
      return false;
    }
    return parsed.analytics === true;
  } catch {
    // Handle any errors: localStorage disabled, JSON parse errors, etc.
    return false;
  }
}

/**
 * Track a custom Google Analytics event
 * Only tracks if user has given consent for analytics
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
): void {
  if (!hasAnalyticsConsent()) {
    return;
  }

  if (!window.gtag) {
    // Analytics not initialized yet, queue the event
    if (!window.dataLayer) {
      window.dataLayer = [];
    }
    window.dataLayer.push({
      event: eventName,
      ...eventParams,
    });
    return;
  }

  window.gtag('event', eventName, eventParams);
}

/**
 * Track newsletter subscription
 */
export function trackNewsletterSubscribe(): void {
  trackEvent('newsletter_subscribe');
}

/**
 * Track booking/CTA button click
 */
export function trackBookingClick(location?: string): void {
  trackEvent('booking_click', {
    button_location: location || 'unknown',
  });
}

/**
 * Track AI assistant question
 */
export function trackAIQuestionAsked(): void {
  trackEvent('ai_question_asked');
}

/**
 * Track external link click
 */
export function trackExternalLinkClick(url: string, linkText?: string): void {
  trackEvent('external_link_click', {
    link_url: url,
    link_text: linkText,
  });
}

/**
 * Track blog post view
 */
export function trackBlogPostView(postId: string, postTitle?: string): void {
  trackEvent('blog_post_view', {
    post_id: postId,
    post_title: postTitle,
  });
}

/**
 * Track social share (optional - if you want to add this later)
 */
export function trackSocialShare(platform: string, url?: string): void {
  trackEvent('social_share', {
    platform,
    share_url: url,
  });
}

/**
 * Check if a URL is external (not same origin)
 */
function isExternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin !== window.location.origin;
  } catch {
    // If URL parsing fails, assume it's external if it starts with http
    return url.startsWith('http://') || url.startsWith('https://');
  }
}

/**
 * Handle external link click tracking
 * Call this in onClick handlers for links that might be external
 */
export function handleExternalLinkClick(
  url: string,
  linkText?: string
): void {
  if (isExternalUrl(url)) {
    trackExternalLinkClick(url, linkText);
  }
}
