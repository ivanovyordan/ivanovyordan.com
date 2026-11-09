import React from 'react';
import { marked } from 'marked';
import type { AccordionBlock as AccordionBlockType } from '../../types';
import Section from '../Section';

interface AccordionBlockProps {
  block: AccordionBlockType;
}

const toHtml = (answer: string) =>
  /<[a-z][\s\S]*>/i.test(answer) ? answer : (marked(answer) as string);

/** Every answer stays open: the kit's FAQ has no accordion. */
const AccordionBlock: React.FC<AccordionBlockProps> = ({ block }) => {
  if (!block.items || block.items.length === 0) {
    return null;
  }

  return (
    <Section>
      <div className="grid grid--top">
      {block.title && (
        <div className="span-5 section-head">
          <h2>{block.title}</h2>
        </div>
      )}
      <div className="span-7 start-6 faq">
        {block.items.map((item) => (
          <div className="faq__item" key={item.question}>
            <h3>{item.question}</h3>
            <div className="prose" dangerouslySetInnerHTML={{ __html: item.answer ? toHtml(item.answer) : '' }} />
          </div>
        ))}
      </div>
      </div>
    </Section>
  );
};

export default AccordionBlock;
