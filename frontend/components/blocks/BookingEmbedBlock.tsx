import React, { useEffect, useRef } from 'react';
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

    if (window.location.hash === `#${anchor}`) {
      sectionRef.current?.scrollIntoView();
    }

    return () => {
      script?.removeEventListener('load', init);
      host.querySelectorAll('iframe').forEach((iframe) => iframe.remove());
      if (!target.isConnected) host.appendChild(target);
    };
  }, [block.path, anchor]);

  return (
    <section ref={sectionRef} id={anchor} className="mb-24 scroll-mt-8">
      {(block.title || block.description) && (
        <div className="max-w-2xl mx-auto text-center mb-8">
          {block.title && (
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4 dark:text-white">
              {block.title}
            </h2>
          )}
          {block.description && (
            <p className="text-lg text-gray-700 dark:text-zinc-300">{block.description}</p>
          )}
        </div>
      )}
      <div ref={hostRef} className="min-h-[700px]">
        <div ref={targetRef} className="tidycal-embed" data-path={block.path} />
      </div>
      {siteConfig.discoveryCallUrl && (
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-zinc-400">
          Calendar not loading?{' '}
          <a
            href={siteConfig.discoveryCallUrl}
            onClick={() => trackBookingClick('embed_fallback')}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-black dark:hover:text-white"
          >
            Open it at book.ivanovyordan.com
          </a>
        </p>
      )}
    </section>
  );
};

export default BookingEmbedBlock;
