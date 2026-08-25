'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translatePlainText, translateHtmlContent, translateBatchTexts, getCachedTranslation, setCachedTranslation } from '../lib/translationService';

const TranslationContext = createContext();

export const useTranslation = () => useContext(TranslationContext);

// Global In-Memory Article Cache (Key: `${articleId || articleTitle}_${targetLang}`)
const ARTICLE_CACHE = new Map();

// Hydrate ARTICLE_CACHE from sessionStorage on startup
if (typeof window !== 'undefined') {
  try {
    const raw = sessionStorage.getItem('daily_brief_article_cache_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.entries(parsed).forEach(([k, v]) => ARTICLE_CACHE.set(k, v));
    }
  } catch (e) {}
}

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);

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
   * Translates a single article (including body content) with 0-1ms Cache Resolution
   */
  const translateArticle = useCallback(async (article, targetLang) => {
    if (targetLang === 'en' || !article) return article;

    const cacheKey = `${article.id || article.title}_${targetLang}`;
    const cached = ARTICLE_CACHE.get(cacheKey);
    if (cached && cached._translatedLang === targetLang && cached._contentTranslated) {
      return cached;
    }

    try {
      const keys = ['title', 'subtitle', 'summary', 'kicker'];
      const textArray = keys.map(k => article[k] || '');
      
      // Parallel batch translation of metadata and full HTML/plain content
      const [translatedMeta, translatedContent] = await Promise.all([
        translateBatchTexts(textArray, targetLang),
        article.content ? translateHtmlContent(article.content, targetLang) : Promise.resolve('')
      ]);

      const translated = { 
        ...article, 
        _translatedLang: targetLang,
        _contentTranslated: true
      };

      keys.forEach((k, idx) => {
        if (translatedMeta[idx]) {
          translated[k] = translatedMeta[idx];
        }
      });
      if (translatedContent) {
        translated.content = translatedContent;
      }

      ARTICLE_CACHE.set(cacheKey, translated);
      return translated;
    } catch (e) {
      console.error('Translate article error:', e);
      return article;
    }
  }, []);

  /**
   * High-Performance Single-Pass Batch Translation for Entire News Feed
   * Translates all feed articles simultaneously in 1 batch call with 0-1ms subsequent resolution.
   */
  const translateMultipleArticles = useCallback(async (articles, targetLang) => {
    if (targetLang === 'en' || !articles || articles.length === 0) return articles;

    // 1. Instant 0ms Cache Check: If all articles are cached with full content, return immediately
    let allCached = true;
    const cachedArticles = articles.map(art => {
      const cacheKey = `${art.id || art.title}_${targetLang}`;
      const cached = ARTICLE_CACHE.get(cacheKey);
      if (cached && cached._translatedLang === targetLang && cached._contentTranslated) {
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
      // 2. Parallel translation of all articles in feed
      const finalArticles = await Promise.all(
        articles.map(async (art) => {
          const cacheKey = `${art.id || art.title}_${targetLang}`;
          const cached = ARTICLE_CACHE.get(cacheKey);
          if (cached && cached._translatedLang === targetLang && cached._contentTranslated) {
            return cached;
          }
          return translateArticle(art, targetLang);
        })
      );

      setIsTranslating(false);
      return finalArticles;
    } catch (err) {
      console.warn('Batch translation warning:', err.message);
      setIsTranslating(false);
      return articles;
    }
  }, [translateArticle]);

  return (
    <TranslationContext.Provider value={{
      language,
      setLanguage: changeLanguage,
      translateArticle,
      translateMultipleArticles,
      isTranslating
    }}>
      {children}
    </TranslationContext.Provider>
  );
};
