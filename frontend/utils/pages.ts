import type { PageContent } from "../types";

// Import all page JSON files at build time
const pageFiles = import.meta.glob<PageContent>("../content/pages/*.json", {
  import: "default",
  eager: true,
});

export function getPageBySlug(slug: string, includeDrafts: boolean = false): PageContent | undefined {
  for (const [path, content] of Object.entries(pageFiles)) {
    if (content.slug === slug) {
      // Filter out drafts unless explicitly requested
      if (!includeDrafts && content.published === false) {
        return undefined;
      }
      return content;
    }
  }
  return undefined;
}

export function getAllPages(includeDrafts: boolean = false): PageContent[] {
  const pages = Object.values(pageFiles) as PageContent[];
  if (includeDrafts) {
    return pages;
  }
  // Filter out unpublished pages
  return pages.filter((page) => page.published !== false);
}
