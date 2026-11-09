import React, { useState } from 'react';
import type { HeroWithVideoBlock as HeroWithVideoBlockType } from '../../types';
import Section from '../Section';

interface HeroWithVideoBlockProps {
  block: HeroWithVideoBlockType;
}

const HeroWithVideoBlock: React.FC<HeroWithVideoBlockProps> = ({ block }) => {
  const [playing, setPlaying] = useState(false);
  // No video yet? Show the copy full-width rather than a play button that
  // opens an empty YouTube embed.
  const hasVideo = Boolean(block.video?.videoId);
  const embedUrl = `https://www.youtube.com/embed/${block.video?.videoId}?autoplay=1&modestbranding=1&rel=0`;

  return (
    <Section className="page-head">
      <div className="grid grid--top">
        <div className={hasVideo ? 'span-6' : 'span-12'}>
          <div className="section-head">
            {block.badge && <p className="t-label muted">{block.badge}</p>}
            <h1>{block.title}</h1>
            {block.subtitle && <p>{block.subtitle}</p>}
          </div>
          {block.buttons && block.buttons.length > 0 && (
            <div className="btn-row">
              {block.buttons.map((button) => (
                <button
                  key={button.text}
                  type="button"
                  className={button.style === 'primary' ? 'btn btn--primary' : 'btn btn--secondary'}
                >
                  {button.text}
                </button>
              ))}
            </div>
          )}
        </div>
        {hasVideo && (
          <div className="span-6 start-7 video-frame">
            {playing ? (
              <iframe
                src={embedUrl}
                title={block.video.title || 'Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button className="btn btn--primary" type="button" onClick={() => setPlaying(true)}>
                {block.video.buttonText || 'Watch the trailer'}
              </button>
            )}
          </div>
        )}
      </div>
    </Section>
  );
};

export default HeroWithVideoBlock;
