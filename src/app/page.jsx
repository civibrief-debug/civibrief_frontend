'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Volume2, 
  ArrowUpRight, 
  Sparkles, 
  TrendingUp, 
  Bookmark, 
  Share2, 
  Compass, 
  Flame, 
  Lock,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Megaphone,
  ExternalLink,
  Clock,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Award,
  Globe,
  DollarSign
} from 'lucide-react';
import { 
  BREAKING_NEWS,
  HERO_FEATURED as FALLBACK_HERO_FEATURED, 
  HERO_SECONDARY as FALLBACK_HERO_SECONDARY, 
  MAIN_ARTICLES as FALLBACK_MAIN_ARTICLES, 
  MOST_READ as FALLBACK_MOST_READ, 
  DEEP_DIVES as FALLBACK_DEEP_DIVES 
} from '../data/newsData';
import { ArticleModal } from '../components/ArticleModal';
import { LoginModal } from '../components/LoginModal';
import { CrestLogo } from '../components/CrestLogo';
import { formatCoverMediaEmbedUrl, formatCoverImageUrl, parseGoogleDriveUrl } from '../lib/videoUtils';
import ContinuousCoverVideo from '../components/ContinuousCoverVideo';
import { useTranslation } from '../context/TranslationContext';

export default function HomePage() {
  const [dbArticles, setDbArticles] = useState([]);
  const [translatedArticles, setTranslatedArticles] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { language, translateMultipleArticles, isTranslating } = useTranslation();

  const [homepageAds, setHomepageAds] = useState([]);
  const [homepageArticleSections, setHomepageArticleSections] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);

  // Financial & Currency Converter State
  const [convAmount, setConvAmount] = useState('1000');
  const [convFrom, setConvFrom] = useState('USD');
  const [convTo, setConvTo] = useState('INR');
  const [convResult, setConvResult] = useState('83,900.00');

  // Top Mutual Funds Tab
  const [activeMfTab, setActiveMfTab] = useState('Equity');

  // Breaking ticker index
  const [breakingIndex, setBreakingIndex] = useState(0);

  // Fetch live articles from database (published only)
  const fetchLiveArticles = async () => {
    try {
      const res = await fetch('/api/db/articles');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        const publishedOnly = json.data.filter(a => a.status === 'Published');
        setDbArticles(prev => {
          if (JSON.stringify(prev) === JSON.stringify(publishedOnly)) return prev;
          return publishedOnly;
        });
      }
    } catch (err) {
      console.warn("Failed to fetch live database articles:", err?.message || err);
    }
  };

  const fetchHomepageAds = async () => {
    try {
      const res = await fetch('/api/db/homepage-ads');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setHomepageAds(json.data);
      }
    } catch (err) {
      console.warn("Failed to fetch homepage ads:", err?.message || err);
    }
  };

  const fetchHomepageArticlePlacements = async () => {
    try {
      const res = await fetch('/api/db/homepage-articles');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setHomepageArticleSections(json.data);
      }
    } catch (err) {
      console.warn("Failed to fetch homepage article placements:", err?.message || err);
    }
  };

  useEffect(() => {
    fetchLiveArticles().catch(() => {});
    fetchHomepageAds().catch(() => {});
    fetchHomepageArticlePlacements().catch(() => {});
    const interval = setInterval(() => {
      fetchLiveArticles().catch(() => {});
      fetchHomepageAds().catch(() => {});
      fetchHomepageArticlePlacements().catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Breaking News ticker rotator
  useEffect(() => {
    const timer = setInterval(() => {
      setBreakingIndex(prev => (prev + 1) % (BREAKING_NEWS.length || 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Handle translation when articles or language change (zero changes to translation logic)
  useEffect(() => {
    let isMounted = true;
    if (language === 'en') {
      setTranslatedArticles(null);
      return;
    }
    const baseArticles = dbArticles.length > 0 ? dbArticles : [FALLBACK_HERO_FEATURED, ...FALLBACK_HERO_SECONDARY, ...FALLBACK_MAIN_ARTICLES];
    if (baseArticles.length > 0) {
      translateMultipleArticles(baseArticles, language).then(translated => {
        if (isMounted && translated) setTranslatedArticles(translated);
      });
    }
    return () => { isMounted = false; };
  }, [dbArticles, language, translateMultipleArticles]);

  const isDeepDiveArticle = (a) => {
    if (!a) return false;
    const cat = (a.category || '').toLowerCase();
    const id = (a.id || '').toLowerCase();
    return id.startsWith('deep-dive-') || cat.includes('deep dive') || cat === 'special investigations' || (cat === 'investigation' && id.startsWith('deep-dive-'));
  };

  // Merge database articles with fallbacks
  const combinedArticlesPool = useMemo(() => {
    const baseList = Array.isArray(dbArticles) && dbArticles.length > 0 ? dbArticles : [];
    const fallbacks = [FALLBACK_HERO_FEATURED, ...FALLBACK_HERO_SECONDARY, ...FALLBACK_MAIN_ARTICLES];

    const seenIds = new Set(baseList.map(a => a.id));
    const seenTitles = new Set(baseList.map(a => (a.title || '').trim().toLowerCase()));

    const merged = [...baseList];
    fallbacks.forEach(f => {
      if (!seenIds.has(f.id) && !seenTitles.has((f.title || '').trim().toLowerCase())) {
        merged.push(f);
      }
    });
    return merged;
  }, [dbArticles]);

  const rawActiveArticles = translatedArticles || combinedArticlesPool;
  const activeArticles = rawActiveArticles.filter(a => !isDeepDiveArticle(a));

  // Helper to get configuration for a homepage editorial zone
  const getZoneConfig = (zoneId) => {
    return (homepageArticleSections || []).find(s => s.id === zoneId);
  };

  // Helper to dynamically resolve articles for a zone based on category assignments or pinned stories
  const resolveZoneArticles = (zoneId, defaultCategory = 'all', defaultCount = 4) => {
    const config = getZoneConfig(zoneId);
    const count = config?.itemCount || defaultCount;

    // 1. Manually Pinned Story Mode
    if (config?.selectionMode === 'manual' && config?.pinnedArticleId) {
      const pinned = activeArticles.find(a => a.id === config.pinnedArticleId);
      if (pinned) return [pinned];
    }

    // 2. Category Filter Mode
    const targetCat = (config?.category || defaultCategory || 'all').toLowerCase();
    if (targetCat === 'all' || targetCat === 'top stories') {
      return activeArticles.slice(0, count);
    }

    const filtered = activeArticles.filter(a => {
      const c = (a.category || '').toLowerCase();
      return c.includes(targetCat) || targetCat.includes(c);
    });

    if (filtered.length > 0) {
      return filtered.slice(0, count);
    }

    return activeArticles.slice(0, count);
  };

  // Categorized story pools for structured newsroom departments dynamically resolved
  const leadStory = resolveZoneArticles('zone-hero-lead', 'All', 1)[0] || activeArticles[0] || FALLBACK_HERO_FEATURED;
  const secondLead = resolveZoneArticles('zone-hero-second-lead', 'All', 1)[0] || activeArticles[1] || FALLBACK_HERO_SECONDARY[0] || FALLBACK_HERO_FEATURED;
  const subLead1 = resolveZoneArticles('zone-hero-sub-1', 'All', 1)[0] || activeArticles[2] || FALLBACK_HERO_SECONDARY[1];
  const subLead2 = resolveZoneArticles('zone-hero-sub-2', 'All', 1)[0] || activeArticles[3] || FALLBACK_HERO_SECONDARY[2];
  const heroStackedStories = resolveZoneArticles('zone-hero-stacked', 'All', 3);
  const subLead3 = heroStackedStories[0] || activeArticles[4] || FALLBACK_HERO_SECONDARY[3];
  const subLead4 = heroStackedStories[1] || activeArticles[5] || FALLBACK_MAIN_ARTICLES[0];
  const subLead5 = heroStackedStories[2] || activeArticles[6] || FALLBACK_MAIN_ARTICLES[1];

  // Dynamic Department pools based on Admin Homepage Article Placement
  const band1Stories = resolveZoneArticles('zone-band-1', 'Global Affairs', 4);
  const band2Stories = resolveZoneArticles('zone-band-2', 'Global Affairs', 4);
  const businessStories = resolveZoneArticles('zone-dept-1', 'Markets & Economy', 4);
  const techStories = resolveZoneArticles('zone-dept-2', 'Tech & AI', 4);
  const forYouStories = (activeArticles.length >= 8 ? activeArticles.slice(4, 8) : FALLBACK_MAIN_ARTICLES.slice(0, 4));

  const isRtl = ['ar', 'he', 'fa', 'ur'].includes(language);

  // Currency Converter calculation
  const handleCurrencyConvert = () => {
    const val = parseFloat(convAmount) || 0;
    const ratesToINR = {
      USD: 83.90,
      EUR: 92.15,
      GBP: 108.40,
      AED: 22.84,
      JPY: 0.57,
      INR: 1.0
    };
    const inrValue = val * (ratesToINR[convFrom] || 1);
    const finalVal = inrValue / (ratesToINR[convTo] || 1);
    setConvResult(finalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleDeepDiveClick = (dive) => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
    } else {
      setSelectedArticle(dive);
    }
  };


  // Helper to render live ads assigned in admin portal with complete media visibility and resizing options
  const renderLiveAd = (slotId) => {
    const ad = homepageAds.find(a => 
      (a.slotId === slotId || a.dropZoneId === slotId || a.dropZoneId === `dropzone-${slotId.replace('-top', '').replace('-bottom', '')}`) && a.enabled
    );
    if (!ad) return null;

    if (ad.customHtml && ad.customHtml.trim()) {
      return (
        <div 
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

    const containerWidth = ad.customWidth || (align === 'full' ? '100%' : '100%');
    const targetUrl = ad.targetUrl || '#';
    const openNewTab = ad.openNewTab !== false;

    // Resizing & visibility options
    const layout = ad.mediaLayout || (ad.format === 'billboard' ? 'full_banner' : 'side_media');
    const fitMode = ad.mediaFit || 'contain'; // Default contain ensures the full image / video is completely visible without cropping!
    const mediaHeight = ad.mediaHeight || (layout === 'full_banner' || layout === 'media_only' ? (ad.customHeight && ad.customHeight !== 'auto' ? ad.customHeight : '220px') : '140px');
    const mediaWidth = ad.mediaWidth || (layout === 'side_media' ? '220px' : '100%');
    const mediaBg = ad.mediaBg || (fitMode === 'contain' ? 'rgba(0, 0, 0, 0.95)' : 'transparent');
    const aspectRatio = ad.mediaAspectRatio && ad.mediaAspectRatio !== 'auto' ? ad.mediaAspectRatio : undefined;

    // 1. PURE CREATIVE / MEDIA ONLY LAYOUT (Full clickable image/video banner)
    if ((layout === 'media_only' || ad.format === 'media_only') && ad.mediaUrl) {
      return (
        <div style={{ maxWidth: '100%', margin: '14px auto', padding: '0 4px', display: 'flex', justifyContent: flexJustify, width: '100%', boxSizing: 'border-box' }}>
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

    // 2. FULL-WIDTH BILLBOARD / BANNER LAYOUT (Media spanning banner width with disclosure header and CTA footer)
    if (layout === 'full_banner' && ad.mediaUrl) {
      return (
        <div style={{ maxWidth: '100%', margin: '14px auto', padding: '0 4px', display: 'flex', justifyContent: flexJustify, width: '100%', boxSizing: 'border-box' }}>
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
            {/* Top Disclosure Header */}
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

            {/* Completely Visible Media Window */}
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

            {/* Bottom Headline & Action Row */}
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

    // 3. STACKED LAYOUT (Top Media, Bottom Text)
    if (layout === 'stacked' && ad.mediaUrl) {
      return (
        <div style={{ maxWidth: '100%', margin: '14px auto', padding: '0 4px', display: 'flex', justifyContent: flexJustify, width: '100%', boxSizing: 'border-box' }}>
          <div style={{
            width: containerWidth,
            maxWidth: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <a href={targetUrl} target={openNewTab ? "_blank" : "_self"} rel="noopener noreferrer" style={{ width: '100%', height: mediaHeight, aspectRatio: aspectRatio, background: mediaBg, display: 'block', position: 'relative', overflow: 'hidden' }}>
              {ad.contentType === 'video' ? (
                <ContinuousCoverVideo
                  src={ad.mediaUrl}
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
                  alt={ad.headline || 'Ad'}
                  style={{ width: '100%', height: '100%', objectFit: fitMode, display: 'block', margin: '0 auto' }}
                  referrerPolicy="no-referrer"
                />
              )}
            </a>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <span style={{ background: '#b90014', color: '#ffffff', fontSize: '9px', fontWeight: 900, padding: '1px 6px', borderRadius: '2px' }}>{ad.badgeText || 'SPONSORED'}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800 }}>{ad.sponsorName}</span>
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>{ad.headline}</div>
                {ad.subtitle && <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{ad.subtitle}</div>}
              </div>
              <a href={targetUrl} target={openNewTab ? "_blank" : "_self"} rel="noopener noreferrer" style={{ background: '#b90014', color: '#fff', padding: '7px 16px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, textDecoration: 'none', flexShrink: 0 }}>
                {ad.ctaText || 'Learn More'} →
              </a>
            </div>
          </div>
        </div>
      );
    }

    // 4. SIDE-BY-SIDE SPLIT CARD LAYOUT (Media cleanly sized alongside headline & CTA)
    return (
      <div style={{
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
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '18px',
          boxShadow: 'var(--shadow-sm)',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
            {ad.mediaUrl && (
              <div style={{
                width: mediaWidth,
                maxWidth: '45%',
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
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* =========================================================================
          CENTRAL NEWSPAPER EDITORIAL CONTENT COLUMN (CLEAN FULL-WIDTH LAYOUT)
          ========================================================================= */}
      <div className="newspaper-main-content-column">
        {/* =========================================================================
            ZONE 1: LIVE PROMO STRIPS (ET + THE HINDU STYLE)
            ========================================================================= */}

      {/* 1.2 Top Leaderboard Ad Slot */}
      {renderLiveAd('masthead-top')}

      {/* 1.3 ETPrime-Style Promotional Offer Strip */}
      <div className="et-promo-strip">
        <div className="et-promo-inner">
          <div className="et-promo-text-group">
            <span className="et-promo-badge">PRO EDITION</span>
            <span className="et-promo-headline">
              Gift Yourself Financial & Geopolitical Clarity with Daily Brief Prime
            </span>
            <span className="et-promo-timer">
              ⏱ Free Trial Offer Extended For 04 : 12 : 38
            </span>
          </div>

          <button 
            type="button"
            onClick={() => setIsLoginOpen(true)}
            className="et-promo-btn"
          >
            <span>Start Free Trial @ ₹0</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* 1.4 Live Breaking News Alert Wire */}
      <div className="breaking-alert-strip">
        <div className="breaking-alert-inner">
          <div className="breaking-badge">
            <span className="breaking-pulse-dot" />
            <span>BREAKING WIRE</span>
          </div>
          <div className="breaking-headline-text">
            {BREAKING_NEWS[breakingIndex] || BREAKING_NEWS[0]}
          </div>
          <Link href="/edition" style={{ fontSize: '11px', fontWeight: 800, color: '#b90014', textTransform: 'uppercase', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Today's e-Paper 📰
          </Link>
        </div>
      </div>

      {/* =========================================================================
          ZONE 2: ABOVE-THE-FOLD HERO MULTI-COLUMN NEWSPAPER CLUSTER
          ========================================================================= */}
      <section className="newspaper-hero-cluster" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* COLUMN 1 (42%): Dominant Lead Story + 2-Column Sub Grid */}
        <div className="newspaper-hero-col col-divider-right">
          {leadStory && (
            <article 
              className="lead-story-hero-card"
              onClick={() => setSelectedArticle(leadStory)}
            >
              <div className="lead-story-img-box">
                {leadStory.coverMediaType === 'video' && leadStory.videoUrl ? (
                  <ContinuousCoverVideo
                    key={`hero-vid-${leadStory.id}`}
                    src={leadStory.videoUrl}
                    cropStyle={leadStory.coverCropStyle}
                    autoPlay={true}
                    muted={true}
                    loop={true}
                    controls={false}
                    playsInline={true}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img
                    src={formatCoverImageUrl(leadStory.imageUrl) || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"}
                    alt={leadStory.title}
                    referrerPolicy="no-referrer"
                    style={{ ...(leadStory.coverCropStyle || {}) }}
                    onError={(e) => {
                      const gdrive = parseGoogleDriveUrl(leadStory.imageUrl);
                      if (gdrive && !e.currentTarget.dataset.retried) {
                        e.currentTarget.dataset.retried = '1';
                        e.currentTarget.src = gdrive.proxyImageUrl || `https://lh3.googleusercontent.com/d/${gdrive.fileId}`;
                      } else {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";
                      }
                    }}
                  />
                )}
                {leadStory.hasAudio && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(185, 0, 20, 0.9)', color: '#ffffff', fontSize: '9.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Volume2 size={12} />
                    <span>AUDIO</span>
                  </div>
                )}
              </div>

              <div>
                <span className="news-kicker">
                  {leadStory.kicker ? leadStory.kicker.toUpperCase() : (leadStory.category || 'TOP STORY')}
                </span>
                <h1 className="lead-story-title">
                  {leadStory.title}
                </h1>
                <p className="lead-story-deck">
                  {leadStory.summary || leadStory.subtitle || leadStory.excerpt}
                </p>
                <div className="lead-story-byline">
                  <span>By <strong>{leadStory.author || 'Editorial Board'}</strong></span>
                  <span>•</span>
                  <span>{leadStory.readTime || '4 min read'}</span>
                </div>
              </div>
            </article>
          )}

          {/* 2-Column Compact Sub-Grid below Main Lead */}
          <div className="hero-sub-grid-2col">
            {subLead1 && (
              <article className="sub-story-card" onClick={() => setSelectedArticle(subLead1)}>
                <img
                  src={formatCoverImageUrl(subLead1.imageUrl) || "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80"}
                  alt={subLead1.title}
                  className="sub-story-img"
                  referrerPolicy="no-referrer"
                />
                <span className="news-kicker" style={{ fontSize: '10px' }}>
                  {subLead1.kicker ? subLead1.kicker.toUpperCase() : subLead1.category}
                </span>
                <h3 className="sub-story-title">
                  {subLead1.title}
                </h3>
              </article>
            )}

            {subLead2 && (
              <article className="sub-story-card" onClick={() => setSelectedArticle(subLead2)}>
                <img
                  src={formatCoverImageUrl(subLead2.imageUrl) || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80"}
                  alt={subLead2.title}
                  className="sub-story-img"
                  referrerPolicy="no-referrer"
                />
                <span className="news-kicker" style={{ fontSize: '10px' }}>
                  {subLead2.kicker ? subLead2.kicker.toUpperCase() : subLead2.category}
                </span>
                <h3 className="sub-story-title">
                  {subLead2.title}
                </h3>
              </article>
            )}
          </div>
        </div>

        {/* COLUMN 2 (31%): Second Major Lead & Stacked News Rows */}
        <div className="newspaper-hero-col col-divider-right">
          {secondLead && (
            <article className="second-lead-card" onClick={() => setSelectedArticle(secondLead)}>
              <img
                src={formatCoverImageUrl(secondLead.imageUrl) || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80"}
                alt={secondLead.title}
                className="second-lead-img"
                referrerPolicy="no-referrer"
              />
              <span className="news-kicker">
                {secondLead.kicker ? secondLead.kicker.toUpperCase() : secondLead.category}
              </span>
              <h2 className="second-lead-title">
                {secondLead.title}
              </h2>
              <p className="second-lead-deck">
                {secondLead.summary || secondLead.subtitle || secondLead.excerpt}
              </p>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                {secondLead.author || 'Senior Correspondent'}
              </div>
            </article>
          )}

          {/* Stacked Compact News Rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[subLead3, subLead4, subLead5].filter(Boolean).map((story, sIdx) => (
              <article 
                key={`stacked-${story.id || sIdx}`}
                className="stacked-story-row"
                onClick={() => setSelectedArticle(story)}
              >
                <div className="stacked-story-content">
                  <span className="news-kicker" style={{ fontSize: '9.5px', marginBottom: '2px' }}>
                    {story.kicker ? story.kicker.toUpperCase() : story.category}
                  </span>
                  <h4 className="stacked-story-title">
                    {story.title}
                  </h4>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {story.author || 'News Desk'}
                  </div>
                </div>
                <img
                  src={formatCoverImageUrl(story.imageUrl) || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&q=80"}
                  alt={story.title}
                  className="stacked-story-thumb"
                  referrerPolicy="no-referrer"
                />
              </article>
            ))}
          </div>

          <Link href="/section/global" style={{ fontSize: '11px', fontWeight: 800, color: '#b90014', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <span>Read More Top Stories</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* COLUMN 3 (27%): The Hindu Opinion Box + ET Fast News Timeline + Sponsor */}
        <div className="newspaper-hero-col">
          {/* The Hindu-Style Editorial Crest Box */}
          <div className="the-hindu-opinion-box">
            <div className="opinion-crest-header">
              <CrestLogo style={{ width: '22px', height: '22px' }} />
              <span className="opinion-crest-title">EDITORIAL OPINION</span>
            </div>
            <h3 
              className="opinion-main-title"
              onClick={() => setSelectedArticle(leadStory)}
            >
              The Architecture of Sovereign Autonomy in an Era of Multipolar Fractures
            </h3>
            <p className="opinion-deck">
              Why independent institutional capacity and domestic silicon manufacturing constitute the genuine pillars of national security.
            </p>
            <Link href="/section/opinion" className="opinion-read-link">
              <span>Read Our Editorials</span>
              <ArrowRight size={11} />
            </Link>
          </div>

          {/* ET-Style Fast News Timeline */}
          <div className="et-fast-news-box">
            <div className="fast-news-header">
              <span className="fast-news-title">LATEST INTELLIGENCE ⚡</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>UPDATED 2M AGO</span>
            </div>

            {[
              { time: "14 MINS AGO", text: "Reserve Bank maintains repo rate policy stance amid food inflation monitoring." },
              { time: "28 MINS AGO", text: "Cabinet Committee approves ₹76,000 Cr incentive outlay for semiconductor fab assembly." },
              { time: "42 MINS AGO", text: "ISRO launches third ocean surveillance payload aboard upgraded GSLV rocket." },
              { time: "1 HOUR AGO", text: "Bilateral energy agreements concluded for green hydrogen corridor to Europe." }
            ].map((wire, wIdx) => (
              <div key={`wire-${wIdx}`} className="fast-news-item" onClick={() => setSelectedArticle(activeArticles[wIdx % activeArticles.length] || leadStory)}>
                <div className="fast-news-time">{wire.time}</div>
                <div className="fast-news-text">{wire.text}</div>
              </div>
            ))}
          </div>

          {/* Sponsored Partner Highlight */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '10px 12px' }}>
            <div style={{ fontSize: '9px', fontWeight: 900, color: '#b90014', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              SPONSORED SHOWCASE
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
              Apex Sovereign Asset Management: Q3 Global Macro Outlook Report
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Explore institutional research on infrastructure yields ↗
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ZONE 3: HIGH-IMPACT MID-PAGE LEADERBOARD AD BREAK (hero-bottom)
          ========================================================================= */}
      {renderLiveAd('hero-bottom')}

      {/* =========================================================================
          ZONE 4: SECOND MAJOR EDITORIAL BAND (NATIONAL, WORLD & MOST READ)
          ========================================================================= */}
      <section className="newspaper-editorial-band" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Band Col 1 (40%): National / Custom Band 1 Feature + Horizontal Story Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="section-ribbon-header" style={{ marginBottom: '8px' }}>
            <div className="section-ribbon-title">
              <span className="bar" />
              <span>{getZoneConfig('zone-band-1')?.sectionTitle || 'National Affairs'}</span>
            </div>
            <Link href="/section/global" className="section-view-all-link">
              <span>View Desk</span> <ArrowRight size={11} />
            </Link>
          </div>

          {band1Stories[0] && (
            <article className="lead-story-hero-card" onClick={() => setSelectedArticle(band1Stories[0])}>
              <img
                src={formatCoverImageUrl(band1Stories[0].imageUrl) || "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80"}
                alt={band1Stories[0].title}
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
                referrerPolicy="no-referrer"
              />
              <span className="news-kicker">{band1Stories[0].kicker || band1Stories[0].category || 'POLICY & INFRASTRUCTURE'}</span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }}>
                {band1Stories[0].title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {band1Stories[0].summary || band1Stories[0].excerpt}
              </p>
            </article>
          )}

          {/* 2 Stacked Horizontal Cards */}
          {band1Stories.slice(1, 3).map((art, aIdx) => (
            <article key={`nat-art-${aIdx}`} className="stacked-story-row" onClick={() => setSelectedArticle(art)}>
              <div className="stacked-story-content">
                <span className="news-kicker" style={{ fontSize: '9.5px' }}>{art.category || 'INDIA'}</span>
                <h4 className="stacked-story-title">{art.title}</h4>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{art.author || 'Desk'}</div>
              </div>
              <img
                src={formatCoverImageUrl(art.imageUrl) || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80"}
                alt={art.title}
                className="stacked-story-thumb"
                referrerPolicy="no-referrer"
              />
            </article>
          ))}
        </div>

        {/* Band Col 2 (32%): World & Geopolitics / Custom Band 2 Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="section-ribbon-header" style={{ marginBottom: '8px' }}>
            <div className="section-ribbon-title">
              <span className="bar" />
              <span>{getZoneConfig('zone-band-2')?.sectionTitle || 'World & Geopolitics'}</span>
            </div>
            <Link href="/section/global" className="section-view-all-link">
              <span>More World</span> <ArrowRight size={11} />
            </Link>
          </div>

          {band2Stories.slice(0, 3).map((art, idx) => (
            <div 
              key={`world-${idx}`}
              onClick={() => setSelectedArticle(art)}
              style={{ cursor: 'pointer', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}
            >
              <span className="news-kicker" style={{ fontSize: '9.5px' }}>{art.category || 'GLOBAL'}</span>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, margin: '2px 0 4px' }}>
                {art.title}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {art.summary || art.excerpt}
              </p>
            </div>
          ))}

          {/* Visual Sports / Culture Feature */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => setSelectedArticle(band2Stories[3] || activeArticles[0])}>
            <img 
              src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80"
              alt="Global Sports & Athletics"
              style={{ width: '100%', height: '120px', objectFit: 'cover' }}
            />
            <div style={{ padding: '8px 12px' }}>
              <span className="news-kicker" style={{ fontSize: '9.5px' }}>GLOBAL SPORTS & CULTURE</span>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {(band2Stories[3] || activeArticles[0])?.title || 'World Athletics & Tactical Playbooks'}
              </div>
            </div>
          </div>
        </div>

        {/* Band Col 3 (28%): Most Read Today Numbered Ranking (The Hindu + ET Style) */}
        <div>
          <div className="most-read-newspaper-box">
            <div className="most-read-header">
              <Flame size={16} color="#b90014" />
              <span>MOST READ TODAY</span>
            </div>

            {(activeArticles.length > 0 ? activeArticles.slice(0, 5) : FALLBACK_MOST_READ).map((item, idx) => (
              <div 
                key={`rank-${item.id || idx}`} 
                className="most-read-rank-row"
                onClick={() => setSelectedArticle(item)}
              >
                <span className="rank-digit">0{idx + 1}</span>
                <div className="rank-headline-content">
                  <span className="news-kicker" style={{ fontSize: '9px', marginBottom: '1px' }}>
                    {item.category ? item.category.toUpperCase() : 'NEWS'}
                  </span>
                  <div className="rank-headline-text">
                    {item.title}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Rail Sticky Ad Slot */}
          <div style={{ marginTop: '16px' }}>
            {renderLiveAd('sidebar-sticky')}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ZONE 5: SECTION-BASED NEWSROOM DEPARTMENTS (INDIA, BUSINESS, TECH)
          ========================================================================= */}

      {/* 5.1 Business, Markets & Industry / Department 1 */}
      <section className="newspaper-department-section" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="section-ribbon-header">
          <div className="section-ribbon-title">
            <span className="bar" />
            <span>{getZoneConfig('zone-dept-1')?.sectionTitle || 'Business, Markets & Economy'}</span>
          </div>
          <Link href="/section/markets" className="section-view-all-link">
            <span>All Business News</span> <ArrowRight size={11} />
          </Link>
        </div>

        <div className="department-grid-4col">
          {(businessStories.length > 0 ? businessStories : activeArticles.slice(0, 4)).map((art, idx) => (
            <article key={`biz-${art.id || idx}`} className="dept-card" onClick={() => setSelectedArticle(art)}>
              <img
                src={formatCoverImageUrl(art.imageUrl) || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80"}
                alt={art.title}
                className="dept-card-img"
                referrerPolicy="no-referrer"
              />
              <span className="news-kicker" style={{ fontSize: '9.5px' }}>{art.category || 'BUSINESS'}</span>
              <h3 className="dept-card-title">{art.title}</h3>
              <div className="dept-card-byline">{art.author || 'Markets Desk'}</div>
            </article>
          ))}
        </div>
      </section>

      {/* In-Feed Native Ad Slot Break */}
      {renderLiveAd('in-feed-mid')}

      {/* 5.2 Technology, AI & Space Intelligence / Department 2 */}
      <section className="newspaper-department-section" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="section-ribbon-header">
          <div className="section-ribbon-title">
            <span className="bar" />
            <span>{getZoneConfig('zone-dept-2')?.sectionTitle || 'Technology, AI & Space'}</span>
          </div>
          <Link href="/section/tech" className="section-view-all-link">
            <span>Explore Tech</span> <ArrowRight size={11} />
          </Link>
        </div>

        <div className="department-grid-4col">
          {(techStories.length > 0 ? techStories : activeArticles.slice(2, 6)).map((art, idx) => (
            <article key={`tech-${art.id || idx}`} className="dept-card" onClick={() => setSelectedArticle(art)}>
              <img
                src={formatCoverImageUrl(art.imageUrl) || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80"}
                alt={art.title}
                className="dept-card-img"
                referrerPolicy="no-referrer"
              />
              <span className="news-kicker" style={{ fontSize: '9.5px' }}>{art.category || 'TECH & AI'}</span>
              <h3 className="dept-card-title">{art.title}</h3>
              <div className="dept-card-byline">{art.author || 'Tech Reporter'}</div>
            </article>
          ))}
        </div>
      </section>

      {/* 5.3 Special Investigations & Deep Dives (Dark Feature Box) */}
      <section className="deep-dives-banner">
        <div className="deep-dives-container">
          {renderLiveAd('deep-dives-top')}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div className="category-tag" style={{ color: '#34d399' }}>
                <Sparkles size={12} />
                <span>INVESTIGATIVE JOURNALISM</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 900, color: '#ffffff', margin: '4px 0' }}>
                Deep Dives 💎
              </h2>
            </div>

            <button 
              onClick={() => {
                if (!isLoggedIn) setIsLoginOpen(true);
              }}
              style={{ background: 'none', border: 'none', color: '#34d399', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              Explore Archive {!isLoggedIn && <Lock size={13} />} <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="deep-dives-grid">
            {FALLBACK_DEEP_DIVES.map((dive) => (
              <article 
                key={dive.id} 
                className="deep-card"
                onClick={() => handleDeepDiveClick(dive)}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <img 
                  src={dive.imageUrl} 
                  alt={dive.title} 
                  className="deep-card-img" 
                />
                {!isLoggedIn && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(185, 0, 20, 0.95)', color: '#fff', fontSize: '9.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10 }}>
                    <Lock size={11} />
                    <span>MEMBER EXCLUSIVE</span>
                  </div>
                )}
                <div className="deep-card-content">
                  <div className="category-tag" style={{ fontSize: '10px' }}>
                    <span>{dive.category}</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
                    {dive.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.45, marginBottom: '10px' }}>
                    {dive.subtitle}
                  </p>
                  <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
                    By {dive.author}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ZONE 6: UTILITY & FINANCIAL ENGAGEMENT MODULES (ET INSPIRED)
          ========================================================================= */}
      <div className="utility-modules-container" dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
        {/* 6.1 Interactive Currency Converter */}
        <div className="utility-card-box" suppressHydrationWarning>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
            <DollarSign size={18} color="#b90014" />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)' }}>
              CURRENCY CONVERTER
            </span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Instant conversion at live institutional interbank rates:
          </div>

          <div className="converter-row" suppressHydrationWarning>
            <input 
              type="number"
              value={convAmount}
              onChange={(e) => setConvAmount(e.target.value)}
              className="converter-input"
              placeholder="Amount"
              suppressHydrationWarning
            />
            <select 
              value={convFrom} 
              onChange={(e) => setConvFrom(e.target.value)}
              className="converter-select"
              suppressHydrationWarning
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED (د.إ)</option>
              <option value="INR">INR (₹)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
            <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>TO</span>
            <select 
              value={convTo} 
              onChange={(e) => setConvTo(e.target.value)}
              className="converter-select"
              suppressHydrationWarning
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED (د.إ)</option>
            </select>
            <button 
              type="button"
              onClick={handleCurrencyConvert}
              className="converter-convert-btn"
              suppressHydrationWarning
            >
              CONVERT
            </button>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '4px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} suppressHydrationWarning>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Estimated Value:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 900, color: '#059669' }}>
              {convResult} {convTo}
            </span>
          </div>
        </div>

        {/* 6.2 Top Mutual Funds Benchmark Performance Table */}
        <div className="utility-card-box" suppressHydrationWarning>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)' }}>
              TOP MUTUAL FUNDS PERFORMANCE
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
              Return Horizon: 3Y
            </span>
          </div>

          <div className="mf-tabs-bar" suppressHydrationWarning>
            {['Equity', 'Debt', 'Hybrid', 'Featured'].map(tab => (
              <button 
                key={tab}
                type="button"
                onClick={() => setActiveMfTab(tab)}
                className={`mf-tab-btn ${activeMfTab === tab ? 'active' : ''}`}
                suppressHydrationWarning
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { name: "Invesco India Largecap Fund", return3Y: "+15.92%", size: "₹1,931 Cr", stars: "★★★★★" },
              { name: "WhiteOak Capital Large Cap Fund", return3Y: "+15.43%", size: "₹1,259 Cr", stars: "★★★★☆" },
              { name: "Bank of India Large Cap Growth", return3Y: "+15.06%", size: "₹223 Cr", stars: "★★★★★" },
              { name: "Quant Large Cap Direct Fund", return3Y: "+14.88%", size: "₹840 Cr", stars: "★★★★☆" }
            ].map((fund, fIdx) => (
              <div key={`fund-${fIdx}`} className="mf-row-item">
                <span className="mf-fund-name">{fund.name}</span>
                <span className="mf-return-val">{fund.return3Y} (3Y)</span>
                <span style={{ color: 'var(--text-muted)' }}>{fund.size}</span>
                <span className="mf-stars">{fund.stars}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6.3 Trending Terms Pill Cloud */}
      <div className="trending-terms-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
        <span className="trending-terms-label">TOP TRENDING TOPICS:</span>
        {[
          "Union Budget 2026",
          "Semiconductor Fab Mission",
          "RBI Monetary Policy",
          "ISRO Gaganyaan Mission",
          "Green Hydrogen Hub",
          "Sensex 85,000 Rally",
          "AI Compute Clusters",
          "Sovereign Gold Bonds"
        ].map((term, tIdx) => (
          <span key={`term-${tIdx}`} className="trending-term-pill">
            #{term}
          </span>
        ))}
      </div>

      {/* =========================================================================
          ZONE 7: "FOR YOU" CURATED EDITORIAL BOTTOM SHELF (THE HINDU STYLE)
          ========================================================================= */}
      <section className="for-you-shelf-section" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="section-ribbon-header">
          <div className="section-ribbon-title">
            <span className="bar" />
            <span>Curated For You</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
            RECOMMENDED READING
          </span>
        </div>

        <div className="department-grid-4col">
          {forYouStories.map((art, idx) => (
            <article key={`foryou-${art.id || idx}`} className="dept-card" onClick={() => setSelectedArticle(art)}>
              <img
                src={formatCoverImageUrl(art.imageUrl) || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80"}
                alt={art.title}
                className="dept-card-img"
                referrerPolicy="no-referrer"
              />
              <span className="news-kicker" style={{ fontSize: '9.5px' }}>{art.category || 'FEATURE'}</span>
              <h3 className="dept-card-title">{art.title}</h3>
              <div className="dept-card-byline">{art.author || 'Desk Correspondent'}</div>
            </article>
          ))}
        </div>
      </section>
      </div>

      {/* =========================================================================
          ZONE 8: MODALS & OVERLAYS
          ========================================================================= */}
      {selectedArticle && (
        <ArticleModal 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
          isLoggedIn={isLoggedIn}
          onOpenLogin={() => {
            setSelectedArticle(null);
            setIsLoginOpen(true);
          }}
          onLoginSuccess={() => {
            setIsLoggedIn(true);
          }}
        />
      )}

      {isLoginOpen && (
        <LoginModal 
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={() => {
            setIsLoggedIn(true);
            setIsLoginOpen(false);
          }}
        />
      )}
    </main>
  );
}
