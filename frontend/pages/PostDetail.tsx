import React, { useMemo, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { marked } from 'marked';
import Section, { FlowContext } from '../components/Section';
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
    <FlowContext.Provider value>
      <SEO meta={buildPostMeta(post)} />
      <Section className="page-head post-head" labelledBy="post-h">
        <a className="link" href="/blog">
          All articles
        </a>
        <div className="section-head">
          <p className="t-small muted">
            {post.date} &middot; {post.category} &middot; {post.readTime}
          </p>
          <h1 id="post-h">{post.title}</h1>
        </div>
      </Section>
      <Section className="post-body">
        <article className="prose prose--post" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        <SocialShare
          url={getCanonicalUrl(`/blog/${post.id}`)}
          title={post.title}
          description={post.excerpt}
        />
      </Section>
      <NewsletterBlock
        centered
        block={{
          _block: 'newsletter',
          title: 'Enjoyed this article?',
          description: 'Subscribe to the newsletter for more on engineering leadership, data and career growth.',
        }}
      />
    </FlowContext.Provider>
  );
};

export default PostDetail;
