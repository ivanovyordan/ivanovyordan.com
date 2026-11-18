import React from 'react';
import type { BookingEmbedBlock as BookingEmbedBlockType } from '../../types';
import { getSiteConfig } from '../../utils/site';

interface BookingEmbedBlockProps {
  block: BookingEmbedBlockType;
}

/**
 * The TidyCal calendar, inline. The page carries an empty div.tidycal-embed;
 * client.ts loads TidyCal's embed.js on pages that have one, and it swaps the div
 * for the calendar. The plain link stays hidden unless the calendar has not
 * appeared after a while (client.ts reveals it).
 */
const BookingEmbedBlock: React.FC<BookingEmbedBlockProps> = ({ block }) => {
  const siteConfig = getSiteConfig();
  const anchor = block.id || 'book';

  return (
    <section id={anchor} className="section section--flow" aria-labelledby={`${anchor}-h`}>
      <div className="wrap">
        {(block.title || block.description) && (
          <div className="section-head">
            {block.title && <h2 id={`${anchor}-h`}>{block.title}</h2>}
            {block.description && <p>{block.description}</p>}
          </div>
        )}
        <div className="booking-host">
          <div className="tidycal-embed" data-path={block.path} />
        </div>
        {siteConfig.discoveryCallUrl && (
          <p className="t-small muted booking-fallback" data-booking-fallback hidden>
            Calendar not loading?{' '}
            <a
              className="link"
              href={siteConfig.discoveryCallUrl}
              data-track="booking"
              data-track-loc="embed_fallback"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open it at book.ivanovyordan.com
            </a>
          </p>
        )}
      </div>
    </section>
  );
};

export default BookingEmbedBlock;
