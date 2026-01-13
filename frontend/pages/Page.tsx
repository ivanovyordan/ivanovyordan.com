import React from 'react';
import { useParams } from 'react-router-dom';
import Container from '../components/Container';
import BlockRenderer from '../components/blocks/BlockRenderer';
import SEO from '../components/SEO';
import { getPageBySlug } from '../utils/pages';
import NotFound from './NotFound';

const Page: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  // For root path, use 'home' as slug
  const pageSlug = slug || 'home';
  const page = getPageBySlug(pageSlug);

  if (!page) {
    return <NotFound />;
  }

  // Check if page is published (defaults to published if not specified)
  if (page.published === false) {
    return <NotFound />;
  }

  // Large layout - original design
  const containerSize: 'lg' = 'lg';
  const padding = 'py-16 md:py-24';

  // Render all blocks sequentially - layout blocks handle their own structure
  const renderContent = () => {
    return page.sections.map((block, idx) => <BlockRenderer key={idx} block={block} />);
  };

  const content = renderContent();

  return (
    <>
      <SEO page={page} />
      <Container size={containerSize} className={padding}>
        {content}
      </Container>
    </>
  );
};

export default Page;
