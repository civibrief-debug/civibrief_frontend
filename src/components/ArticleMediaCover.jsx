"use client";

import React, { useState } from 'react';
import { resolveArticleMedia, getDefaultArticleImage, parseGoogleDriveUrl } from '../lib/videoUtils';
import ContinuousCoverVideo from './ContinuousCoverVideo';

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

  // Extract and sanitize crop styles so numeric dimensions (e.g. { width: 100, height: 100 }) NEVER shrink the image to 100px
  const rawCrop = cropStyle || article?.coverCropStyle || (media.isVideo ? article?.coverVideoCrop : article?.coverImageCrop) || {};
  const effectiveCrop = {};
  if (rawCrop && typeof rawCrop === 'object') {
    if (rawCrop.objectPosition) {
      effectiveCrop.objectPosition = rawCrop.objectPosition;
    } else if (rawCrop.x !== undefined && rawCrop.y !== undefined && (rawCrop.x !== 0 || rawCrop.y !== 0)) {
      effectiveCrop.objectPosition = `${rawCrop.x}% ${rawCrop.y}%`;
    }
    if (rawCrop.transform) effectiveCrop.transform = rawCrop.transform;
  }

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
          style={{ width: '100%', height: '100%', objectFit: 'cover', ...videoStyle }}
          cropStyle={effectiveCrop}
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

  // 2. Static Image Cover (with resilient error recovery & full cover sizing)
  const imageSrc = imageError ? defaultPoster : (media.formattedImageUrl || media.imageUrl || defaultPoster);

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
          ...effectiveCrop,
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
