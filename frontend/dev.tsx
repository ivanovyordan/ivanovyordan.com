import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

/**
 * Dev server only. The production site ships no React: its pages are the HTML that
 * scripts/prerender.mjs writes. The dev server serves an empty root, so this renders
 * the app in the browser, then starts client.ts, which expects the page to be there.
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

requestAnimationFrame(() => {
  import('./client');
});
