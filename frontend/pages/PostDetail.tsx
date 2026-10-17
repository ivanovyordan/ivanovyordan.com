import React, { useMemo, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { marked } from 'marked';
import Container from '../components/Container';
import SocialShare from '../components/SocialShare';
import NewsletterBlock from '../components/blocks/NewsletterBlock';
import { getPostById } from '../utils/posts';
import { getCanonicalUrl } from '../utils/routes';
import { trackBlogPostView } from '../utils/analytics';
import SEO from '../components/SEO';
import { buildPostMeta } from '../utils/meta';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const post = useMemo(() => (id ? getPostById(id) : undefined), [id]);

  const htmlContent = useMemo(() => {
    if (!post?.body) return '';
    return marked(post.body);
  }, [post?.body]);

  useEffect(() => {
    if (!post) return;
    trackBlogPostView(post.id, post.title);
  }, [post]);

  if (!post) {
    return <Navigate to="/404" replace />;
  }

  return (
    <Container size="sm" className="py-12 md:py-20">
      <SEO meta={buildPostMeta(post)} />
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
          <SocialShare
            url={getCanonicalUrl(`/blog/${post.id}`)}
            title={post.title}
            description={post.excerpt}
          />
        </div>

        <footer className="mt-16 pt-12 border-t border-gray-100 dark:border-zinc-900">
          <NewsletterBlock
            block={{
              _block: 'newsletter',
              title: 'Enjoyed this article?',
              description: 'Subscribe to the newsletter for more insights on engineering leadership, data, and career growth.',
            }}
          />
        </footer>
      </article>
    </Container>
  );
};

export default PostDetail;
