import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'img', 'figure', 'figcaption', 'div', 'span', 'a', 'sup', 'sub',
  'table', 'thead', 'tbody', 'tr', 'td', 'th', 'iframe', 'video', 'source'
];

const ALLOWED_ATTR = [
  'src', 'alt', 'title', 'width', 'height', 'class', 'style', 'href', 'target', 'rel',
  'frameborder', 'allow', 'allowfullscreen', 'controls', 'autoplay', 'muted', 'loop', 'type', 'preload', 'poster'
];

export function sanitizeArticleHtml(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') return '';

  DOMPurify.removeAllHooks();
  DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
      if (!node.classList.contains('article-link')) {
        node.classList.add('article-link');
      }
    }

    if (node.hasAttribute('style')) {
      let style = node.getAttribute('style') || '';
      style = style
        .replace(/background-color:[^;]+;?/gi, '')
        .replace(/background:[^;]+;?/gi, '')
        .replace(/font-family:[^;]+;?/gi, '')
        .replace(/color:\s*rgb\(\s*(?:3[0-9]|2[0-9]|1[0-9]|[0-9])\s*,\s*(?:3[0-9]|2[0-9]|1[0-9]|[0-9])\s*,\s*(?:3[0-9]|2[0-9]|1[0-9]|[0-9])\s*\);?/gi, '');
      
      if (style.trim()) {
        node.setAttribute('style', style);
      } else {
        node.removeAttribute('style');
      }
    }
  });

  return DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_TAGS: ['iframe', 'video', 'source'],
    ADD_ATTR: ['target', 'rel', 'controls', 'preload', 'poster', 'type', 'allowfullscreen', 'frameborder'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'style', 'svg'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
  });
}
