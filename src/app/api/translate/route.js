import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { translateText } from '../../../lib/translationService';
import { checkRateLimit } from '../../../lib/rateLimit';

// Valid 2 to 5 character ISO language code format (e.g. hi, bn, te, mr, ta, gu, ur, kn, zh-CN)
const IS_VALID_LANG_CODE = (code) => typeof code === 'string' && /^[a-z]{2,3}(-[A-Za-z0-9]+)?$/i.test(code);

function getDb() {
  const dbPath = path.join(process.cwd(), '..', 'shared_database.json');
  if (fs.existsSync(dbPath)) {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }
  const altPath = path.join(process.cwd(), 'shared_database.json');
  if (fs.existsSync(altPath)) {
    return JSON.parse(fs.readFileSync(altPath, 'utf8'));
  }
  return { articles: [], subscribers: [], supportTickets: [], article_translations: [] };
}

function saveDb(data) {
  let dbPath = path.join(process.cwd(), '..', 'shared_database.json');
  if (!fs.existsSync(path.dirname(dbPath))) {
    dbPath = path.join(process.cwd(), 'shared_database.json');
  }
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

export async function POST(req) {
  if (!checkRateLimit(req, 60, 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded for translation service' },
      { status: 429 }
    );
  }

  try {
    const { articleId, targetLang, articleData } = await req.json();

    if (!articleId || !targetLang || !articleData || typeof articleData !== 'object') {
      return NextResponse.json({ success: false, error: 'Missing or invalid required fields' }, { status: 400 });
    }

    if (!IS_VALID_LANG_CODE(targetLang)) {
      return NextResponse.json({ success: false, error: 'Unsupported or invalid target language code' }, { status: 400 });
    }


    if (targetLang === 'en') {
      return NextResponse.json({ success: true, data: articleData });
    }

    const db = getDb();
    if (!db.article_translations) {
      db.article_translations = [];
    }

    // Check cache
    const cacheKey = `${articleId}-${targetLang}`;
    const cachedTranslation = db.article_translations.find(t => t.id === cacheKey);

    if (cachedTranslation) {
      return NextResponse.json({ success: true, data: cachedTranslation.translatedData });
    }

    // Not in cache, we must translate
    const translatedData = { ...articleData };
    
    // Translate fields
    if (articleData.title && typeof articleData.title === 'string') {
      translatedData.title = await translateText(articleData.title.slice(0, 1000), targetLang);
    }
    if (articleData.subtitle && typeof articleData.subtitle === 'string') {
      translatedData.subtitle = await translateText(articleData.subtitle.slice(0, 1000), targetLang);
    }
    if (articleData.summary && typeof articleData.summary === 'string') {
      translatedData.summary = await translateText(articleData.summary.slice(0, 2000), targetLang);
    }
    if (articleData.kicker && typeof articleData.kicker === 'string') {
      translatedData.kicker = await translateText(articleData.kicker.slice(0, 500), targetLang);
    }
    if (articleData.content && typeof articleData.content === 'string') {
      translatedData.content = await translateText(articleData.content.slice(0, 10000), targetLang);
    }

    // Save to cache
    db.article_translations.push({
      id: cacheKey,
      article_id: articleId,
      language_code: targetLang,
      translatedData,
      created_at: new Date().toISOString()
    });

    saveDb(db);

    return NextResponse.json({ success: true, data: translatedData });
  } catch (err) {
    console.error("Translation API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

