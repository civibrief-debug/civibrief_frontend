import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { authorizeRequest } from '../../../../../lib/auth';
import { sanitizeArticleHtml } from '../../../../../lib/sanitizer';

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

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const db = getDb();
    const article = (db.articles || []).find(a => a.id === id);

    if (!article) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    // STRICT USER/READER VISIBILITY: Drafts or non-published articles cannot be viewed by readers.
    if (article.status !== 'Published') {
      const session = authorizeRequest(req, ['admin', 'editor']);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Article is in draft state and not yet published.' }, { status: 404 });
      }
    }

    // Backend Paywall Gating Enforcement
    if (article.is_premium) {
      const session = authorizeRequest(req);
      if (!session || !session.hasActiveSubscription) {
        return NextResponse.json({
          success: true,
          data: {
            ...article,
            content: null,
            snippet: article.summary || (article.content ? article.content.slice(0, 300) + '...' : ''),
            is_gated: true
          }
        });
      }
    }

    return NextResponse.json({ success: true, data: article });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = authorizeRequest(req, ['admin', 'editor']);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin or Editor session required.' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();

    const index = (db.articles || []).findIndex(a => a.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    const existing = db.articles[index];
    const targetStatus = body.status !== undefined ? body.status : existing.status;
    if (targetStatus === 'Published') {
      const finalTitle = (body.title !== undefined ? body.title : existing.title)?.trim() || '';
      const kickerCandidate = body.kicker !== undefined ? body.kicker : (body.supertitle !== undefined ? body.supertitle : (existing.kicker || existing.supertitle || ''));
      const finalSupertitle = (kickerCandidate || '')?.trim();
      if (!finalTitle || !finalSupertitle) {
        return NextResponse.json(
          { success: false, error: 'Article cannot be published without both Supertitle (kicker) and Headline Title.' },
          { status: 400 }
        );
      }
    }

    const updatedData = { ...body };
    if (updatedData.kicker !== undefined || updatedData.supertitle !== undefined) {
      const sVal = (updatedData.kicker || updatedData.supertitle || '').trim();
      updatedData.kicker = sVal;
      updatedData.supertitle = sVal;
    }
    if (updatedData.content) {
      updatedData.content = sanitizeArticleHtml(updatedData.content);
    }

    db.articles[index] = {
      ...db.articles[index],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    saveDb(db);
    return NextResponse.json({ success: true, data: db.articles[index] });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = authorizeRequest(req, ['admin', 'editor']);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin or Editor session required.' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const db = getDb();

    db.articles = (db.articles || []).filter(a => a.id !== id);
    saveDb(db);

    return NextResponse.json({ success: true, message: 'Article deleted successfully' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
