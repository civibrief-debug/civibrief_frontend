"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  // Safe play attempt function supporting Safari, iOS, Chrome, Edge
  const attemptPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !autoPlay || videoError) return;

    try {
      video.defaultMuted = muted;
      video.muted = muted;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If unmuted autoplay was blocked by Safari/iOS, force muted and retry
          if (!video.muted) {
            video.muted = true;
            video.play().catch(() => {});
          }
        });
      }
    } catch (err) {}
  }, [autoPlay, muted, videoError]);

  // Auto-play and continuous playback loop with smart viewport streaming
  useEffect(() => {
    attemptPlay();

    let observer = null;
    const video = videoRef.current;
    if (typeof IntersectionObserver !== 'undefined' && video) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            attemptPlay();
          } else {
            if (video && !video.paused) {
              try { video.pause(); } catch (e) {}
            }
          }
        });
      }, { threshold: 0.05 });
      observer.observe(video);
    }

    // iOS Safari Low-Power-Mode / User Gesture Recovery
    const handleFirstUserInteraction = () => {
      if (video && video.paused && autoPlay && !videoError) {
        attemptPlay();
      }
    };

    window.addEventListener('touchstart', handleFirstUserInteraction, { passive: true, once: true });
    window.addEventListener('click', handleFirstUserInteraction, { passive: true, once: true });

    return () => {
      if (observer && video) observer.unobserve(video);
      window.removeEventListener('touchstart', handleFirstUserInteraction);
      window.removeEventListener('click', handleFirstUserInteraction);
    };
  }, [src, attemptPlay, autoPlay, videoError]);

  // Synchronize dynamic mute/unmute changes from parent
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
      videoRef.current.defaultMuted = muted;
    }
  }, [muted]);

  if (!cleanSrc) {
    return null;
  }

  // 1. If it's a genuine YouTube / Vimeo / Dailymotion / Loom embed or Google Drive document preview
  const isEmbedSource = (videoMeta.isYouTube || videoMeta.isVimeo || videoMeta.isEmbed || (videoMeta.isGDrive && videoMeta.isDoc)) && Boolean(videoMeta.embedUrl);

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

  // 2. If video playback encounters an error, fallback gracefully to the poster image (NEVER an iframe that causes 'refused to connect')
  if (videoError) {
    const fallbackImage = poster || (typeof src === 'string' && /\.(jpg|jpeg|png|webp|gif|svg|avif)/i.test(src) ? src : 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80');
    return (
      <div 
        style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#000000', ...cropStyle, ...style }}
        onClick={onClick}
      >
        <img
          src={fallbackImage}
          alt="Media Cover"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...cropStyle }}
          referrerPolicy="no-referrer"
        />
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

  // 3. Continuous Looping HTML5 Video Player for all videos (Google Drive, Pexels, MP4, WebM, Blobs, uploaded files)
  const streamSrc = videoMeta.streamUrl || src;

  return (
    <div 
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#000000', ...cropStyle, ...style }}
      onClick={onClick}
    >
      {/* Instant 0ms poster image backdrop: Guarantees zero blank screen or buffering lag */}
      {poster && (
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            pointerEvents: 'none',
            ...cropStyle
          }}
        />
      )}

      <video
        ref={videoRef}
        src={streamSrc}
        poster={poster}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="metadata"
        className={className}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          cursor: onClick ? 'pointer' : 'default',
          ...cropStyle
        }}
        onLoadedData={attemptPlay}
        onCanPlay={attemptPlay}
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
        <source src={streamSrc} />
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


