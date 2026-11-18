import React from 'react';
import type { VideoBlock as VideoBlockType } from '../../types';
import Section from '../Section';

interface VideoBlockProps {
  block: VideoBlockType;
}

/** A play button that swaps for the YouTube player in place: no modal (client.ts swaps it on click). */
const VideoBlock: React.FC<VideoBlockProps> = ({ block }) => {
  // The whole block is the video, so render nothing until there is one.
  if (!block.videoId) {
    return null;
  }

  const embedUrl = `https://www.youtube.com/embed/${block.videoId}?autoplay=1&modestbranding=1&rel=0`;

  return (
    <Section>
      <div className="video-frame">
        <button
          className="btn btn--primary"
          type="button"
          data-video={embedUrl}
          data-video-title={block.title || 'Video'}
        >
          {block.buttonText || 'Watch the trailer'}
        </button>
      </div>
    </Section>
  );
};

export default VideoBlock;
