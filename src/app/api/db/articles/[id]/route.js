import { NextResponse } from 'next/server';
import { queryD1 } from '../../../../../lib/edgeDb';

export const runtime = 'edge';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const rows = await queryD1('SELECT * FROM articles WHERE id = ?;', [id]);
    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }
    const r = rows[0];
    const formatted = {
      ...r,
      isHero: Boolean(r.isHero),
      isEditorsPick: Boolean(r.isEditorsPick),
      isTrending: Boolean(r.isTrending),
      isLive: Boolean(r.isLive),
      placeholderAdEnabled: Boolean(r.placeholderAdEnabled),
      adPlacements: r.adPlacements ? (typeof r.adPlacements === 'string' ? JSON.parse(r.adPlacements) : r.adPlacements) : [],
      coverImageCrop: r.coverImageCrop ? (typeof r.coverImageCrop === 'string' ? JSON.parse(r.coverImageCrop) : r.coverImageCrop) : null,
      coverVideoCrop: r.coverVideoCrop ? (typeof r.coverVideoCrop === 'string' ? JSON.parse(r.coverVideoCrop) : r.coverVideoCrop) : null
    };
    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
