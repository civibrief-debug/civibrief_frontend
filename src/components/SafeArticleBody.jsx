'use client';

import React, { useMemo } from 'react';
import { sanitizeArticleHtml } from '../lib/sanitizer';
import ArticleAdBanner from './ArticleAdBanner';

function getTargetIndexForAd(ad) {
  const dropZoneId = ad.dropZoneId || '';
  const positionType = ad.placementType || ad.placeholderAdPositionType || 'after_paragraph';
  const positionValue = ad.placementValue !== undefined ? ad.placementValue : ad.placeholderAdPositionValue;

  if (positionType === 'after_intro' || dropZoneId === 'dropzone-intro') {
    return 1;
  }
  if (positionType === 'before_related' || dropZoneId === 'dropzone-related') {
    return 999999;
  }
  if (positionValue !== undefined && !isNaN(parseInt(positionValue))) {
    return Math.max(1, parseInt(positionValue));
  }
  if (dropZoneId.startsWith('dropzone-p-')) {
    const parsed = parseInt(dropZoneId.replace('dropzone-p-', ''));
    if (!isNaN(parsed)) return Math.max(1, parsed);
  }
  return 2;
}

function splitHtmlAtMultiAdPositions(html, adPlacements = [], fallbackAd = null) {
  if (!html) return [{ html: '', ad: null }];

  // Normalize list of active ads
  let activeAds = [];
  if (Array.isArray(adPlacements) && adPlacements.length > 0) {
    activeAds = adPlacements.filter(a => a && a.enabled);
  } else if (fallbackAd && fallbackAd.placeholderAdEnabled) {
    activeAds = [{
      ...fallbackAd,
      id: 'fallback-ad',
      enabled: true,
      placementType: fallbackAd.placeholderAdPositionType || 'after_paragraph',
      placementValue: fallbackAd.placeholderAdPositionValue || '2',
      alignment: fallbackAd.placeholderAdAlignment || 'center',
      label: fallbackAd.placeholderAdLabel || 'Advertisement',
      contentType: fallbackAd.placeholderAdContentType || 'placeholder',
      content: fallbackAd.placeholderAdContent || '',
      dropZoneId: fallbackAd.placeholderAdDropZoneId || 'dropzone-p-2'
    }];
  }

  if (activeAds.length === 0) {
    return [{ html, ad: null }];
  }

  // Find all block boundary cut points
  const blockRegex = /<\/(p|figure|blockquote|h1|h2|h3|section|table)>/gi;
  const matches = [...html.matchAll(blockRegex)];

  if (matches.length === 0) {
    return [{ html, ad: activeAds[0] }];
  }

  // Map each ad to its cut index in matches
  const sortedAdsWithCuts = activeAds.map(ad => {
    const targetBlockIdx = getTargetIndexForAd(ad);
    const cutMatchIdx = Math.min(targetBlockIdx - 1, matches.length - 1);
    const match = matches[cutMatchIdx];
    const cutPos = match.index + match[0].length;
    return {
      ad,
      cutPos,
      targetBlockIdx
    };
  }).sort((a, b) => a.cutPos - b.cutPos);

  // Split HTML into interleaved segments with their associated ads
  const segments = [];
  let lastPos = 0;

  sortedAdsWithCuts.forEach(({ ad, cutPos }) => {
    // Only split if cutPos is advancing beyond lastPos
    if (cutPos > lastPos) {
      segments.push({
        html: html.slice(lastPos, cutPos),
        ad: ad
      });
      lastPos = cutPos;
    } else {
      // If two ads target the exact same cut position, append ad to current slice
      segments.push({
        html: '',
        ad: ad
      });
    }
  });

  // Add trailing HTML segment if any
  if (lastPos < html.length) {
    segments.push({
      html: html.slice(lastPos),
      ad: null
    });
  }

  return segments;
}

const SafeArticleBody = React.memo(function SafeArticleBody({
  content,
  className = '',
  adConfig = null,
  adPlacements = null
}) {
  const cleanHtml = useMemo(() => sanitizeArticleHtml(content), [content]);

  // Determine active ad placements list
  const activePlacements = useMemo(() => {
    if (Array.isArray(adPlacements) && adPlacements.length > 0) {
      return adPlacements;
    }
    if (adConfig && Array.isArray(adConfig.adPlacements) && adConfig.adPlacements.length > 0) {
      return adConfig.adPlacements;
    }
    return [];
  }, [adPlacements, adConfig]);

  const segments = useMemo(() => {
    return splitHtmlAtMultiAdPositions(cleanHtml, activePlacements, adConfig);
  }, [cleanHtml, activePlacements, adConfig]);

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
    <div className={`article-body-wrapper ${className}`} onClick={handleBodyClick}>
      {segments.map((seg, idx) => (
        <React.Fragment key={idx}>
          {seg.html && (
            <div
              className={`article-body-segment segment-${idx} prose max-w-none`}
              dangerouslySetInnerHTML={{ __html: seg.html }}
            />
          )}

          {seg.ad && (
            <ArticleAdBanner
              adConfig={seg.ad}
              alignment={seg.ad.alignment}
              label={seg.ad.label}
              contentType={seg.ad.contentType}
              content={seg.ad.content}
            />
          )}
        </React.Fragment>
      ))}
      <div style={{ clear: 'both' }} />
    </div>
  );
}, (prev, next) => {
  return (
    prev.content === next.content &&
    prev.className === next.className &&
    JSON.stringify(prev.adConfig) === JSON.stringify(next.adConfig) &&
    JSON.stringify(prev.adPlacements) === JSON.stringify(next.adPlacements)
  );
});

export default SafeArticleBody;
