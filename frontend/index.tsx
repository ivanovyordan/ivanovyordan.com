import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App';
import { getSiteConfig } from './utils/site';

// Initialize Sentry before rendering the app
const siteConfig = getSiteConfig();
const sentryDsn = siteConfig.errorTracking?.sentryDsn;

if (sentryDsn) {
  // Determine environment - use 'development' in dev mode, otherwise use config
  const environment = import.meta.env.DEV
    ? 'development'
    : siteConfig.errorTracking?.environment || 'production';

  Sentry.init({
    dsn: sentryDsn,
    environment,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    tracesSampleRate: 0.1, // 10% of transactions
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Production HTML is pre-rendered at build time (scripts/prerender.mjs), so
// the root already holds the page: hydrate it. The dev server ships an empty
// root and renders from scratch.
if (rootElement.children.length > 0) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}