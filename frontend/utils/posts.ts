import fm from "front-matter";
import type { Post } from "../types";

interface PostFrontmatter {
  title?: string;
  excerpt?: string;
  date?: string;
  category?: string;
  slug?: string;
}

// Average reading speed in words per minute
const WORDS_PER_MINUTE = 200;

// Calculate read time from word count
function calculateReadTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / WORDS_PER_MINUTE);
  return `${minutes} min read`;
}

function getExcerpt(content: string): string {
  const excerpt = content.split("\n\n")[0];
  return excerpt.trim();
}

// Import all markdown files from content/posts at build time
const postFiles = import.meta.glob<string>("../content/posts/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

// Parse all posts
export function getAllPosts(): Post[] {
  const posts: Post[] = [];

  for (const [path, content] of Object.entries(postFiles)) {
    const { attributes: data, body } = fm<PostFrontmatter>(content);

    // Extract slug from filename if not in frontmatter
    const filename = path.split("/").pop()?.replace(".md", "") || "";
    const slug = data.slug || filename;

    posts.push({
      id: slug,
      title: data.title || "Untitled",
      excerpt: getExcerpt(body),
      date: data.date || "",
      category: data.category || "Uncategorised",
      readTime: calculateReadTime(body),
      body: body,
    });
  }

  // Sort by date (newest first)
  return posts.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
}

// Get a single post by ID (slug)
export function getPostById(id: string): Post | undefined {
  return getAllPosts().find((post) => post.id === id);
}
