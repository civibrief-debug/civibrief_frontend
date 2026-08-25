import { NextResponse } from 'next/server';
import { translatePlainText, translateHtmlContent, translateBatchTexts } from '../../../lib/translationService';
import { checkRateLimit } from '../../../lib/rateLimit';

export const runtime = 'edge';

const IS_VALID_LANG_CODE = (code) => typeof code === 'string' && /^[a-z]{2,3}(-[A-Za-z0-9]+)?$/i.test(code);

export async function POST(req) {
  if (!checkRateLimit(req, 120, 60 * 1000)) {
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

    const keys = ['title', 'subtitle', 'summary', 'kicker'];
    const texts = keys.map(k => (articleData[k] && typeof articleData[k] === 'string' ? articleData[k] : ''));

    const [translatedMeta, translatedContent] = await Promise.all([
      translateBatchTexts(texts, targetLang),
      (articleData.content && typeof articleData.content === 'string') 
        ? translateHtmlContent(articleData.content, targetLang) 
        : Promise.resolve('')
    ]);

    const translatedData = { ...articleData };
    keys.forEach((k, idx) => {
      if (translatedMeta[idx]) {
        translatedData[k] = translatedMeta[idx];
      }
    });
    if (translatedContent) {
      translatedData.content = translatedContent;
    }

    return NextResponse.json({ success: true, data: translatedData });
  } catch (err) {
    console.error("Translation API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
