import { NextResponse } from 'next/server';
import { translatePlainText, translateHtmlContent } from '../../../lib/translationService';
import { checkRateLimit } from '../../../lib/rateLimit';

const IS_VALID_LANG_CODE = (code) => typeof code === 'string' && /^[a-z]{2,3}(-[A-Za-z0-9]+)?$/i.test(code);

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

    const translatedData = { ...articleData };
    
    if (articleData.title && typeof articleData.title === 'string') {
      translatedData.title = await translatePlainText(articleData.title.slice(0, 1000), targetLang);
    }
    if (articleData.subtitle && typeof articleData.subtitle === 'string') {
      translatedData.subtitle = await translatePlainText(articleData.subtitle.slice(0, 1000), targetLang);
    }
    if (articleData.summary && typeof articleData.summary === 'string') {
      translatedData.summary = await translatePlainText(articleData.summary.slice(0, 2000), targetLang);
    }
    if (articleData.kicker && typeof articleData.kicker === 'string') {
      translatedData.kicker = await translatePlainText(articleData.kicker.slice(0, 500), targetLang);
    }
    if (articleData.content && typeof articleData.content === 'string') {
      translatedData.content = await translateHtmlContent(articleData.content, targetLang);
    }

    return NextResponse.json({ success: true, data: translatedData });
  } catch (err) {
    console.error("Translation API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
