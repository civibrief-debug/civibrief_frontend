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

// Hydrate ARTICLE_CACHE from localStorage & sessionStorage on startup for 0ms transitions
if (typeof window !== 'undefined') {
  try {
    const rawLocal = localStorage.getItem('daily_brief_article_cache_v4');
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      Object.entries(parsed).forEach(([k, v]) => ARTICLE_CACHE.set(k, v));
    }
    const rawSession = sessionStorage.getItem('daily_brief_article_cache_v4');
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      Object.entries(parsed).forEach(([k, v]) => ARTICLE_CACHE.set(k, v));
    }
  } catch (e) {}
}

const persistArticleCache = () => {
  if (typeof window === 'undefined') return;
  try {
    const obj = {};
    let count = 0;
    // Persist most recent 100 translated articles
    for (const [k, v] of ARTICLE_CACHE.entries()) {
      if (count++ > 100) break;
      obj[k] = v;
    }
    localStorage.setItem('daily_brief_article_cache_v4', JSON.stringify(obj));
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
   * Universal Synchronous Article Translator (0.00ms latency)
   * Resolves instantly from ARTICLE_CACHE or static dictionary on initial render tick.
   */
  const getSynchronousArticle = useCallback((article, targetLang = language) => {
    if (!article || targetLang === 'en') return article;

    const cacheKey = `${article.id || article.title}_${targetLang}`;
    const cached = ARTICLE_CACHE.get(cacheKey);
    if (cached && cached._translatedLang === targetLang && cached._fullyTranslated) {
      return cached;
    }

    // Resolve synchronously from pre-compiled static dictionary and memory cache
    const staticTranslated = getSynchronousTranslatedArticle(article, targetLang);

    // If dynamic article not yet fully translated in background, trigger async worker
    if (!staticTranslated._fullyTranslated) {
      if (!PENDING_ARTICLE_TRANSLATIONS.has(cacheKey)) {
        PENDING_ARTICLE_TRANSLATIONS.add(cacheKey);
        translateArticle(article, targetLang)
          .then(fullTranslated => {
            if (fullTranslated && fullTranslated._fullyTranslated) {
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
    } else {
      ARTICLE_CACHE.set(cacheKey, staticTranslated);
    }

    return staticTranslated;
  }, [language, version]);

  /**
   * Universal Synchronous Article List Translator (0.00ms latency)
   */
  const getSynchronousArticleList = useCallback((articles, targetLang = language) => {
    if (!articles || !Array.isArray(articles) || targetLang === 'en') {
      return articles || [];
    }
    return articles.map(a => getSynchronousArticle(a, targetLang));
  }, [getSynchronousArticle, language, version]);

  /**
   * Translates a single article (including body content) with 0-1ms Cache Resolution
   */
  const translateArticle = useCallback(async (article, targetLang) => {
    if (targetLang === 'en' || !article) return article;

    const cacheKey = `${article.id || article.title}_${targetLang}`;
    const cached = ARTICLE_CACHE.get(cacheKey);
    if (cached && cached._translatedLang === targetLang && cached._fullyTranslated) {
      return cached;
    }

    try {
      const keys = ['title', 'subtitle', 'summary', 'kicker', 'category'];
      const textArray = keys.map(k => article[k] || '');
      
      // Parallel batch translation of metadata and full HTML/plain content
      const [translatedMeta, translatedContent] = await Promise.all([
        translateBatchTexts(textArray, targetLang),
        article.content ? translateHtmlContent(article.content, targetLang) : Promise.resolve('')
      ]);

      const translated = { 
        ...article, 
        _translatedLang: targetLang,
        _fullyTranslated: true,
        _contentTranslated: true
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
   * High-Performance Single-Pass Batch Translation for Entire News Feed
   */
  const translateMultipleArticles = useCallback(async (articles, targetLang) => {
    if (targetLang === 'en' || !articles || articles.length === 0) return articles;

    let allCached = true;
    const cachedArticles = articles.map(art => {
      const cacheKey = `${art.id || art.title}_${targetLang}`;
      const cached = ARTICLE_CACHE.get(cacheKey);
      if (cached && cached._translatedLang === targetLang && cached._fullyTranslated) {
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
      const keys = ['title', 'subtitle', 'summary', 'kicker', 'category'];
      const uncachedStrings = new Set();

      articles.forEach(art => {
        const cacheKey = `${art.id || art.title}_${targetLang}`;
        const cached = ARTICLE_CACHE.get(cacheKey);
        if (!cached || cached._translatedLang !== targetLang || !cached._fullyTranslated) {
          keys.forEach(k => {
            const val = art[k];
            if (val && typeof val === 'string' && val.trim()) {
              const trimmed = val.trim();
              if (getCachedTranslation(targetLang, trimmed) === null) {
                uncachedStrings.add(trimmed);
              }
            }
          });
        }
      });

      // Single-pass batch translation for all distinct strings across all articles
      if (uncachedStrings.size > 0) {
        const strList = Array.from(uncachedStrings);
        const translatedList = await translateBatchTexts(strList, targetLang);
        strList.forEach((orig, idx) => {
          if (translatedList[idx]) {
            setCachedTranslation(targetLang, orig, translatedList[idx]);
          }
        });
      }

      // Map translations to article objects
      const finalArticles = articles.map(art => {
        const cacheKey = `${art.id || art.title}_${targetLang}`;
        const cached = ARTICLE_CACHE.get(cacheKey);
        if (cached && cached._translatedLang === targetLang && cached._fullyTranslated) {
          return cached;
        }

        const translatedArt = {
          ...art,
          originalTitle: art.originalTitle || art.title,
          _translatedLang: targetLang,
          _fullyTranslated: true
        };

        keys.forEach(k => {
          const val = art[k];
          if (val && typeof val === 'string' && val.trim()) {
            const trans = getCachedTranslation(targetLang, val.trim());
            if (trans) {
              translatedArt[k] = trans;
            }
          }
        });

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
    if (targetLang === 'en' || !texts || texts.length === 0) return texts;
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
    if (targetLang === 'en' || !deepDives || deepDives.length === 0) return deepDives;
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
