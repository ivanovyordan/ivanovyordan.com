import React from 'react';
import type { NewsletterBlock as NewsletterBlockType } from '../../types';
import Section from '../Section';

interface NewsletterBlockProps {
  block: NewsletterBlockType;
  centered?: boolean;
}

const NewsletterBlock: React.FC<NewsletterBlockProps> = ({ block, centered }) => {
  if (centered) {
    return (
      <Section id="course" className="newsletter--centered" labelledBy="course-h">
        <div className="section-head">
          <h2 id="course-h">{block.title}</h2>
          <p>{block.description}</p>
        </div>
        <iframe
          className="substack-embed"
          title="Subscribe by email"
          src="https://www.datagibberish.com/embed?transparent=1"
          width="480"
          height="150"
          loading="lazy"
        />
      </Section>
    );
  }
  return (
    <Section id="course" labelledBy="course-h">
      <div className="grid grid--top">
        <div className="span-6">
          <div className="section-head">
            <h2 id="course-h">{block.title}</h2>
            <p>{block.description}</p>
          </div>
          <iframe
            className="substack-embed"
            title="Subscribe by email"
            src="https://www.datagibberish.com/embed?transparent=1"
            width="480"
            height="150"
            loading="lazy"
          />
        </div>
        <div className="span-6 start-7">
          {block.quote && (
            <figure className="quote proof proof--panel">
              <blockquote>{block.quote}</blockquote>
              {block.quoteAuthor && (
                <figcaption className="person">
                  <span>
                    <span className="person__name">{block.quoteAuthor}</span>
                  </span>
                </figcaption>
              )}
            </figure>
          )}
        </div>
      </div>
    </Section>
  );
};

export default NewsletterBlock;
