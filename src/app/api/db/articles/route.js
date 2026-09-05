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

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const includeDrafts = searchParams.get('includeDrafts') === 'true';

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

    const rows = await queryD1(sql, params);
    const formatted = (rows || []).map(formatArticle);
    return NextResponse.json(
      { success: true, data: formatted },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400' } }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error', data: [] }, { status: 500 });
  }
}
