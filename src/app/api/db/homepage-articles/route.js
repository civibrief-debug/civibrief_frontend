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

function writeSharedDb(key, data) {
  const p = getSharedDbPath();
  try {
    let db = readSharedDb() || {};
    db[key] = data;
    fs.writeFileSync(p, JSON.stringify(db, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing shared_database.json:', e);
    return false;
  }
}

export async function GET() {
  try {
    // 1. Try D1 if configured
    try {
      await queryD1(`CREATE TABLE IF NOT EXISTS homepage_articles (id TEXT PRIMARY KEY, data TEXT, updated_at TEXT);`);
      const rows = await queryD1('SELECT data FROM homepage_articles WHERE id = "current_homepage_articles" LIMIT 1;');
      if (rows && rows.length > 0 && rows[0].data) {
        const parsed = JSON.parse(rows[0].data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return NextResponse.json(
            { success: true, data: parsed },
            { headers: { 'Cache-Control': 'public, max-age=1, s-maxage=2, stale-while-revalidate=10' } }
          );
        }
      }
    } catch (e) {}

    // 2. Try shared_database.json
    const db = readSharedDb();
    if (db && Array.isArray(db.homepageArticleSections) && db.homepageArticleSections.length > 0) {
      return NextResponse.json(
        { success: true, data: db.homepageArticleSections },
        { headers: { 'Cache-Control': 'public, max-age=1, s-maxage=2, stale-while-revalidate=10' } }
      );
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (err) {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const sections = body.sections || [];

    // 1. Write to shared_database.json
    writeSharedDb('homepageArticleSections', sections);

    // 2. Sync to D1
    try {
      await queryD1(`CREATE TABLE IF NOT EXISTS homepage_articles (id TEXT PRIMARY KEY, data TEXT, updated_at TEXT);`);
      await queryD1(
        `INSERT INTO homepage_articles (id, data, updated_at) VALUES ("current_homepage_articles", ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP;`,
        [JSON.stringify(sections)]
      );
    } catch (e) {}

    return NextResponse.json({ success: true, data: sections });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
