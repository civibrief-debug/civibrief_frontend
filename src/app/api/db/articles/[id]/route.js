import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { queryD1 } from '../../../../../lib/edgeDb';

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

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    // 1. Try D1 if configured
    try {
      const rows = await queryD1('SELECT * FROM articles WHERE id = ?;', [id]);
      if (rows && rows.length > 0) {
        return NextResponse.json({ success: true, data: formatArticle(rows[0]) });
      }
    } catch (e) {}

    // 2. Fallback to shared_database.json
    const db = readSharedDb();
    if (db && Array.isArray(db.articles)) {
      const found = db.articles.find(a => a.id === id || a.slug === id);
      if (found) {
        return NextResponse.json({ success: true, data: formatArticle(found) });
      }
    }

    return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
