import React, { useState } from 'react';
import type { HeroWithVideoBlock as HeroWithVideoBlockType } from '../../types';

interface HeroWithVideoBlockProps {
  block: HeroWithVideoBlockType;
}

const HeroWithVideoBlock: React.FC<HeroWithVideoBlockProps> = ({ block }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const embedUrl = `https://www.youtube.com/embed/${block.video.videoId}?autoplay=1&modestbranding=1&rel=0`;

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
      {/* Contained hero section - matches original layout */}
      <section className="mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Content */}
            <div>
              {block.badge && (
                <span className="inline-block px-4 py-2 border border-black dark:border-white text-black dark:text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                  {block.badge.toUpperCase()}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 leading-tight text-black dark:text-white">
                {block.title}
              </h1>
              {block.subtitle && (
                <p className="text-lg md:text-xl text-gray-700 dark:text-white/90 mb-8 leading-relaxed">
                  {block.subtitle}
                </p>
              )}
              {block.buttons && block.buttons.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4">
                  {block.buttons.map((button, idx) => (
                    <button
                      key={idx}
                      className={
                        button.style === 'primary'
                          ? 'bg-black dark:bg-white text-white dark:text-black px-8 py-4 font-bold rounded-sm hover:bg-gray-800 dark:hover:bg-white/90 transition-colors focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black cursor-pointer'
                          : 'border border-black dark:border-white bg-transparent text-black dark:text-white px-8 py-4 font-bold rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black cursor-pointer'
                      }
                    >
                      {button.text}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Video */}
            <div className="relative">
              <div
                className="relative aspect-video bg-black dark:bg-black flex flex-col items-center justify-center cursor-pointer group"
                onClick={openModal}
              >
                {/* Play Icon */}
                <div className="w-20 h-20 bg-white/10 dark:bg-white/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/20 dark:group-hover:bg-white/20 transition-colors">
                  <svg className="w-10 h-10 ml-1 text-white dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>

                {/* Video Info - Centered in video */}
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.3em] font-bold text-white dark:text-white">
                    {block.video.buttonText ? (
                      <>
                        {block.video.buttonText.split(' ')[0].toUpperCase()}{' '}
                        <span className="underline decoration-white dark:decoration-white underline-offset-4">
                          {block.video.buttonText.split(' ').slice(1).join(' ').toUpperCase()}
                        </span>
                      </>
                    ) : (
                      <>
                        WATCH <span className="underline decoration-white dark:decoration-white underline-offset-4">TRAILER</span>
                      </>
                    )}
                  </p>
                  {block.video.duration && (
                    <p className="text-[10px] text-white/70 dark:text-white/70 mt-2 uppercase tracking-widest">
                      {block.video.duration}
                    </p>
                  )}
                </div>

                {/* Duration Badge - Light colored, slightly offset from bottom-right */}
                {block.video.badge && (
                  <div className="absolute -bottom-4 -right-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-4 md:p-6 shadow-lg">
                    <p className="text-2xl md:text-3xl font-bold text-black dark:text-white">
                      {block.video.badge.value}
                    </p>
                    <p className="text-[10px] text-gray-600 dark:text-zinc-400 uppercase font-bold tracking-[0.2em]">
                      {block.video.badge.label}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
      </section>

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
              title={block.video.title || 'Video'}
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

export default HeroWithVideoBlock;
