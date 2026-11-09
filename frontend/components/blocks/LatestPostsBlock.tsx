import React, { useContext, useMemo } from 'react';
import { stripMarkdown } from '../../utils/meta';
import type { LatestPostsBlock as LatestPostsBlockType } from '../../types';
import { getAllPosts } from '../../utils/posts';
import Section, { BareContext } from '../Section';

interface LatestPostsBlockProps {
  block: LatestPostsBlockType;
}

const LatestPostsBlock: React.FC<LatestPostsBlockProps> = ({ block }) => {
  const latestPosts = useMemo(
    () => getAllPosts().slice(0, block.limit || 3),
    [block.limit]
  );

  // Paired into another block's section it is a label, not a heading: one h2 a section.
  const paired = useContext(BareContext);

  return (
    <Section hm={2} id="blog" labelledBy="blog-h">
      <div className="section-head section-head--split">
        <div>
          {paired ? (
            <p className="t-label" id="blog-h">{block.title || 'Latest articles'}</p>
          ) : (
            <h2 id="blog-h">{block.title || 'Latest articles'}</h2>
          )}
        </div>
        {block.showViewAll !== false && (
          <a className="link" href="/blog">
            See all articles
          </a>
        )}
      </div>
      <div className="grid">
        {latestPosts.map((post) => (
          <article className="card post-card span-6" key={post.id}>
            {post.image && (
              <a className="m-zoom frame frame--photo post-card__photo" href={`/blog/${post.id}`} tabIndex={-1} aria-hidden="true">
                <img className="frame__img" src={post.image} alt="" loading="lazy" />
              </a>
            )}
            <p className="t-small muted">{post.date}</p>
            <h3>
              <a href={`/blog/${post.id}`}>{post.title}</a>
            </h3>
            <p className="post-card__excerpt">{stripMarkdown(post.excerpt)}</p>
          </article>
        ))}
      </div>
    </Section>
  );
};

export default LatestPostsBlock;
