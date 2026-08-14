import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'img', 'figure', 'figcaption', 'div', 'span', 'a', 'sup', 'sub',
  'table', 'thead', 'tbody', 'tr', 'td', 'th', 'iframe', 'video', 'source'
];

const ALLOWED_ATTR = [
  'src', 'alt', 'title', 'width', 'height', 'class', 'style', 'href', 'target', 'rel',
  'frameborder', 'allow', 'allowfullscreen', 'controls', 'autoplay', 'muted', 'loop', 'type', 'preload', 'poster',
  'data-video-url', 'data-media-url', 'data-provider', 'scrolling', 'loading', 'allowtransparency',
  'data-source-url', 'data-original-url', 'data-link-url', 'id', 'dir', 'referrerpolicy'
];

export function sanitizeArticleHtml(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') return '';

  DOMPurify.removeAllHooks();
  DOMPurify.addHook('afterSanitizeAttributes', function (node) {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
      const isImgLink = node.querySelector('img') || node.classList.contains('image-source-link');
      if (!isImgLink && !node.classList.contains('article-link') && !node.classList.contains('btn-open-video')) {
        node.classList.add('article-link');
      }
    }

    if (node.tagName === 'IFRAME') {
      if (!node.hasAttribute('allow')) {
        node.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      }
      if (!node.hasAttribute('allowfullscreen')) {
        node.setAttribute('allowfullscreen', 'true');
      }
    }

    if (node.hasAttribute('style')) {
      const isCardElement = node.classList?.contains('social-embed-card') || 
                            node.classList?.contains('video-fallback-card') || 
                            node.classList?.contains('btn-open-video') ||
                            node.classList?.contains('twitter-card') ||
                            node.classList?.contains('facebook-card') ||
                            node.classList?.contains('instagram-card');

      if (!isCardElement) {
        let style = node.getAttribute('style') || '';
        
        // Strip hardcoded text colors and background colors so theme (Light/Dark mode) controls text color automatically
        style = style
          .replace(/background-color:\s*[^;]+;?/gi, '')
          .replace(/background:\s*[^;]+;?/gi, '')
          .replace(/font-family:\s*[^;]+;?/gi, '')
          .replace(/color:\s*[^;]+;?/gi, '');
        
        if (style.trim()) {
          node.setAttribute('style', style);
        } else {
          node.removeAttribute('style');
        }
      }
    }
  });

  return DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_TAGS: ['iframe', 'video', 'source'],
    ADD_ATTR: ['target', 'rel', 'controls', 'preload', 'poster', 'type', 'allowfullscreen', 'frameborder', 'allow', 'data-video-url', 'data-media-url', 'data-provider', 'scrolling', 'loading', 'allowtransparency'],
    ADD_URI_SAFE_ATTR: ['src', 'href'],
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'style', 'svg'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
  });
}
