import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TranslationContext = createContext();

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('dailyBriefLanguage');
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  const changeLanguage = (langCode) => {
    setLanguage(langCode);
    localStorage.setItem('dailyBriefLanguage', langCode);
  };

  const translateArticle = useCallback(async (article, targetLang) => {
    if (targetLang === 'en' || !article) return article;

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

      const json = await res.json();
      if (json.success) {
        return { ...article, ...json.data };
      }
    } catch (err) {
      console.error('Translation error:', err);
    }
    // Fallback to original
    return article;
  }, []);

  const translateMultipleArticles = useCallback(async (articles, targetLang) => {
    if (targetLang === 'en' || !articles || articles.length === 0) return articles;
    
    setIsTranslating(true);
    
    // Process in parallel
    const translatedPromises = articles.map(article => translateArticle(article, targetLang));
    const translatedArticles = await Promise.all(translatedPromises);
    
    setIsTranslating(false);
    return translatedArticles;
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
