import React, { useState } from 'react';
import type { VideoBlock as VideoBlockType } from '../../types';

interface VideoBlockProps {
  block: VideoBlockType;
}

const VideoBlock: React.FC<VideoBlockProps> = ({ block }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const embedUrl = `https://www.youtube.com/embed/${block.videoId}?autoplay=1&modestbranding=1&rel=0`;

  const openModal = () => {
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <>
      <div className="relative group cursor-pointer" onClick={openModal}>
        <div className="aspect-video bg-gray-900 dark:bg-zinc-950 flex items-center justify-center text-white shadow-2xl border border-transparent dark:border-zinc-800 overflow-hidden relative">
          <div className="text-center group-hover:scale-110 transition-transform duration-500 w-full h-full flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
              <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
            <p className="text-sm uppercase tracking-[0.3em] font-bold">
              {block.buttonText || 'Watch Trailer'}
            </p>
            {block.duration && (
              <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-widest">
                {block.duration}
              </p>
            )}
          </div>
        </div>
        {block.badge && (
          <div className="absolute -bottom-6 -right-6 bg-white dark:bg-zinc-800 p-6 border border-gray-200 dark:border-zinc-700 shadow-xl hidden md:block z-10">
            <p className="text-2xl font-bold dark:text-white">{block.badge.value}</p>
            <p className="text-xs text-gray-600 dark:text-zinc-400 uppercase font-bold tracking-widest">
              {block.badge.label}
            </p>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-10">
          <button
            onClick={closeModal}
            className="absolute top-6 right-6 text-white hover:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-white p-2 cursor-pointer"
            aria-label="Close Video"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="w-full max-w-6xl aspect-video bg-black shadow-2xl">
            <iframe
              width="100%"
              height="100%"
              src={embedUrl}
              title={block.title || 'Video'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoBlock;
