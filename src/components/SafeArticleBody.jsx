import React, { useMemo } from 'react';
import { sanitizeArticleHtml } from '../lib/sanitizer';

const SafeArticleBody = React.memo(function SafeArticleBody({ content, className = '' }) {
  const cleanHtml = useMemo(() => sanitizeArticleHtml(content), [content]);

  const handleBodyClick = (e) => {
    const img = e.target.closest('img');
    if (img) {
      const sourceUrl = img.getAttribute('data-source-url') || img.closest('a')?.getAttribute('href');
      if (sourceUrl && sourceUrl !== '#' && !sourceUrl.startsWith('javascript:')) {
        e.preventDefault();
        e.stopPropagation();
        window.open(sourceUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <div
      className={`article-body prose max-w-none ${className}`}
      onClick={handleBodyClick}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}, (prev, next) => prev.content === next.content && prev.className === next.className);

export default SafeArticleBody;
