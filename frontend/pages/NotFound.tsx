import React from 'react';
import Section from '../components/Section';
import SEO from '../components/SEO';
import { buildNotFoundMeta } from '../utils/meta';

const NotFound: React.FC = () => {
  return (
    <>
      <SEO meta={buildNotFoundMeta()} />
      <Section flow className="page-head">
        <div className="section-head">
          <p className="t-label muted">404</p>
          <h1>This page doesn't exist</h1>
          <p>It may have moved, or the link is wrong. The home page and the blog are the places to start.</p>
        </div>
        <div className="btn-row">
          <a className="btn btn--primary" href="/">
            Go to the home page
          </a>
          <a className="btn btn--secondary" href="/blog">
            Read the blog
          </a>
        </div>
      </Section>
    </>
  );
};

export default NotFound;
