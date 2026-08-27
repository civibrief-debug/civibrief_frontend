"use client";

import React, { useState } from 'react';
import { resolveArticleMedia, getDefaultArticleImage, parseGoogleDriveUrl } from '../lib/videoUtils';
import ContinuousCoverVideo from './ContinuousCoverVideo';

/**
 * Helper to safely resolve crop positioning without letting numeric crop dimensions
 * override the 100% full-width cover image display.
 */
function getResolvedCropStyle(crop) {
  if (!crop || typeof crop !== 'object') return {};

  // If already explicit CSS positioning styles
  if (crop.objectPosition || crop.transform || crop.clipPath) {
    return {
      objectPosition: crop.objectPosition,
      transform: crop.transform,
      clipPath: crop.clipPath
    };
  }

  // If react-image-crop percentage or pixel coordinates
  if (typeof crop.x === 'number' && typeof crop.y === 'number') {
    // If it's the full default 0,0 crop, return neutral
    if (crop.x === 0 && crop.y === 0 && (crop.width === 100 || !crop.width)) {
      return { objectPosition: 'center center' };
    }
    return { objectPosition: `${crop.x}% ${crop.y}%` };
  }

  return {};
}

/**
 * Universal Article Media Cover Component
 * Standardized across Homepage cards, Hero sections, Stacked feed, Article Modal, and Detail View.
 */
export default function ArticleMediaCover({
  article,
  className = '',
  style = {},
  imageStyle = {},
  videoStyle = {},
  cropStyle = null,
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
  playsInline = true,
  priority = false,
  onClick = null,
  fallbackCategory = '',
  showCaption = false,
  captionStyle = {},
  alt = '',
  debugContext = ''
}) {
  const [imageError, setImageError] = useState(false);
  const media = resolveArticleMedia(article, fallbackCategory);

  if (media.type === 'none') {
    return null;
  }

  const rawCrop = cropStyle || article?.coverCropStyle || (media.isVideo ? article?.coverVideoCrop : article?.coverImageCrop) || null;
  const effectiveCropStyle = getResolvedCropStyle(rawCrop);
  const effectiveAlt = alt || article?.title || 'Article Cover';
  const defaultPoster = getDefaultArticleImage(article?.category || fallbackCategory);

  // 1. Video / Embed Cover
  if (media.isVideo && media.videoUrl) {
    return (
      <div 
        className={`article-media-cover-container ${className}`}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
          ...style
        }}
        onClick={onClick}
      >
        <ContinuousCoverVideo
          src={media.videoUrl}
          poster={media.posterUrl || defaultPoster}
          style={{ width: '100%', height: '100%', ...videoStyle }}
          cropStyle={effectiveCropStyle}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          controls={controls}
          playsInline={playsInline}
          onClick={onClick}
        />
        {showCaption && article?.photoCaption && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted, #71717a)', marginTop: '8px', textAlign: 'center', fontStyle: 'italic', ...captionStyle }}>
            {article.photoCaption}
          </p>
        )}
      </div>
    );
  }

  // 2. Static Image Cover (with resilient error recovery and guaranteed full-cover width)
  const imageSrc = imageError ? defaultPoster : (media.formattedImageUrl || media.imageUrl || defaultPoster);

  return (
    <div 
      className={`article-media-cover-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '260px',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      onClick={onClick}
    >
      <img
        src={imageSrc}
        alt={effectiveAlt}
        referrerPolicy="no-referrer"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className="article-media-image"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          ...effectiveCropStyle,
          ...imageStyle
        }}
        onError={(e) => {
          const gdrive = parseGoogleDriveUrl(media.imageUrl || article?.imageUrl);
          if (gdrive && !e.currentTarget.dataset.retried) {
            e.currentTarget.dataset.retried = '1';
            e.currentTarget.src = gdrive.proxyImageUrl || `https://lh3.googleusercontent.com/d/${gdrive.fileId}`;
          } else if (!imageError) {
            setImageError(true);
            e.currentTarget.src = defaultPoster;
          }
        }}
      />
      {showCaption && (article?.photoCaption || article?.imageCaption) && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #71717a)', marginTop: '8px', textAlign: 'center', fontStyle: 'italic', ...captionStyle }}>
          {article.photoCaption || article.imageCaption}
        </p>
      )}
    </div>
  );
}
