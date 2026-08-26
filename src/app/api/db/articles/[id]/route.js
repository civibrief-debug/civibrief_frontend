import { NextResponse } from 'next/server';
import { queryD1 } from '../../../../../lib/edgeDb';

export const runtime = 'edge';

function formatArticle(r) {
  if (!r) return null;
  return {
    ...r,
    coverMediaType: r.coverMediaType || (r.videoUrl ? 'video' : 'image'),
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

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const rows = await queryD1('SELECT * FROM articles WHERE id = ?;', [id]);
    if (rows && rows.length > 0) {
      return NextResponse.json({ success: true, data: formatArticle(rows[0]) });
    }
    return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
