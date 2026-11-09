import React, { useEffect, useRef, useState } from 'react';
import type { BookingEmbedBlock as BookingEmbedBlockType } from '../../types';
import { getSiteConfig } from '../../utils/site';
import { trackBookingClick } from '../../utils/analytics';

const EMBED_SRC = 'https://asset-tidycal.b-cdn.net/js/embed.js';

declare global {
  interface Window {
    TidyCal?: { init: (el: HTMLElement) => void };
  }
}

interface BookingEmbedBlockProps {
  block: BookingEmbedBlockType;
}

/**
 * The TidyCal calendar, inline. The server renders an empty
 * div.tidycal-embed; embed.js is loaded after mount, so the pre-rendered HTML
 * and the hydrated tree match. TidyCal.init(target) swaps the target div for
 * the iframe (replaceChild), scans the page only once when the script loads
 * and has no double-init guard. So the target sits inside a React-owned
 * wrapper, later client-side mounts call init themselves only while the
 * target is still in the DOM, and the cleanup puts the div back so React's
 * view of the tree stays true across StrictMode re-runs and route changes.
 */
const BookingEmbedBlock: React.FC<BookingEmbedBlockProps> = ({ block }) => {
  const siteConfig = getSiteConfig();
  const sectionRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const anchor = block.id || 'book';
  // The plain link shows only when the calendar has not appeared after a while.
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const target = targetRef.current;
    if (!host || !target) return;

    const init = () => {
      if (window.TidyCal && target.isConnected && !host.querySelector('iframe')) {
        window.TidyCal.init(target);
      }
    };

    let script = document.querySelector<HTMLScriptElement>(`script[src="${EMBED_SRC}"]`);
    if (window.TidyCal) {
      init();
    } else {
      if (!script) {
        script = document.createElement('script');
        script.src = EMBED_SRC;
        script.async = true;
        document.body.appendChild(script);
      }
      // On its first run embed.js inits every div.tidycal-embed itself, which
      // detaches the target; init() then does nothing.
      script.addEventListener('load', init);
    }

    const timer = window.setTimeout(() => setStalled(!host.querySelector('iframe')), 8000);

    if (window.location.hash === `#${anchor}`) {
      sectionRef.current?.scrollIntoView();
    }

    return () => {
      window.clearTimeout(timer);
      script?.removeEventListener('load', init);
      host.querySelectorAll('iframe').forEach((iframe) => iframe.remove());
      if (!target.isConnected) host.appendChild(target);
    };
  }, [block.path, anchor]);

  return (
    <section ref={sectionRef} id={anchor} className="section section--flow" aria-labelledby={`${anchor}-h`}>
      <div className="wrap">
        {(block.title || block.description) && (
          <div className="section-head">
            {block.title && <h2 id={`${anchor}-h`}>{block.title}</h2>}
            {block.description && <p>{block.description}</p>}
          </div>
        )}
        <div ref={hostRef} className="booking-host">
          <div ref={targetRef} className="tidycal-embed" data-path={block.path} />
        </div>
        {stalled && siteConfig.discoveryCallUrl && (
          <p className="t-small muted booking-fallback">
            Calendar not loading?{' '}
            <a
              className="link"
              href={siteConfig.discoveryCallUrl}
              onClick={() => trackBookingClick('embed_fallback')}
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
