/**
 * Ultra-Fast High-Performance Translation Service for Daily Brief
 * Features Multi-Tier Instant Memory Caching (0-1ms) and Bulk Parallel Batching.
 */

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9'
};

// Global High-Speed In-Memory Cache (TargetLang -> Text -> TranslatedText)
const MEMORY_CACHE = new Map();

// Instant Hydration from localStorage on startup (0.00ms latency)
if (typeof window !== 'undefined') {
  try {
    const rawLocal = localStorage.getItem('daily_brief_text_cache_v5');
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      Object.entries(parsed).forEach(([lang, mapObj]) => {
        if (!MEMORY_CACHE.has(lang)) MEMORY_CACHE.set(lang, new Map());
        const langMap = MEMORY_CACHE.get(lang);
        Object.entries(mapObj).forEach(([k, v]) => langMap.set(k, v));
      });
    }
  } catch (e) {}
}

let persistTimeout = null;
function queuePersistMemoryCache() {
  if (typeof window === 'undefined') return;
  if (persistTimeout) return;
  persistTimeout = setTimeout(() => {
    persistTimeout = null;
    try {
      const exportObj = {};
      for (const [lang, map] of MEMORY_CACHE.entries()) {
        exportObj[lang] = {};
        let count = 0;
        for (const [k, v] of map.entries()) {
          if (count++ > 600) break;
          exportObj[lang][k] = v;
        }
      }
      localStorage.setItem('daily_brief_text_cache_v5', JSON.stringify(exportObj));
    } catch (e) {}
  }, 1000);
}

export function getCachedTranslation(targetLang, text) {
  if (!text || typeof text !== 'string' || targetLang === 'en') return text;
  const trimmed = text.trim();
  const langMap = MEMORY_CACHE.get(targetLang);
  if (langMap && langMap.has(trimmed)) {
    return langMap.get(trimmed);
  }
  return null;
}

export function setCachedTranslation(targetLang, text, translated) {
  if (!text || typeof text !== 'string' || !translated || targetLang === 'en') return;
  const trimmed = text.trim();
  if (!MEMORY_CACHE.has(targetLang)) {
    MEMORY_CACHE.set(targetLang, new Map());
  }
  MEMORY_CACHE.get(targetLang).set(trimmed, translated);
  queuePersistMemoryCache();
}

/**
 * Direct Google Translate GTX fetcher
 */
async function fetchGtx(text, targetLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
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
  throw new Error('GTX fetch failed');
}

/**
 * Direct Chrome Extension translate fetcher
 */
async function fetchChromeEx(text, targetLang) {
  const url2 = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=${targetLang}&q=${encodeURIComponent(text)}`;
  const res2 = await fetch(url2, {
    headers: HEADERS,
    signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined
  });

  if (res2.ok) {
    const data2 = await res2.json();
    if (Array.isArray(data2) && data2[0]) {
      const result = typeof data2[0] === 'string' ? data2[0] : (data2[0][0] || '');
      if (result) return result;
    }
  }
  throw new Error('ChromeEx fetch failed');
}

/**
 * Translates a single plain text with 0-1ms cache resolution
 */
export async function translatePlainText(plainText, targetLang) {
  if (!plainText || typeof plainText !== 'string' || !plainText.trim() || targetLang === 'en') {
    return plainText;
  }

  const trimmed = plainText.trim();

  // 0ms Cache Hit Check
  const cached = getCachedTranslation(targetLang, trimmed);
  if (cached !== null) {
    return cached;
  }

  // Tier 1: Google GTX Endpoint
  try {
    const translated = await fetchGtx(trimmed, targetLang);
    setCachedTranslation(targetLang, trimmed, translated);
    return translated;
  } catch (err) {}

  // Tier 2: Google Chrome Extension Endpoint
  try {
    const translated2 = await fetchChromeEx(trimmed, targetLang);
    setCachedTranslation(targetLang, trimmed, translated2);
    return translated2;
  } catch (err2) {}

  // Tier 3: MyMemory Translation API
  try {
    const url3 = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed.slice(0, 500))}&langpair=en|${targetLang}`;
    const res3 = await fetch(url3, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined
    });

    if (res3.ok) {
      const data3 = await res3.json();
      if (data3?.responseData?.translatedText) {
        const translated3 = data3.responseData.translatedText;
        setCachedTranslation(targetLang, trimmed, translated3);
        return translated3;
      }
    }
  } catch (err3) {}

  return plainText;
}

/**
 * High-speed Bulk Batch Translation for Multiple Strings (Titles, Summaries, Kickers)
 * Translates 20-50 text strings in a single rapid request instead of dozens of sequential requests.
 */
export async function translateBatchTexts(texts, targetLang) {
  if (!texts || !Array.isArray(texts) || texts.length === 0 || targetLang === 'en') {
    return texts || [];
  }

  const results = new Array(texts.length);
  const uncachedList = [];

  // 1. Resolve all cached strings in 0ms (<0.01ms)
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    if (!text || typeof text !== 'string' || !text.trim()) {
      results[i] = text || '';
      continue;
    }
    const cached = getCachedTranslation(targetLang, text.trim());
    if (cached !== null) {
      results[i] = cached;
    } else {
      uncachedList.push({ origIndex: i, text: text.trim() });
    }
  }

  // If 100% of items were cached, return instantaneously (0-1ms)
  if (uncachedList.length === 0) {
    return results;
  }

  // 2. Group uncached items into chunks of ~3000 chars for single-shot batch translation
  const DELIM = '\n<<<§T§>>>\n';
  const batches = [];
  let currentBatch = [];
  let currentLen = 0;

  for (let j = 0; j < uncachedList.length; j++) {
    const item = uncachedList[j];
    if (currentLen + item.text.length > 2800 && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
      currentLen = 0;
    }
    currentBatch.push(item);
    currentLen += item.text.length;
  }
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  // 3. Process batches in parallel
  await Promise.all(
    batches.map(async (batch) => {
      const combined = batch.map(b => b.text).join(DELIM);
      let translatedCombined = '';
      try {
        translatedCombined = await fetchGtx(combined, targetLang);
      } catch (e) {
        try {
          translatedCombined = await fetchChromeEx(combined, targetLang);
        } catch (e2) {}
      }

      if (translatedCombined) {
        let split = translatedCombined.split(/\s*(?:<<<|«««|〈〈〈|＜＜＜)\s*§\s*T\s*§\s*(?:>>>|»»»|〉〉〉|＞＞＞)\s*/gi);
        if (split.length !== batch.length) {
          split = translatedCombined.split(/\n\s*(?:<<<|«««|〈〈〈|＜＜＜).*?(?:>>>|»»»|〉〉〉|＞＞＞)\s*\n/gi);
        }
        if (split.length === batch.length) {
          batch.forEach((item, idx) => {
            const trans = (split[idx] || item.text).trim();
            setCachedTranslation(targetLang, item.text, trans);
            results[item.origIndex] = trans;
          });
          return;
        }
      }

      // Fallback: translate items in parallel
      await Promise.all(
        batch.map(async (item) => {
          const trans = await translatePlainText(item.text, targetLang);
          setCachedTranslation(targetLang, item.text, trans);
          results[item.origIndex] = trans;
        })
      );
    })
  );

  return results;
}

/**
 * Translates HTML content while preserving tags and formatting
 */
export async function translateHtmlContent(html, targetLang) {
  if (!html || typeof html !== 'string' || !html.trim() || targetLang === 'en') {
    return html;
  }

  const cached = getCachedTranslation(targetLang, html.trim());
  if (cached !== null) {
    return cached;
  }

  try {
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

    const translatedChunks = await translateBatchTexts(textChunks, targetLang);

    if (translatedChunks.length === textIndices.length) {
      for (let k = 0; k < textIndices.length; k++) {
        tokens[textIndices[k]] = translatedChunks[k];
      }
    }

    let resultHtml = tokens.join('');

    if (['ar', 'he', 'fa', 'ur'].includes(targetLang)) {
      resultHtml = `<div dir="rtl" class="rtl-translated-wrapper">${resultHtml}</div>`;
    }

    setCachedTranslation(targetLang, html.trim(), resultHtml);
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
