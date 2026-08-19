import { NextResponse } from 'next/server';
import { queryD1 } from '../../../../lib/edgeDb';

export const runtime = 'edge';

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
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY createdAt DESC;';

    const rows = await queryD1(sql, params);
    const formatted = rows.map(r => ({
      ...r,
      isHero: Boolean(r.isHero),
      isEditorsPick: Boolean(r.isEditorsPick),
      isTrending: Boolean(r.isTrending),
      isLive: Boolean(r.isLive),
      placeholderAdEnabled: Boolean(r.placeholderAdEnabled),
      adPlacements: r.adPlacements ? (typeof r.adPlacements === 'string' ? JSON.parse(r.adPlacements) : r.adPlacements) : [],
      coverImageCrop: r.coverImageCrop ? (typeof r.coverImageCrop === 'string' ? JSON.parse(r.coverImageCrop) : r.coverImageCrop) : null,
      coverVideoCrop: r.coverVideoCrop ? (typeof r.coverVideoCrop === 'string' ? JSON.parse(r.coverVideoCrop) : r.coverVideoCrop) : null
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
