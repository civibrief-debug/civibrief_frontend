import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { queryD1 } from '../../../../lib/edgeDb';

function getSharedDbPath() {
  const candidates = [
    path.join(process.cwd(), '..', 'shared_database.json'),
    path.join(process.cwd(), 'shared_database.json'),
    'd:/Daily News/shared_database.json'
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (e) {}
  }
  return candidates[0];
}

function readSharedDb() {
  const p = getSharedDbPath();
  try {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {}
  return null;
}

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

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const includeDrafts = searchParams.get('includeDrafts') === 'true';

    // 1. Try D1 if configured
    try {
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
      if (rows && rows.length > 0) {
        const formatted = rows.map(formatArticle);
        return NextResponse.json(
          { success: true, data: formatted },
          { headers: { 'Cache-Control': 'public, max-age=5, s-maxage=15, stale-while-revalidate=60' } }
        );
      }
    } catch (e) {}

    // 2. Fallback to shared_database.json
    const db = readSharedDb();
    if (db && Array.isArray(db.articles)) {
      let result = db.articles;
      if (!includeDrafts) {
        result = result.filter(a => a.status === 'Published');
      }
      if (category && category !== 'All') {
        const catLower = category.toLowerCase();
        result = result.filter(a => (a.category || '').toLowerCase().includes(catLower));
      }
      return NextResponse.json(
        { success: true, data: result.map(formatArticle) },
        { headers: { 'Cache-Control': 'public, max-age=5, s-maxage=15, stale-while-revalidate=60' } }
      );
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
