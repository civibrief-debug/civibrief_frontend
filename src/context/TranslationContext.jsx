'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  translatePlainText, 
  translateHtmlContent, 
  translateBatchTexts, 
  getCachedTranslation, 
  setCachedTranslation 
} from '../lib/translationService';
import { getStaticTranslation, getSynchronousTranslatedArticle, UI_DICTIONARY } from '../lib/uiTranslations';

const TranslationContext = createContext();

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (text) => text,
      getSynchronousArticle: (a) => a,
      getSynchronousArticleList: (arr) => arr || [],
      translateArticle: async (a) => a,
      translateMultipleArticles: async (arr) => arr,
      translateBatch: async (arr) => arr,
      translateDeepDives: async (arr) => arr,
      isTranslating: false
    };
  }
  return context;
};

// Global In-Memory Article Cache (Key: `${articleId || articleTitle}_${targetLang}`)
const ARTICLE_CACHE = new Map();
const PENDING_TRANSLATIONS = new Set();
const PENDING_ARTICLE_TRANSLATIONS = new Set();

const CACHE_KEY = 'daily_brief_article_cache_v9';

// Hydrate ARTICLE_CACHE from localStorage & sessionStorage on startup for 0ms transitions
if (typeof window !== 'undefined') {
  try {
    // Purge deprecated caches that may contain untranslated fallbacks or poisoned content
    ['daily_brief_article_cache_v4', 'daily_brief_article_cache_v5', 'daily_brief_article_cache_v8'].forEach(k => {
      try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch(e){}
    });

    const rawLocal = localStorage.getItem(CACHE_KEY);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      Object.entries(parsed).forEach(([k, v]) => {
        if (v && v._translatedLang && v.originalTitle && v.title && v.title !== v.originalTitle) {
          ARTICLE_CACHE.set(k, v);
        }
      });
    }
  } catch (e) {}
}

const persistArticleCache = () => {
  if (typeof window === 'undefined') return;
  try {
    const obj = {};
    let count = 0;
    // Persist most recent 120 genuinely translated articles
    for (const [k, v] of ARTICLE_CACHE.entries()) {
      if (count++ > 120) break;
      if (v && v.title && v.originalTitle && v.title !== v.originalTitle) {
        obj[k] = v;
      }
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch (e) {}
};

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dailyBriefLanguage');
      if (saved && saved !== 'en') {
        setLanguage(saved);
      }
    } catch (e) {}
  }, []);

  const changeLanguage = (langCode) => {
    setLanguage(langCode);
    try {
      localStorage.setItem('dailyBriefLanguage', langCode);
    } catch (e) {}
  };

  /**
   * Universal Synchronous UI String Translator
   * Resolves in 0.00ms from Static Dictionary or In-Memory Cache.
   * Auto-fetches uncached strings in background and triggers re-render.
   */
  const t = useCallback((text) => {
    if (!text || typeof text !== 'string' || language === 'en') {
      return text;
    }

    const trimmed = text.trim();
    if (!trimmed) return text;

    // 1. Check curated static dictionary (0.0001 ms)
    const staticMatch = getStaticTranslation(language, trimmed);
    if (staticMatch) {
      return staticMatch;
    }

    // 2. Check dynamic translation memory cache (0.0001 ms)
    const dynamicMatch = getCachedTranslation(language, trimmed);
    if (dynamicMatch !== null && dynamicMatch !== undefined) {
      return dynamicMatch;
    }

    // 3. Trigger asynchronous background translation if not already pending
    const pendingKey = `${language}:${trimmed}`;
    if (!PENDING_TRANSLATIONS.has(pendingKey)) {
      PENDING_TRANSLATIONS.add(pendingKey);
      translatePlainText(trimmed, language)
        .then((translated) => {
          if (translated && translated !== trimmed) {
            setCachedTranslation(language, trimmed, translated);
            setVersion(v => v + 1);
          }
        })
        .catch(() => {})
        .finally(() => {
          PENDING_TRANSLATIONS.delete(pendingKey);
        });
    }

    return text;
  }, [language, version]);

  /**
   * Translates a single article (including body content) with 0-1ms Cache Resolution
   */
  const translateArticle = useCallback(async (article, targetLang) => {
    if (!article) return article;

    // Instant English resolution: restore pristine original English fields if available
    if (targetLang === 'en') {
      if (article._translatedLang === 'en' && article._fullyTranslated) {
        return article;
      }
      const isNonEnglish = (str) => {
        if (!str || typeof str !== 'string') return false;
        return /[\uac00-\ud7af\u1100-\u11ff\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0400-\u04ff\u0600-\u06ff\u0900-\u097f]/.test(str);
      };

      const trueOrigTitle = article.originalTitle || article.originalArticle?.title;
      const canInstantRestoreEnglish = trueOrigTitle && !isNonEnglish(trueOrigTitle);

      if (canInstantRestoreEnglish) {
        if (article.originalArticle) {
          return {
            ...article.originalArticle,
            originalArticle: article.originalArticle,
            originalTitle: trueOrigTitle,
            originalSubtitle: article.originalSubtitle || article.originalArticle.subtitle,
            originalSummary: article.originalSummary || article.originalArticle.summary,
            originalContent: article.originalContent || article.originalArticle.content,
            originalKicker: article.originalKicker || article.originalArticle.kicker,
            originalCategory: article.originalCategory || article.originalArticle.category,
            originalAuthor: article.originalAuthor || article.originalArticle.author,
            originalTakeaways: article.originalTakeaways || article.originalArticle.takeaways,
            _translatedLang: 'en',
            _fullyTranslated: true,
            _contentTranslated: true
          };
        }
        if (article.originalTitle && article.title !== article.originalTitle) {
          return {
            ...article,
            title: article.originalTitle,
            subtitle: article.originalSubtitle || article.subtitle,
            summary: article.originalSummary || article.summary,
            content: article.originalContent || article.content,
            kicker: article.originalKicker || article.kicker,
            category: article.originalCategory || article.category,
            author: article.originalAuthor || article.author,
            takeaways: article.originalTakeaways || article.takeaways,
            _translatedLang: 'en',
            _fullyTranslated: true,
            _contentTranslated: true
          };
        }
      }
    }

    const origTitle = (article.originalTitle || article.title || '').trim();
    const cacheKey = `${article.id || origTitle}_${targetLang}`;
    const cached = ARTICLE_CACHE.get(cacheKey);

    const hasContent = typeof article.content === 'string' && article.content.trim().length > 0;
    const hasContentTranslated = !!(cached && cached._contentTranslated && cached.content && cached.content !== article.content);

    if (cached && cached._translatedLang === targetLang) {
      if (hasContent && hasContentTranslated) {
        if (!origTitle || cached.title !== origTitle) {
          return cached;
        }
      } else if (!hasContent && (cached._metaTranslated || cached._fullyTranslated)) {
        if (!origTitle || cached.title !== origTitle) {
          return cached;
        }
      }
    }

    try {
      // In browser, call internal /api/translate edge endpoint (bypasses browser CORS)
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleId: article.id || origTitle,
            targetLang,
            articleData: {
              title: article.title,
              subtitle: article.subtitle,
              summary: article.summary,
              kicker: article.kicker,
              category: article.category,
              content: article.content,
              author: article.author,
              takeaways: article.takeaways
            }
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.data) {
            const data = json.data;
            const trueOriginalTitle = (targetLang === 'en' && data.title) ? data.title : (article.originalTitle || origTitle);
            const translated = { 
              ...article, 
              ...data,
              originalArticle: article.originalArticle || article,
              originalTitle: trueOriginalTitle,
              originalSubtitle: article.originalSubtitle || article.subtitle,
              originalSummary: article.originalSummary || article.summary,
              originalContent: article.originalContent || article.content,
              originalKicker: article.originalKicker || article.kicker,
              originalCategory: article.originalCategory || article.category,
              originalAuthor: article.originalAuthor || article.author,
              originalTakeaways: article.originalTakeaways || article.takeaways,
              _translatedLang: targetLang,
              _metaTranslated: true,
              _contentTranslated: !!(data.content && typeof data.content === 'string' && data.content.trim().length > 0 && data.content !== article.content),
              _fullyTranslated: true
            };
            if (data.title) setCachedTranslation(targetLang, origTitle, data.title);
            if (data.summary) setCachedTranslation(targetLang, article.summary, data.summary);
            if (data.subtitle) setCachedTranslation(targetLang, article.subtitle, data.subtitle);
            if (data.kicker) setCachedTranslation(targetLang, article.kicker, data.kicker);
            if (data.category) setCachedTranslation(targetLang, article.category, data.category);
            if (data.author) setCachedTranslation(targetLang, article.author, data.author);
            if (data.content) setCachedTranslation(targetLang, article.content, data.content);
            if (Array.isArray(data.takeaways) && Array.isArray(article.takeaways)) {
              article.takeaways.forEach((pt, idx) => {
                if (data.takeaways[idx]) setCachedTranslation(targetLang, pt, data.takeaways[idx]);
              });
            }

            ARTICLE_CACHE.set(cacheKey, translated);
            persistArticleCache();
            return translated;
          }
        }
      }

      const keys = ['title', 'subtitle', 'summary', 'kicker', 'category', 'author'];
      const textArray = keys.map(k => (article[k] && typeof article[k] === 'string' ? article[k] : ''));
      const hasTakeaways = Array.isArray(article.takeaways) && article.takeaways.length > 0;
      
      // Parallel batch translation of metadata, takeaways and full HTML/plain content
      const [translatedMeta, translatedContent, translatedTakeaways] = await Promise.all([
        translateBatchTexts(textArray, targetLang),
        hasContent ? translateHtmlContent(article.content, targetLang) : Promise.resolve(''),
        hasTakeaways ? translateBatchTexts(article.takeaways, targetLang) : Promise.resolve(article.takeaways)
      ]);

      const translated = { 
        ...article, 
        originalArticle: article.originalArticle || article,
        originalTitle: origTitle,
        originalSubtitle: article.originalSubtitle || article.subtitle,
        originalSummary: article.originalSummary || article.summary,
        originalContent: article.originalContent || article.content,
        originalKicker: article.originalKicker || article.kicker,
        originalCategory: article.originalCategory || article.category,
        originalAuthor: article.originalAuthor || article.author,
        originalTakeaways: article.originalTakeaways || article.takeaways,
        _translatedLang: targetLang,
        _metaTranslated: true,
        _contentTranslated: !!(translatedContent && translatedContent !== article.content),
        _fullyTranslated: true
      };

      keys.forEach((k, idx) => {
        if (translatedMeta[idx]) {
          translated[k] = translatedMeta[idx];
          if (article[k]) {
            setCachedTranslation(targetLang, article[k], translatedMeta[idx]);
          }
        }
      });
      if (translatedContent) {
        translated.content = translatedContent;
        if (article.content) {
          setCachedTranslation(targetLang, article.content, translatedContent);
        }
      }
      if (translatedTakeaways) {
        translated.takeaways = translatedTakeaways;
        if (Array.isArray(article.takeaways)) {
          article.takeaways.forEach((pt, idx) => {
            if (translatedTakeaways[idx]) setCachedTranslation(targetLang, pt, translatedTakeaways[idx]);
          });
        }
      }

      ARTICLE_CACHE.set(cacheKey, translated);
      persistArticleCache();
      return translated;
    } catch (e) {
      console.error('Translate article error:', e);
      return article;
    }
  }, []);

  /**
   * Universal Synchronous Article Translator (0.00ms latency)
   * Resolves instantly from ARTICLE_CACHE or static dictionary on initial render tick.
   */
  const getSynchronousArticle = useCallback((article, targetLang = language) => {
    if (!article) return article;
    if (targetLang === 'en') {
      return getSynchronousTranslatedArticle(article, 'en');
    }

    const origTitle = (article.originalTitle || article.title || '').trim();
    const cacheKey = `${article.id || origTitle}_${targetLang}`;
    const cached = ARTICLE_CACHE.get(cacheKey);
    const needsContent = !!(article.content && typeof article.content === 'string' && article.content.trim().length > 0);
    const hasContentTranslated = !!(cached && cached._contentTranslated && cached.content && cached.content !== article.content);

    // If fully translated (including body content if present), return cached instantly
    if (cached && cached._translatedLang === targetLang) {
      if ((!needsContent && (cached._metaTranslated || cached._fullyTranslated)) || (needsContent && hasContentTranslated)) {
        if (!origTitle || cached.title !== origTitle) {
          return cached;
        }
      }
    }

    // Resolve synchronously from pre-compiled static dictionary and memory cache
    const staticTranslated = getSynchronousTranslatedArticle(article, targetLang);

    // If dynamic article not yet fully translated in background, trigger async worker
    const isStillUntranslated = needsContent 
      ? (!cached || !cached._contentTranslated)
      : (!staticTranslated._fullyTranslated || (origTitle && staticTranslated.title === origTitle));

    if (isStillUntranslated) {
      if (!PENDING_ARTICLE_TRANSLATIONS.has(cacheKey)) {
        PENDING_ARTICLE_TRANSLATIONS.add(cacheKey);
        translateArticle(article, targetLang)
          .then(fullTranslated => {
            if (fullTranslated && (fullTranslated._fullyTranslated || fullTranslated._contentTranslated)) {
              ARTICLE_CACHE.set(cacheKey, fullTranslated);
              persistArticleCache();
              setVersion(v => v + 1);
            }
          })
          .catch(() => {})
          .finally(() => {
            PENDING_ARTICLE_TRANSLATIONS.delete(cacheKey);
          });
      }
    } else if (staticTranslated._fullyTranslated) {
      ARTICLE_CACHE.set(cacheKey, staticTranslated);
    }

    // If cached has metadata translated, return it merged with current content as interim display
    if (cached && cached._translatedLang === targetLang && cached._metaTranslated) {
      return { ...article, ...cached, content: cached._contentTranslated ? cached.content : article.content };
    }

    return staticTranslated;
  }, [language, version, translateArticle]);

  /**
   * Universal Synchronous Article List Translator (0.00ms latency)
   */
  const getSynchronousArticleList = useCallback((articles, targetLang = language) => {
    if (!articles || !Array.isArray(articles)) {
      return [];
    }
    return articles.map(a => getSynchronousArticle(a, targetLang));
  }, [getSynchronousArticle, language, version]);


  /**
   * High-Performance Single-Pass Batch Translation for Entire News Feed
   */
  const translateMultipleArticles = useCallback(async (articles, targetLang) => {
    if (!articles || articles.length === 0) return articles || [];
    if (targetLang === 'en') {
      return articles.map(art => getSynchronousArticle(art, 'en'));
    }

    let allCached = true;
    const cachedArticles = articles.map(art => {
      const origTitle = (art.originalTitle || art.title || '').trim();
      const cacheKey = `${art.id || origTitle}_${targetLang}`;
      const cached = ARTICLE_CACHE.get(cacheKey);
      if (cached && cached._translatedLang === targetLang && (cached._metaTranslated || cached._fullyTranslated) && (!origTitle || cached.title !== origTitle)) {
        return cached;
      }
      allCached = false;
      return null;
    });

    if (allCached) {
      return cachedArticles;
    }

    setIsTranslating(true);

    try {
      const keys = ['title', 'subtitle', 'summary', 'kicker', 'category', 'author'];
      const uncachedStrings = new Set();

      articles.forEach(art => {
        const origTitle = (art.originalTitle || art.title || '').trim();
        const cacheKey = `${art.id || origTitle}_${targetLang}`;
        const cached = ARTICLE_CACHE.get(cacheKey);
        if (!cached || cached._translatedLang !== targetLang || (!cached._metaTranslated && !cached._fullyTranslated) || (origTitle && cached.title === origTitle)) {
          keys.forEach(k => {
            const val = art[k];
            if (val && typeof val === 'string' && val.trim()) {
              const trimmed = val.trim();
              if (getStaticTranslation(targetLang, trimmed) === null && getCachedTranslation(targetLang, trimmed) === null) {
                uncachedStrings.add(trimmed);
              }
            }
          });
        }
      });

      // Single-pass batch translation for all distinct strings across all articles via /api/translate
      if (uncachedStrings.size > 0) {
        const strList = Array.from(uncachedStrings);
        const translatedList = await translateBatchTexts(strList, targetLang);
        strList.forEach((orig, idx) => {
          if (translatedList[idx] && translatedList[idx] !== orig) {
            setCachedTranslation(targetLang, orig, translatedList[idx]);
          }
        });
      }

      // Map translations to article objects
      const finalArticles = articles.map(art => {
        const origTitle = (art.originalTitle || art.title || '').trim();
        const cacheKey = `${art.id || origTitle}_${targetLang}`;
        const cached = ARTICLE_CACHE.get(cacheKey);
        if (cached && cached._translatedLang === targetLang && (cached._metaTranslated || cached._fullyTranslated) && (!origTitle || cached.title !== origTitle)) {
          return cached;
        }

        const translatedArt = {
          ...art,
          originalArticle: art.originalArticle || art,
          originalTitle: origTitle,
          originalSubtitle: art.originalSubtitle || art.subtitle,
          originalSummary: art.originalSummary || art.summary,
          originalExcerpt: art.originalExcerpt || art.excerpt,
          originalContent: art.originalContent || art.content,
          originalKicker: art.originalKicker || art.kicker,
          originalCategory: art.originalCategory || art.category,
          originalAuthor: art.originalAuthor || art.author,
          originalTakeaways: art.originalTakeaways || art.takeaways,
          _translatedLang: targetLang,
          _metaTranslated: false,
          _contentTranslated: false,
          _fullyTranslated: false
        };

        let hasTranslatedField = false;
        keys.forEach(k => {
          const val = art[k];
          if (val && typeof val === 'string' && val.trim()) {
            const trans = getStaticTranslation(targetLang, val.trim()) || getCachedTranslation(targetLang, val.trim());
            if (trans && trans !== val.trim()) {
              translatedArt[k] = trans;
              hasTranslatedField = true;
            }
          }
        });

        if (hasTranslatedField && (!origTitle || translatedArt.title !== origTitle)) {
          translatedArt._metaTranslated = true;
        }

        ARTICLE_CACHE.set(cacheKey, translatedArt);
        return translatedArt;
      });

      persistArticleCache();
      setIsTranslating(false);
      setVersion(v => v + 1);
      return finalArticles;
    } catch (err) {
      console.warn('Batch translation warning:', err?.message || err);
      setIsTranslating(false);
      return articles;
    }
  }, []);


  /**
   * Batch Translate arbitrary array of strings
   */
  const translateBatch = useCallback(async (texts, targetLang) => {
    if (!texts || !Array.isArray(texts) || texts.length === 0) return texts || [];
    try {
      return await translateBatchTexts(texts, targetLang);
    } catch (e) {
      return texts;
    }
  }, []);

  /**
   * Batch Translate Deep Dives array
   */
  const translateDeepDives = useCallback(async (deepDives, targetLang) => {
    if (!deepDives || deepDives.length === 0) return deepDives || [];
    return await translateMultipleArticles(deepDives, targetLang);
  }, [translateMultipleArticles]);

  const value = useMemo(() => ({
    language,
    setLanguage: changeLanguage,
    t,
    getSynchronousArticle,
    getSynchronousArticleList,
    translateArticle,
    translateMultipleArticles,
    translateBatch,
    translateDeepDives,
    isTranslating
  }), [language, t, getSynchronousArticle, getSynchronousArticleList, translateArticle, translateMultipleArticles, translateBatch, translateDeepDives, isTranslating]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};
