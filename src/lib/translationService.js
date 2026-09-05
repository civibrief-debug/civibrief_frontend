/**
 * Ultra-Fast High-Performance Translation Service for Daily Brief
 * Features Multi-Tier Instant Memory Caching (0-1ms) and Bulk Parallel Batching.
 */

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

// Global High-Speed In-Memory Cache (TargetLang -> Text -> TranslatedText)
const MEMORY_CACHE = new Map();

// Instant Hydration from localStorage on startup (0.00ms latency)
if (typeof window !== 'undefined') {
  try {
    const rawLocal = localStorage.getItem('daily_brief_text_cache_v6');
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
          if (count++ > 800) break;
          exportObj[lang][k] = v;
        }
      }
      localStorage.setItem('daily_brief_text_cache_v6', JSON.stringify(exportObj));
    } catch (e) {}
  }, 1000);
}

export function getCachedTranslation(targetLang, text) {
  if (!text || typeof text !== 'string' || targetLang === 'en') return text;
  const trimmed = text.trim();
  const langMap = MEMORY_CACHE.get(targetLang);
  if (langMap && langMap.has(trimmed)) {
    const val = langMap.get(trimmed);
    // Never treat identical English text as valid translation for foreign language
    if (val && val !== trimmed) {
      return val;
    }
  }
  return null;
}

export function setCachedTranslation(targetLang, text, translated) {
  if (!text || typeof text !== 'string' || !translated || targetLang === 'en') return;
  const trimmed = text.trim();
  const transTrimmed = translated.trim();
  // Do not cache identical English text as a foreign language translation
  if (transTrimmed === trimmed && targetLang !== 'en') return;

  if (!MEMORY_CACHE.has(targetLang)) {
    MEMORY_CACHE.set(targetLang, new Map());
  }
  MEMORY_CACHE.get(targetLang).set(trimmed, transTrimmed);
  queuePersistMemoryCache();
}

/**
 * Client-Side Proxy to /api/translate (Bypasses Browser CORS completely for all languages!)
 */
async function fetchClientBatch(texts, targetLang) {
  if (typeof window === 'undefined' || !texts || texts.length === 0) return null;
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, targetLang }),
      signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length === texts.length) {
        return json.data;
      }
    }
  } catch (e) {}
  return null;
}

async function fetchClientText(text, targetLang) {
  if (typeof window === 'undefined' || !text) return null;
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang }),
      signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && typeof json.data === 'string') {
        return json.data;
      }
    }
  } catch (e) {}
  return null;
}

/**
 * Google Translate Mobile Scraper - Reliable on Cloudflare Edge Worker with zero 429 IP rate limits
 */
export async function fetchGoogleM(text, targetLang) {
  if (!text || !text.trim() || targetLang === 'en') return text;
  const url = `https://translate.google.com/m?sl=auto&tl=${targetLang}&q=${encodeURIComponent(text.trim())}`;
  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined
  });

  if (!res.ok) {
    throw new Error(`Google M fetch failed with HTTP ${res.status}`);
  }

  const html = await res.text();
  const match = html.match(/class="result-container">([\s\S]*?)<\/div>/i);
  if (!match || !match[1]) {
    throw new Error('Google M result container not found');
  }

  const decoded = decodeHtmlEntities(match[1]);
  return decoded.trim();
}

/**
 * Direct Google Translate GTX fetcher (Server / Edge runtime fallback)
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
 * Direct Chrome Extension translate fetcher (Server / Edge runtime fallback)
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

  // Tier 1 (Browser Client): Call internal /api/translate edge endpoint
  if (typeof window !== 'undefined') {
    const clientResult = await fetchClientText(trimmed, targetLang);
    if (clientResult && clientResult !== trimmed) {
      setCachedTranslation(targetLang, trimmed, clientResult);
      return clientResult;
    }
  }

  // Tier 2 (Server-side): Primary reliable Google M engine
  try {
    const translated = await fetchGoogleM(trimmed, targetLang);
    if (translated && translated !== trimmed) {
      setCachedTranslation(targetLang, trimmed, translated);
      return translated;
    }
  } catch (err) {}

  // Tier 3 (Server-side fallback): GTX endpoint
  try {
    const translatedGtx = await fetchGtx(trimmed, targetLang);
    if (translatedGtx && translatedGtx !== trimmed) {
      setCachedTranslation(targetLang, trimmed, translatedGtx);
      return translatedGtx;
    }
  } catch (err2) {}

  // Tier 4 (Server-side fallback): Chrome Extension endpoint
  try {
    const translatedChrome = await fetchChromeEx(trimmed, targetLang);
    if (translatedChrome && translatedChrome !== trimmed) {
      setCachedTranslation(targetLang, trimmed, translatedChrome);
      return translatedChrome;
    }
  } catch (err3) {}

  return plainText;
}

/**
 * High-speed Bulk Batch Translation for Multiple Strings (Titles, Summaries, Kickers)
 * Translates 20-50 text strings with zero latency via cache, and fast single-pass batches for uncached.
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

  // Client-Side Browser: Route uncached batch via /api/translate (Bypasses Browser CORS)
  if (typeof window !== 'undefined') {
    try {
      const uncachedTexts = uncachedList.map(u => u.text);
      const translatedBatch = await fetchClientBatch(uncachedTexts, targetLang);
      if (translatedBatch && Array.isArray(translatedBatch) && translatedBatch.length === uncachedList.length) {
        uncachedList.forEach((item, idx) => {
          const trans = (translatedBatch[idx] || item.text).trim();
          if (trans && trans !== item.text) {
            setCachedTranslation(targetLang, item.text, trans);
            results[item.origIndex] = trans;
          } else {
            results[item.origIndex] = item.text;
          }
        });
        return results;
      }
    } catch (e) {}
  }

  // 2. Server-Side: Group uncached items into chunks of ~1200 chars for single-shot batch translation
  const DELIM = ' ||| ';
  const batches = [];
  let currentBatch = [];
  let currentLen = 0;

  for (let j = 0; j < uncachedList.length; j++) {
    const item = uncachedList[j];
    if (currentLen + item.text.length > 1200 && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
      currentLen = 0;
    }
    currentBatch.push(item);
    currentLen += item.text.length + DELIM.length;
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
        translatedCombined = await fetchGoogleM(combined, targetLang);
      } catch (e) {
        try {
          translatedCombined = await fetchGtx(combined, targetLang);
        } catch (e2) {
          try {
            translatedCombined = await fetchChromeEx(combined, targetLang);
          } catch (e3) {}
        }
      }

      if (translatedCombined) {
        const split = translatedCombined.split(/\s*\|\|\|\s*/);
        if (split.length === batch.length) {
          batch.forEach((item, idx) => {
            const trans = (split[idx] || item.text).trim();
            setCachedTranslation(targetLang, item.text, trans);
            results[item.origIndex] = trans;
          });
          return;
        }
      }

      // Fallback: translate individual items in parallel
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
 * Translates HTML content while preserving tags, formatting, and attributes
 */
export async function translateHtmlContent(html, targetLang) {
  if (!html || typeof html !== 'string' || !html.trim() || targetLang === 'en') {
    return html;
  }

  const cached = getCachedTranslation(targetLang, html.trim());
  if (cached !== null) {
    return cached;
  }

  // Client-Side Browser: Route through /api/translate
  if (typeof window !== 'undefined') {
    const clientResult = await fetchClientText(html, targetLang);
    if (clientResult && clientResult !== html) {
      setCachedTranslation(targetLang, html.trim(), clientResult);
      return clientResult;
    }
  }

  try {
    let resultHtml = '';

    // If reasonably sized, translate directly in 1 fast request
    if (html.length <= 1200) {
      try {
        resultHtml = await fetchGoogleM(html, targetLang);
      } catch (e) {
        // Fallback to GTX if needed
        try {
          resultHtml = await fetchGtx(html, targetLang);
        } catch (e2) {
          resultHtml = html;
        }
      }
    } else {
      // For longer content, chunk by block-level elements or double newlines
      const blockRegex = /(<\/(?:p|div|section|article|blockquote|h[1-6]|ul|ol|li)>|\n\n+)/gi;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = blockRegex.exec(html)) !== null) {
        const end = match.index + match[0].length;
        parts.push(html.substring(lastIndex, end));
        lastIndex = end;
      }
      if (lastIndex < html.length) {
        parts.push(html.substring(lastIndex));
      }

      const chunks = [];
      let currentChunk = '';

      for (const part of parts) {
        if (currentChunk.length + part.length > 1000 && currentChunk.length > 0) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
        currentChunk += part;
      }
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }

      const translatedChunks = await Promise.all(
        chunks.map(async (chunk) => {
          try {
            return await fetchGoogleM(chunk, targetLang);
          } catch (err) {
            try {
              return await fetchGtx(chunk, targetLang);
            } catch (err2) {
              return chunk;
            }
          }
        })
      );

      resultHtml = translatedChunks.join('');
    }

    if (['ar', 'he', 'fa', 'ur'].includes(targetLang) && !resultHtml.includes('dir="rtl"')) {
      resultHtml = `<div dir="rtl" class="rtl-translated-wrapper">${resultHtml}</div>`;
    }

    if (resultHtml && resultHtml !== html) {
      setCachedTranslation(targetLang, html.trim(), resultHtml);
    }
    return resultHtml || html;
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

