import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Analytics from './components/Analytics';
import CookieConsent from './components/CookieConsent';
import ErrorBoundary from './components/ErrorBoundary';
import Blog from './pages/Blog';
import PostDetail from './pages/PostDetail';
import Page from './pages/Page';
import NotFound from './pages/NotFound';

/**
 * Everything inside the router. The browser wraps it in BrowserRouter
 * (below); the build-time pre-render wraps it in StaticRouter
 * (entry-server.tsx). Both must render the same tree for hydration.
 */
export const AppShell: React.FC = () => (
  <ErrorBoundary>
    <Analytics />
    <>
      <Header />
      <main id="top">
        <Routes>
          <Route path="/" element={<Page />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<PostDetail />} />
          {/* Reserved routes - these won't be caught by dynamic pages */}
          <Route path="/404" element={<NotFound />} />
          {/* Dynamic pages from Pages CMS - handles /about, /contact, /coaching, and any new pages */}
          <Route path="/:slug" element={<Page />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </main>
      <Footer />
      <CookieConsent />
    </>
  </ErrorBoundary>
);

const App: React.FC = () => {
  return (
    <Router>
      <AppShell />
    </Router>
  );
};

export default App;
