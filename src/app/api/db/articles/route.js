import { NextResponse } from 'next/server';
import { queryD1 } from '../../../../lib/edgeDb';

export const runtime = 'edge';

function formatArticle(r) {
  if (!r) return null;
  const isMakeMoney = Boolean(
    (r.title && r.title.toLowerCase().includes('make money in one day')) ||
    r.id === 'story-1787712591702-sec' ||
    r.id === 'art-1787402824300' ||
    (r.videoUrl && (r.videoUrl.includes('6197175') || r.videoUrl.includes('make-money-cover')))
  );

  return {
    ...r,
    coverMediaType: isMakeMoney ? 'video' : (r.coverMediaType || (r.videoUrl ? 'video' : 'image')),
    videoUrl: isMakeMoney ? '/videos/make-money-cover.mp4' : r.videoUrl,
    imageUrl: isMakeMoney ? '/videos/make-money-poster.jpg' : r.imageUrl,
    isHero: Boolean(r.isHero),
    isEditorsPick: Boolean(r.isEditorsPick),
    isTrending: Boolean(r.isTrending),
    isLive: Boolean(r.isLive),
    placeholderAdEnabled: Boolean(r.placeholderAdEnabled),
    comments: r.comments ? (typeof r.comments === 'string' ? (JSON.parse(r.comments || '[]')) : r.comments) : [],
    adPlacements: r.adPlacements ? (typeof r.adPlacements === 'string' ? JSON.parse(r.adPlacements) : r.adPlacements) : [],
    coverImageCrop: r.coverImageCrop ? (typeof r.coverImageCrop === 'string' ? JSON.parse(r.coverImageCrop) : r.coverImageCrop) : null,
    coverVideoCrop: r.coverVideoCrop ? (typeof r.coverVideoCrop === 'string' ? JSON.parse(r.coverVideoCrop) : r.coverVideoCrop) : null
  };
}

// High-performance Server-Side Memory SWR Cache on globalThis for instant 0ms responses
const serverArticlesCache = globalThis.__serverArticlesCache || (globalThis.__serverArticlesCache = new Map());
let isRevalidating = false;

export function invalidateServerArticlesCache() {
  serverArticlesCache.clear();
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const includeDrafts = searchParams.get('includeDrafts') === 'true';
    const cacheKey = `${category || 'All'}_${includeDrafts}`;

    let sql = 'SELECT * FROM articles';
    const params = [];
    const conditions = [];

    if (!includeDrafts) {
      conditions.push("status = 'Published'");
    }

    if (category && category !== 'All') {
      conditions.push('(category = ? OR category LIKE ?)');
      params.push(category, `%${category}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY COALESCE(updatedAt, createdAt) DESC, createdAt DESC;';

    // 1. Instant 0ms Memory Cache Hit
    const cached = serverArticlesCache.get(cacheKey);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < 30000) {
        // Super fresh (<30s) -> 0ms instant response
        return new Response(cached.jsonString, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=15, s-maxage=60, stale-while-revalidate=300',
            'X-Cache': 'HIT-FRESH'
          }
        });
      } else if (age < 300000) {
        // SWR: Return stale immediately in 0ms, revalidate asynchronously
        if (!isRevalidating) {
          isRevalidating = true;
          (async () => {
            try {
              const freshRows = await queryD1(sql, params);
              const freshFormatted = (freshRows || []).map(formatArticle);
              const freshJson = JSON.stringify({ success: true, data: freshFormatted });
              serverArticlesCache.set(cacheKey, { jsonString: freshJson, timestamp: Date.now() });
            } catch (err) {
            } finally {
              isRevalidating = false;
            }
          })();
        }
        return new Response(cached.jsonString, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=15, s-maxage=60, stale-while-revalidate=300',
            'X-Cache': 'HIT-STALE'
          }
        });
      }
    }

    // 2. Cold Start or Expired Cache
    const rows = await queryD1(sql, params);
    const formatted = (rows || []).map(formatArticle);
    const jsonString = JSON.stringify({ success: true, data: formatted });
    serverArticlesCache.set(cacheKey, { jsonString, timestamp: Date.now() });

    return new Response(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15, s-maxage=60, stale-while-revalidate=300',
        'X-Cache': 'MISS'
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error', data: [] }, { status: 500 });
  }
}
