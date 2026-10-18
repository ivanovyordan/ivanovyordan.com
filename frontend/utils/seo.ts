import { getAllPosts } from "./posts";
import { getAllPages } from "./pages";
import { getSiteConfig, getDefaultDescription } from "./site";
import { stripMarkdown } from "./meta";

// Get base URL from environment, site config, or use default
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // For build time, check environment variable, then site config, then default
  const envUrl = import.meta.env.VITE_SITE_URL as string;
  if (envUrl) return envUrl;

  const siteConfig = getSiteConfig();
  return siteConfig.siteUrl || "https://ivanovyordan.com";
}

// Escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Format date for RSS/Atom
function formatRssDate(date: Date): string {
  return date.toUTCString();
}

// Format date for sitemap
function formatSitemapDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Generate RSS feed
export function generateRSSFeed(): string {
  const siteConfig = getSiteConfig();
  const posts = getAllPosts();
  const baseUrl = getBaseUrl();
  const now = new Date();

  const items = posts
    .slice(0, 20) // Latest 20 posts
    .map((post) => {
      const postDate = new Date(post.date || now);
      const postUrl = `${baseUrl}/blog/${post.id}`;
      const excerpt = escapeXml(post.excerpt || "");
      const siteConfig = getSiteConfig();
      const authorEmail = siteConfig.email || "";

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${excerpt}</description>
      <pubDate>${formatRssDate(postDate)}</pubDate>
      <category>${escapeXml(post.category)}</category>
      ${authorEmail ? `<author>${escapeXml(authorEmail)} (${escapeXml(siteConfig.name)})</author>` : ""}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)} - ${escapeXml(
    siteConfig.blog.title
  )}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(getDefaultDescription())}</description>
    <language>en-GB</language>
    <lastBuildDate>${formatRssDate(now)}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}

// Generate Atom feed
export function generateAtomFeed(): string {
  const siteConfig = getSiteConfig();
  const posts = getAllPosts();
  const baseUrl = getBaseUrl();
  const now = new Date();

  const entries = posts
    .slice(0, 20) // Latest 20 posts
    .map((post) => {
      const postDate = new Date(post.date || now);
      const postUrl = `${baseUrl}/blog/${post.id}`;
      const excerpt = escapeXml(post.excerpt || "");
      const authorEmail = siteConfig.email || "";

      return `    <entry>
      <title>${escapeXml(post.title)}</title>
      <link href="${postUrl}" rel="alternate"/>
      <id>${postUrl}</id>
      <published>${postDate.toISOString()}</published>
      <updated>${postDate.toISOString()}</updated>
      <summary type="html">${excerpt}</summary>
      <category term="${escapeXml(post.category)}"/>
      <author>
        <name>${escapeXml(siteConfig.name)}</name>
        ${authorEmail ? `<email>${escapeXml(authorEmail)}</email>` : ""}
      </author>
    </entry>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(siteConfig.name)} - ${escapeXml(
    siteConfig.blog.title
  )}</title>
  <link href="${baseUrl}" rel="alternate"/>
  <link href="${baseUrl}/atom.xml" rel="self"/>
  <id>${baseUrl}/</id>
  <updated>${now.toISOString()}</updated>
  <author>
    <name>${escapeXml(siteConfig.name)}</name>
    ${siteConfig.email ? `<email>${escapeXml(siteConfig.email)}</email>` : ""}
  </author>
  ${entries}
</feed>`;
}

// Generate sitemap: the published, indexable pages and every post
export function generateSitemap(): string {
  const posts = getAllPosts();
  const pages = getAllPages().filter(
    (page) => page.slug !== "home" && !page.seo?.noindex
  );
  const baseUrl = getBaseUrl();
  const now = new Date();
  const latestPostDate =
    posts.length > 0 && posts[0].date ? new Date(posts[0].date) : now;

  const urls: string[] = [];

  // Homepage
  urls.push(`  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${formatSitemapDate(now)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`);

  // Blog index
  urls.push(`  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${formatSitemapDate(latestPostDate)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);

  // Blog posts
  posts.forEach((post) => {
    const postDate = new Date(post.date || now);
    urls.push(`  <url>
    <loc>${baseUrl}/blog/${post.id}</loc>
    <lastmod>${formatSitemapDate(postDate)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
  });

  // Pages
  pages.forEach((page) => {
    urls.push(`  <url>
    <loc>${baseUrl}/${page.slug}</loc>
    <lastmod>${formatSitemapDate(now)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}

// One line of plain text for an llms.txt entry
function oneLine(text: string, maxLength = 200): string {
  const plain = stripMarkdown(text);
  if (plain.length <= maxLength) return plain;
  const cut = plain.slice(0, maxLength);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 1)).trim()}…`;
}

const LEGAL_SLUGS = new Set(["privacy", "tos", "terms"]);

// Generate llms.txt (https://llmstxt.org) from site.json plus the published,
// indexable pages and the posts, so it cannot drift from the site.
export function generateLlmsTxt(): string {
  const siteConfig = getSiteConfig();
  const baseUrl = getBaseUrl();
  const pages = getAllPages().filter(
    (page) => page.slug !== "home" && !page.seo?.noindex
  );
  const mainPages = pages.filter((page) => !LEGAL_SLUGS.has(page.slug));
  const legalPages = pages.filter((page) => LEGAL_SLUGS.has(page.slug));
  const posts = getAllPosts();

  const pageLine = (page: { title: string; slug: string; seo?: { description?: string } }) => {
    const description = page.seo?.description
      ? `: ${oneLine(page.seo.description)}`
      : "";
    return `- [${page.title}](${baseUrl}/${page.slug})${description}`;
  };

  const facts: string[] = [];
  if (siteConfig.tagline) facts.push(`- Role: ${siteConfig.tagline}`);
  facts.push(`- Website: ${baseUrl}`);
  if (siteConfig.newsletter) {
    facts.push(
      `- Newsletter: [${siteConfig.newsletter.name}](${siteConfig.newsletter.url})`
    );
  }
  if (siteConfig.bookingUrl) facts.push(`- Booking: ${siteConfig.bookingUrl}`);
  if (siteConfig.discoveryCallUrl) facts.push(`- Free discovery call: ${siteConfig.discoveryCallUrl}`);
  if (siteConfig.flagshipUrl) facts.push(`- Flagship (6 private coaching calls): ${siteConfig.flagshipUrl}`);
  if (siteConfig.email) facts.push(`- Email: ${siteConfig.email}`);
  for (const item of siteConfig.social || []) {
    facts.push(`- ${item.label}: ${item.url}`);
  }

  const sections: string[] = [
    `# ${siteConfig.name}`,
    "",
    `> ${getDefaultDescription()}`,
    "",
    ...facts,
    "",
    "## Pages",
    "",
    ...mainPages.map(pageLine),
    "",
    `## ${siteConfig.blog.title}`,
    "",
    `[${siteConfig.blog.title}](${baseUrl}/blog): ${siteConfig.blog.description}`,
    "",
    ...posts.map(
      (post) =>
        `- [${post.title}](${baseUrl}/blog/${post.id})${
          post.date ? ` (${post.date})` : ""
        }: ${oneLine(post.excerpt)}`
    ),
    "",
    "## Optional",
    "",
    ...legalPages.map(pageLine),
    `- [RSS feed](${baseUrl}/feed.xml)`,
    `- [Sitemap](${baseUrl}/sitemap.xml)`,
    "",
  ];

  return sections.join("\n");
}
