'use client';

import React, { useState, useEffect } from 'react';
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
  Play
} from 'lucide-react';
import { 
  HERO_FEATURED as FALLBACK_HERO_FEATURED, 
  HERO_SECONDARY as FALLBACK_HERO_SECONDARY, 
  MAIN_ARTICLES as FALLBACK_MAIN_ARTICLES, 
  MOST_READ as FALLBACK_MOST_READ, 
  DEEP_DIVES as FALLBACK_DEEP_DIVES 
} from '../data/newsData';
import { ArticleModal } from '../components/ArticleModal';
import { LoginModal } from '../components/LoginModal';
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

  // Hero 3-Second Continuous Slider State
  const [activeSlide, setActiveSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  // Fetch live articles from shared common database (strictly Published articles only)
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
      console.warn("Failed to fetch live database articles (suppressed):", err?.message || err);
    }
  };

  useEffect(() => {
    fetchLiveArticles().catch(() => {});
    const interval = setInterval(() => {
      fetchLiveArticles().catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Handle translation when articles or language change
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

  const rawActiveArticles = translatedArticles || (dbArticles.length > 0 ? dbArticles : [FALLBACK_HERO_FEATURED, ...FALLBACK_HERO_SECONDARY, ...FALLBACK_MAIN_ARTICLES]);
  const activeArticles = rawActiveArticles.filter(a => (!a.status || a.status === 'Published') && !isDeepDiveArticle(a));

  // Compute Top 4 News Stories for the Hero Slider (strictly excluding Deep Dives)
  const allHeroPool = [
    ...activeArticles,
    FALLBACK_HERO_FEATURED,
    ...FALLBACK_HERO_SECONDARY,
    ...FALLBACK_MAIN_ARTICLES
  ].filter(a => !isDeepDiveArticle(a));

  const uniqueHeroMap = new Map();
  allHeroPool.forEach(item => {
    if (item && item.id && !uniqueHeroMap.has(item.id)) {
      uniqueHeroMap.set(item.id, item);
    }
  });
  const heroTop4 = Array.from(uniqueHeroMap.values()).slice(0, 4);

  // Active Featured Story from Top 4
  const currentFeatured = heroTop4[activeSlide] || heroTop4[0] || FALLBACK_HERO_FEATURED;
  const liveArticlesList = activeArticles.length > 0 ? activeArticles : FALLBACK_MAIN_ARTICLES;

  // Continuous 3-Second Auto-Slide Timer (keeps going continuously)
  useEffect(() => {
    if (heroTop4.length <= 1) {
      return;
    }

    const intervalTime = 50; // update progress every 50ms
    const totalDuration = 3000; // 3 seconds
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setActiveSlide(curr => (curr + 1) % heroTop4.length);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [heroTop4.length, activeSlide]);

  const handleSelectSlide = (idx) => {
    setActiveSlide(idx);
    setProgress(0);
  };

  const handleDeepDiveClick = (dive) => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
    } else {
      setSelectedArticle(dive);
    }
  };

  const isRtl = ['ar', 'he', 'fa', 'ur'].includes(language);

  return (
    <main>
      {/* Hero 4-Grid Carousel Section */}
      <section className="hero-section">
        {/* Main Lead Story (Active Slide) */}
        <article 
          className="hero-main-card hero-slider-active-card" 
          onClick={() => setSelectedArticle(currentFeatured)} 
          style={{ cursor: 'pointer' }}
        >
          {/* Continuous 3-Second Slider Progress Bar */}
          <div className="hero-progress-track">
            <div 
              className="hero-progress-bar" 
              style={{ 
                width: `${progress}%`,
                backgroundColor: 'var(--accent-emerald, #10b981)'
              }} 
            />
          </div>

          <div className="hero-img-box" onClick={() => setSelectedArticle(currentFeatured)} style={{ cursor: 'pointer' }}>
            {currentFeatured.coverMediaType === 'video' && currentFeatured.videoUrl ? (
              <ContinuousCoverVideo
                key={`video-${currentFeatured.id}`}
                src={currentFeatured.videoUrl}
                cropStyle={currentFeatured.coverCropStyle}
                autoPlay={true}
                muted={true}
                loop={true}
                controls={false}
                playsInline={true}
                onClick={() => setSelectedArticle(currentFeatured)}
                style={{ width: '100%', height: '100%', cursor: 'pointer' }}
              />
            ) : (
              <img 
                key={`img-${currentFeatured.id}`}
                src={formatCoverImageUrl(currentFeatured.imageUrl) || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"} 
                alt={currentFeatured.title} 
                referrerPolicy="no-referrer"
                style={{ cursor: 'pointer', ...(currentFeatured.coverCropStyle || {}) }}
                onClick={() => setSelectedArticle(currentFeatured)}
                onError={(e) => {
                  const gdrive = parseGoogleDriveUrl(currentFeatured.imageUrl);
                  if (gdrive && !e.currentTarget.dataset.retried) {
                    e.currentTarget.dataset.retried = '1';
                    e.currentTarget.src = gdrive.proxyImageUrl || `https://lh3.googleusercontent.com/d/${gdrive.fileId}`;
                  }
                }}
              />
            )}

            
            {/* Audio Digest Badge if present */}
            {currentFeatured.hasAudio && (
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(9, 13, 22, 0.85)', backdropFilter: 'blur(4px)', color: '#34d399', fontSize: '11px', fontWeight: 800, padding: '5px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 10 }}>
                <Volume2 size={14} />
                <span>LISTEN NOW</span>
              </div>
            )}
          </div>

          <div className="hero-content" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Small Dotted Pagination Indicators Below Image */}
            <div className="hero-slide-dots-container" onClick={e => e.stopPropagation()}>
              {heroTop4.map((s, idx) => (
                <button
                  key={`dot-${s.id || idx}`}
                  type="button"
                  onClick={() => handleSelectSlide(idx)}
                  className={`hero-dot ${idx === activeSlide ? 'active' : ''}`}
                  aria-label={`Go to slide ${idx + 1}`}
                  title={`View Top Story 0${idx + 1}: ${s.title}`}
                />
              ))}
            </div>

            <div className="category-tag">
              <Sparkles size={13} />
              <span dir="ltr">{currentFeatured.kicker ? currentFeatured.kicker.toUpperCase() : (currentFeatured.category || 'Technology')}</span>
            </div>

            <h1 className="hero-main-title" onClick={() => setSelectedArticle(currentFeatured)} style={{ cursor: 'pointer' }}>
              {currentFeatured.title}
            </h1>

            <p className="hero-main-summary" onClick={() => setSelectedArticle(currentFeatured)} style={{ cursor: 'pointer' }}>
              {currentFeatured.summary || currentFeatured.excerpt}
            </p>

            <div className="hero-meta">
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>{currentFeatured.author || 'Staff Reporter'}</span>
            </div>
          </div>
        </article>

        {/* Secondary Stack (Interactive 4-Story Playlist) */}
        <div className="hero-secondary-stack">
          {heroTop4.map((story, idx) => {
            const isActive = idx === activeSlide;
            return (
              <article 
                key={story.id || idx} 
                className={`secondary-card ${isActive ? 'secondary-card-active' : ''}`} 
                onClick={() => handleSelectSlide(idx)} 
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                {isActive && (
                  <div className="active-card-indicator-badge">
                    <span>NOW SHOWING</span>
                  </div>
                )}
                <div className="secondary-content" dir={isRtl ? 'rtl' : 'ltr'}>
                  <div className="category-tag" style={{ fontSize: '10px' }} dir="ltr">
                    <Sparkles size={11} />
                    <span>{story.kicker ? story.kicker.toUpperCase() : (story.category || 'NEWS')}</span>
                  </div>
                  <h3 className="secondary-title">{story.title}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: 800, marginTop: '6px' }} dir="ltr">
                    <span>{story.author || 'Desk'}</span>
                  </div>
                </div>

                <img 
                  src={formatCoverImageUrl(story.imageUrl) || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80"} 
                  alt={story.title} 
                  referrerPolicy="no-referrer"
                  className="secondary-img" 
                  onError={(e) => {
                    const gdrive = parseGoogleDriveUrl(story.imageUrl);
                    if (gdrive && !e.currentTarget.dataset.retried) {
                      e.currentTarget.dataset.retried = '1';
                      e.currentTarget.src = gdrive.proxyImageUrl || `https://lh3.googleusercontent.com/d/${gdrive.fileId}`;
                    }
                  }}
                />
              </article>
            );
          })}
        </div>
      </section>



      {/* Main Feed & Sidebar Grid */}
      <section className="main-feed-layout">
        {/* Left Column Feed */}
        <div className="feed-grid-wrapper">
          <div className="section-title">
            <span>Latest Intelligence</span>
            <Compass size={20} color="var(--accent-emerald)" />
          </div>

          <div className="feed-grid">
            {liveArticlesList.map((article) => (
              <article key={article.id} className="article-card-vertical" onClick={() => setSelectedArticle(article)} style={{ cursor: 'pointer' }}>
                <div className="card-v-img-box">
                  {article.coverMediaType === 'video' && article.videoUrl ? (
                    <ContinuousCoverVideo
                      src={article.videoUrl}
                      cropStyle={article.coverCropStyle}
                      autoPlay={true}
                      muted={true}
                      loop={true}
                      controls={false}
                      playsInline={true}
                      onClick={() => setSelectedArticle(article)}
                      className="card-v-img"
                      style={{ objectFit: 'cover', cursor: 'pointer' }}
                    />
                  ) : (
                    <img 
                      src={formatCoverImageUrl(article.imageUrl) || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"} 
                      alt={article.title} 
                      referrerPolicy="no-referrer"
                      className="card-v-img" 
                      onClick={() => setSelectedArticle(article)}
                      style={{ cursor: 'pointer', ...(article.coverCropStyle || {}) }}
                      onError={(e) => {
                        const gdrive = parseGoogleDriveUrl(article.imageUrl);
                        if (gdrive && !e.currentTarget.dataset.retried) {
                          e.currentTarget.dataset.retried = '1';
                          e.currentTarget.src = gdrive.proxyImageUrl || `https://lh3.googleusercontent.com/d/${gdrive.fileId}`;
                        }
                      }}
                    />
                  )}
                </div>
                <div className="card-v-content">
                  <div className="category-tag" style={{ fontSize: '11px' }}>
                    <Sparkles size={12} />
                    <span>{article.kicker ? article.kicker.toUpperCase() : (article.category || 'TECHNOLOGY')}</span>
                  </div>
                  <h3 className="card-v-title">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="card-v-summary">
                      {article.summary || article.excerpt}
                    </p>
                  )}
                  <div className="card-v-meta">
                    <span className="card-v-author">{article.author || 'Staff Reporter'}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="sidebar-trending">
          <div className="section-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} color="var(--accent-crimson)" />
              Most Read Today
            </span>
          </div>

          <div>
            {(activeArticles.length > 0 ? activeArticles.slice(0, 5) : FALLBACK_MOST_READ).map((item, idx) => (
              <div key={item.id} className="trending-item" onClick={() => setSelectedArticle(item)} style={{ cursor: 'pointer' }} dir={isRtl ? 'rtl' : 'ltr'}>
                <span className="rank-number" dir="ltr">0{idx + 1}</span>
                <div>
                  <div className="category-tag" style={{ fontSize: '9px', marginBottom: '2px' }} dir="ltr">
                    <Sparkles size={10} />
                    <span>{item.kicker ? item.kicker.toUpperCase() : item.category}</span>
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                    {item.title}
                  </h4>
                  <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 700, marginTop: '4px' }} dir="ltr">
                    {item.author || 'Staff Desk'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {/* Special Deep Dives Dark Feature Section */}
      <section className="deep-dives-banner">
        <div className="deep-dives-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="category-tag" style={{ color: 'var(--accent-emerald)' }}>
                <span>SPECIAL INVESTIGATIONS</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 900, color: '#ffffff' }}>
                Deep Dives 💎
              </h2>
            </div>
            <button 
              onClick={() => {
                if (!isLoggedIn) setIsLoginOpen(true);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              Explore All Investigations {!isLoggedIn && <Lock size={14} />} <ArrowUpRight size={18} />
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
                  <div style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(220, 38, 38, 0.9)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10 }}>
                    <Lock size={12} />
                    <span>MEMBER ONLY</span>
                  </div>
                )}
                <div className="deep-card-content">
                  <div className="category-tag" style={{ fontSize: '10px' }}>
                    <Sparkles size={11} />
                    <span>{dive.category}</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                    {dive.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '14px' }}>
                    {dive.subtitle}
                  </p>
                  <div style={{ fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                    By {dive.author}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>


      {/* Article Modal */}
      {selectedArticle && (
        <ArticleModal 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
          isLoggedIn={isLoggedIn}
          onOpenLogin={() => {
            setSelectedArticle(null);
            setIsLoginOpen(true);
          }}
          onLoginSuccess={(u) => {
            setIsLoggedIn(true);
          }}
        />
      )}

      {/* Login Modal */}
      {isLoginOpen && (
        <LoginModal 
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={(u) => {
            setIsLoggedIn(true);
            setIsLoginOpen(false);
          }}
        />
      )}
    </main>
  );
}
