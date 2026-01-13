import React, { Component, ErrorInfo, ReactNode } from 'react';
import { getSiteConfig } from '../utils/site';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const siteConfig = getSiteConfig();

    // Log to console in development
    console.error('Error caught by boundary:', error, errorInfo);

    // Send to Sentry if configured
    if (siteConfig.errorTracking?.sentryDsn && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold mb-4 dark:text-white">Something went wrong</h1>
            <p className="text-gray-700 dark:text-zinc-300 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-medium hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void;
    };
  }
}

export default ErrorBoundary;
