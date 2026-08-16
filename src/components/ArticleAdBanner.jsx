'use client';

import React from 'react';
import { Megaphone, Sparkles, ExternalLink, MousePointerClick } from 'lucide-react';

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
  const description = adConfig.description || adConfig.placeholderAdDescription || 'Discover exclusive offers and services curated for our readers.';
  const ctaText = adConfig.ctaText || adConfig.placeholderAdCtaText || 'Learn More ↗';

  // Responsive alignment styling
  let containerStyle = {
    margin: '32px auto',
    maxWidth: '728px',
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
      margin: '12px 28px 18px 0',
      width: '46%',
      maxWidth: '380px',
      float: 'left',
      clear: 'none'
    };
  } else if (align === 'right') {
    containerStyle = {
      margin: '12px 0 18px 28px',
      width: '46%',
      maxWidth: '380px',
      float: 'right',
      clear: 'none'
    };
  }

  const handleBannerClick = () => {
    if (redirectUrl && redirectUrl.startsWith('http')) {
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    }
  };

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
        onClick={handleBannerClick}
        style={{
          background: 'var(--bg-secondary, #0f172a)',
          border: '1.5px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          cursor: redirectUrl ? 'pointer' : 'default',
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
            <Megaphone size={12} style={{ color: 'var(--accent-emerald, #10b981)' }} />
            <span>{displayLabel}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {redirectUrl && (
              <span style={{
                fontSize: '9px',
                color: '#38bdf8',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
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

        {/* Ad Body: Custom Image Banner with Link */}
        {type === 'image' && adContent ? (
          <div style={{ textAlign: 'center', width: '100%', overflow: 'hidden', position: 'relative' }}>
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
          <div
            className="custom-ad-html-container"
            style={{ fontSize: '14px', lineHeight: 1.5 }}
            dangerouslySetInnerHTML={{ __html: adContent }}
          />
        ) : (
          /* Interactive Showcase Banner Box */
          <div style={{
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
            minHeight: '110px'
          }}>
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
