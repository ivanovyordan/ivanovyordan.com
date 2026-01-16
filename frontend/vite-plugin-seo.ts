import type { Plugin } from "vite";
import { readFileSync, readdirSync, existsSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import fm from "front-matter";

// Vite plugin to generate SEO files after build
export function seoPlugin(): Plugin {
  return {
    name: "vite-plugin-seo",
    apply: "build",
    async writeBundle() {
      // Generate SEO files after the bundle is written
      // We read posts directly from the filesystem since import.meta.glob doesn't work in plugins
      try {
        const rootDir = resolve(process.cwd());
        const contentDir = join(rootDir, "content");
        const postsDir = join(contentDir, "posts");
        const siteConfigPath = join(contentDir, "site.json");

        // Read site config
        const siteConfig = JSON.parse(readFileSync(siteConfigPath, "utf-8"));
        const baseUrl =
          process.env.VITE_SITE_URL ||
          siteConfig.siteUrl ||
          "https://www.ivanovyordan.com";

        // Read all markdown posts
        const posts: Array<{
          id: string;
          title: string;
          excerpt: string;
          date: string;
          category: string;
        }> = [];

        if (existsSync(postsDir)) {
          const files = readdirSync(postsDir).filter((f) => f.endsWith(".md"));

          for (const file of files) {
            try {
              const content = readFileSync(join(postsDir, file), "utf-8");
              const { attributes, body } = fm<{
                title?: string;
                excerpt?: string;
                date?: string;
                category?: string;
                slug?: string;
              }>(content);

              const filename = file.replace(".md", "");
              const slug = attributes.slug || filename;
              const excerpt =
                attributes.excerpt || body.split("\n\n")[0].trim();

              posts.push({
                id: slug,
                title: attributes.title || "Untitled",
                excerpt,
                date: attributes.date || new Date().toISOString(),
                category: attributes.category || "Uncategorised",
              });
            } catch (err) {
              console.warn(`Failed to parse post ${file}:`, err);
            }
          }

          // Sort by date (newest first)
          posts.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        }

        // Escape XML special characters
        const escapeXml = (unsafe: string): string => {
          return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
        };

        // Format date for RSS
        const formatRssDate = (date: Date): string => date.toUTCString();

        const now = new Date();
        const latestPosts = posts.slice(0, 20);

        // Generate RSS feed
        const rssItems = latestPosts
          .map((post) => {
            const postDate = new Date(post.date || now);
            const postUrl = `${baseUrl}/blog/${post.id}`;
            const excerpt = escapeXml(post.excerpt || "");
            const authorEmail = siteConfig.email || "";

            return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${excerpt}</description>
      <pubDate>${formatRssDate(postDate)}</pubDate>
      <category>${escapeXml(post.category)}</category>
      ${
        authorEmail
          ? `<author>${escapeXml(authorEmail)} (${escapeXml(
              siteConfig.name
            )})</author>`
          : ""
      }
    </item>`;
          })
          .join("\n");

        const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)} - ${escapeXml(
          siteConfig.blog?.title || "Blog"
        )}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(
      siteConfig.seo?.defaultDescription || siteConfig.description || ""
    )}</description>
    <language>en-GB</language>
    <lastBuildDate>${formatRssDate(now)}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;

        // Generate Atom feed
        const atomEntries = latestPosts
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

        const atomFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(siteConfig.name)} - ${escapeXml(
          siteConfig.blog?.title || "Blog"
        )}</title>
  <link href="${baseUrl}" rel="alternate"/>
  <link href="${baseUrl}/atom.xml" rel="self"/>
  <id>${baseUrl}/</id>
  <updated>${now.toISOString()}</updated>
  <author>
    <name>${escapeXml(siteConfig.name)}</name>
    ${siteConfig.email ? `<email>${escapeXml(siteConfig.email)}</email>` : ""}
  </author>
${atomEntries}
</feed>`;

        // Write files to dist directory
        const distDir = join(rootDir, "dist");

        writeFileSync(join(distDir, "feed.xml"), rssFeed, "utf-8");
        writeFileSync(join(distDir, "atom.xml"), atomFeed, "utf-8");

        console.log("✓ Generated feed.xml and atom.xml");
      } catch (error) {
        console.error("Error generating feeds:", error);
        // Don't fail the build, but log the error
      }
    },
  };
}
