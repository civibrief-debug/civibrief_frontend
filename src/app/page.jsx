'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Volume2, 
  Clock, 
  ArrowUpRight, 
  Sparkles, 
  TrendingUp, 
  Bookmark, 
  Share2, 
  Compass, 
  Flame,
  Lock
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

export default function HomePage() {
  const [dbArticles, setDbArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fetch live articles from shared common database
  const fetchLiveArticles = async () => {
    try {
      const res = await fetch('/api/db/articles');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setDbArticles(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch live database articles:", err);
    }
  };

  useEffect(() => {
    fetchLiveArticles();
    const interval = setInterval(fetchLiveArticles, 5000);
    return () => clearInterval(interval);
  }, []);

  // Compute live featured story & articles
  const liveFeatured = dbArticles.find(a => a.featured) || dbArticles[0] || FALLBACK_HERO_FEATURED;
  const liveArticlesList = dbArticles.length > 0 ? dbArticles : FALLBACK_MAIN_ARTICLES;
  const secondaryStack = dbArticles.length > 1 ? dbArticles.slice(1, 4) : FALLBACK_HERO_SECONDARY;

  const handleDeepDiveClick = (dive) => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
    } else {
      setSelectedArticle(dive);
    }
  };

  return (
    <main>
      {/* Hero 4-Grid Section */}
      <section className="hero-section">
        {/* Main Lead Story */}
        <article className="hero-main-card">
          <div className="hero-img-box">
            <img 
              src={liveFeatured.imageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"} 
              alt={liveFeatured.title} 
            />
            {liveFeatured.hasAudio && (
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(9, 13, 22, 0.85)', backdropFilter: 'blur(4px)', color: '#34d399', fontSize: '11px', fontWeight: 800, padding: '6px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Volume2 size={14} />
                <span>LISTEN • 5 MIN</span>
              </div>
            )}
          </div>

          <div className="hero-content">
            <div className="category-tag">
              <Sparkles size={13} />
              <span>{liveFeatured.kicker ? liveFeatured.kicker.toUpperCase() : (liveFeatured.category || 'Technology')}</span>
            </div>

            <div onClick={() => setSelectedArticle(liveFeatured)} style={{ cursor: 'pointer' }}>
              <h1 className="hero-headline">{liveFeatured.title}</h1>
            </div>

            <p className="hero-subtitle">{liveFeatured.summary || liveFeatured.subtitle}</p>

            <div className="author-meta">
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{liveFeatured.author || 'Staff Reporter'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{liveFeatured.publishedAt ? new Date(liveFeatured.publishedAt).toLocaleDateString() : 'August 2026'} • 5 min read</div>
              </div>
            </div>
          </div>
        </article>

        {/* Secondary Stack */}
        <div className="hero-secondary-stack">
          {secondaryStack.map((story) => (
            <article key={story.id} className="secondary-card" onClick={() => setSelectedArticle(story)} style={{ cursor: 'pointer' }}>
              <div className="secondary-content">
                <div className="category-tag" style={{ fontSize: '10px' }}>
                  {story.kicker ? <span style={{ color: 'var(--accent-gold, #d97706)', fontWeight: 800 }}>{story.kicker}</span> : story.category}
                </div>
                <h3 className="secondary-title">{story.title}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <span>{story.author || 'Desk'}</span>
                  <span>•</span>
                  <Clock size={12} />
                  <span>3 min read</span>
                </div>
              </div>

              <img 
                src={story.imageUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80"} 
                alt={story.title} 
                className="secondary-img" 
              />
            </article>
          ))}
        </div>
      </section>

      {/* Main Feed & Sidebar Grid */}
      <section className="main-feed-layout">
        {/* Left Column Feed */}
        <div className="feed-grid">
          <div className="section-title">
            <span>Latest Intelligence (Live Shared DB)</span>
            <Compass size={20} color="var(--accent-emerald)" />
          </div>

          {liveArticlesList.map((article) => (
            <article key={article.id} className="article-card-horizontal" onClick={() => setSelectedArticle(article)} style={{ cursor: 'pointer' }}>
              <img 
                src={article.imageUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"} 
                alt={article.title} 
                className="card-h-img" 
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="category-tag" style={{ fontSize: '10px' }}>
                  {article.kicker ? <span style={{ color: 'var(--accent-gold, #d97706)', fontWeight: 800 }}>{article.kicker}</span> : article.category}
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '8px' }}>
                  {article.title}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                  {article.summary || article.excerpt}
                </p>
                <div style={{ marginTop: 'auto', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{article.author || 'Staff Reporter'}</span>
                  <span>•</span>
                  <span>4 min read</span>
                </div>
              </div>
            </article>
          ))}
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
            {(dbArticles.length > 0 ? dbArticles.slice(0, 5) : FALLBACK_MOST_READ).map((item, idx) => (
              <div key={item.id} className="trending-item" onClick={() => setSelectedArticle(item)} style={{ cursor: 'pointer' }}>
                <span className="rank-number">0{idx + 1}</span>
                <div>
                  <div className="category-tag" style={{ fontSize: '9px', marginBottom: '2px' }}>
                    {item.category}
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                    {item.title}
                  </h4>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
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
                    {dive.category} • {dive.readTime}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                    {dive.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '14px' }}>
                    {dive.subtitle}
                  </p>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
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
