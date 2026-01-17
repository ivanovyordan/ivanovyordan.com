import React, { useMemo, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { marked } from 'marked';
import Container from '../components/Container';
import SocialShare from '../components/SocialShare';
import { getPostById } from '../utils/posts';
import { getSiteConfig } from '../utils/site';
import { getCanonicalUrl } from '../utils/routes';
import { trackBlogPostView } from '../utils/analytics';

interface BlogPostingSchema {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  author: {
    '@type': string;
    name: string;
  };
  datePublished: string;
  dateModified: string;
  mainEntityOfPage: {
    '@type': string;
    '@id': string;
  };
  publisher: {
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
 * Create blog posting schema data
 */
function createBlogPostingSchema(
  post: { id: string; title: string; excerpt: string; date?: string },
  siteName: string
): BlogPostingSchema {
  const postUrl = getCanonicalUrl(`/blog/${post.id}`);
  const postDate = new Date(post.date || new Date());

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Person',
      name: siteName,
    },
    datePublished: postDate.toISOString(),
    dateModified: postDate.toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
    },
  };
}

/**
 * Update blog post structured data
 */
function updateBlogPostStructuredData(
  post: { id: string; title: string; excerpt: string; date?: string },
  siteName: string
): void {
  const schemaScript = getOrCreateSchemaScript();
  const schema = createBlogPostingSchema(post, siteName);
  schemaScript.textContent = JSON.stringify(schema);
}

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const post = useMemo(() => (id ? getPostById(id) : undefined), [id]);

  const htmlContent = useMemo(() => {
    if (!post?.body) return '';
    return marked(post.body);
  }, [post?.body]);

  const siteConfig = getSiteConfig();

  useEffect(() => {
    if (!post) return;
    updateBlogPostStructuredData(post, siteConfig.name);
    trackBlogPostView(post.id, post.title);
  }, [post, siteConfig.name]);

  if (!post) {
    return <Navigate to="/404" replace />;
  }

  return (
    <Container size="sm" className="py-12 md:py-20">
      <Link
        to="/blog"
        className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white mb-12 inline-flex items-center gap-2 group focus:outline-none focus:underline"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="group-hover:-translate-x-1 transition-transform"
        >
          <path
            d="M11 6H1M1 6L6 1M1 6L6 11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to Blog
      </Link>

      <article>
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-widest">
              {post.date}
            </span>
            <span
              className="text-gray-300 dark:text-zinc-700 text-xs"
              aria-hidden="true"
            >
              |
            </span>
            <span className="text-xs font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-widest">
              {post.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight mb-6 tracking-tight dark:text-white">
            {post.title}
          </h1>
        </header>

        <div
          className="prose prose-lg md:prose-xl dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-zinc-900">
          <SocialShare title={post.title} description={post.excerpt} />
        </div>

        <footer className="mt-16 pt-12 border-t border-gray-100 dark:border-zinc-900">
          <div className="bg-gray-50 dark:bg-zinc-900 p-8 md:p-12 text-center border border-gray-100 dark:border-zinc-800">
            <h4 className="text-xl font-bold mb-3 font-serif dark:text-white">
              Enjoyed this article?
            </h4>
            <p className="text-gray-700 dark:text-zinc-300 mb-8 max-w-md mx-auto">
              Join the newsletter for more deep dives into engineering
              leadership.
            </p>
            <Link
              to="/"
              className="inline-block bg-black dark:bg-white text-white dark:text-black px-10 py-3 text-sm font-bold hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              Join 5,000+ Readers
            </Link>
          </div>
        </footer>
      </article>
    </Container>
  );
};

export default PostDetail;
