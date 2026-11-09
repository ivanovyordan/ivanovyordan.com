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
    sendDefaultPii: false,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    tracesSampleRate: 0.1, // 10% of transactions
  });
}

// A page opened as its own file (/about.html, a static preview) is the same page as /about.
const { pathname } = window.location;
if (pathname.endsWith('.html')) {
  const clean = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  window.history.replaceState(null, '', clean + window.location.search + window.location.hash);
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
  ReactDOM.hydrateRoot(rootElement, app, {
    onRecoverableError: Sentry.reactErrorHandler(),
  });
} else {
  ReactDOM.createRoot(rootElement).render(app);
  // Dev only: the kit's scripts start once the page has rendered (see vite.config.ts).
  requestAnimationFrame(() => {
    // Script tags, not import(): Vite refuses to import files from /public.
    const load = (srcs: string[]) => {
      const [src, ...rest] = srcs;
      if (!src) return;
      const tag = document.createElement('script');
      tag.type = 'module';
      tag.src = src;
      tag.onload = () => load(rest);
      document.body.appendChild(tag);
    };
    load(['/kit/system.js', '/kit/motion/motion.js', '/kit/layout/layout.js']);
  });
}