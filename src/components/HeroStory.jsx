import React from 'react';
import { formatCoverImageUrl, parseGoogleDriveUrl } from '../lib/videoUtils';
import ContinuousCoverVideo from './ContinuousCoverVideo';

export const HeroStory = ({ story, onArticleClick }) => {
  if (!story) return null;

  return (
    <article className="hero-column col-divider">
      <div className="hero-image-wrapper" onClick={() => onArticleClick(story)}>
        {story.coverMediaType === 'video' && story.videoUrl ? (
          <ContinuousCoverVideo
            src={story.videoUrl}
            cropStyle={story.coverCropStyle}
            autoPlay={true}
            muted={true}
            loop={true}
            controls={false}
            playsInline={true}
            className="hero-image"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <img 
            src={formatCoverImageUrl(story.imageUrl)} 
            alt={story.title} 
            referrerPolicy="no-referrer"
            className="hero-image" 
            loading="eager" 
            style={story.coverCropStyle || undefined}
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
