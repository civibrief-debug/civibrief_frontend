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
import { formatCoverImageUrl, isArticleCoverVideo, getArticleCoverVideoUrl, getDefaultArticleImage } from '../lib/videoUtils';
import ContinuousCoverVideo from './ContinuousCoverVideo';
import ArticleMediaCover from './ArticleMediaCover';
import LiveAdSlot from './LiveAdSlot';
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

const FALLBACK_ALL = [FALLBACK_HERO_FEATURED, ...FALLBACK_HERO_SECONDARY, ...FALLBACK_MAIN_ARTICLES];
const categoryArticlesCache = new Map();

function SectionPageInner({ slug }) {
  const searchParams = useSearchParams();
  const subSectionParam = searchParams ? searchParams.get('subsection') || 'All' : 'All';

  const categoryMeta = useMemo(() => matchCategory(slug), [slug]);
  const sectionsData = CATEGORY_SECTIONS[categoryMeta.slug];

  const [activeSubSection, setActiveSubSection] = useState(subSectionParam);
  const [dbArticles, setDbArticles] = useState(() => categoryArticlesCache.get(categoryMeta.name) || []);
  const [translatedArticles, setTranslatedArticles] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { language, getSynchronousArticleList, translateMultipleArticles, t } = useTranslation();

  // Sync activeSubSection when URL param changes
  useEffect(() => {
    if (subSectionParam) {
      setActiveSubSection(subSectionParam);
    }
  }, [subSectionParam]);

  // Fetch articles for this category with in-memory caching for 0ms transitions
  const fetchCategoryArticles = async () => {
    try {
      const res = await fetch(`/api/db/articles?category=${encodeURIComponent(categoryMeta.name)}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          const published = json.data.filter(a => a.status === 'Published');
          categoryArticlesCache.set(categoryMeta.name, published);
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

  const categoryPool = useMemo(() => {
    if (dbArticles.length > 0) return dbArticles;
    const filteredFallback = FALLBACK_ALL.filter(a => 
      a.category?.toLowerCase() === categoryMeta.name.toLowerCase() ||
      a.category?.toLowerCase().includes(categoryMeta.slug)
    );
    return filteredFallback.length > 0 ? filteredFallback : FALLBACK_ALL;
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

  const activePool = useMemo(() => {
    if (language === 'en') return categoryPool;
    if (translatedArticles && translatedArticles.length > 0) return translatedArticles;
    return getSynchronousArticleList(categoryPool, language);
  }, [categoryPool, language, translatedArticles, getSynchronousArticleList]);

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

  const [translatedMostRead, setTranslatedMostRead] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (language === 'en') {
      setTranslatedMostRead(null);
      return;
    }
    translateMultipleArticles(FALLBACK_MOST_READ, language).then(translated => {
      if (isMounted && translated) setTranslatedMostRead(translated);
    });
    return () => { isMounted = false; };
  }, [language, translateMultipleArticles]);

  const activeMostRead = useMemo(() => {
    if (language === 'en') return FALLBACK_MOST_READ;
    if (translatedMostRead && translatedMostRead.length > 0) return translatedMostRead;
    return getSynchronousArticleList(FALLBACK_MOST_READ, language);
  }, [language, translatedMostRead, getSynchronousArticleList]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', paddingBottom: '80px' }}>
      {/* Category Header Ribbon */}
      <header style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)', paddingTop: '28px', paddingBottom: '16px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-crimson, #b90014)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              {t("HOME")}
            </Link>
            <ChevronRight size={12} opacity={0.6} />
            <span style={{ color: 'var(--text-muted)' }}>{t("NEWS")}</span>
            <ChevronRight size={12} opacity={0.6} />
            <span style={{ color: 'var(--accent-crimson, #b90014)', fontWeight: 800 }}>{t(categoryMeta.name)}</span>
          </nav>

          {/* Section Main Title */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '2px solid var(--accent-crimson, #b90014)', paddingBottom: '12px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: 900, letterSpacing: '-0.5px', margin: 0, color: 'var(--text-primary)' }}>
                {t(categoryMeta.name)}
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {t("Latest briefings, investigative reporting, deep analysis, and updates on")} {t(categoryMeta.name)}.
              </p>
            </div>
            
            {displayedArticles.length > 0 && (
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-crimson, #b90014)', background: 'var(--accent-crimson-light, rgba(220, 38, 38, 0.1))', padding: '4px 12px', borderRadius: '12px', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                {displayedArticles.length} {t("Stories Available")}
              </div>
            )}
          </div>

          {/* Sub-sections Pills Bar */}
          {sectionsData && sectionsData.sections && sectionsData.sections.length > 0 && (
            <div className="subsection-filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '16px 0 4px 0', scrollbarWidth: 'none' }}>
              <button
                type="button"
                onClick={() => setActiveSubSection('All')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: activeSubSection === 'All' ? 800 : 600,
                  border: activeSubSection === 'All' ? '1px solid var(--accent-crimson, #b90014)' : '1px solid var(--border-color)',
                  background: activeSubSection === 'All' ? 'var(--accent-crimson, #b90014)' : 'var(--bg-card)',
                  color: activeSubSection === 'All' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  boxShadow: activeSubSection === 'All' ? '0 2px 8px rgba(185, 0, 20, 0.25)' : 'none'
                }}
              >
                {t("All")} {t(categoryMeta.name)}
              </button>

              {sectionsData.sections.map((sub, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSubSection(sub.name)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12.5px',
                    fontWeight: activeSubSection === sub.name ? 800 : 600,
                    border: activeSubSection === sub.name ? '1px solid var(--accent-crimson, #b90014)' : '1px solid var(--border-color)',
                    background: activeSubSection === sub.name ? 'var(--accent-crimson, #b90014)' : 'var(--bg-card)',
                    color: activeSubSection === sub.name ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    boxShadow: activeSubSection === sub.name ? '0 2px 8px rgba(185, 0, 20, 0.25)' : 'none'
                  }}
                >
                  {t(sub.name)}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Section Masthead Leaderboard Ad Slot */}
      <div style={{ maxWidth: '1280px', margin: '14px auto 0 auto', padding: '0 24px' }}>
        <LiveAdSlot slotId="masthead-top" />
      </div>

      {/* Main Section Content Feed */}
      <main style={{ maxWidth: '1280px', margin: '24px auto 0 auto', padding: '0 24px' }}>
        {displayedArticles.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{t("No stories published under this sub-section yet.")}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>{t("Explore all stories in")} {t(categoryMeta.name)} {t("or return to home.")}</p>
            <button onClick={() => setActiveSubSection('All')} style={{ background: 'var(--accent-crimson, #b90014)', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>
              {t("View All")} {t(categoryMeta.name)}
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
                    borderBottom: '1px solid var(--border-color)', 
                    paddingBottom: '32px', 
                    marginBottom: '36px' 
                  }}
                >
                  {/* Lead Cover Media */}
                  <div 
                    style={{ position: 'relative', width: '100%', height: '420px', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', background: '#000', cursor: 'pointer' }}
                    onClick={() => setSelectedArticle(leadStory)}
                  >
                    <ArticleMediaCover
                      article={leadStory}
                      style={{ width: '100%', height: '100%', cursor: 'pointer' }}
                      autoPlay={true}
                      muted={true}
                      loop={true}
                      controls={false}
                      playsInline={true}
                      priority={true}
                      onClick={() => setSelectedArticle(leadStory)}
                    />
                    <span style={{ position: 'absolute', top: '14px', left: '14px', background: 'var(--accent-crimson, #b90014)', color: '#ffffff', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', padding: '4px 10px', borderRadius: '4px', letterSpacing: '0.5px', zIndex: 12 }}>
                      {t("FEATURED LEAD")}
                    </span>
                  </div>

                  {/* Kicker / Supertitle */}
                  {(leadStory.kicker || leadStory.supertitle) && (
                    <div style={{ color: 'var(--accent-crimson, #b90014)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                      {t(leadStory.kicker || leadStory.supertitle)}
                    </div>
                  )}

                  {/* Lead Headline */}
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 900, lineHeight: 1.25, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
                    {leadStory.title}
                  </h2>

                  {/* Lead Summary */}
                  {leadStory.summary && (
                    <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                      {leadStory.summary}
                    </p>
                  )}

                  {/* Meta Byline */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700 }}>
                    <span>{leadStory.author ? t(leadStory.author) : t('Staff Reporter')}</span>
                  </div>
                </article>
              )}

              {/* Remaining Stories Feed with Interleaved In-Feed Ads */}
              <div className="section-articles-stream" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {secondaryStories.concat(remainingStories).map((art, idx) => (
                  <React.Fragment key={art.id || idx}>
                    <article 
                      onClick={() => setSelectedArticle(art)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) 200px',
                        gap: '20px',
                        paddingBottom: '24px',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                      <div>
                        {(art.kicker || art.supertitle) && (
                          <div style={{ color: 'var(--accent-crimson, #b90014)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                            {t(art.kicker || art.supertitle)}
                          </div>
                        )}
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 800, lineHeight: 1.35, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                          {art.title}
                        </h3>
                        {art.summary && (
                          <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text-secondary)', margin: '0 0 10px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {art.summary}
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>
                          <span>{art.author ? t(art.author) : t('Staff Reporter')}</span>
                        </div>
                      </div>

                      <div style={{ width: '200px', height: '130px', borderRadius: '6px', overflow: 'hidden', background: '#000' }}>
                        <ArticleMediaCover
                          article={art}
                          style={{ width: '100%', height: '100%' }}
                          autoPlay={true}
                          muted={true}
                          loop={true}
                          controls={false}
                          playsInline={true}
                        />
                      </div>
                    </article>

                    {/* In-Feed Native Ad Slots between stories */}
                    {idx === 1 && (
                      <div style={{ margin: '8px 0', width: '100%' }}>
                        <LiveAdSlot slotId="in-feed-mid" />
                      </div>
                    )}
                    {idx === 3 && (
                      <div style={{ margin: '8px 0', width: '100%' }}>
                        <LiveAdSlot slotId="feed-row-2" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Right Sidebar: Live Sidebar Ads + Spotlight Newsletter + Trending Topics */}
            <aside className="section-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Right Sidebar Top Ad (Rolex Precision Chronometers & Placed Ads) */}
              <LiveAdSlot slotId="sidebar-top" />

              {/* Spotlight Box if configured */}
              {sectionsData?.spotlight && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-crimson, #b90014)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                    {t(sectionsData.spotlight.tag || 'NEWSLETTER')}
                  </div>
                  {sectionsData.spotlight.image && (
                    <div style={{ width: '100%', height: '140px', borderRadius: '6px', overflow: 'hidden', marginBottom: '14px' }}>
                      <img src={sectionsData.spotlight.image} alt={sectionsData.spotlight.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                    {t(sectionsData.spotlight.title)}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                    {t(sectionsData.spotlight.desc)}
                  </p>
                  <button 
                    type="button"
                    onClick={() => setIsLoginOpen(true)}
                    style={{ width: '100%', background: 'var(--accent-crimson, #b90014)', color: '#ffffff', border: 'none', padding: '9px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  >
                    {t(sectionsData.spotlight.cta || 'SUBSCRIBE NOW')}
                  </button>
                </div>
              )}

              {/* Trending in Category Box (Theme Adaptive) */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', color: '#0284c7', marginBottom: '16px', letterSpacing: '0.5px' }}>
                  <TrendingUp size={16} />
                  {t("Trending Briefings")}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {activeMostRead.slice(0, 4).map((tr, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedArticle(tr)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}
                    >
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 900, color: 'var(--text-muted)', opacity: 0.6, lineHeight: 1 }}>
                        0{idx + 1}
                      </span>
                      <div>
                        <h5 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', lineHeight: 1.35, color: 'var(--text-primary)' }}>
                          {tr.title}
                        </h5>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                          {t(tr.category || categoryMeta.name)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Sidebar Sticky / Bottom Ad */}
              <LiveAdSlot slotId="sidebar-sticky" />
            </aside>
          </div>
        )}
      </main>

      {/* Section Bottom Banner Break */}
      <div style={{ maxWidth: '1280px', margin: '32px auto 0 auto', padding: '0 24px' }}>
        <LiveAdSlot slotId="hero-bottom" />
      </div>

      {/* Floating Bottom Footer Anchor Ad */}
      <LiveAdSlot slotId="footer-floating" />

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
    <React.Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} />}>
      <SectionPageInner slug={slug} />
    </React.Suspense>
  );
}
