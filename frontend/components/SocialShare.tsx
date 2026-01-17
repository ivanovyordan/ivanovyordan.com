import React from 'react';
import { getSiteConfig } from '../utils/site';
import { getCanonicalUrl } from '../utils/routes';

interface SocialShareProps {
  url?: string;
  title: string;
  description?: string;
  className?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({
  url,
  title,
  description,
  className = '',
}) => {
  const siteConfig = getSiteConfig();
  const shareUrl = url || getCanonicalUrl(window.location.pathname);
  const shareTitle = encodeURIComponent(title);
  const shareDescription = encodeURIComponent(description || siteConfig.seo.defaultDescription);
  const encodedUrl = encodeURIComponent(shareUrl);

  // Note: LinkedIn and Facebook no longer support pre-filled text via URL params.
  // They pull title/description from Open Graph meta tags on the shared page.
  const shareLinks = {
    x: `https://x.com/intent/tweet?text=${shareTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${shareTitle}&body=${shareDescription}%0A%0A${encodedUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    const link = shareLinks[platform];
    if (platform === 'email') {
      window.location.href = link;
    } else {
      window.open(link, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`} role="group" aria-label="Share on social media">
      <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Share:</span>
      <div className="flex gap-2">
        <button
          onClick={() => handleShare('x')}
          className="p-2 text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          aria-label="Share on X"
          title="Share on X"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>
        <button
          onClick={() => handleShare('linkedin')}
          className="p-2 text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          aria-label="Share on LinkedIn"
          title="Share on LinkedIn"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </button>
        <button
          onClick={() => handleShare('facebook')}
          className="p-2 text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          aria-label="Share on Facebook"
          title="Share on Facebook"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </button>
        <button
          onClick={() => handleShare('email')}
          className="p-2 text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          aria-label="Share via email"
          title="Share via email"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.546l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SocialShare;
