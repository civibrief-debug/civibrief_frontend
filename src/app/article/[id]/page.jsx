'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ShareModal from '../../../components/ShareModal';
import { 
  Volume2, 
  Clock, 
  Bookmark, 
  Share2, 
  Sparkles, 
  Check, 
  ArrowLeft, 
  MessageSquare,
  ThumbsUp
} from 'lucide-react';
import { HERO_FEATURED, MAIN_ARTICLES, HERO_SECONDARY } from '../../../data/newsData';

export default function ArticlePage({ params }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(342);
  const [showShareModal, setShowShareModal] = useState(false);

  // Match article from params slug or default to HERO_FEATURED
  const allStories = [HERO_FEATURED, ...HERO_SECONDARY, ...MAIN_ARTICLES];
  const article = allStories.find(a => (a.slug || a.id) === params.id) || HERO_FEATURED;

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
            <span>Back to Briefings</span>
          </Link>
          <span className="category-badge">{article.category || 'NEWS'}</span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 800, lineHeight: 1.2, marginBottom: '20px' }}>
          {article.title}
        </h1>

        {/* Article Metadata Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>{article.author || 'Staff Reporter'}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>•</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} />
              {article.readTime || '4 min read'}
            </span>
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

        {/* Featured Cover Image */}
        {article.imageUrl && (
          <div style={{ marginBottom: '32px' }}>
            <img 
              src={article.imageUrl} 
              alt={article.title} 
              style={{ width: '100%', borderRadius: 'var(--radius-lg)', maxHeight: '480px', objectFit: 'cover' }} 
            />
            {article.imageCaption && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center', fontStyle: 'italic' }}>
                {article.imageCaption}
              </p>
            )}
          </div>
        )}

        {/* Key Takeaways Box */}
        {article.takeaways && article.takeaways.length > 0 && (
          <div style={{ background: 'var(--accent-emerald-light)', borderLeft: '4px solid var(--accent-emerald)', padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '36px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} />
              Executive Takeaways
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
        {article.content && (article.content.includes('<p>') || article.content.includes('<h1>') || article.content.includes('<h2>') || article.content.includes('<div>') || article.content.includes('<table')) ? (
          <div 
            className="article-body"
            style={{ width: '100%', minWidth: 0, wordBreak: 'normal', overflowWrap: 'break-word' }} 
            dangerouslySetInnerHTML={{ __html: article.content }} 
          />
        ) : (
          (article.content || article.excerpt || '').split('\n\n').map((para, i) => (
            <p key={i} style={{ marginBottom: '24px' }}>
              {para}
            </p>
          ))
        )}
      </div>
    </main>
    </>
  );
}
