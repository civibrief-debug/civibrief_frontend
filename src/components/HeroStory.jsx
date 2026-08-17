import React from 'react';

export const HeroStory = ({ story, onArticleClick }) => {
  if (!story) return null;

  return (
    <article className="hero-column col-divider">
      <div className="hero-image-wrapper" onClick={() => onArticleClick(story)}>
        {story.coverMediaType === 'video' && story.videoUrl ? (
          <video 
            src={story.videoUrl} 
            autoPlay
            muted
            loop
            playsInline
            className="hero-image" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', ...story.coverCropStyle }}
          />
        ) : (
          <img 
            src={story.imageUrl} 
            alt={story.title} 
            className="hero-image" 
            loading="eager" 
            style={story.coverCropStyle || undefined}
          />
        )}
      </div>

      <div className="category-badge">{story.category}</div>

      <h1 className="hero-title" onClick={() => onArticleClick(story)}>
        {story.title}
      </h1>

      <p className="hero-excerpt">
        {story.excerpt}
      </p>

      <div className="author-attribution">
        {story.author}
      </div>
    </article>
  );
};
