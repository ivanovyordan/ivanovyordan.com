
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Analytics from './components/Analytics';
import CookieConsent from './components/CookieConsent';
import ErrorBoundary from './components/ErrorBoundary';
import SentryInit from './components/SentryInit';
import SkipLink from './components/SkipLink';
import Blog from './pages/Blog';
import PostDetail from './pages/PostDetail';
import Page from './pages/Page';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SentryInit />
      <Router>
        <Analytics />
        <CookieConsent />
        <SkipLink />
        <div className="flex flex-col min-h-screen">
        <Header />
        <main id="main-content" className="flex-grow" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Page />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<PostDetail />} />
            {/* Reserved routes - these won't be caught by dynamic pages */}
            <Route path="/404" element={<NotFound />} />
            {/* Dynamic pages from Pages CMS - handles /about, /contact, /coaching, /course, and any new pages */}
            <Route path="/:slug" element={<Page />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </main>
        <Footer />
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
