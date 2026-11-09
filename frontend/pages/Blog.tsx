import React, { useState, useMemo } from 'react';
import { stripMarkdown } from '../utils/meta';
import Section, { FlowContext } from '../components/Section';
import { getAllPosts } from '../utils/posts';
import { getSiteConfig } from '../utils/site';
import SEO from '../components/SEO';
import { buildBlogMeta } from '../utils/meta';

const Blog: React.FC = () => {
  const siteConfig = getSiteConfig();
  const INITIAL_POSTS = siteConfig.blog.initialPosts;
  const POSTS_PER_LOAD = siteConfig.blog.postsPerLoad;
  const [visibleCount, setVisibleCount] = useState(INITIAL_POSTS);

  const posts = useMemo(() => getAllPosts(), []);
  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + POSTS_PER_LOAD);
  };

  return (
    <FlowContext.Provider value>
      <SEO meta={buildBlogMeta()} />
      <Section className="page-head">
        <div className="section-head">
          <h1>{siteConfig.blog.title}</h1>
          <p>{siteConfig.blog.description}</p>
        </div>
      </Section>
      <Section labelledBy="posts-h">
        <h2 id="posts-h" className="sr-only">All articles</h2>
        <div className="grid">
          {visiblePosts.map((post) => (
            <article className="card post-card span-6" key={post.id}>
              {post.image && (
                <a className="m-zoom frame frame--photo post-card__photo" href={`/blog/${post.id}`} tabIndex={-1} aria-hidden="true">
                  <img className="frame__img" src={post.image} alt="" loading="lazy" />
                </a>
              )}
              <p className="t-small muted">
                {post.date} &middot; {post.category} &middot; {post.readTime}
              </p>
              <h3>
                <a href={`/blog/${post.id}`}>{post.title}</a>
              </h3>
              <p className="post-card__excerpt">{stripMarkdown(post.excerpt)}</p>
            </article>
          ))}
        </div>
        {hasMore && (
          <div className="btn-row">
            <button className="btn btn--secondary" type="button" onClick={handleLoadMore}>
              Show older posts
            </button>
          </div>
        )}
      </Section>
    </FlowContext.Provider>
  );
};

export default Blog;
