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


    // Case 1: Bulk array of texts
    if (Array.isArray(texts) && texts.length > 0) {
      const translatedList = await translateBatchTexts(texts, targetLang);
      return NextResponse.json({ success: true, data: translatedList });
    }

    // Case 2: Single plain text or HTML
    if (typeof text === 'string' && text.trim()) {
      const isHtml = /<[a-z][\s\S]*>/i.test(text);
      const translated = isHtml 
        ? await translateHtmlContent(text, targetLang)
        : await translatePlainText(text, targetLang);
      return NextResponse.json({ success: true, data: translated });
    }

    // Case 3: Single article data (translates metadata + author + takeaways + full article body)
    if (articleData && typeof articleData === 'object') {
      const keys = ['title', 'subtitle', 'summary', 'kicker', 'category', 'author'];
      const textArray = keys.map(k => (articleData[k] && typeof articleData[k] === 'string' ? articleData[k] : ''));
      const hasContent = typeof articleData.content === 'string' && articleData.content.trim().length > 0;
      const hasTakeaways = Array.isArray(articleData.takeaways) && articleData.takeaways.length > 0;

      const [translatedMeta, translatedContent, translatedTakeaways] = await Promise.all([
        translateBatchTexts(textArray, targetLang),
        hasContent ? translateHtmlContent(articleData.content, targetLang) : Promise.resolve(''),
        hasTakeaways ? translateBatchTexts(articleData.takeaways, targetLang) : Promise.resolve(articleData.takeaways)
      ]);

      const translatedData = { 
        ...articleData, 
        originalTitle: articleData.originalTitle || articleData.title,
        originalSummary: articleData.originalSummary || articleData.summary,
        originalContent: articleData.originalContent || articleData.content,
        originalAuthor: articleData.originalAuthor || articleData.author,
        originalTakeaways: articleData.originalTakeaways || articleData.takeaways
      };

      keys.forEach((k, idx) => {
        if (translatedMeta[idx]) {
          translatedData[k] = translatedMeta[idx];
        }
      });
      if (translatedContent) {
        translatedData.content = translatedContent;
      }
      if (translatedTakeaways) {
        translatedData.takeaways = translatedTakeaways;
      }

      return NextResponse.json({ success: true, data: translatedData });
    }

    return NextResponse.json({ success: false, error: 'Missing or invalid required fields' }, { status: 400 });
  } catch (err) {
    console.error("Translation API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

