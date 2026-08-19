'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translatePlainText, translateHtmlContent } from '../lib/translationService';

const TranslationContext = createContext();

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('dailyBriefLanguage');
      if (savedLang) {
        setLanguage(savedLang);
      }
    } catch (e) {}
  }, []);

  const changeLanguage = (langCode) => {
    setLanguage(langCode);
    try {
      localStorage.setItem('dailyBriefLanguage', langCode);
    } catch (e) {}
  };

  const translateArticle = useCallback(async (article, targetLang) => {
    if (targetLang === 'en' || !article) return article;

    // 1. Try serverless API endpoint
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          targetLang,
          articleData: article
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.title !== article.title) {
          return { ...article, ...json.data };
        }
      }
    } catch (err) {
      console.warn('API translation fallback triggered:', err.message);
    }

    // 2. Direct browser-side translation fallback (Guaranteed to work in all environments)
    try {
      const translated = { ...article };
      if (article.title) translated.title = await translatePlainText(article.title, targetLang);
      if (article.subtitle) translated.subtitle = await translatePlainText(article.subtitle, targetLang);
      if (article.summary) translated.summary = await translatePlainText(article.summary, targetLang);
      if (article.kicker) translated.kicker = await translatePlainText(article.kicker, targetLang);
      if (article.content) translated.content = await translateHtmlContent(article.content, targetLang);
      return translated;
    } catch (e) {
      console.error('Direct translation error:', e);
      return article;
    }
  }, []);

  const translateMultipleArticles = useCallback(async (articles, targetLang) => {
    if (targetLang === 'en' || !articles || articles.length === 0) return articles;
    
    setIsTranslating(true);
    try {
      const translatedPromises = articles.map(article => translateArticle(article, targetLang));
      const translatedArticles = await Promise.all(translatedPromises);
      setIsTranslating(false);
      return translatedArticles;
    } catch (err) {
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
