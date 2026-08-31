'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Megaphone, ExternalLink } from 'lucide-react';
import { formatCoverImageUrl } from '../lib/videoUtils';
import ContinuousCoverVideo from './ContinuousCoverVideo';

// Global singletons for instant 0ms memory cache across all page navigations
let globalLiveAdsMemory = null;
let globalLiveAdsListeners = new Set();

export const getCachedLiveAds = () => {
  if (globalLiveAdsMemory && globalLiveAdsMemory.length > 0) return globalLiveAdsMemory;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('daily_brief_cached_ads_v3');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          globalLiveAdsMemory = parsed;
          return parsed;
        }
      }
    } catch (e) {}
  }
  return [];
};

export const fetchLiveHomepageAds = async () => {
  try {
    const res = await fetch('/api/db/homepage-ads');
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.success && Array.isArray(json.data)) {
      globalLiveAdsMemory = json.data;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('daily_brief_cached_ads_v3', JSON.stringify(json.data));
        } catch (e) {}
      }
      globalLiveAdsListeners.forEach(listener => listener(json.data));
      return json.data;
    }
  } catch (err) {
    console.warn("Failed to fetch live ads:", err?.message || err);
  }
  return null;
};

// Hook for components needing reactive ads list
export function useLiveAds() {
  const [ads, setAds] = useState(() => getCachedLiveAds());

  useEffect(() => {
    // 1. Subscribe to updates
    const handleUpdate = (updatedAds) => {
      if (Array.isArray(updatedAds)) {
        setAds(updatedAds);
      }
    };
    globalLiveAdsListeners.add(handleUpdate);

    // 2. Fetch fresh data on mount
    fetchLiveHomepageAds();

    // 3. Auto-sync periodically every 8 seconds
    const interval = setInterval(() => {
      fetchLiveHomepageAds();
    }, 8000);

    // 4. Sync immediately when tab regains focus or visibility
    const handleFocus = () => fetchLiveHomepageAds();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveHomepageAds();
      }
    };
    const handleStorage = (e) => {
      if (e.key === 'daily_brief_cached_ads_v3' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            globalLiveAdsMemory = parsed;
            setAds(parsed);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('storage', handleStorage);

    return () => {
      globalLiveAdsListeners.delete(handleUpdate);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return ads;
}

// Helper to check if an ad matches a target slot
export const slotMatchesAd = (ad, targetSlot) => {
  if (!ad || !ad.enabled) return false;
  
  const norm = (str) => (str || '').toLowerCase().trim().replace(/^dropzone-/, '');
  const t = norm(targetSlot);

  // Priority 1: Check ad.dropZoneId if defined (Admin single source of truth)
  if (ad.dropZoneId) {
    const z = norm(ad.dropZoneId);
    if (z === t) return true;
    if (t === 'masthead-top' && (z === 'masthead-top' || z === 'masthead')) return true;
    if (t === 'hero-above' && (z === 'hero-above' || z === 'hero-top')) return true;
    if (t === 'hero-bottom' && (z === 'hero-bottom' || z === 'hero-mid')) return true;
    if ((t === 'in-feed-mid' || t === 'feed-row-1' || t === 'feed-1') && (z === 'feed-row-1' || z === 'in-feed-mid' || z === 'feed-1')) return true;
    if ((t === 'feed-row-2' || t === 'feed-2') && (z === 'feed-row-2' || z === 'feed-2')) return true;
    if (t === 'sidebar-top' && (z === 'sidebar-top' || z === 'rail-top' || z === 'right-sidebar-top')) return true;
    if ((t === 'sidebar-sticky' || t === 'sidebar-bottom') && (z === 'sidebar-bottom' || z === 'sidebar-sticky' || z === 'rail-bottom')) return true;
    if (t === 'deep-dives-top' && (z === 'deep-dives-top' || z === 'deep-dives')) return true;
    if (t === 'footer-floating' && (z === 'footer-floating' || z === 'floating-footer')) return true;
    if (t === 'left-rail' && (z === 'left-rail' || z === 'dropzone-left-rail')) return true;
    if (t === 'right-rail' && (z === 'right-rail' || z === 'dropzone-right-rail')) return true;
    return false;
  }

  // Priority 2: Check ad.slotId only if dropZoneId is absent
  if (ad.slotId) {
    const s = norm(ad.slotId);
    if (s === t) return true;
    if ((t === 'in-feed-mid' || t === 'feed-row-1') && (s === 'in-feed-mid' || s === 'feed-row-1')) return true;
    if ((t === 'sidebar-sticky' || t === 'sidebar-bottom') && (s === 'sidebar-sticky' || s === 'sidebar-bottom')) return true;
    if (t === 'sidebar-top' && (s === 'sidebar-top' || s === 'sidebar')) return true;
    return false;
  }

  return false;
};

/**
 * Universal Live Ad Slot Component
 * Renders all active ads assigned to a given slotId with responsive styling and continuous media playback
 */
export default function LiveAdSlot({ slotId, ads: propAds, style, className }) {
  const syncedAds = useLiveAds();
  const allAds = propAds || syncedAds;

  const matchingAds = useMemo(() => {
    return (allAds || []).filter(a => slotMatchesAd(a, slotId));
  }, [allAds, slotId]);

  if (!matchingAds || matchingAds.length === 0) return null;

  return (
    <div className={`live-ad-slot-container ${className || ''}`} style={{ width: '100%', boxSizing: 'border-box', ...style }}>
      {matchingAds.map((ad, adIdx) => {
        if (ad.customHtml && ad.customHtml.trim()) {
          return (
            <div 
              key={ad.id || `ad-html-${adIdx}`}
              className="homepage-ad-container"
              style={{ width: '100%', maxWidth: '100%', margin: '14px auto', padding: '0 4px', boxSizing: 'border-box' }}
              dangerouslySetInnerHTML={{ __html: ad.customHtml }} 
            />
          );
        }

        const align = ad.alignment || 'center';
        let flexJustify = 'center';
        if (align === 'left') flexJustify = 'flex-start';
        else if (align === 'right') flexJustify = 'flex-end';
        else if (align === 'full') flexJustify = 'stretch';

        const isSidebarSlot = slotId === 'sidebar-sticky' || slotId === 'sidebar-top' || slotId === 'sidebar-bottom' || slotId?.includes('sidebar') || slotId?.includes('rail');
        const isFloated = align === 'left' || align === 'right' || isSidebarSlot;
        const containerWidth = ad.customWidth && ad.customWidth !== 'auto' ? ad.customWidth : (align === 'full' ? '100%' : '100%');
        const targetUrl = ad.targetUrl || '#';
        const openNewTab = ad.openNewTab !== false;

        const layout = ad.mediaLayout || (isSidebarSlot || ad.format === 'rectangle' ? 'stacked' : (ad.format === 'billboard' ? 'full_banner' : 'side_media'));
        const fitMode = ad.mediaFit || (layout === 'stacked' || isSidebarSlot ? 'cover' : 'contain');
        const mediaHeight = ad.mediaHeight || (layout === 'full_banner' || layout === 'media_only' ? (ad.customHeight && ad.customHeight !== 'auto' ? ad.customHeight : '220px') : (layout === 'stacked' || isSidebarSlot ? '180px' : '140px'));
        const mediaWidth = ad.mediaWidth || (layout === 'side_media' ? '220px' : '100%');
        const mediaBg = ad.mediaBg || (fitMode === 'contain' ? 'rgba(0, 0, 0, 0.95)' : 'transparent');
        const aspectRatio = ad.mediaAspectRatio && ad.mediaAspectRatio !== 'auto' ? ad.mediaAspectRatio : undefined;

        // 1. FLOATED EDITORIAL AD CARD FORMAT (Rolex Style & Right Sidebar Card)
        if (isFloated) {
          return (
            <div 
              key={ad.id || `floated-ad-${adIdx}`} 
              style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: flexJustify, 
                margin: '12px 0', 
                boxSizing: 'border-box' 
              }}
            >
              <div style={{
                background: 'var(--bg-surface, var(--bg-card, #0c1522))',
                border: '1.5px solid var(--border-color, #1e293b)',
                borderRadius: '12px',
                padding: '14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                width: containerWidth || '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                {/* Ad Disclosure Header Bar: [OFFICIAL PARTNER] ... [↗ Visit Link SPONSOR] */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  borderBottom: '1px solid var(--border-color, #1e293b)',
                  paddingBottom: '6px'
                }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'var(--accent-purple, #8b5cf6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <Megaphone size={12} />
                    <span>{ad.badgeText || 'OFFICIAL PARTNER'}</span>
                  </div>

                  <a
                    href={targetUrl}
                    target={openNewTab ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '9.5px',
                      color: '#38bdf8',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      textDecoration: 'none'
                    }}
                  >
                    <ExternalLink size={10} /> Visit Link
                    <span style={{ color: 'var(--text-muted, #94a3b8)', marginLeft: '3px', textTransform: 'uppercase', fontSize: '8.5px' }}>
                      SPONSOR
                    </span>
                  </a>
                </div>

                {/* Media / Photo Showcase Area with Explore CTA Badge Overlay */}
                {ad.contentType === 'video' && ad.mediaUrl ? (
                  <div style={{ width: '100%', height: mediaHeight === 'auto' ? '220px' : mediaHeight, borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                    <ContinuousCoverVideo
                      src={ad.mediaUrl}
                      poster={formatCoverImageUrl(ad.mediaUrl) || ad.mediaUrl}
                      autoPlay={true}
                      muted={true}
                      loop={true}
                      controls={false}
                      playsInline={true}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: mediaHeight === 'auto' ? '220px' : mediaHeight,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: ad.mediaUrl ? `url(${formatCoverImageUrl(ad.mediaUrl) || ad.mediaUrl}) center/cover` : 'var(--bg-secondary, #111827)',
                    border: '1px solid var(--border-color, #1e293b)'
                  }}>
                    {/* Explore Series / CTA Button Badge in Bottom-Right Corner */}
                    <a
                      href={targetUrl}
                      target={openNewTab ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        background: 'rgba(0, 0, 0, 0.85)',
                        backdropFilter: 'blur(6px)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                      }}
                    >
                      <span>{ad.ctaText || 'Discover Model'}</span>
                      <span>↗</span>
                    </a>
                  </div>
                )}

                {/* Headline & Subtitle below Photo */}
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary, #ffffff)', lineHeight: 1.35 }}>
                    {ad.headline}
                  </div>
                  {ad.subtitle && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94a3b8)', marginTop: '4px', lineHeight: 1.35 }}>
                      {ad.subtitle}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }

        // 2. PURE CREATIVE / MEDIA ONLY LAYOUT
        if ((layout === 'media_only' || ad.format === 'media_only') && ad.mediaUrl) {
          return (
            <div key={ad.id || `media-ad-${adIdx}`} style={{ maxWidth: '100%', margin: '14px auto', padding: '0 4px', display: 'flex', justifyContent: flexJustify, width: '100%', boxSizing: 'border-box' }}>
              <a
                href={targetUrl}
                target={openNewTab ? "_blank" : "_self"}
                rel="noopener noreferrer"
                style={{
                  width: containerWidth,
                  maxWidth: '100%',
                  height: mediaHeight === 'auto' ? 'auto' : mediaHeight,
                  aspectRatio: aspectRatio,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'block',
                  position: 'relative',
                  background: mediaBg,
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-md)',
                  textDecoration: 'none'
                }}
              >
                {ad.contentType === 'video' ? (
                  <ContinuousCoverVideo
                    src={ad.mediaUrl}
                    poster={formatCoverImageUrl(ad.mediaUrl) || ad.mediaUrl}
                    autoPlay={true}
                    muted={true}
                    loop={true}
                    playsInline={true}
                    controls={false}
                    style={{ width: '100%', height: '100%', objectFit: fitMode }}
                  />
                ) : (
                  <img
                    src={formatCoverImageUrl(ad.mediaUrl) || ad.mediaUrl}
                    alt={ad.headline || 'Advertisement'}
                    style={{ width: '100%', height: '100%', objectFit: fitMode, display: 'block', margin: '0 auto' }}
                    referrerPolicy="no-referrer"
                  />
                )}
                <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.85)', color: '#ffffff', fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px', border: '1px solid rgba(255,255,255,0.2)' }}>
                  {ad.badgeText || 'ADVERTISEMENT'}
                </span>
              </a>
            </div>
          );
        }

        // 3. FULL-WIDTH BILLBOARD / BANNER LAYOUT
        if (layout === 'full_banner' && ad.mediaUrl) {
          return (
            <div key={ad.id || `banner-ad-${adIdx}`} style={{ maxWidth: '100%', margin: '14px auto', padding: '0 4px', display: 'flex', justifyContent: flexJustify, width: '100%', boxSizing: 'border-box' }}>
              <div style={{
                width: containerWidth,
                maxWidth: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px', background: 'var(--bg-secondary, #111827)', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#b90014', color: '#ffffff', fontSize: '9px', fontWeight: 900, padding: '2px 6px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {ad.badgeText || 'SPONSORED'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 800 }}>{ad.sponsorName}</span>
                  </div>
                  <a href={targetUrl} target={openNewTab ? "_blank" : "_self"} rel="noopener noreferrer" style={{ color: '#b90014', fontSize: '11px', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{ad.ctaText || 'Learn More'}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>

                <a
                  href={targetUrl}
                  target={openNewTab ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  style={{
                    width: '100%',
                    height: mediaHeight === 'auto' ? '220px' : mediaHeight,
                    aspectRatio: aspectRatio,
                    background: mediaBg,
                    position: 'relative',
                    display: 'block',
                    overflow: 'hidden'
                  }}
                >
                  {ad.contentType === 'video' ? (
                    <ContinuousCoverVideo
                      src={ad.mediaUrl}
                      poster={formatCoverImageUrl(ad.mediaUrl) || ad.mediaUrl}
                      autoPlay={true}
                      muted={true}
                      loop={true}
                      playsInline={true}
                      controls={false}
                      style={{ width: '100%', height: '100%', objectFit: fitMode }}
                    />
                  ) : (
                    <img
                      src={formatCoverImageUrl(ad.mediaUrl) || ad.mediaUrl}
                      alt={ad.headline || 'Advertisement'}
                      style={{ width: '100%', height: '100%', objectFit: fitMode, display: 'block', margin: '0 auto' }}
                      referrerPolicy="no-referrer"
                    />
                  )}
                </a>

                {(ad.headline || ad.subtitle) && (
                  <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'var(--bg-card)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {ad.headline && <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{ad.headline}</div>}
                      {ad.subtitle && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{ad.subtitle}</div>}
                    </div>
                    <a
                      href={targetUrl}
                      target={openNewTab ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      style={{
                        background: '#b90014',
                        color: '#ffffff',
                        padding: '8px 18px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        textDecoration: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 8px rgba(185, 0, 20, 0.25)'
                      }}
                    >
                      <span>{ad.ctaText || 'Explore'}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // 4. VERTICAL STACKED CARD LAYOUT
        if (layout === 'stacked' || ad.format === 'rectangle') {
          return (
            <div key={ad.id || `stacked-ad-${adIdx}`} style={{
              width: '100%',
              maxWidth: containerWidth,
              margin: '14px auto',
              boxSizing: 'border-box'
            }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  background: 'var(--bg-secondary, #111827)',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <span style={{
                      background: '#b90014',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: '2px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      flexShrink: 0
                    }}>
                      {ad.badgeText || 'SPONSORED'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ad.sponsorName}
                    </span>
                  </div>
                </div>

                {ad.mediaUrl && (
                  <a
                    href={targetUrl}
                    target={openNewTab ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    style={{
                      width: '100%',
                      height: mediaHeight === 'auto' ? '160px' : mediaHeight,
                      aspectRatio: aspectRatio,
                      background: mediaBg,
                      position: 'relative',
                      display: 'block',
                      overflow: 'hidden',
                      textDecoration: 'none'
                    }}
                  >
                    {ad.contentType === 'video' ? (
                      <ContinuousCoverVideo
                        src={ad.mediaUrl}
                        poster={formatCoverImageUrl(ad.mediaUrl) || ad.mediaUrl}
                        autoPlay={true}
                        muted={true}
                        loop={true}
                        playsInline={true}
                        controls={false}
                        style={{ width: '100%', height: '100%', objectFit: fitMode }}
                      />
                    ) : (
                      <img
                        src={formatCoverImageUrl(ad.mediaUrl) || ad.mediaUrl}
                        alt={ad.headline || 'Sponsored'}
                        style={{ width: '100%', height: '100%', objectFit: fitMode, display: 'block' }}
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </a>
                )}

                <div style={{
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  background: 'var(--bg-card)'
                }}>
                  {ad.headline && (
                    <div style={{
                      fontSize: '14.5px',
                      fontWeight: 800,
                      fontFamily: 'var(--font-serif)',
                      color: 'var(--text-primary)',
                      lineHeight: 1.3
                    }}>
                      {ad.headline}
                    </div>
                  )}
                  {ad.subtitle && (
                    <div style={{
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4
                    }}>
                      {ad.subtitle}
                    </div>
                  )}
                  <a
                    href={targetUrl}
                    target={openNewTab ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    style={{
                      background: '#b90014',
                      color: '#ffffff',
                      padding: '8px 14px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '4px',
                      boxShadow: '0 2px 8px rgba(185, 0, 20, 0.25)',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <span>{ad.ctaText || 'Explore'}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          );
        }

        // 5. SIDE-BY-SIDE SPLIT CARD LAYOUT (For In-Feed horizontal banners)
        return (
          <div key={ad.id || `split-ad-${adIdx}`} style={{
            maxWidth: '100%',
            margin: '14px auto',
            padding: '0 4px',
            clear: 'both',
            display: 'flex',
            justifyContent: flexJustify,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: containerWidth,
              maxWidth: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '14px 18px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: 'var(--shadow-sm)',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 260px', minWidth: 0 }}>
                {ad.mediaUrl && (
                  <div style={{
                    width: mediaWidth === '100%' ? '200px' : mediaWidth,
                    maxWidth: '40%',
                    height: mediaHeight,
                    aspectRatio: aspectRatio,
                    borderRadius: '6px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: mediaBg,
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {ad.contentType === 'video' ? (
                      <ContinuousCoverVideo
                        src={ad.mediaUrl}
                        poster={formatCoverImageUrl(ad.mediaUrl) || ad.mediaUrl}
                        autoPlay={true}
                        muted={true}
                        loop={true}
                        playsInline={true}
                        controls={false}
                        style={{ width: '100%', height: '100%', objectFit: fitMode }}
                      />
                    ) : (
                      <img
                        src={formatCoverImageUrl(ad.mediaUrl) || ad.mediaUrl}
                        alt={ad.headline || 'Ad Media'}
                        style={{ width: '100%', height: '100%', objectFit: fitMode, display: 'block' }}
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ background: '#b90014', color: '#ffffff', fontSize: '9px', fontWeight: 900, padding: '2px 6px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {ad.badgeText || 'ADVERTISEMENT'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11.5px', fontWeight: 800 }}>{ad.sponsorName}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: '3px' }}>
                    {ad.headline}
                  </div>
                  {ad.subtitle && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                      {ad.subtitle}
                    </div>
                  )}
                </div>
              </div>

              <a
                href={targetUrl}
                target={openNewTab ? "_blank" : "_self"}
                rel="noopener noreferrer"
                style={{
                  background: '#b90014',
                  color: '#ffffff',
                  padding: '8px 18px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(185, 0, 20, 0.25)'
                }}
              >
                <span>{ad.ctaText || 'Learn More'}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
