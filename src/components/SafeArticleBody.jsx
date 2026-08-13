import React from 'react';
import { sanitizeArticleHtml } from '../lib/sanitizer';

export default function SafeArticleBody({ content, className = '' }) {
  const cleanHtml = sanitizeArticleHtml(content);

  return (
    <div
      className={`prose max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
