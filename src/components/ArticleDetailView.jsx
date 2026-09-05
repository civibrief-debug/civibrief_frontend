'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ShareModal from './ShareModal';
import SafeArticleBody from './SafeArticleBody';
import ArticleAdBanner from './ArticleAdBanner';
import { formatCoverImageUrl, parseGoogleDriveUrl, isArticleCoverVideo, getArticleCoverVideoUrl, getDefaultArticleImage } from '../lib/videoUtils';
import ContinuousCoverVideo from './ContinuousCoverVideo';
import ArticleMediaCover from './ArticleMediaCover';
import { 
  Clock, 
  Bookmark, 
  Share2, 
  Sparkles, 
  Check, 
  ArrowLeft, 
  ThumbsUp
} from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { HERO_FEATURED, MAIN_ARTICLES, HERO_SECONDARY } from '../data/newsData';

export default function ArticleDetailView({ id }) {
  const [dbArticle, setDbArticle] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(342);
  const [showShareModal, setShowShareModal] = useState(false);
  const { language, getSynchronousArticle, translateArticle, t } = useTranslation();
  const [translatedArticle, setTranslatedArticle] = useState(null);

  // Fetch live article by ID from common D1 database
  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    const fetchSingleArticle = async () => {
      try {
        const res = await fetch(`/api/db/articles/${encodeURIComponent(id)}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.data && isMounted) {
            setDbArticle(json.data);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch article from database:', err?.message || err);
      }
    };

    fetchSingleArticle();
    return () => { isMounted = false; };
  }, [id]);

  const allStories = [HERO_FEATURED, ...HERO_SECONDARY, ...MAIN_ARTICLES];
  const staticFallback = allStories.find(a => (a.slug || a.id) === id) || HERO_FEATURED;
  const rawArticle = dbArticle || staticFallback;

  useEffect(() => {
    let isMounted = true;
    if (language === 'en') {
      setTranslatedArticle(null);
      return;
    }
    if (rawArticle) {
      translateArticle(rawArticle, language).then(translated => {
        if (isMounted && translated) setTranslatedArticle(translated);
      });
    }
    return () => { isMounted = false; };
  }, [rawArticle, language, translateArticle]);

  const article = useMemo(() => {
    if (!rawArticle || language === 'en') return rawArticle;
    if (translatedArticle && translatedArticle._translatedLang === language) {
      if (translatedArticle._contentTranslated || !rawArticle.content) {
        return translatedArticle;
      }
      return { 
        ...rawArticle, 
        ...translatedArticle, 
        content: translatedArticle.content || rawArticle.content 
      };
    }
    return getSynchronousArticle(rawArticle, language);
  }, [rawArticle, language, translatedArticle, getSynchronousArticle]);


  const toggleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount(likesCount - 1);
    } else {
      setLiked(true);
      setLikesCount(likesCount + 1);
    }
  };

  return (
    <>
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        article={article} 
      />

      <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 24px' }}>
        {/* Back Link & Category */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>
            <ArrowLeft size={16} />
            <span>{t("Back to Briefings")}</span>
          </Link>
          <span className="category-badge">{t(article.category || 'NEWS')}</span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 800, lineHeight: 1.2, marginBottom: '20px' }}>
          {article.title}
        </h1>

        {/* Article Metadata Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--accent-emerald)' }}>{article.author || 'Staff Reporter'}</span>
          </div>


          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={toggleLike}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: 'var(--radius-sm)', background: liked ? 'var(--accent-emerald-light)' : 'var(--bg-secondary)', color: liked ? 'var(--accent-emerald)' : 'var(--text-secondary)', fontWeight: 700, fontSize: '13px' }}
            >
              <ThumbsUp size={16} />
              <span>{likesCount}</span>
            </button>

            <button 
              onClick={() => setBookmarked(!bookmarked)}
              style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: bookmarked ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}
            >
              <Bookmark size={18} fill={bookmarked ? 'var(--accent-emerald)' : 'none'} />
            </button>

            <button 
              onClick={() => setShowShareModal(true)} 
              style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
              title="Share Article"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Featured Cover Media (Video, Document, or Image) */}
        <div style={{ marginBottom: '32px', width: article.coverWidth || '100%', margin: '0 auto 32px auto' }}>
          <ArticleMediaCover
            article={article}
            style={{
              width: '100%',
              height: article.coverHeight === 'auto' ? 'auto' : (article.coverHeight || '450px'),
              minHeight: article.coverHeight === 'auto' ? '300px' : undefined,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
            imageStyle={{
              borderRadius: 'var(--radius-lg)',
              maxHeight: article.coverHeight === 'auto' ? 'none' : (article.coverHeight || '480px')
            }}
            controls={true}
            autoPlay={true}
            muted={true}
            loop={true}
            priority={true}
            showCaption={true}
          />
        </div>

        {/* Key Takeaways Box */}
        {article.takeaways && article.takeaways.length > 0 && (
          <div style={{ background: 'var(--accent-emerald-light)', borderLeft: '4px solid var(--accent-emerald)', padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '36px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} />
              {t("Executive Takeaways")}
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {article.takeaways.map((point, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                  <Check size={18} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Body */}
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '19px', lineHeight: 1.7, color: 'var(--text-primary)' }}>
          {article.content && (article.content.includes('<') || article.content.includes('>')) ? (
            <SafeArticleBody content={article.content} className="article-body" adConfig={article} adPlacements={article.adPlacements} />
          ) : (
            (article.content || article.excerpt || '').split('\n\n').map((para, i, arr) => {
              const activeAds = Array.isArray(article?.adPlacements) && article.adPlacements.length > 0
                ? article.adPlacements.filter(a => a && a.enabled)
                : (article?.placeholderAdEnabled ? [article] : []);

              const matchingAds = activeAds.filter(a => {
                const targetIdx = parseInt(a.placementValue || a.placeholderAdPositionValue || '2');
                const pType = a.placementType || a.placeholderAdPositionType || 'after_paragraph';
                if (pType === 'after_intro') return i === 0;
                if (pType === 'before_related') return i === arr.length - 1;
                return i === Math.min(arr.length - 1, Math.max(0, targetIdx - 1));
              });

              return (
                <React.Fragment key={i}>
                  <p style={{ marginBottom: '24px' }}>
                    {para}
                  </p>
                  {matchingAds.map((ad, idx) => (
                    <ArticleAdBanner key={ad.id || idx} adConfig={ad} alignment={ad.alignment} label={ad.label} contentType={ad.contentType} content={ad.content} />
                  ))}
                </React.Fragment>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}
