import React from 'react';
import type { TestimonialBlock as TestimonialBlockType } from '../../types';

interface TestimonialBlockProps {
  block: TestimonialBlockType;
}

/** One quote. Page.tsx groups neighbouring testimonials into one section. */
const TestimonialBlock: React.FC<TestimonialBlockProps> = ({ block }) => (
  <figure className="quote">
    <blockquote>{block.quote}</blockquote>
    <figcaption className="person">
      <span>
        <span className="person__name">{block.author}</span>
      </span>
    </figcaption>
  </figure>
);

export default TestimonialBlock;
