import type { PageContent } from "../types";
// Only the published pages: vite-plugin-content.ts builds this module from
// content/pages/*.json, so an unpublished page never ships.
import pages from "virtual:published-pages";

function publishedPages(): PageContent[] {
  return pages.filter((page) => page.published !== false);
}

export function getPageBySlug(slug: string): PageContent | undefined {
  return publishedPages().find((page) => page.slug === slug);
}

export function getAllPages(): PageContent[] {
  return publishedPages();
}
