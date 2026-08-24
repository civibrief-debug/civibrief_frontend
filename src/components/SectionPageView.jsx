'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Clock, 
  ArrowUpRight, 
  Sparkles, 
  TrendingUp, 
  Bookmark, 
  Share2, 
  Compass, 
  Flame,
  ChevronRight,
  Filter,
  Volume2
} from 'lucide-react';
import { 
  CATEGORIES, 
  CATEGORY_SECTIONS, 
  HERO_FEATURED as FALLBACK_HERO_FEATURED, 
  HERO_SECONDARY as FALLBACK_HERO_SECONDARY, 
  MAIN_ARTICLES as FALLBACK_MAIN_ARTICLES,
  MOST_READ as FALLBACK_MOST_READ 
} from '../data/newsData';
import { ArticleModal } from './ArticleModal';
import { LoginModal } from './LoginModal';
import { formatCoverImageUrl, parseGoogleDriveUrl, isArticleCoverVideo, getArticleCoverVideoUrl } from '../lib/videoUtils';
import ContinuousCoverVideo from './ContinuousCoverVideo';
import { useTranslation } from '../context/TranslationContext';

// Helper to normalize category slugs
function matchCategory(slug) {
  if (!slug) return { name: 'Top Stories', slug: 'top-stories' };
  const clean = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (clean.includes('tech') || clean.includes('ai')) return { name: 'Tech & AI', slug: 'tech' };
  if (clean.includes('global') || clean.includes('world') || clean.includes('international')) return { name: 'Global Affairs', slug: 'global' };
  if (clean.includes('market') || clean.includes('economy') || clean.includes('business')) return { name: 'Markets & Economy', slug: 'markets' };
  if (clean.includes('science') || clean.includes('climate')) return { name: 'Science & Climate', slug: 'science' };
  if (clean.includes('movie') || clean.includes('entertainment')) return { name: 'Movies', slug: 'movies' };
  if (clean.includes('life') || clean.includes('style')) return { name: 'Lifestyle', slug: 'lifestyle' };
  if (clean.includes('sport')) return { name: 'Sports', slug: 'sports' };
  if (clean.includes('opinion') || clean.includes('essay')) return { name: 'Opinion & Essays', slug: 'opinion' };
  if (clean.includes('culture') || clean.includes('design')) return { name: 'Culture & Design', slug: 'culture' };
  if (clean.includes('deep') || clean.includes('dive')) return { name: 'Deep Dives 💎', slug: 'deep-dives' };
  
  const found = CATEGORIES.find(c => c.slug === slug || c.name.toLowerCase() === slug.toLowerCase());
  return found || { name: slug.charAt(0).toUpperCase() + slug.slice(1), slug };
}

function SectionPageInner({ slug }) {
  const searchParams = useSearchParams();
  const subSectionParam = searchParams ? searchParams.get('subsection') || 'All' : 'All';

  const categoryMeta = useMemo(() => matchCategory(slug), [slug]);
  const sectionsData = CATEGORY_SECTIONS[categoryMeta.slug];

  const [activeSubSection, setActiveSubSection] = useState(subSectionParam);
  const [dbArticles, setDbArticles] = useState([]);
  const [translatedArticles, setTranslatedArticles] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { language, translateMultipleArticles, isTranslating } = useTranslation();

  // Sync activeSubSection when URL param changes
  useEffect(() => {
    if (subSectionParam) {
      setActiveSubSection(subSectionParam);
    }
  }, [subSectionParam]);

  // Fetch articles for this category
  const fetchCategoryArticles = async () => {
    try {
      const res = await fetch(`/api/db/articles?category=${encodeURIComponent(categoryMeta.name)}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          const published = json.data.filter(a => a.status === 'Published');
          setDbArticles(published);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch category articles:', e.message);
    }
  };

  useEffect(() => {
    fetchCategoryArticles();
  }, [categoryMeta.name]);

  // Compute base pool of articles
  const allFallback = [FALLBACK_HERO_FEATURED, ...FALLBACK_HERO_SECONDARY, ...FALLBACK_MAIN_ARTICLES];
  const categoryPool = useMemo(() => {
    if (dbArticles.length > 0) return dbArticles;
    const filteredFallback = allFallback.filter(a => 
      a.category?.toLowerCase() === categoryMeta.name.toLowerCase() ||
      a.category?.toLowerCase().includes(categoryMeta.slug)
    );
    return filteredFallback.length > 0 ? filteredFallback : allFallback;
  }, [dbArticles, categoryMeta]);

  // Handle translation
  useEffect(() => {
    let isMounted = true;
    if (language === 'en') {
      setTranslatedArticles(null);
      return;
    }
    if (categoryPool.length > 0) {
      translateMultipleArticles(categoryPool, language).then(translated => {
        if (isMounted && translated) setTranslatedArticles(translated);
      });
    }
    return () => { isMounted = false; };
  }, [categoryPool, language, translateMultipleArticles]);

  const activePool = translatedArticles || categoryPool;

  // Filter by sub-section if selected
  const displayedArticles = useMemo(() => {
    if (!activeSubSection || activeSubSection === 'All') return activePool;
    return activePool.filter(a => 
      (a.subSection && a.subSection.toLowerCase() === activeSubSection.toLowerCase()) ||
      (a.kicker && a.kicker.toLowerCase().includes(activeSubSection.toLowerCase())) ||
      (a.title && a.title.toLowerCase().includes(activeSubSection.toLowerCase()))
    );
  }, [activePool, activeSubSection]);

  const leadStory = displayedArticles[0] || categoryPool[0] || FALLBACK_HERO_FEATURED;
  const secondaryStories = displayedArticles.slice(1, 4);
  const remainingStories = displayedArticles.slice(4);

  return (
    <div className="section-page-container" style={{ minHeight: '100vh', background: 'var(--bg-primary, #090d16)', color: 'var(--text-primary, #f8fafc)', paddingBottom: '80px' }}>
      {/* Section Breadcrumbs & Header (The Hindu Style) */}
      <header className="section-page-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '24px 0 16px 0', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted, #94a3b8)', marginBottom: '14px' }}>
            <Link href="/" style={{ color: 'var(--text-muted, #94a3b8)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#38bdf8'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted, #94a3b8)'}>
              HOME
            </Link>
            <ChevronRight size={12} opacity={0.6} />
            <span style={{ color: 'var(--text-muted, #94a3b8)' }}>NEWS</span>
            <ChevronRight size={12} opacity={0.6} />
            <span style={{ color: '#dc2626' }}>{categoryMeta.name}</span>
          </nav>

          {/* Section Main Title */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '2px solid #dc2626', paddingBottom: '12px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: '38px', fontWeight: 900, letterSpacing: '-0.5px', margin: 0, color: 'var(--text-primary, #f8fafc)' }}>
                {categoryMeta.name}
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}>
                Latest briefings, investigative reporting, deep analysis, and updates on {categoryMeta.name}.
              </p>
            </div>
            
            {displayedArticles.length > 0 && (
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '4px 12px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                {displayedArticles.length} Stories Available
              </div>
            )}
          </div>

          {/* Sub-Section Filter Tabs (if available) */}
          {sectionsData && sectionsData.sections && sectionsData.sections.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '14px 0 4px 0', scrollbarWidth: 'none' }}>
              <button
                onClick={() => setActiveSubSection('All')}
                style={{
                  background: activeSubSection === 'All' ? '#dc2626' : 'rgba(255,255,255,0.06)',
                  color: activeSubSection === 'All' ? '#ffffff' : 'var(--text-secondary, #cbd5e1)',
                  border: '1px solid ' + (activeSubSection === 'All' ? '#dc2626' : 'rgba(255,255,255,0.1)'),
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                All {categoryMeta.name}
              </button>

              {sectionsData.sections.map((sub, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSubSection(sub.name)}
                  style={{
                    background: activeSubSection === sub.name ? '#dc2626' : 'rgba(255,255,255,0.06)',
                    color: activeSubSection === sub.name ? '#ffffff' : 'var(--text-secondary, #cbd5e1)',
                    border: '1px solid ' + (activeSubSection === sub.name ? '#dc2626' : 'rgba(255,255,255,0.1)'),
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Section Content Feed */}
      <main style={{ maxWidth: '1280px', margin: '32px auto 0 auto', padding: '0 24px' }}>
        {displayedArticles.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>No stories published under this sub-section yet.</h3>
            <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '14px', marginBottom: '20px' }}>Explore all stories in {categoryMeta.name} or return to home.</p>
            <button onClick={() => setActiveSubSection('All')} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>
              View All {categoryMeta.name}
            </button>
          </div>
        ) : (
          <div className="section-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '36px' }}>
            {/* Left Main Column: Lead Story + Article Feed */}
            <div className="section-feed-left">
              {/* Lead Featured Story */}
              {leadStory && (
                <article 
                  onClick={() => setSelectedArticle(leadStory)}
                  style={{ 
                    cursor: 'pointer', 
                    borderBottom: '1px solid rgba(255,255,255,0.12)', 
                    paddingBottom: '32px', 
                    marginBottom: '36px' 
                  }}
                >
                  {/* Lead Cover Media */}
                  <div 
                    style={{ position: 'relative', width: '100%', height: '420px', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', background: '#000', cursor: 'pointer' }}
                    onClick={() => setSelectedArticle(leadStory)}
                  >
                    {isArticleCoverVideo(leadStory) ? (
                      <ContinuousCoverVideo 
                        src={getArticleCoverVideoUrl(leadStory)}
                        cropStyle={leadStory.coverCropStyle || leadStory.coverVideoCrop}
                        autoPlay={true}
                        muted={true}
                        loop={true}
                        controls={false}
                        onClick={() => setSelectedArticle(leadStory)}
                        style={{ width: '100%', height: '100%', cursor: 'pointer' }}
                      />
                    ) : (
                      <img 
                        src={formatCoverImageUrl(leadStory.imageUrl) || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"} 
                        alt={leadStory.title} 
                        referrerPolicy="no-referrer"
                        onClick={() => setSelectedArticle(leadStory)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                      />
                    )}
                    <span style={{ position: 'absolute', top: '14px', left: '14px', background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', padding: '4px 10px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                      FEATURED LEAD
                    </span>
                  </div>

                  {/* Kicker / Supertitle */}
                  {(leadStory.kicker || leadStory.supertitle) && (
                    <div style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                      {leadStory.kicker || leadStory.supertitle}
                    </div>
                  )}

                  {/* Lead Headline */}
                  <h2 style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: '32px', fontWeight: 900, lineHeight: 1.25, margin: '0 0 12px 0', color: 'var(--text-primary, #f8fafc)' }}>
                    {leadStory.title}
                  </h2>

                  {/* Lead Summary */}
                  {leadStory.summary && (
                    <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--text-secondary, #cbd5e1)', margin: '0 0 16px 0' }}>
                      {leadStory.summary}
                    </p>
                  )}

                  {/* Meta Byline */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: 'var(--accent-emerald, #34d399)', fontWeight: 700 }}>
                    <span>{leadStory.author || 'Staff Reporter'}</span>
                  </div>
                </article>
              )}

              {/* Remaining Stories Feed */}
              <div className="section-articles-stream" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {secondaryStories.concat(remainingStories).map((art, idx) => (
                  <article 
                    key={art.id || idx}
                    onClick={() => setSelectedArticle(art)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) 200px',
                      gap: '20px',
                      paddingBottom: '24px',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    <div>
                      {(art.kicker || art.supertitle) && (
                        <div style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                          {art.kicker || art.supertitle}
                        </div>
                      )}
                      <h3 style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: '20px', fontWeight: 800, lineHeight: 1.35, margin: '0 0 8px 0', color: 'var(--text-primary, #f8fafc)' }}>
                        {art.title}
                      </h3>
                      {art.summary && (
                        <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text-secondary, #cbd5e1)', margin: '0 0 10px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {art.summary}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--accent-emerald, #34d399)', fontWeight: 700 }}>
                        <span>{art.author || 'Staff Reporter'}</span>
                      </div>
                    </div>


                    {(isArticleCoverVideo(art) || art.imageUrl) && (
                      <div style={{ width: '200px', height: '130px', borderRadius: '6px', overflow: 'hidden', background: '#000' }}>
                        {isArticleCoverVideo(art) ? (
                          <ContinuousCoverVideo
                            src={getArticleCoverVideoUrl(art)}
                            cropStyle={art.coverCropStyle || art.coverVideoCrop}
                            autoPlay={true}
                            muted={true}
                            loop={true}
                            controls={false}
                            playsInline={true}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <img 
                            src={formatCoverImageUrl(art.imageUrl) || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80"} 
                            alt={art.title} 
                            referrerPolicy="no-referrer"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>

            {/* Right Sidebar: Spotlight Newsletter + Trending Topics */}
            <aside className="section-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Spotlight Box if configured */}
              {sectionsData?.spotlight && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '20px', overflow: 'hidden' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                    {sectionsData.spotlight.tag || 'NEWSLETTER'}
                  </div>
                  {sectionsData.spotlight.image && (
                    <div style={{ width: '100%', height: '140px', borderRadius: '6px', overflow: 'hidden', marginBottom: '14px' }}>
                      <img src={sectionsData.spotlight.image} alt={sectionsData.spotlight.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#f8fafc' }}>
                    {sectionsData.spotlight.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                    {sectionsData.spotlight.desc}
                  </p>
                  <button 
                    onClick={() => setIsLoginOpen(true)}
                    style={{ width: '100%', background: '#dc2626', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}
                  >
                    {sectionsData.spotlight.cta || 'SUBSCRIBE NOW'}
                  </button>
                </div>
              )}

              {/* Trending in Category Box */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', marginBottom: '16px' }}>
                  <TrendingUp size={16} />
                  Trending Briefings
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {FALLBACK_MOST_READ.slice(0, 4).map((tr, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedArticle(tr)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', lineHeight: 1 }}>
                        0{idx + 1}
                      </span>
                      <div>
                        <h5 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', lineHeight: 1.35, color: '#f8fafc' }}>
                          {tr.title}
                        </h5>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700 }}>
                          {tr.category || categoryMeta.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Article Detail Reading Modal */}
      {selectedArticle && (
        <ArticleModal 
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          isLoggedIn={isLoggedIn}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLoginSuccess={() => {
            setIsLoggedIn(true);
            setIsLoginOpen(false);
          }}
        />
      )}

      {/* Login Modal */}
      {isLoginOpen && (
        <LoginModal 
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={() => {
            setIsLoggedIn(true);
            setIsLoginOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default function SectionPageView({ slug }) {
  return (
    <React.Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary, #090d16)' }} />}>
      <SectionPageInner slug={slug} />
    </React.Suspense>
  );
}
