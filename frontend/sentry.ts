import * as Sentry from '@sentry/browser';
import { getSiteConfig } from './utils/site';

/**
 * Error tracking, loaded on demand by client.ts: when the browser is idle, or at
 * the first error. Errors that happened before it loaded are replayed from the
 * buffer client.ts keeps.
 */
export function initSentry(buffered: Array<ErrorEvent | PromiseRejectionEvent>): void {
  const errorTracking = getSiteConfig().errorTracking;
  if (!errorTracking?.sentryDsn) return;

  Sentry.init({
    dsn: errorTracking.sentryDsn,
    environment: import.meta.env.DEV ? 'development' : errorTracking.environment || 'production',
    sendDefaultPii: false,
    release: import.meta.env.VITE_SENTRY_RELEASE,
  });

  for (const event of buffered) {
    Sentry.captureException('reason' in event ? event.reason : (event.error ?? event.message));
  }
}
