import type { PageBlock, PageContent, Post } from "../types";
import { getAllPosts } from "./posts";
import { getSiteConfig } from "./site";
import { getBaseUrl } from "./seo";
import { getMarkdownPath } from "./routes";
import { getPagePath } from "./meta";

/**
 * Markdown variants of every page and post, written at build time next to the
 * HTML (see generateFiles in entry-server.tsx): /about.md, /blog/some-post.md.
 */

function absolute(url: string): string {
  if (/^(https?:|mailto:|#)/.test(url)) return url;
  return `${getBaseUrl()}${url.startsWith("/") ? url : `/${url}`}`;
}

/** Root-relative links and images become absolute, since the file is read out of context. */
function absolutizeMarkdown(markdown: string): string {
  return markdown.replace(
    /(!?\[[^\]]*\]\()(\/[^)\s]*)/g,
    (_match, prefix: string, path: string) => `${prefix}${absolute(path)}`
  );
}

/** Accordion answers are stored as HTML. */
function htmlToMarkdown(html: string): string {
  return html
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gis, "[$2]($1)")
    .replace(/<(strong|b)>(.*?)<\/\1>/gis, "**$2**")
    .replace(/<(em|i)>(.*?)<\/\1>/gis, "*$2*")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/(p|li|ul|ol)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function blockToMarkdown(block: PageBlock): string {
  const site = getSiteConfig();
  const bookUrl = (url?: string) =>
    absolute(url || site.discoveryCallUrl || site.bookingUrl || "/");

  switch (block._block) {
    case "hero":
    case "hero-with-video": {
      const parts = [`## ${block.title}`];
      if (block.subtitle) parts.push(block.subtitle);
      if (block._block === "hero-with-video" && block.video.videoId) {
        parts.push(
          `[${block.video.title || "Watch the video"}](https://www.youtube.com/watch?v=${block.video.videoId})`
        );
      }
      return parts.join("\n\n");
    }
    case "about-hero": {
      const facts = [
        block.location && `- Location: ${block.location}`,
        block.expertise && `- Expertise: ${block.expertise}`,
        block.currently && `- Currently: ${block.currently}`,
      ].filter(Boolean);
      return [`## ${block.title}`, facts.join("\n")].filter(Boolean).join("\n\n");
    }
    case "text":
      return block.content;
    case "heading":
      return `${"#".repeat(Math.min(Math.max(block.level ?? 2, 1), 6))} ${block.text}`;
    case "highlight-box":
      return `### ${block.title}\n\n${block.content}`;
    case "features-grid":
      return [
        `## ${block.title}`,
        block.items.map((i) => `- **${i.title}**: ${i.description}`).join("\n"),
      ].join("\n\n");
    case "cta-section": {
      const parts = [`## ${block.title}`];
      if (block.description) parts.push(block.description);
      if (block.items?.length) parts.push(block.items.map((i) => `- ${i}`).join("\n"));
      if (block.pricing) parts.push(`${block.pricing.label}: ${block.pricing.price}`);
      parts.push(`[${block.buttonText}](${bookUrl(block.buttonUrl)})`);
      if (block.secondaryButtonText && block.secondaryButtonUrl) {
        parts.push(
          `[${block.secondaryButtonText}](${absolute(block.secondaryButtonUrl)})`
        );
      }
      return parts.join("\n\n");
    }
    case "newsletter": {
      const link = site.newsletter
        ? `[${site.newsletter.name}](${site.newsletter.url})`
        : "";
      return [`## ${block.title}`, block.description, link].filter(Boolean).join("\n\n");
    }
    case "testimonial":
      return [
        block.heading && `## ${block.heading}`,
        `> ${block.quote.replace(/\n/g, "\n> ")}\n>\n> — ${block.author}`,
      ]
        .filter(Boolean)
        .join("\n\n");
    case "contact-info": {
      const lines = [`- Email: ${block.email}`];
      for (const item of block.social || []) lines.push(`- [${item.label}](${item.url})`);
      const parts = ["## Contact", lines.join("\n")];
      if (block.officeHours) {
        const { description, buttonText, url } = block.officeHours;
        if (description) parts.push(description);
        if (url) parts.push(`[${buttonText || "Book office hours"}](${absolute(url)})`);
      }
      return parts.join("\n\n");
    }
    case "video":
      return `[${block.title || "Watch the video"}](https://www.youtube.com/watch?v=${block.videoId})`;
    case "course-modules": {
      const modules = (block.modules || [])
        .map(
          (m, i) =>
            `### Module ${i + 1}: ${m.title}\n\n${m.lessons.map((l) => `- ${l}`).join("\n")}`
        )
        .join("\n\n");
      return [block.title && `## ${block.title}`, modules].filter(Boolean).join("\n\n");
    }
    case "latest-posts": {
      const posts = getAllPosts().slice(0, block.limit ?? 3);
      const list = posts
        .map((p) => `- [${p.title}](${getBaseUrl()}${getMarkdownPath(`/blog/${p.id}`)})`)
        .join("\n");
      return [`## ${block.title || "Latest posts"}`, list].join("\n\n");
    }
    case "image":
      return `![${block.alt || ""}](${absolute(block.src)})${
        block.caption ? `\n\n*${block.caption}*` : ""
      }`;
    case "columns":
      return blocksToMarkdown(block.items);
    case "sidebar":
      return blocksToMarkdown([block.sidebar, ...block.content]);
    case "accordion":
      return [
        block.title && `## ${block.title}`,
        block.items
          .map((i) => `### ${i.question}\n\n${htmlToMarkdown(i.answer)}`)
          .join("\n\n"),
      ]
        .filter(Boolean)
        .join("\n\n");
    case "booking-embed":
      return [
        block.title && `## ${block.title}`,
        block.description,
        `[Book a time](https://book.ivanovyordan.com/${block.path.replace(/^\//, "")})`,
      ]
        .filter(Boolean)
        .join("\n\n");
    default:
      // gemini-assistant and any future interactive-only block
      return "";
  }
}

function blocksToMarkdown(blocks: PageBlock[]): string {
  return blocks
    .map(blockToMarkdown)
    .filter((md) => md.trim() !== "")
    .join("\n\n");
}

export function pageToMarkdown(page: PageContent): string {
  const url = `${getBaseUrl()}${getPagePath(page)}`;
  const parts = [`# ${page.title}`];
  if (page.seo?.description) parts.push(`> ${page.seo.description}`);
  parts.push(`Source: ${url}`);
  parts.push(blocksToMarkdown(page.sections));
  return `${absolutizeMarkdown(parts.join("\n\n"))}\n`;
}

export function postToMarkdown(post: Post): string {
  const url = `${getBaseUrl()}/blog/${post.id}`;
  const meta = [post.date, post.category, post.readTime].filter(Boolean).join(" · ");
  return `${absolutizeMarkdown(
    [`# ${post.title}`, meta, `Source: ${url}`, post.body.trim()].join("\n\n")
  )}\n`;
}

export function blogIndexToMarkdown(posts: Post[]): string {
  const site = getSiteConfig();
  const list = posts
    .map(
      (p) =>
        `- [${p.title}](${getBaseUrl()}${getMarkdownPath(`/blog/${p.id}`)})${
          p.date ? ` (${p.date})` : ""
        }`
    )
    .join("\n");
  return `${[
    `# ${site.blog.title}`,
    `> ${site.blog.description}`,
    `Source: ${getBaseUrl()}/blog`,
    list,
  ].join("\n\n")}\n`;
}
