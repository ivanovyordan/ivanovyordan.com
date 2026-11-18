import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import Blog from './pages/Blog';
import PostDetail from './pages/PostDetail';
import Page from './pages/Page';
import NotFound from './pages/NotFound';

/**
 * Everything inside the router. The build-time pre-render wraps it in
 * StaticRouter (entry-server.tsx) and ships the result as plain HTML; only the
 * dev server runs it in the browser, inside BrowserRouter (below, dev.tsx).
 */
export const AppShell: React.FC = () => (
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
);

const App: React.FC = () => {
  return (
    <Router>
      <AppShell />
    </Router>
  );
};

export default App;
