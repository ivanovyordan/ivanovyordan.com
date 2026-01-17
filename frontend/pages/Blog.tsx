import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import Container from '../components/Container';
import { getAllPosts } from '../utils/posts';
import { getSiteConfig } from '../utils/site';
import { getCanonicalUrl } from '../utils/routes';

interface BlogSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  author: {
    '@type': string;
    name: string;
  };
}

/**
 * Get or create structured data script element
 */
function getOrCreateSchemaScript(): HTMLScriptElement {
  let existingSchema = document.querySelector(
    'script[type="application/ld+json"]'
  ) as HTMLScriptElement | null;
  if (!existingSchema) {
    existingSchema = document.createElement('script');
    existingSchema.setAttribute('type', 'application/ld+json');
    document.head.appendChild(existingSchema);
  }
  return existingSchema;
}

/**
 * Create blog schema data
 */
function createBlogSchema(
  siteName: string,
  blogTitle: string,
  blogDescription: string
): BlogSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${siteName} - ${blogTitle}`,
    description: blogDescription,
    url: getCanonicalUrl('/blog'),
    author: {
      '@type': 'Person',
      name: siteName,
    },
  };
}

/**
 * Update blog structured data
 */
function updateBlogStructuredData(
  siteName: string,
  blogTitle: string,
  blogDescription: string
): void {
  const schemaScript = getOrCreateSchemaScript();
  const schema = createBlogSchema(siteName, blogTitle, blogDescription);
  schemaScript.textContent = JSON.stringify(schema);
}

const Blog: React.FC = () => {
  const siteConfig = getSiteConfig();
  const INITIAL_POSTS = siteConfig.blog.initialPosts;
  const POSTS_PER_LOAD = siteConfig.blog.postsPerLoad;
  const [visibleCount, setVisibleCount] = useState(INITIAL_POSTS);

  const posts = useMemo(() => getAllPosts(), []);
  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  useEffect(() => {
    updateBlogStructuredData(
      siteConfig.name,
      siteConfig.blog.title,
      siteConfig.blog.description
    );
  }, [siteConfig]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + POSTS_PER_LOAD);
  };

  return (
    <Container size="md" className="py-16">
      <div className="mb-20">
        <h1 className="text-4xl font-serif font-bold mb-4 dark:text-white">
          {siteConfig.blog.title}
        </h1>
        <p className="text-gray-700 dark:text-zinc-300 text-lg">
          {siteConfig.blog.description}
        </p>
      </div>

      <div className="space-y-20">
        {visiblePosts.map((post) => (
          <article key={post.id} className="group relative">
            <header className="mb-3">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-widest">
                  {post.date}
                </span>
                <span
                  className="text-gray-400 dark:text-zinc-600 text-xs"
                  aria-hidden="true"
                >
                  |
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-white px-2 py-0.5 border border-black/40 dark:border-white/40 rounded">
                  {post.category}
                </span>
              </div>
              <Link
                to={`/blog/${post.id}`}
                className="focus:outline-none group-focus:underline"
              >
                <h2 className="text-3xl font-serif font-bold group-hover:text-gray-700 dark:group-hover:text-zinc-300 transition-colors leading-tight dark:text-white">
                  {post.title}
                </h2>
              </Link>
            </header>

            <div
              className="text-gray-700 dark:text-zinc-300 leading-relaxed text-lg mb-6 max-w-2xl prose prose-lg dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: marked.parse(post.excerpt) as string }}
            />

            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
              <span className="text-gray-600 dark:text-zinc-400">
                {post.readTime}
              </span>
              <Link
                to={`/blog/${post.id}`}
                className="inline-flex items-center gap-2 group-hover:gap-3 transition-all text-black hover:text-gray-700 dark:text-white dark:hover:text-zinc-300 focus:outline-none focus:underline"
              >
                Read Article
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 6H11M11 6L6 1M11 6L6 11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            <div
              className="mt-16 border-b border-gray-100 dark:border-zinc-900"
              aria-hidden="true"
            ></div>
          </article>
        ))}
      </div>

      {hasMore ? (
        <div className="mt-20 text-center">
          <button
            onClick={handleLoadMore}
            className="text-xs font-bold uppercase tracking-[0.2em] text-gray-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors border-b-2 border-gray-300 dark:border-zinc-700 hover:border-black dark:hover:border-white pb-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white p-2"
          >
            Older Posts
          </button>
        </div>
      ) : (
        <div className="mt-20 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 dark:text-zinc-500">
            End of the line
          </p>
        </div>
      )}
    </Container>
  );
};

export default Blog;
