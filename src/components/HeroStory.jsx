import React from 'react';
import ArticleMediaCover from './ArticleMediaCover';

export const HeroStory = ({ story, onArticleClick }) => {
  if (!story) return null;

  return (
    <article className="hero-column col-divider">
      <div className="hero-image-wrapper" onClick={() => onArticleClick && onArticleClick(story)}>
        <ArticleMediaCover
          article={story}
          className="hero-image"
          style={{ width: '100%', height: '100%', cursor: 'pointer' }}
          autoPlay={true}
          muted={true}
          loop={true}
          controls={false}
          playsInline={true}
          priority={true}
          onClick={() => onArticleClick && onArticleClick(story)}
        />
      </div>

      <div className="category-badge">{story.category}</div>

      <h1 className="hero-title" onClick={() => onArticleClick && onArticleClick(story)}>
        {story.title}
      </h1>

      <p className="hero-excerpt">
        {story.summary || story.subtitle || story.excerpt}
      </p>

      <div className="author-attribution">
        {story.author}
      </div>
    </article>
  );
};
