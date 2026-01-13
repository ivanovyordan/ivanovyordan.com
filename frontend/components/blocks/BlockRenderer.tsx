import React from 'react';
import type { PageBlock } from '../../types';
import HeroBlock from './HeroBlock';
import AboutHeroBlock from './AboutHeroBlock';
import TextBlock from './TextBlock';
import HeadingBlock from './HeadingBlock';
import HighlightBoxBlock from './HighlightBoxBlock';
import FeaturesGridBlock from './FeaturesGridBlock';
import CTASectionBlock from './CTASectionBlock';
import NewsletterBlock from './NewsletterBlock';
import TestimonialBlock from './TestimonialBlock';
import ContactInfoBlock from './ContactInfoBlock';
import GeminiAssistantBlock from './GeminiAssistantBlock';
import VideoBlock from './VideoBlock';
import CourseModulesBlock from './CourseModulesBlock';
import HeroWithVideoBlock from './HeroWithVideoBlock';
import LatestPostsBlock from './LatestPostsBlock';
import ImageBlock from './ImageBlock';
import ColumnsBlock from './ColumnsBlock';
import SidebarBlock from './SidebarBlock';
import AccordionBlock from './AccordionBlock';

interface BlockRendererProps {
  block: PageBlock;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ block }) => {
  switch (block._block) {
    case 'hero':
      return <HeroBlock block={block} />;
    case 'about-hero':
      return <AboutHeroBlock block={block} />;
    case 'text':
      return <TextBlock block={block} />;
    case 'heading':
      return <HeadingBlock block={block} />;
    case 'highlight-box':
      return <HighlightBoxBlock block={block} />;
    case 'features-grid':
      return <FeaturesGridBlock block={block} />;
    case 'cta-section':
      return <CTASectionBlock block={block} />;
    case 'newsletter':
      return <NewsletterBlock block={block} />;
    case 'testimonial':
      return <TestimonialBlock block={block} />;
    case 'contact-info':
      return <ContactInfoBlock block={block} />;
    case 'gemini-assistant':
      return <GeminiAssistantBlock block={block} />;
    case 'video':
      return <VideoBlock block={block} />;
    case 'course-modules':
      return <CourseModulesBlock block={block} />;
    case 'hero-with-video':
      return <HeroWithVideoBlock block={block} />;
    case 'latest-posts':
      return <LatestPostsBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'columns':
      return <ColumnsBlock block={block} />;
    case 'sidebar':
      return <SidebarBlock block={block} />;
    case 'accordion':
      return <AccordionBlock block={block} />;
    default:
      return null;
  }
};

export default BlockRenderer;
