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
  playsInline = true
}) {
  const videoRef = useRef(null);
  const videoMeta = getContinuousVideoUrls(src);

  // Auto-play and continuous playback loop
  useEffect(() => {
    if (videoRef.current && autoPlay) {
      videoRef.current.defaultMuted = muted;
      videoRef.current.muted = muted;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy fallback: keep muted and ready
        });
      }
    }
  }, [src, autoPlay]);

  // Synchronize dynamic mute/unmute changes from parent
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  // 1. If it's a YouTube / Vimeo embed, or an explicit Google Doc / Slides / Sheets document
  if (videoMeta.isYouTube || videoMeta.isVimeo || (videoMeta.isGDrive && videoMeta.isDoc)) {
    return (
      <iframe
        src={videoMeta.embedUrl}
        title="Cover Media"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block', ...cropStyle, ...style }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  // 2. Continuous Looping HTML5 Video Player for all videos (Google Drive, MP4, WebM, Blobs, uploaded files)
  const primarySrc = videoMeta.isGDrive ? videoMeta.streamUrl : (videoMeta.streamUrl || src);
  const secondarySrc = videoMeta.isGDrive ? videoMeta.directDownloadUrl : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...cropStyle, ...style }}>
      <video
        ref={videoRef}
        poster={poster}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          background: '#000000',
          ...cropStyle
        }}
        onEnded={(e) => {
          // Continuous loop without any breaks or pausing
          try {
            e.target.currentTime = 0;
            const p = e.target.play();
            if (p !== undefined) p.catch(() => {});
          } catch (err) {}
        }}
        onTimeUpdate={(e) => {
          // Seamless loop before final frame freeze
          if (loop && e.target.duration > 0 && e.target.currentTime >= e.target.duration - 0.15) {
            try {
              e.target.currentTime = 0;
              const p = e.target.play();
              if (p !== undefined) p.catch(() => {});
            } catch (err) {}
          }
        }}
      >
        <source src={primarySrc} type="video/mp4" />
        {secondarySrc && <source src={secondarySrc} type="video/mp4" />}
        {videoMeta.altStreamUrl && <source src={videoMeta.altStreamUrl} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
