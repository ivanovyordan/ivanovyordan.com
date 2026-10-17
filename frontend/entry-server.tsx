import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppShell } from './App';
import { getAllPages } from './utils/pages';
import { getAllPosts } from './utils/posts';
import {
  buildBlogMeta,
  buildNotFoundMeta,
  buildPageMeta,
  buildPostMeta,
  getPagePath,
  renderHeadTags,
  type RouteMeta,
} from './utils/meta';
import {
  generateAtomFeed,
  generateLlmsTxt,
  generateRSSFeed,
  generateSitemap,
} from './utils/seo';

/**
 * Build-time entry. `vite build --ssr entry-server.tsx` bundles it, and
 * scripts/prerender.mjs calls it once per route to write static HTML with
 * the route's own <head> and body, which the client then hydrates.
 */

export interface PrerenderRoute {
  /** The URL path, e.g. "/coaching" or "/blog/some-post". */
  path: string;
  /**
   * The file under dist/, e.g. "coaching.html". Cloudflare Pages serves
   * "coaching.html" at "/coaching" directly, whereas "coaching/index.html"
   * would redirect "/coaching" to "/coaching/" and break every canonical URL.
   */
  file: string;
  meta: RouteMeta;
}

export function listRoutes(): PrerenderRoute[] {
  const routes: PrerenderRoute[] = [];

  for (const page of getAllPages()) {
    routes.push({
      path: getPagePath(page),
      file: page.slug === 'home' ? 'index.html' : `${page.slug}.html`,
      meta: buildPageMeta(page),
    });
  }

  routes.push({ path: '/blog', file: 'blog.html', meta: buildBlogMeta() });

  for (const post of getAllPosts()) {
    routes.push({
      path: `/blog/${post.id}`,
      file: `blog/${post.id}.html`,
      meta: buildPostMeta(post),
    });
  }

  // The 404 page. Its presence at dist/404.html makes Cloudflare Pages answer
  // unknown paths with a real 404 status instead of the SPA fallback.
  routes.push({ path: '/404', file: '404.html', meta: buildNotFoundMeta() });

  return routes;
}

export function render(route: PrerenderRoute): { head: string; html: string } {
  const html = renderToString(
    <StaticRouter location={route.path}>
      <AppShell />
    </StaticRouter>
  );
  return { head: renderHeadTags(route.meta), html };
}

/** The non-HTML files generated at build time, keyed by path under dist/. */
export function generateFiles(): Record<string, string> {
  return {
    'sitemap.xml': generateSitemap(),
    'feed.xml': generateRSSFeed(),
    'atom.xml': generateAtomFeed(),
    'llms.txt': generateLlmsTxt(),
  };
}
