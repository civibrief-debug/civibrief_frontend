"use client";

import React, { useState, useRef } from 'react';
import { 
  X, 
  Code, 
  MessageCircle, 
  Send, 
  Mail, 
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function ShareModal({ isOpen, onClose, article }) {
  const [copied, setCopied] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const scrollContainerRef = useRef(null);

  if (!isOpen || !article) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dailybrief.news';
  const articleUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : `${origin}/article/${article.id || 1}`;
  
  const shareTitle = article.title || 'Check out this news story on Daily Brief';

  // Universal Cross-Browser Clipboard Copy (Safari, Chrome, Edge, iOS WebViews, HTTP fallback)
  const copyToClipboard = async (text) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {}

    // Fallback for Safari, iOS older WebKits, in-app browsers, or non-secure contexts
    try {
      if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        textarea.setAttribute('readonly', '');
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        return successful;
      }
    } catch (err) {}
    return false;
  };

  const handleCopyUrl = async () => {
    await copyToClipboard(articleUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyEmbed = async () => {
    const embedSnippet = `<iframe src="${origin}/embed/article/${article.id || 1}" width="600" height="400" frameborder="0" allowfullscreen title="${shareTitle}"></iframe>`;
    await copyToClipboard(embedSnippet);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareTitle,
          url: articleUrl
        });
      } catch (err) {}
    } else {
      handleCopyUrl();
    }
  };

  const scrollPlatforms = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Safe Universal Platform Launcher (Handles Safari popup blocker gracefully)
  const openPlatform = (url, isDirectScheme = false) => {
    if (!url) return;
    if (isDirectScheme || url.startsWith('sms:') || url.startsWith('mailto:')) {
      window.location.href = url;
    } else {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        window.location.href = url;
      }
    }
  };

  // YouTube / Social Share Platforms List
  const platforms = [
    {
      name: 'Embed',
      bg: '#ffffff',
      color: '#0f172a',
      icon: <Code size={22} color="#0f172a" />,
      onClick: () => setShowEmbedCode(true)
    },
    {
      name: 'WhatsApp',
      bg: '#25D366',
      color: '#ffffff',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.012 2c-5.506 0-9.969 4.463-9.969 9.969 0 1.758.459 3.469 1.332 4.977l-1.375 5.054 5.172-1.355c1.45.793 3.097 1.213 4.84 1.213 5.506 0 9.969-4.463 9.969-9.969s-4.463-9.969-9.969-9.969zm0 18.234c-1.527 0-3.024-.41-4.332-1.188l-.311-.184-3.218.844.859-3.136-.203-.324c-.859-1.371-1.312-2.965-1.312-4.609 0-4.562 3.715-8.277 8.277-8.277s8.277 3.715 8.277 8.277-3.715 8.277-8.277 8.277zm4.535-6.195c-.249-.125-1.473-.727-1.701-.81-.228-.083-.394-.125-.56.125-.166.249-.643.81-.788.976-.145.166-.29.187-.539.062s-1.05-.387-2.001-1.234c-.741-.66-1.241-1.475-1.386-1.724-.145-.249-.015-.384.109-.508.112-.112.249-.29.373-.435.125-.145.166-.249.249-.415.083-.166.042-.311-.021-.435s-.56-1.349-.767-1.846c-.201-.484-.406-.418-.56-.425l-.477-.008c-.166 0-.435.062-.663.311s-.871.851-.871 2.075c0 1.224.892 2.406 1.017 2.572.125.166 1.756 2.681 4.254 3.76.594.257 1.058.41 1.42.525.597.19 1.14.163 1.57.099.479-.071 1.473-.602 1.68-1.183.207-.581.207-1.079.145-1.183-.062-.104-.228-.166-.477-.291z"/>
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + articleUrl)}`
    },
    {
      name: 'Messages',
      bg: '#007AFF',
      color: '#ffffff',
      icon: <MessageCircle size={22} color="#ffffff" />,
      url: `sms:?&body=${encodeURIComponent(shareTitle + ' ' + articleUrl)}`,
      isDirectScheme: true
    },
    {
      name: 'Facebook',
      bg: '#1877F2',
      color: '#ffffff',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`
    },
    {
      name: 'X',
      bg: '#000000',
      color: '#ffffff',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareTitle)}`
    },
    {
      name: 'Email',
      bg: '#64748b',
      color: '#ffffff',
      icon: <Mail size={22} color="#ffffff" />,
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(articleUrl)}`,
      isDirectScheme: true
    },
    {
      name: 'Reddit',
      bg: '#FF4500',
      color: '#ffffff',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-1.415 3.515 3.515-1.415C7.686 22.657 10.686 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.196-.491 1.034 0 1.872.838 1.872 1.872 0 .753-.445 1.401-1.09 1.701.035.297.054.599.054.903 0 3.354-3.874 6.073-8.653 6.073-4.779 0-8.654-2.719-8.654-6.073 0-.301.018-.601.052-.896-.649-.3-1.096-.95-1.096-1.708 0-1.034.838-1.872 1.872-1.872.463 0 .882.18 1.19.486 1.189-.85 2.838-1.411 4.653-1.487l.957-4.488 3.255.688c.071-.628.609-1.116 1.261-1.116z"/>
        </svg>
      ),
      url: `https://www.reddit.com/submit?url=${encodeURIComponent(articleUrl)}&title=${encodeURIComponent(shareTitle)}`
    },
    {
      name: 'Pinterest',
      bg: '#E60023',
      color: '#ffffff',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
        </svg>
      ),
      url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(articleUrl)}&description=${encodeURIComponent(shareTitle)}`
    },
    {
      name: 'LinkedIn',
      bg: '#0A66C2',
      color: '#ffffff',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`
    },
    {
      name: 'Telegram',
      bg: '#229ED9',
      color: '#ffffff',
      icon: <Send size={20} color="#ffffff" />,
      url: `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareTitle)}`
    }
  ];

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
          color: '#ffffff',
          position: 'relative',
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff', fontFamily: 'var(--font-sans)' }}>
            {showEmbedCode ? 'Embed Article' : 'Share'}
          </h3>
          <button 
            onClick={() => {
              if (showEmbedCode) setShowEmbedCode(false);
              else onClose();
            }}
            style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              border: 'none', 
              color: '#94a3b8', 
              padding: '6px', 
              borderRadius: '50%', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
          >
            <X size={18} />
          </button>
        </div>

        {showEmbedCode ? (
          /* Embed Code Sub-View */
          <div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
              Paste this HTML embed code on your website or blog:
            </p>
            <textarea
              readOnly
              value={`<iframe src="${origin}/embed/article/${article.id || 1}" width="100%" height="450" frameborder="0" allowfullscreen title="${shareTitle}"></iframe>`}
              style={{
                width: '100%',
                height: '100px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '12px',
                color: '#38bdf8',
                fontFamily: 'monospace',
                fontSize: '12px',
                resize: 'none',
                outline: 'none',
                marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowEmbedCode(false)}
                style={{ padding: '8px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                Back
              </button>
              <button
                onClick={handleCopyEmbed}
                style={{ padding: '8px 20px', borderRadius: '20px', background: embedCopied ? '#16a34a' : '#38bdf8', color: '#0f172a', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                {embedCopied ? 'Copied Code!' : 'Copy Embed Code'}
              </button>
            </div>
          </div>
        ) : (
          /* Main YouTube Style Share View */
          <div>
            {/* Horizontal Platform Carousel */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <button
                onClick={() => scrollPlatforms('left')}
                style={{
                  position: 'absolute',
                  left: '-10px',
                  top: '24px',
                  zIndex: 2,
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
              >
                <ChevronLeft size={18} />
              </button>

              <div 
                ref={scrollContainerRef}
                style={{
                  display: 'flex',
                  gap: '16px',
                  overflowX: 'auto',
                  scrollBehavior: 'smooth',
                  padding: '8px 4px 14px 4px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {platforms.map((platform) => (
                  <div
                    key={platform.name}
                    onClick={() => {
                      if (platform.onClick) {
                        platform.onClick();
                      } else if (platform.url) {
                        openPlatform(platform.url, platform.isDirectScheme);
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      minWidth: '64px',
                      userSelect: 'none'
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: platform.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                        transition: 'transform 0.2s ease, filter 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.08)';
                        e.currentTarget.style.filter = 'brightness(1.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.filter = 'brightness(1)';
                      }}
                    >
                      {platform.icon}
                    </div>
                    <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>
                      {platform.name}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollPlatforms('right')}
                style={{
                  position: 'absolute',
                  right: '-10px',
                  top: '24px',
                  zIndex: 2,
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Bottom Copy Link Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '30px',
                padding: '6px 6px 6px 16px',
                gap: '12px'
              }}
            >
              <input
                type="text"
                readOnly
                value={articleUrl}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '13px',
                  width: '100%',
                  outline: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              />
              <button
                onClick={handleCopyUrl}
                style={{
                  background: copied ? '#16a34a' : '#ffffff',
                  color: copied ? '#ffffff' : '#0f172a',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>Copied</span>
                  </>
                ) : (
                  <span>Copy</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
