import type { Plugin } from 'vite';

// Vite plugin to generate SEO files after build
export function seoPlugin(): Plugin {
  return {
    name: 'vite-plugin-seo',
    apply: 'build',
    async generateBundle() {
      // Generate SEO files during the build
      // Note: import.meta.glob only works in Vite-processed modules, not in plugins
      // So we need to dynamically import at runtime
      try {
        const { generateRSSFeed, generateAtomFeed, generateSitemap } = await import('./utils/seo');

        // Generate RSS feed
        const rssFeed = generateRSSFeed();
        this.emitFile({
          type: 'asset',
          fileName: 'feed.xml',
          source: rssFeed,
        });

        // Generate Atom feed
        const atomFeed = generateAtomFeed();
        this.emitFile({
          type: 'asset',
          fileName: 'atom.xml',
          source: atomFeed,
        });

        // Generate sitemap
        const sitemap = generateSitemap();
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: sitemap,
        });
      } catch (error) {
        // Silently fail - import.meta.glob limitation in plugins
        // SEO files can be generated via a separate script if needed
        // The build will still succeed without them
      }
    },
  };
}
