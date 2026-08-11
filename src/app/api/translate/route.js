import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { translateText } from '../../../lib/translationService';

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
  try {
    const { articleId, targetLang, articleData } = await req.json();

    if (!articleId || !targetLang || !articleData) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
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
    if (articleData.title) {
      translatedData.title = await translateText(articleData.title, targetLang);
    }
    if (articleData.subtitle) {
      translatedData.subtitle = await translateText(articleData.subtitle, targetLang);
    }
    if (articleData.summary) {
      translatedData.summary = await translateText(articleData.summary, targetLang);
    }
    if (articleData.kicker) {
      translatedData.kicker = await translateText(articleData.kicker, targetLang);
    }
    if (articleData.content) {
      // Content might be HTML, our simple mock service handles it by prefixing
      translatedData.content = await translateText(articleData.content, targetLang);
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
