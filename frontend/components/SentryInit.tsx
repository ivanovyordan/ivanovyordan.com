import { useEffect } from 'react';
import { getSiteConfig } from '../utils/site';

const SentryInit: React.FC = () => {
  const siteConfig = getSiteConfig();

  useEffect(() => {
    if (siteConfig.errorTracking?.sentryDsn) {
      // Load Sentry SDK
      const script = document.createElement('script');
      script.src = 'https://browser.sentry-cdn.com/8.40.0/bundle.tracing.min.js';
      script.integrity =
        'sha384-7bqJhXNmMb6I1W2lXK8zJ5zRfKvPvZ6qL2z8v8v8v8v8v8v8v8v8v8v8v8v8v8v8=';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (window.Sentry?.init && siteConfig.errorTracking?.sentryDsn) {
          window.Sentry.init({
            dsn: siteConfig.errorTracking.sentryDsn,
            environment: siteConfig.errorTracking.environment || 'production',
            tracesSampleRate: 0.1, // 10% of transactions
            beforeSend(event: any) {
              // Don't send errors in development
              if (import.meta.env.DEV) {
                return null;
              }
              return event;
            },
          });
        }
      };
      document.head.appendChild(script);
    }
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
