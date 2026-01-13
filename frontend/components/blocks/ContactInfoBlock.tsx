import React from 'react';
import type { ContactInfoBlock as ContactInfoBlockType } from '../../types';
import { getSiteConfig } from '../../utils/site';

interface ContactInfoBlockProps {
  block: ContactInfoBlockType;
}

const ContactInfoBlock: React.FC<ContactInfoBlockProps> = ({ block }) => {
  const siteConfig = getSiteConfig();
  // Use site.json as single source of truth, with block data as fallback
  const email = siteConfig.email || block.email;
  const socialLinks = siteConfig.social || block.social || [];

  return (
    <div className="space-y-12">
      {email && (
        <div className="group">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 dark:text-zinc-400 mb-2">
            Direct Inquiry
          </h3>
          <a
            href={`mailto:${email}`}
            className="text-2xl md:text-3xl font-serif font-bold hover:text-gray-600 dark:text-white dark:hover:text-zinc-400 transition-colors border-b-2 border-black dark:border-white group-hover:border-gray-400 dark:group-hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            {email}
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {socialLinks.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 dark:text-zinc-400 mb-2">
              Social Path
            </h3>
            <ul className="space-y-3">
              {socialLinks.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-bold hover:underline dark:text-white focus:outline-none focus:ring-1 focus:ring-white"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {block.officeHours && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 dark:text-zinc-400 mb-2">
              Office Hours
            </h3>
            {block.officeHours.description && (
              <p className="text-gray-700 dark:text-zinc-300 mb-4 text-sm leading-relaxed">
                {block.officeHours.description}
              </p>
            )}
            {block.officeHours.buttonText && (
              <a
                href={siteConfig.bookingUrl || block.officeHours.url || '#'}
                target={siteConfig.bookingUrl || block.officeHours.url ? "_blank" : undefined}
                rel={siteConfig.bookingUrl || block.officeHours.url ? "noopener noreferrer" : undefined}
                className="inline-block bg-black dark:bg-white text-white dark:text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-offset-zinc-950"
              >
                {block.officeHours.buttonText}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactInfoBlock;
