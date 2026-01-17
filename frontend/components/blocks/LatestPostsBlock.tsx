import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import type { LatestPostsBlock as LatestPostsBlockType } from '../../types';
import { getAllPosts } from '../../utils/posts';

interface LatestPostsBlockProps {
  block: LatestPostsBlockType;
}

const LatestPostsBlock: React.FC<LatestPostsBlockProps> = ({ block }) => {
  const latestPosts = useMemo(
    () => getAllPosts().slice(0, block.limit || 3),
    [block.limit]
  );

  return (
    <section className="mb-24">
      <div className="flex justify-between items-end mb-10">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 dark:text-zinc-400">
          {block.title || 'Latest Articles'}
        </h2>
        {block.showViewAll !== false && (
          <Link
            to="/blog"
            className="text-xs font-bold border-b-2 border-black dark:border-white pb-1 uppercase tracking-widest hover:opacity-50 transition-opacity dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
          >
            View all
          </Link>
        )}
      </div>
      <div className="space-y-12">
        {latestPosts.map((post) => (
          <article key={post.id} className="group">
            <span className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-widest block mb-2">
              {post.date}
            </span>
            <Link to={`/blog/${post.id}`} className="focus:outline-none group-focus:underline">
              <h3 className="text-2xl md:text-3xl font-bold group-hover:text-gray-700 dark:group-hover:text-zinc-300 transition-colors dark:text-white">
                {post.title}
              </h3>
            </Link>
            <div
              className="mt-3 text-lg text-gray-700 dark:text-zinc-300 leading-relaxed max-w-3xl prose prose-lg dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: marked.parse(post.excerpt) as string }}
            />
          </article>
        ))}
      </div>
    </section>
  );
};

export default LatestPostsBlock;
