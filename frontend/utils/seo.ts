import type { Post } from "../types";
import { getAllPosts } from "./posts";
import { getAllPages } from "./pages";
import { getSiteConfig } from "./site";

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
      const imageUrl = post.image ? `${baseUrl}${post.image}` : null;
      const authorEmail = siteConfig.email || "";

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${excerpt}</description>
      <pubDate>${formatRssDate(postDate)}</pubDate>
      <category>${escapeXml(post.category)}</category>
      ${authorEmail ? `<author>${escapeXml(authorEmail)} (${escapeXml(siteConfig.name)})</author>` : ""}
      ${imageUrl ? `<enclosure url="${escapeXml(imageUrl)}" type="image/jpeg"/>` : ""}
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
    <description>${escapeXml(siteConfig.seo.defaultDescription)}</description>
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
      const imageUrl = post.image ? `${baseUrl}${post.image}` : null;
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
      ${imageUrl ? `<link href="${escapeXml(imageUrl)}" rel="enclosure" type="image/jpeg"/>` : ""}
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

// Generate sitemap
export function generateSitemap(): string {
  const siteConfig = getSiteConfig();
  const posts = getAllPosts();
  const pages = getAllPages();
  const baseUrl = getBaseUrl();
  const now = new Date();

  const urls: string[] = [];

  // Homepage
  urls.push(`    <url>
      <loc>${baseUrl}/</loc>
      <lastmod>${formatSitemapDate(now)}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>1.0</priority>
    </url>`);

  // Blog index
  urls.push(`    <url>
      <loc>${baseUrl}/blog</loc>
      <lastmod>${formatSitemapDate(now)}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>`);

  // Blog posts
  posts.forEach((post) => {
    const postDate = new Date(post.date || now);
    urls.push(`    <url>
      <loc>${baseUrl}/blog/${post.id}</loc>
      <lastmod>${formatSitemapDate(postDate)}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>`);
  });

  // Pages
  pages.forEach((page) => {
    const slug = page.slug === "home" ? "" : `/${page.slug}`;
    urls.push(`    <url>
      <loc>${baseUrl}${slug}</loc>
      <lastmod>${formatSitemapDate(now)}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
    </url>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}
