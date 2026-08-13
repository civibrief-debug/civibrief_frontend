import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { authorizeRequest } from '../../../../lib/auth';
import { sanitizeArticleHtml } from '../../../../lib/sanitizer';

function getDb() {
  const dbPath = path.join(process.cwd(), '..', 'shared_database.json');
  if (fs.existsSync(dbPath)) {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }
  const altPath = path.join(process.cwd(), 'shared_database.json');
  if (fs.existsSync(altPath)) {
    return JSON.parse(fs.readFileSync(altPath, 'utf8'));
  }
  return { articles: [], subscribers: [], supportTickets: [] };
}

function saveDb(data) {
  let dbPath = path.join(process.cwd(), '..', 'shared_database.json');
  if (!fs.existsSync(path.dirname(dbPath))) {
    dbPath = path.join(process.cwd(), 'shared_database.json');
  }
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET(req) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    let list = db.articles || [];

    if (category && category !== 'top-stories' && category !== 'All') {
      list = list.filter(a => a.category.toLowerCase() === category.toLowerCase() || a.category.toLowerCase().includes(category.toLowerCase()));
    }

    if (featured === 'true') {
      list = list.filter(a => a.featured === true);
    }

    return NextResponse.json({ success: true, data: list });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = authorizeRequest(req, ['admin', 'editor']);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin or Editor session required.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const db = getDb();

    const sanitizedContent = sanitizeArticleHtml(body.content || '');

    const newArticle = {
      id: `art-${Date.now()}`,
      title: body.title || 'Untitled Article',
      category: body.category || 'Technology',
      author: body.author || 'Staff Reporter',
      status: body.status || 'Published',
      is_premium: !!body.is_premium,
      summary: body.summary || '',
      content: sanitizedContent,
      featured: !!body.featured,
      publishedAt: new Date().toISOString()
    };

    db.articles = [newArticle, ...(db.articles || [])];
    saveDb(db);

    return NextResponse.json({ success: true, data: newArticle }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

