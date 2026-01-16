import { useEffect } from 'react';
import { getSiteConfig } from '../utils/site';

interface SentryConfig {
  dsn: string;
  environment?: string;
  tracesSampleRate?: number;
  beforeSend?: (event: any) => any;
}

interface SentryWindow extends Window {
  Sentry?: {
    init?: (config: SentryConfig) => void;
    captureException: (error: Error, context?: any) => void;
  };
}

/**
 * Check if Sentry DSN is configured
 */
function hasSentryConfig(sentryDsn?: string): boolean {
  return Boolean(sentryDsn);
}

/**
 * Create Sentry script element
 */
function createSentryScript(): HTMLScriptElement {
  const script = document.createElement('script');
  script.src = 'https://browser.sentry-cdn.com/8.40.0/bundle.tracing.min.js';
  script.integrity =
    'sha384-7bqJhXNmMb6I1W2lXK8zJ5zRfKvPvZ6qL2z8v8v8v8v8v8v8v8v8v8v8v8v8v8v8=';
  script.crossOrigin = 'anonymous';
  return script;
}

/**
 * Create Sentry configuration
 */
function createSentryConfig(
  dsn: string,
  environment?: string
): SentryConfig {
  return {
    dsn,
    environment: environment || 'production',
    tracesSampleRate: 0.1, // 10% of transactions
    beforeSend(event: any) {
      // Don't send errors in development
      if (import.meta.env.DEV) {
        return null;
      }
      return event;
    },
  };
}

/**
 * Initialize Sentry after script loads
 */
function initializeSentry(
  dsn: string,
  environment?: string
): void {
  const windowWithSentry = window as unknown as SentryWindow;
  if (windowWithSentry.Sentry?.init) {
    const config = createSentryConfig(dsn, environment);
    windowWithSentry.Sentry.init(config);
  }
}

/**
 * Load and initialize Sentry
 */
function loadAndInitializeSentry(
  dsn: string,
  environment?: string
): void {
  const script = createSentryScript();
  script.onload = () => {
    initializeSentry(dsn, environment);
  };
  document.head.appendChild(script);
}

const SentryInit: React.FC = () => {
  const siteConfig = getSiteConfig();

  useEffect(() => {
    const sentryDsn = siteConfig.errorTracking?.sentryDsn;
    if (!hasSentryConfig(sentryDsn)) {
      return;
    }

    if (!sentryDsn) {
      return;
    }

    loadAndInitializeSentry(
      sentryDsn,
      siteConfig.errorTracking?.environment
    );
  }, [siteConfig.errorTracking]);

  return null;
};

declare global {
  interface Window {
    Sentry?: {
      init?: (config: {
        dsn: string;
        environment?: string;
        tracesSampleRate?: number;
        beforeSend?: (event: any) => any;
      }) => void;
      captureException: (error: Error, context?: any) => void;
    };
  }
}

export default SentryInit;
