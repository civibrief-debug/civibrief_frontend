"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getContinuousVideoUrls } from '../lib/videoUtils';

export default function ContinuousCoverVideo({
  src,
  poster,
  style = {},
  cropStyle = {},
  className = '',
  controls = true,
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  onClick
}) {
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const cleanSrc = (typeof src === 'string' ? src.trim() : '') || '';
  const videoMeta = getContinuousVideoUrls(cleanSrc);

  // Reset error state on src change
  useEffect(() => {
    setVideoError(false);
  }, [src]);

  if (!cleanSrc) {
    return null;
  }

  // Auto-play and continuous playback loop
  useEffect(() => {
    if (videoRef.current && autoPlay && !videoError) {
      videoRef.current.defaultMuted = muted;
      videoRef.current.muted = muted;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy fallback: keep muted and ready
        });
      }
    }
  }, [src, autoPlay, muted, videoError]);

  // Synchronize dynamic mute/unmute changes from parent
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  // 1. If it's a YouTube / Vimeo embed, Google Drive document, or if HTML5 video errored
  const isEmbedSource = videoMeta.isYouTube || videoMeta.isVimeo || videoMeta.isEmbed || (videoMeta.isGDrive && videoMeta.isDoc) || (videoError && videoMeta.embedUrl && !videoMeta.isGDrive);

  if (isEmbedSource && videoMeta.embedUrl) {
    return (
      <div 
        style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#000000', ...cropStyle, ...style }}
        onClick={onClick}
      >
        <iframe
          src={videoMeta.embedUrl}
          title="Cover Media"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#000000', pointerEvents: onClick ? 'none' : 'auto', ...cropStyle, ...style }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
        {/* Transparent click catcher overlay when clickable as article cover */}
        {onClick && (
          <div 
            style={{ 
              position: 'absolute', 
              inset: 0, 
              zIndex: 10, 
              cursor: 'pointer', 
              background: 'transparent' 
            }} 
            onClick={onClick} 
            title="Open Content"
          />
        )}
      </div>
    );
  }

  // 2. Continuous Looping HTML5 Video Player for all videos (Google Drive, Pexels, MP4, WebM, Blobs, uploaded files)
  const streamSrc = videoMeta.streamUrl || src;

  return (
    <div 
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#000000', ...cropStyle, ...style }}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        src={streamSrc}
        poster={poster}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        preload="auto"
        className={className}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          background: '#000000',
          cursor: onClick ? 'pointer' : 'default',
          ...cropStyle
        }}
        onError={() => {
          if (!videoError && videoMeta.proxyStreamUrl && streamSrc !== videoMeta.proxyStreamUrl) {
            if (videoRef.current) {
              videoRef.current.src = videoMeta.proxyStreamUrl;
              videoRef.current.load();
              videoRef.current.play().catch(() => {});
            }
          } else if (!videoError && videoMeta.directStreamUrl && streamSrc !== videoMeta.directStreamUrl) {
            if (videoRef.current) {
              videoRef.current.src = videoMeta.directStreamUrl;
              videoRef.current.load();
              videoRef.current.play().catch(() => {});
            }
          } else {
            setVideoError(true);
          }
        }}
        onClick={onClick}
        onEnded={(e) => {
          try {
            e.target.currentTime = 0;
            const p = e.target.play();
            if (p !== undefined) p.catch(() => {});
          } catch (err) {}
        }}
        onTimeUpdate={(e) => {
          if (loop && e.target.duration > 0 && e.target.currentTime >= e.target.duration - 0.15) {
            try {
              e.target.currentTime = 0;
              const p = e.target.play();
              if (p !== undefined) p.catch(() => {});
            } catch (err) {}
          }
        }}
      >
        <source src={streamSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Transparent overlay to guarantee cover video clicks open the article / ad destination */}
      {onClick && !controls && (
        <div 
          style={{ 
            position: 'absolute', 
            inset: 0, 
            zIndex: 10, 
            cursor: 'pointer', 
            background: 'transparent' 
          }} 
          onClick={onClick} 
          title="Open Content"
        />
      )}
    </div>
  );
}

