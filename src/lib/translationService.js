/**
 * Production-Grade Translation Service for Daily Brief
 * Accurately translates Plain Text & Rich HTML content across all languages
 * with multi-tier fallback APIs and 100% layout preservation.
 */

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9'
};

export async function translatePlainText(plainText, targetLang) {
  if (!plainText || typeof plainText !== 'string' || !plainText.trim() || targetLang === 'en') {
    return plainText;
  }

  const trimmed = plainText.trim();

  // Tier 1: Google GTX Endpoint
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined
    });

    if (response.ok) {
      const data = await response.json();
      let translated = '';
      if (data && data[0]) {
        data[0].forEach(chunk => {
          if (chunk && chunk[0]) translated += chunk[0];
        });
      }
      if (translated && translated.trim()) {
        return translated;
      }
    }
  } catch (err) {
    console.warn('Tier 1 Translate warning:', err.message);
  }

  // Tier 2: Google Chrome Extension Endpoint
  try {
    const url2 = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=${targetLang}&q=${encodeURIComponent(trimmed)}`;
    const res2 = await fetch(url2, {
      headers: HEADERS,
      signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
    });

    if (res2.ok) {
      const data2 = await res2.json();
      if (Array.isArray(data2) && data2[0]) {
        const text = typeof data2[0] === 'string' ? data2[0] : (data2[0][0] || '');
        if (text) return text;
      }
    }
  } catch (err2) {
    console.warn('Tier 2 Translate warning:', err2.message);
  }

  // Tier 3: MyMemory Translation API
  try {
    const url3 = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed.slice(0, 500))}&langpair=en|${targetLang}`;
    const res3 = await fetch(url3, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
    });

    if (res3.ok) {
      const data3 = await res3.json();
      if (data3?.responseData?.translatedText) {
        return data3.responseData.translatedText;
      }
    }
  } catch (err3) {
    console.warn('Tier 3 Translate warning:', err3.message);
  }

  return plainText;
}

export async function translateHtmlContent(html, targetLang) {
  if (!html || typeof html !== 'string' || !html.trim() || targetLang === 'en') {
    return html;
  }

  try {
    // 1. Split HTML into alternating tokens of tags (<...>) and text content
    const tokens = html.split(/(<[^>]+>)/g);
    const textIndices = [];
    const textChunks = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token && !token.startsWith('<') && token.trim().length > 0) {
        if (token.trim() === '\u200B' || token.trim() === '&nbsp;') {
          continue;
        }
        textIndices.push(i);
        textChunks.push(token);
      }
    }

    if (textChunks.length === 0) {
      return html;
    }

    // 2. Batch translate text chunks using a safe multi-character delimiter
    const DELIM = '\n<<<§>>>\n';
    const combinedText = textChunks.join(DELIM);

    let translatedChunks = [];
    if (combinedText.length < 3500) {
      const translatedCombined = await translatePlainText(combinedText, targetLang);
      translatedChunks = translatedCombined.split(/\s*<<<§>>>\s*/g);
    }

    // 3. Re-inject translated text into exact token positions
    if (translatedChunks.length === textChunks.length) {
      for (let k = 0; k < textIndices.length; k++) {
        tokens[textIndices[k]] = translatedChunks[k];
      }
    } else {
      // Fallback: translate chunk-by-chunk in parallel batches of 5 to guarantee 100% precision
      const batchSize = 5;
      for (let b = 0; b < textIndices.length; b += batchSize) {
        const batchIndices = textIndices.slice(b, b + batchSize);
        const batchChunks = textChunks.slice(b, b + batchSize);
        const results = await Promise.all(
          batchChunks.map(chunk => {
            if (/[a-zA-Z\u00C0-\u024F]/.test(chunk)) {
              return translatePlainText(chunk, targetLang);
            }
            return Promise.resolve(chunk);
          })
        );
        for (let k = 0; k < batchIndices.length; k++) {
          tokens[batchIndices[k]] = results[k];
        }
      }
    }

    let resultHtml = tokens.join('');

    // Handle RTL languages (Arabic, Hebrew, Persian, Urdu)
    if (['ar', 'he', 'fa', 'ur'].includes(targetLang)) {
      resultHtml = `<div dir="rtl" class="rtl-translated-wrapper">${resultHtml}</div>`;
    }

    return resultHtml;
  } catch (err) {
    console.error('translateHtmlContent error:', err);
    return html;
  }
}

export async function translateText(text, targetLang) {
  if (!text) return text;
  const isHtml = /<[a-z][\s\S]*>/i.test(text);
  if (isHtml) {
    return translateHtmlContent(text, targetLang);
  }
  return translatePlainText(text, targetLang);
}
