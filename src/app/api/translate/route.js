import { NextResponse } from 'next/server';
import { translatePlainText, translateHtmlContent, translateBatchTexts } from '../../../lib/translationService';

export const runtime = 'edge';

const IS_VALID_LANG_CODE = (code) => typeof code === 'string' && /^[a-z]{2,3}(-[A-Za-z0-9]+)?$/i.test(code);

export async function POST(req) {
  try {
    const body = await req.json();
    const { articleId, targetLang, articleData, texts, text } = body;

    if (!targetLang || !IS_VALID_LANG_CODE(targetLang)) {
      return NextResponse.json({ success: false, error: 'Unsupported or invalid target language code' }, { status: 400 });
    }

    if (targetLang === 'en') {
      if (texts) return NextResponse.json({ success: true, data: texts });
      if (text) return NextResponse.json({ success: true, data: text });
      if (articleData) return NextResponse.json({ success: true, data: articleData });
      return NextResponse.json({ success: true });
    }

    // Case 1: Bulk array of texts
    if (Array.isArray(texts) && texts.length > 0) {
      const translatedList = await translateBatchTexts(texts, targetLang);
      return NextResponse.json({ success: true, data: translatedList });
    }

    // Case 2: Single plain text
    if (typeof text === 'string' && text.trim()) {
      const translated = await translatePlainText(text, targetLang);
      return NextResponse.json({ success: true, data: translated });
    }

    // Case 3: Single article data
    if (articleData && typeof articleData === 'object') {
      const keys = ['title', 'subtitle', 'summary', 'kicker', 'category'];
      const textArray = keys.map(k => (articleData[k] && typeof articleData[k] === 'string' ? articleData[k] : ''));

      const [translatedMeta, translatedContent] = await Promise.all([
        translateBatchTexts(textArray, targetLang),
        (articleData.content && typeof articleData.content === 'string') 
          ? translateHtmlContent(articleData.content, targetLang) 
          : Promise.resolve('')
      ]);

      const translatedData = { ...articleData, originalTitle: articleData.originalTitle || articleData.title };
      keys.forEach((k, idx) => {
        if (translatedMeta[idx]) {
          translatedData[k] = translatedMeta[idx];
        }
      });
      if (translatedContent) {
        translatedData.content = translatedContent;
      }

      return NextResponse.json({ success: true, data: translatedData });
    }

    return NextResponse.json({ success: false, error: 'Missing or invalid required fields' }, { status: 400 });
  } catch (err) {
    console.error("Translation API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
