'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Megaphone, Sparkles, ExternalLink, MousePointerClick, Play, Video, LayoutGrid, Image as ImageIcon, Volume2, VolumeX } from 'lucide-react';
import ContinuousCoverVideo from './ContinuousCoverVideo';

const DEFAULT_COLLAGE_ITEMS = [
  {
    id: 'col-1',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    title: 'Deep Reflection',
    tag: 'Featured'
  },
  {
    id: 'col-2',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
    title: 'Joyful Connection',
    tag: 'Community'
  },
  {
    id: 'col-3',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    title: 'Quiet Moments',
    tag: 'Spotlight'
  },
  {
    id: 'col-4',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
    title: 'Collaborative Study',
    tag: 'Education'
  }
];

export default function ArticleAdBanner({
  adConfig = {},
  alignment = 'center',
  label = 'Advertisement',
  contentType = 'placeholder',
  content = '',
  className = ''
}) {
  const align = adConfig.alignment || adConfig.placeholderAdAlignment || alignment || 'center';
  const displayLabel = adConfig.label || adConfig.placeholderAdLabel || label || 'Advertisement';
  const type = adConfig.contentType || adConfig.placeholderAdContentType || contentType || 'placeholder';
  const adContent = adConfig.content !== undefined ? adConfig.content : (adConfig.placeholderAdContent !== undefined ? adConfig.placeholderAdContent : content);
  const redirectUrl = adConfig.targetUrl || adConfig.linkUrl || adConfig.placeholderAdTargetUrl || '';
  const headline = adConfig.headline || adConfig.placeholderAdHeadline || 'Premium Partner Showcase';
  const description = (adConfig.description !== undefined && adConfig.description !== null)
    ? adConfig.description
    : (adConfig.placeholderAdDescription !== undefined && adConfig.placeholderAdDescription !== null
        ? adConfig.placeholderAdDescription
        : '');
  const ctaText = adConfig.ctaText || adConfig.placeholderAdCtaText || 'Learn More ↗';

  const videoAutoplay = adConfig.videoAutoplay ?? true;
  const videoLoop = adConfig.videoLoop ?? true;
  const videoMuted = adConfig.videoMuted ?? true;
  const videoControls = adConfig.videoControls ?? true;

  const isCompact = (align === 'left' || align === 'right');

  // Responsive alignment styling
  let containerStyle = {
    margin: '32px auto',
    maxWidth: '680px',
    width: '100%',
    clear: 'both'
  };

  if (align === 'full_width') {
    containerStyle = {
      margin: '36px 0',
      width: '100%',
      maxWidth: '100%',
      clear: 'both'
    };
  } else if (align === 'left') {
    containerStyle = {
      margin: '12px 24px 18px 0',
      width: '45%',
      maxWidth: '340px',
      float: 'left',
      clear: 'none'
    };
  } else if (align === 'right') {
    containerStyle = {
      margin: '12px 0 18px 24px',
      width: '45%',
      maxWidth: '340px',
      float: 'right',
      clear: 'none'
    };
  }

  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef(null);

  const handleBannerClick = () => {
    if (redirectUrl && redirectUrl.startsWith('http')) {
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    // If YouTube / Vimeo iframe
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        if (nextMuted) {
          // YouTube Mute
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
          // Vimeo Mute
          iframeRef.current.contentWindow.postMessage('{"method":"setMuted","value":true}', '*');
        } else {
          // YouTube Unmute & Play
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          // Vimeo Unmute & Play
          iframeRef.current.contentWindow.postMessage('{"method":"setMuted","value":false}', '*');
          iframeRef.current.contentWindow.postMessage('{"method":"setVolume","value":1}', '*');
          iframeRef.current.contentWindow.postMessage('{"method":"play"}', '*');
        }
      } catch (err) {}
    }
  };

  // Resume video playback when switching back to tab or refreshing
  useEffect(() => {
    const handleResumePlayback = () => {
      if (document.visibilityState === 'visible' && iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          iframeRef.current.contentWindow.postMessage('{"method":"play"}', '*');
        } catch (e) {}
      }
    };

    document.addEventListener('visibilitychange', handleResumePlayback);
    window.addEventListener('focus', handleResumePlayback);

    // Initial check & periodic heartbeat to ensure continuous loop without pausing
    const interval = setInterval(handleResumePlayback, 3000);

    return () => {
      document.removeEventListener('visibilitychange', handleResumePlayback);
      window.removeEventListener('focus', handleResumePlayback);
      clearInterval(interval);
    };
  }, []);

  // Helper to extract embed video URL (YouTube, Vimeo, etc.) with zero controls & continuous loop
  const parseVideoEmbedUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const cleanUrl = rawUrl.trim();

    // YouTube - Silent Looping Background Video (No play/pause buttons, no controls, no branding)
    const ytMatch = cleanUrl.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&playsinline=1&enablejsapi=1&fs=0&color=white&autohide=1`;
    }

    // Vimeo - Silent Looping Background Video (No controls)
    const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+))/i) || cleanUrl.match(/player\.vimeo\.com\/video\/(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&background=1&controls=0&autopause=0`;
    }

    return null;
  };

  const videoEmbedUrl = type === 'video' ? parseVideoEmbedUrl(adContent) : null;

  return (
    <aside
      className={`article-ad-banner-wrapper ${className}`}
      style={{
        ...containerStyle,
        display: 'block',
        boxSizing: 'border-box'
      }}
      aria-label={displayLabel}
    >
      <div 
        style={{
          background: 'var(--bg-secondary, #0f172a)',
          border: '1.5px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          borderRadius: '12px',
          padding: isCompact ? '12px 14px' : '16px 20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (redirectUrl) {
            e.currentTarget.style.borderColor = '#a855f7';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(168, 85, 247, 0.25)';
          }
        }}
        onMouseLeave={(e) => {
          if (redirectUrl) {
            e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.12))';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
          }
        }}
      >
        {/* Ad Disclosure Tag Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          paddingBottom: '6px'
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 800,
            color: 'var(--text-muted, #94a3b8)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            {type === 'video' ? (
              <Video size={12} style={{ color: '#ef4444' }} />
            ) : type === 'collage' ? (
              <LayoutGrid size={12} style={{ color: '#a855f7' }} />
            ) : (
              <Megaphone size={12} style={{ color: 'var(--accent-emerald, #10b981)' }} />
            )}
            <span>{displayLabel}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {redirectUrl && (
              <span 
                onClick={handleBannerClick}
                style={{
                  fontSize: '9px',
                  color: '#38bdf8',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  cursor: 'pointer'
                }}
              >
                <ExternalLink size={10} /> Visit Link
              </span>
            )}
            <span style={{
              fontSize: '9px',
              color: 'var(--text-muted, #64748b)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Sponsor
            </span>
          </div>
        </div>

        {/* 0. MULTI-MEDIA COLLAGE AD FORMAT (2x2 Quad Grid, 1x2, 1+2, etc.) */}
        {type === 'collage' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* The Responsive Collage Grid Box (Square 1:1 on 2x2, perfectly fitted) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: (adConfig.collageLayout === 'grid_1x2' || adConfig.collageLayout === 'grid_2x2' || !adConfig.collageLayout) 
                  ? 'repeat(2, 1fr)' 
                  : (adConfig.collageLayout === 'grid_3_cols' ? 'repeat(3, 1fr)' : (adConfig.collageLayout === 'grid_1_plus_2' ? '1.2fr 0.8fr' : 'repeat(3, 1fr)')),
                gridTemplateRows: (adConfig.collageLayout === 'grid_2x2' || !adConfig.collageLayout)
                  ? 'repeat(2, 1fr)'
                  : (adConfig.collageLayout === 'grid_1_plus_2' ? 'repeat(2, 1fr)' : (adConfig.collageLayout === 'grid_1_plus_3' ? '1.2fr 1fr' : '1fr')),
                gap: adConfig.collageGap || '6px',
                borderRadius: adConfig.collageRadius || '10px',
                overflow: 'hidden',
                background: 'rgba(0, 0, 0, 0.4)',
                aspectRatio: adConfig.collageLayout === 'grid_3_cols' ? '16 / 7' : (adConfig.collageLayout === 'grid_1x2' ? '16 / 9' : '1 / 1'),
                width: '100%',
                maxHeight: isCompact ? '320px' : (adConfig.collageHeight || '420px')
              }}
            >
              {(Array.isArray(adConfig.collageItems) && adConfig.collageItems.length > 0 ? adConfig.collageItems : DEFAULT_COLLAGE_ITEMS).map((item, idx) => {
                const itemSpanStyle = {};
                if (adConfig.collageLayout === 'grid_1_plus_2' && idx === 0) {
                  itemSpanStyle.gridRow = '1 / 3';
                } else if (adConfig.collageLayout === 'grid_1_plus_3' && idx === 0) {
                  itemSpanStyle.gridColumn = '1 / 4';
                }

                const itemTarget = item.targetUrl || redirectUrl;
                const isVideo = item.mediaType === 'video' || /\.(mp4|webm|ogg)(\?.*)?$/i.test(item.url || '');

                return (
                  <div
                    key={item.id || idx}
                    onClick={() => {
                      if (itemTarget && itemTarget.startsWith('http')) {
                        window.open(itemTarget, '_blank', 'noopener,noreferrer');
                      } else {
                        handleBannerClick();
                      }
                    }}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '4px',
                      background: '#020617',
                      cursor: itemTarget ? 'pointer' : 'default',
                      ...itemSpanStyle
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget.querySelector('img, video');
                      if (el) el.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget.querySelector('img, video');
                      if (el) el.style.transform = 'scale(1)';
                    }}
                  >
                    {isVideo && item.url ? (
                      <video
                        src={item.url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    ) : (
                      <img
                        src={item.url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80'}
                        alt={item.title || `Collage Frame ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          transition: 'transform 0.3s ease'
                        }}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    )}

                    {/* Tag / Badge Overlay on Tile */}
                    {(item.tag || item.title) && (
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#f8fafc',
                        fontSize: isCompact ? '8.5px' : '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        pointerEvents: 'none',
                        maxWidth: '85%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.tag || item.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Collage Info & CTA Block (Stacked vertically for Left/Right float, side-by-side for Center) */}
            {isCompact ? (
              /* Compact Vertical Card (Like Canva ad format in Right/Left float) */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '6px',
                paddingTop: '4px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
                  {headline}
                </div>
                {description && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.3, maxWidth: '100%' }}>
                    {description}
                  </div>
                )}

                {redirectUrl && (
                  <button
                    type="button"
                    onClick={handleBannerClick}
                    style={{
                      width: '100%',
                      marginTop: '4px',
                      background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      boxShadow: '0 3px 10px rgba(168, 85, 247, 0.35)'
                    }}
                  >
                    <MousePointerClick size={12} />
                    <span>{ctaText || 'Get Started Free ↗'}</span>
                  </button>
                )}
              </div>
            ) : (
              /* Wide Horizontal Bar (Center / Full Width) */
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                paddingTop: '6px'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>
                    {headline}
                  </div>
                  {description && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', maxWidth: '440px', lineHeight: 1.35 }}>
                      {description}
                    </div>
                  )}
                </div>

                {redirectUrl && (
                  <button
                    type="button"
                    onClick={handleBannerClick}
                    style={{
                      background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(168, 85, 247, 0.35)'
                    }}
                  >
                    <MousePointerClick size={12} />
                    <span>{ctaText || 'Explore Showcase ↗'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : type === 'video' && adContent ? (
          <div
            onClick={handleBannerClick}
            style={{
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#000',
              position: 'relative',
              cursor: redirectUrl ? 'pointer' : 'default'
            }}
          >
            {/* Floating Volume / Mute Toggle Button (Top-Right Badge) */}
            <button
              type="button"
              onClick={toggleMute}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 20,
                background: 'rgba(9, 13, 22, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isMuted ? '#cbd5e1' : '#38bdf8',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.7)',
                transition: 'all 0.2s ease',
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              title={isMuted ? "Click to Unmute" : "Click to Mute"}
              aria-label={isMuted ? "Unmute video ad" : "Mute video ad"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {videoEmbedUrl ? (
              <div style={{ position: 'relative', width: '100%', height: isCompact ? '220px' : '280px', overflow: 'hidden', background: '#000' }}>
                <iframe
                  ref={iframeRef}
                  src={videoEmbedUrl}
                  title={displayLabel}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '145%',
                    height: '145%',
                    transform: 'translate(-50%, -50%)',
                    border: 'none',
                    display: 'block',
                    pointerEvents: 'none'
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
                {/* Transparent click shield: Prevents hover states inside YouTube while routing clicks to sponsor */}
                <div
                  onClick={handleBannerClick}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 5,
                    cursor: redirectUrl ? 'pointer' : 'default'
                  }}
                />
              </div>
            ) : (
              <div style={{ width: '100%', height: isCompact ? '220px' : '280px' }}>
                <ContinuousCoverVideo
                  src={adContent}
                  controls={false}
                  autoPlay={true}
                  muted={isMuted}
                  loop={true}
                  playsInline={true}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>
            )}

            {/* Video Footer Banner with Info & Clickable CTA */}
            <div style={{
              padding: '12px 14px',
              background: 'rgba(15, 23, 42, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                  {headline}
                </div>
                {description && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '420px', lineHeight: 1.3 }}>
                    {description}
                  </div>
                )}
              </div>

              {redirectUrl && (
                <button
                  type="button"
                  onClick={handleBannerClick}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <Play size={11} fill="#fff" />
                  <span>{ctaText || 'Visit Sponsor ↗'}</span>
                </button>
              )}
            </div>
          </div>
        ) : type === 'image' && adContent ? (
          /* 2. CUSTOM IMAGE BANNER FORMAT */
          <div 
            onClick={handleBannerClick}
            style={{ textAlign: 'center', width: '100%', overflow: 'hidden', position: 'relative', cursor: redirectUrl ? 'pointer' : 'default' }}
          >
            <img
              src={adContent}
              alt={displayLabel}
              style={{
                width: '100%',
                maxHeight: '280px',
                objectFit: 'cover',
                borderRadius: '8px',
                display: 'block'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {redirectUrl && (
              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0, 0, 0, 0.85)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}>
                <MousePointerClick size={12} color="#34d399" />
                <span>{ctaText || 'Visit Partner ↗'}</span>
              </div>
            )}
          </div>
        ) : type === 'html' && adContent ? (
          /* 3. CUSTOM HTML EMBED FORMAT */
          <div
            className="custom-ad-html-container"
            style={{ fontSize: '14px', lineHeight: 1.5 }}
            dangerouslySetInnerHTML={{ __html: adContent }}
          />
        ) : (
          /* 4. INTERACTIVE SHOWCASE BANNER BOX */
          <div 
            onClick={handleBannerClick}
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(56, 189, 248, 0.08) 100%)',
              border: '1px dashed var(--border-color, rgba(255, 255, 255, 0.18))',
              borderRadius: '8px',
              padding: '20px 18px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '110px',
              cursor: redirectUrl ? 'pointer' : 'default'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-primary, #f8fafc)',
              fontWeight: 800,
              fontSize: '15px',
              fontFamily: 'var(--font-sans, system-ui)'
            }}>
              <Sparkles size={16} style={{ color: 'var(--accent-emerald, #10b981)' }} />
              <span>{headline}</span>
            </div>

            <p style={{
              margin: 0,
              fontSize: '13px',
              color: 'var(--text-muted, #94a3b8)',
              maxWidth: '480px',
              lineHeight: 1.45
            }}>
              {description}
            </p>

            {redirectUrl && (
              <div style={{
                marginTop: '6px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
              }}>
                <MousePointerClick size={14} />
                <span>{ctaText}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
