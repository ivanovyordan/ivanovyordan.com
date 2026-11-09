import React from 'react';
import { useParams } from 'react-router-dom';
import BlockRenderer from '../components/blocks/BlockRenderer';
import TestimonialBlock from '../components/blocks/TestimonialBlock';
import Section, { BareContext, FlowContext } from '../components/Section';
import SEO from '../components/SEO';
import { getPageBySlug } from '../utils/pages';
import { buildPageMeta } from '../utils/meta';
import type { PageBlock, TestimonialBlock as TestimonialBlockType } from '../types';
import NotFound from './NotFound';

type Group =
  | { kind: 'block'; block: PageBlock }
  | { kind: 'quotes'; quotes: TestimonialBlockType[]; after?: PageBlock }
  | { kind: 'pair'; blocks: PageBlock[] };

/** Neighbouring testimonials share one section: a quote alone is too short for a screen. */
const groupBlocks = (blocks: PageBlock[]): Group[] => {
  const groups: Group[] = [];
  for (const block of blocks) {
    const last = groups[groups.length - 1];
    if (block._block === 'testimonial') {
      if (last?.kind === 'quotes') last.quotes.push(block);
      else groups.push({ kind: 'quotes', quotes: [block] });
    } else if (block._block === 'text' && last?.kind === 'quotes' && !last.after && block.content.length < 200) {
      // A line under the quotes (a link to more of them) belongs to their section.
      last.after = block;
    } else {
      groups.push({ kind: 'block', block });
    }
  }
  return groups;
};

/** On the home page the email course and the latest posts share a two-screen section: each alone fills under half a screen. */
const pairHome = (blocks: PageBlock[]): Group[] => {
  const groups: Group[] = [];
  for (const block of blocks) {
    const last = groups[groups.length - 1];
    const prev = last?.kind === 'block' ? last.block : undefined;
    if (block._block === 'latest-posts' && prev?._block === 'newsletter') {
      groups[groups.length - 1] = { kind: 'pair', blocks: [prev, block] };
    } else {
      groups.push({ kind: 'block', block });
    }
  }
  return groups;
};

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

  // The home page is a stack of whole screens; every other page runs as long as its content.
  const flow = pageSlug !== 'home';
  const groups = flow ? groupBlocks(page.sections) : pairHome(page.sections);

  return (
    <FlowContext.Provider value={flow}>
      <SEO meta={buildPageMeta(page)} />
      {groups.map((group, idx) =>
        group.kind === 'pair' ? (
          <Section key={idx} h={2} hm={2} className="pair-section" id="course" labelledBy="course-h">
            <BareContext.Provider value>
              <div className="pair">
                {group.blocks.map((block, i) => (
                  <div key={i}>
                    <BlockRenderer block={block} />
                  </div>
                ))}
              </div>
            </BareContext.Provider>
          </Section>
        ) : group.kind === 'quotes' ? (
          <Section key={idx} labelledBy={group.quotes[0].heading ? `quotes-${idx}-h` : undefined}>
            {group.quotes[0].heading && (
              <div className="section-head">
                <h2 id={`quotes-${idx}-h`}>{group.quotes[0].heading}</h2>
              </div>
            )}
            <div className="quotes">
              {group.quotes.map((quote) => (
                <TestimonialBlock key={quote.author} block={quote} />
              ))}
            </div>
            {group.after && <BlockRenderer block={group.after} bare />}
          </Section>
        ) : (
          <BlockRenderer key={idx} block={group.block} />
        )
      )}
    </FlowContext.Provider>
  );
};

export default Page;
