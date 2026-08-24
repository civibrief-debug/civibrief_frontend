import React from 'react';
import { formatCoverImageUrl, parseGoogleDriveUrl, isArticleCoverVideo, getArticleCoverVideoUrl } from '../lib/videoUtils';
import ContinuousCoverVideo from './ContinuousCoverVideo';

export const HeroStory = ({ story, onArticleClick }) => {
  if (!story) return null;

  return (
    <article className="hero-column col-divider">
      <div className="hero-image-wrapper" onClick={() => onArticleClick(story)}>
        {isArticleCoverVideo(story) ? (
          <ContinuousCoverVideo
            src={getArticleCoverVideoUrl(story)}
            cropStyle={story.coverCropStyle || story.coverVideoCrop}
            autoPlay={true}
            muted={true}
            loop={true}
            controls={false}
            playsInline={true}
            onClick={() => onArticleClick(story)}
            className="hero-image"
            style={{ width: '100%', height: '100%', cursor: 'pointer' }}
          />
        ) : (
          <img 
            src={formatCoverImageUrl(story.imageUrl) || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"} 
            alt={story.title} 
            referrerPolicy="no-referrer"
            className="hero-image" 
            loading="eager" 
            onClick={() => onArticleClick(story)}
            style={{ cursor: 'pointer', ...(story.coverCropStyle || {}) }}
            onError={(e) => {
              const gdrive = parseGoogleDriveUrl(story.imageUrl);
              if (gdrive && !e.currentTarget.dataset.retried) {
                e.currentTarget.dataset.retried = '1';
                e.currentTarget.src = gdrive.proxyImageUrl || `https://lh3.googleusercontent.com/d/${gdrive.fileId}`;
              }
            }}
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
