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
    const includeDrafts = searchParams.get('includeDrafts') === 'true';

    let list = db.articles || [];

    // STRICT USER/READER VISIBILITY: Only Published articles are returned to users.
    // Drafts, Under Editorial Review, Changes Requested, and Pending Editor Assignment are excluded.
    if (!includeDrafts) {
      list = list.filter(a => a.status === 'Published');
    } else {
      // If includeDrafts is requested, ensure requester has admin or editor authorization
      const session = authorizeRequest(req, ['admin', 'editor']);
      if (!session) {
        list = list.filter(a => a.status === 'Published');
      }
    }

    if (category && category !== 'top-stories' && category !== 'All') {
      list = list.filter(a => a.category?.toLowerCase() === category.toLowerCase() || a.category?.toLowerCase().includes(category.toLowerCase()));
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

    // Mandatory Publish Validation: Article CANNOT be published without both Supertitle and Headline Title!
    if (body.status === 'Published') {
      const hasTitle = !!body.title?.trim();
      const hasSupertitle = !!(body.kicker?.trim() || body.supertitle?.trim());
      if (!hasTitle || !hasSupertitle) {
        return NextResponse.json(
          { success: false, error: 'Article cannot be published without both Supertitle (kicker) and Headline Title.' },
          { status: 400 }
        );
      }
    }

    const supertitleVal = (body.kicker?.trim() || body.supertitle?.trim() || '');
    const sanitizedContent = sanitizeArticleHtml(body.content || '');

    const newArticle = {
      id: `art-${Date.now()}`,
      title: body.title || 'Untitled Article',
      kicker: supertitleVal,
      supertitle: supertitleVal,
      category: body.category || 'Technology',
      author: body.author || 'Staff Reporter',
      status: body.status || 'Draft',
      is_premium: !!body.is_premium,
      summary: body.summary || '',
      content: sanitizedContent,
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      coverMediaType: body.coverMediaType || (body.videoUrl ? 'video' : 'image'),
      videoUrl: body.videoUrl || '',
      imageCaption: body.imageCaption || '',
      coverWidth: body.coverWidth || '100%',
      coverHeight: body.coverHeight || '340px',
      coverAspectRatio: body.coverAspectRatio || null,
      coverCropBox: body.coverCropBox || null,
      coverCropStyle: body.coverCropStyle || null,
      featured: !!body.featured,
      placeholderAdEnabled: !!body.placeholderAdEnabled,
      placeholderAdPositionType: body.placeholderAdPositionType || 'after_paragraph',
      placeholderAdPositionValue: body.placeholderAdPositionValue || '2',
      placeholderAdAlignment: body.placeholderAdAlignment || 'center',
      placeholderAdLabel: body.placeholderAdLabel || 'Advertisement',
      placeholderAdContentType: body.placeholderAdContentType || 'placeholder',
      placeholderAdContent: body.placeholderAdContent || null,
      placeholderAdDropZoneId: body.placeholderAdDropZoneId || 'dropzone-p-2',
      placeholderAdCollageLayout: body.placeholderAdCollageLayout || 'grid_2x2',
      placeholderAdCollageGap: body.placeholderAdCollageGap || '8px',
      placeholderAdCollageRadius: body.placeholderAdCollageRadius || '12px',
      placeholderAdCollageItems: Array.isArray(body.placeholderAdCollageItems) ? body.placeholderAdCollageItems : null,
      adPlacements: Array.isArray(body.adPlacements) ? body.adPlacements : [],
      publishedAt: body.status === 'Published' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    };

    db.articles = [newArticle, ...(db.articles || [])];
    saveDb(db);

    return NextResponse.json({ success: true, data: newArticle }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
