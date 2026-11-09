import React, { useState } from 'react';
import type { VideoBlock as VideoBlockType } from '../../types';
import Section from '../Section';

interface VideoBlockProps {
  block: VideoBlockType;
}

/** A play button that swaps for the YouTube player in place: no modal. */
const VideoBlock: React.FC<VideoBlockProps> = ({ block }) => {
  const [playing, setPlaying] = useState(false);

  // The whole block is the video, so render nothing until there is one.
  if (!block.videoId) {
    return null;
  }

  const embedUrl = `https://www.youtube.com/embed/${block.videoId}?autoplay=1&modestbranding=1&rel=0`;

  return (
    <Section>
      <div className="video-frame">
        {playing ? (
          <iframe
            src={embedUrl}
            title={block.title || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button className="btn btn--primary" type="button" onClick={() => setPlaying(true)}>
            {block.buttonText || 'Watch the trailer'}
          </button>
        )}
      </div>
    </Section>
  );
};

export default VideoBlock;
