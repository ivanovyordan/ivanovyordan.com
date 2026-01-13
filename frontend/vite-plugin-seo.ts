import type { Plugin } from 'vite';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Vite plugin to generate SEO files after build
export function seoPlugin(): Plugin {
  return {
    name: 'vite-plugin-seo',
    apply: 'build',
    async closeBundle() {
      // Wait a bit for the build to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const outputDir = join(process.cwd(), 'dist');

      if (!existsSync(outputDir)) {
        console.warn('Output directory does not exist, skipping SEO file generation');
        return;
      }

      try {
        // Dynamic import to avoid build-time issues with Vite's module resolution
        const { generateRSSFeed, generateAtomFeed, generateSitemap } = await import('./utils/seo');

        // Generate RSS feed
        const rssFeed = generateRSSFeed();
        writeFileSync(join(outputDir, 'feed.xml'), rssFeed, 'utf-8');
        console.log('✓ Generated feed.xml');

        // Generate Atom feed
        const atomFeed = generateAtomFeed();
        writeFileSync(join(outputDir, 'atom.xml'), atomFeed, 'utf-8');
        console.log('✓ Generated atom.xml');

        // Generate sitemap
        const sitemap = generateSitemap();
        writeFileSync(join(outputDir, 'sitemap.xml'), sitemap, 'utf-8');
        console.log('✓ Generated sitemap.xml');
      } catch (error) {
        console.error('Error generating SEO files:', error);
      }
    },
  };
}
