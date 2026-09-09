import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ShareModal from './ShareModal';
import SafeArticleBody from './SafeArticleBody';
import ArticleAdBanner from './ArticleAdBanner';
import { useTranslation } from '../context/TranslationContext';
import { formatCoverMediaEmbedUrl, formatCoverImageUrl, parseGoogleDriveUrl, isArticleCoverVideo, getArticleCoverVideoUrl, getDefaultArticleImage, resolveArticleMedia } from '../lib/videoUtils';
import ContinuousCoverVideo from './ContinuousCoverVideo';
import ArticleMediaCover from './ArticleMediaCover';

import { LanguageSelector } from './LanguageSelector';
import { getStaticTranslation } from '../lib/uiTranslations';
import { getCachedTranslation } from '../lib/translationService';
import { 
  X, 
  Play,
  Pause,
  Volume2, 
  VolumeX, 
  Bookmark, 
  Share2, 
  Clock, 
  Lock,
  UserCheck,
  Gauge,
  Plus,
  Minus,
  ChevronRight,
  Sparkles,
  Check,
  RotateCcw,
  Loader2
} from 'lucide-react';

export const ArticleModal = ({ article, onClose, isLoggedIn, onOpenLogin, onLoginSuccess }) => {
  const { language: globalLanguage, getSynchronousArticle, translateArticle, t } = useTranslation();
  const [localLanguage, setLocalLanguage] = useState(globalLanguage);
  const [localIsTranslating, setLocalIsTranslating] = useState(false);
  const [translatedArticle, setTranslatedArticle] = useState(null);
  const [dbHydratedArticle, setDbHydratedArticle] = useState(null);

  // Keep local language in sync with global language changes
  useEffect(() => {
    setLocalLanguage(globalLanguage);
  }, [globalLanguage]);

  // If article has incomplete body, fetch full article from database API
  useEffect(() => {
    let isMounted = true;
    if (!article?.id) return;
    if (!article.content || article.content.length < 250) {
      fetch(`/api/db/articles/${encodeURIComponent(article.id)}`)
        .then(res => res.json())
        .then(json => {
          if (isMounted && json && json.success && json.data) {
            setDbHydratedArticle(json.data);
          }
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [article?.id, article?.content]);

  const isNonEnglishText = useCallback((str) => {
    if (!str || typeof str !== 'string') return false;
    return /[\uac00-\ud7af\u1100-\u11ff\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0400-\u04ff\u0600-\u06ff\u0900-\u097f]/.test(str);
  }, []);

  const effectiveSourceArticle = useMemo(() => {
    if (!article) return null;
    if (dbHydratedArticle) {
      return { 
        ...article, 
        ...dbHydratedArticle,
        originalArticle: dbHydratedArticle.originalArticle || article.originalArticle || dbHydratedArticle || article,
        originalTitle: dbHydratedArticle.originalTitle || dbHydratedArticle.title || article.originalTitle || article.title,
        originalSubtitle: dbHydratedArticle.originalSubtitle || dbHydratedArticle.subtitle || article.originalSubtitle || article.subtitle,
        originalSummary: dbHydratedArticle.originalSummary || dbHydratedArticle.summary || article.originalSummary || article.summary,
        originalContent: dbHydratedArticle.originalContent || dbHydratedArticle.content || article.originalContent || article.content,
        originalKicker: dbHydratedArticle.originalKicker || dbHydratedArticle.kicker || article.originalKicker || article.kicker,
        originalCategory: dbHydratedArticle.originalCategory || dbHydratedArticle.category || article.originalCategory || article.category,
        originalAuthor: dbHydratedArticle.originalAuthor || dbHydratedArticle.author || article.originalAuthor || article.author,
        originalTakeaways: dbHydratedArticle.originalTakeaways || dbHydratedArticle.takeaways || article.originalTakeaways || article.takeaways
      };
    }
    return article;
  }, [article, dbHydratedArticle]);

  const articleId = effectiveSourceArticle?.id;
  const articleContent = effectiveSourceArticle?.content;

  // Reset translated article when switching articles
  useEffect(() => {
    setTranslatedArticle(null);
  }, [articleId]);

  // Handle translation when language or article ID changes
  useEffect(() => {
    let isMounted = true;

    if (!effectiveSourceArticle) return;

    // Pristine English source derivation
    const baseEnglish = effectiveSourceArticle.originalArticle || effectiveSourceArticle;
    const origTitle = effectiveSourceArticle.originalTitle || baseEnglish.title || effectiveSourceArticle.title;
    const hasEnglishMaster = origTitle && !isNonEnglishText(origTitle);

    if (localLanguage === 'en') {
      if (hasEnglishMaster) {
        setTranslatedArticle({
          ...effectiveSourceArticle,
          ...baseEnglish,
          title: origTitle,
          subtitle: effectiveSourceArticle.originalSubtitle || baseEnglish.subtitle || effectiveSourceArticle.subtitle,
          summary: effectiveSourceArticle.originalSummary || baseEnglish.summary || effectiveSourceArticle.summary,
          content: effectiveSourceArticle.originalContent || baseEnglish.content || effectiveSourceArticle.content,
          kicker: effectiveSourceArticle.originalKicker || baseEnglish.kicker || effectiveSourceArticle.kicker,
          category: effectiveSourceArticle.originalCategory || baseEnglish.category || effectiveSourceArticle.category,
          author: effectiveSourceArticle.originalAuthor || baseEnglish.author || effectiveSourceArticle.author,
          takeaways: effectiveSourceArticle.originalTakeaways || baseEnglish.takeaways || effectiveSourceArticle.takeaways,
          _translatedLang: 'en',
          _metaTranslated: true,
          _contentTranslated: true,
          _fullyTranslated: true
        });
        setLocalIsTranslating(false);
        return;
      }
    }

    setLocalIsTranslating(true);
    // Base source for translation should ALWAYS use pristine English records for highest accuracy
    const sourceForTranslation = {
      ...baseEnglish,
      id: effectiveSourceArticle.id || baseEnglish.id,
      title: origTitle,
      subtitle: effectiveSourceArticle.originalSubtitle || baseEnglish.subtitle || effectiveSourceArticle.subtitle,
      summary: effectiveSourceArticle.originalSummary || baseEnglish.summary || effectiveSourceArticle.summary,
      kicker: effectiveSourceArticle.originalKicker || baseEnglish.kicker || effectiveSourceArticle.kicker,
      category: effectiveSourceArticle.originalCategory || baseEnglish.category || effectiveSourceArticle.category,
      author: effectiveSourceArticle.originalAuthor || baseEnglish.author || effectiveSourceArticle.author,
      content: effectiveSourceArticle.originalContent || baseEnglish.content || effectiveSourceArticle.content,
      takeaways: effectiveSourceArticle.originalTakeaways || baseEnglish.takeaways || effectiveSourceArticle.takeaways,
      originalArticle: effectiveSourceArticle.originalArticle || baseEnglish,
      originalTitle: origTitle,
      originalCategory: effectiveSourceArticle.originalCategory || baseEnglish.category,
      originalAuthor: effectiveSourceArticle.originalAuthor || baseEnglish.author,
      originalContent: effectiveSourceArticle.originalContent || baseEnglish.content,
      originalTakeaways: effectiveSourceArticle.originalTakeaways || baseEnglish.takeaways,
    };

    translateArticle(sourceForTranslation, localLanguage).then(translated => {
      if (isMounted && translated) {
        setTranslatedArticle(translated);
        setLocalIsTranslating(false);
      }
    }).catch(() => {
      if (isMounted) setLocalIsTranslating(false);
    });

    return () => { isMounted = false; };
  }, [articleId, articleContent, localLanguage, translateArticle, effectiveSourceArticle, isNonEnglishText]);

  // Cancel playing voiceover only when explicitly switching languages
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioObjUrlRef.current) {
      URL.revokeObjectURL(audioObjUrlRef.current);
      audioObjUrlRef.current = null;
    }
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
    setIsEnded(false);
    setIsLoadingAudio(false);
    setAudioMode('idle');
    setAudioProgress(0);
    setElapsedTimeStr('0:00');
    setDurationStr('0:00');
    isPlayingRef.current = false;
    isPausedRef.current = false;
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  }, [localLanguage]);

  const activeArticle = useMemo(() => {
    if (!effectiveSourceArticle) return {};

    if (translatedArticle && translatedArticle._translatedLang === localLanguage) {
      return { 
        ...effectiveSourceArticle, 
        ...translatedArticle, 
        content: translatedArticle.content || effectiveSourceArticle.content,
        takeaways: translatedArticle.takeaways || effectiveSourceArticle.takeaways,
        author: translatedArticle.author || effectiveSourceArticle.author,
        title: translatedArticle.title || effectiveSourceArticle.title,
        subtitle: translatedArticle.subtitle || effectiveSourceArticle.subtitle,
        summary: translatedArticle.summary || effectiveSourceArticle.summary,
        category: translatedArticle.category || effectiveSourceArticle.category,
        kicker: translatedArticle.kicker || effectiveSourceArticle.kicker,
        _translatedLang: localLanguage
      };
    }

    if (localLanguage === 'en') {
      const baseEnglish = effectiveSourceArticle.originalArticle || effectiveSourceArticle;
      const origTitle = effectiveSourceArticle.originalTitle || baseEnglish.title;
      if (origTitle && !isNonEnglishText(origTitle)) {
        return {
          ...effectiveSourceArticle,
          ...baseEnglish,
          title: origTitle,
          subtitle: effectiveSourceArticle.originalSubtitle || baseEnglish.subtitle || effectiveSourceArticle.subtitle,
          summary: effectiveSourceArticle.originalSummary || baseEnglish.summary || effectiveSourceArticle.summary,
          content: effectiveSourceArticle.originalContent || baseEnglish.content || effectiveSourceArticle.content,
          kicker: effectiveSourceArticle.originalKicker || baseEnglish.kicker || effectiveSourceArticle.kicker,
          category: effectiveSourceArticle.originalCategory || baseEnglish.category || effectiveSourceArticle.category,
          author: effectiveSourceArticle.originalAuthor || baseEnglish.author || effectiveSourceArticle.author,
          takeaways: effectiveSourceArticle.originalTakeaways || baseEnglish.takeaways || effectiveSourceArticle.takeaways,
          _translatedLang: 'en'
        };
      }
      return effectiveSourceArticle;
    }

    // Synchronous fallback from static dictionary while network request is resolving
    const baseSource = effectiveSourceArticle.originalArticle || effectiveSourceArticle;
    return getSynchronousArticle(baseSource, localLanguage);
  }, [effectiveSourceArticle, localLanguage, translatedArticle, getSynchronousArticle, isNonEnglishText]);


  const [zoomLevel, setZoomLevel] = useState(1.0); // 0.7 to 1.8 document zoom scale
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioMode, setAudioMode] = useState('idle'); // 'elevenlabs' | 'fallback' | 'idle'
  const [durationStr, setDurationStr] = useState('0:00');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // Numeric speed float (1.0 = Normal)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0); // 0 to 100%
  const [elapsedTimeStr, setElapsedTimeStr] = useState('0:00');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const audioRef = useRef(null);
  const audioObjUrlRef = useRef(null);
  const utteranceRef = useRef(null);
  const progressTimerRef = useRef(null);
  const speedMenuRef = useRef(null);
  const chunkIndexRef = useRef(0);
  const chunksRef = useRef([]);
  const playbackSpeedRef = useRef(1.0);
  const secondsPlayedRef = useRef(0);
  const totalArticleCharsRef = useRef(0);
  const chunkCharOffsetsRef = useRef([]);
  const isPausedRef = useRef(false);
  const isPlayingRef = useRef(false);

  const isRtl = ['ar', 'he', 'fa', 'ur', 'ku'].includes(localLanguage);

  const localT = (str) => {
    if (!str || typeof str !== 'string' || localLanguage === 'en') return str;
    return getStaticTranslation(localLanguage, str) || getCachedTranslation(localLanguage, str) || t(str);
  };

  // Use activeArticle (translated) for displaying text
  const paragraphs = (activeArticle.content || activeArticle.summary || activeArticle.excerpt || "").split('\n\n');

  const isDeepDive = activeArticle.category?.toUpperCase()?.includes('DEEP DIVE') || 
                     activeArticle.slug?.includes('deep-dive') ||
                     activeArticle.isDeepDive;
  const isGated = isDeepDive && !isLoggedIn;

  // Pre-fetch voices when speech synthesis initializes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Lock background scroll when modal is open & listen for Ctrl + / Ctrl - keyboard shortcuts
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoomLevel(prev => Math.min(1.8, +(prev + 0.15).toFixed(2)));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoomLevel(prev => Math.max(0.7, +(prev - 0.15).toFixed(2)));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (progressTimerRef && progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  // Handle click outside speed menu popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target)) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean HTML markup into pure plain text for natural speech reading
  const cleanHtmlText = (inputStr) => {
    if (!inputStr) return '';
    const formatted = inputStr
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<img[\s\S]*?>/gi, ' ')
      .replace(/data:image\/[a-zA-Z]+;base64,[a-zA-Z0-9+/=]+/g, ' ')
      .replace(/<\/(h[1-6]|p|div|li|tr|blockquote)>/gi, '. ')
      .replace(/<br\s*\/?>/gi, '. ')
      .replace(/<[^>]*>/g, ' ');
    
    let text = formatted;
    if (typeof window !== 'undefined' && window.DOMParser) {
      try {
        const doc = new DOMParser().parseFromString(formatted, 'text/html');
        text = doc.body.textContent || formatted;
      } catch (e) {
        text = formatted;
      }
    }
    return text.replace(/\s+/g, ' ').trim();
  };

  // Detect language of text for accurate TTS voice matching (Multilingual Support)
  const detectLanguage = (text) => {
    if (!text) return 'en-US';
    
    // Indic & Asian Scripts (Checked first to avoid Devanagari punctuation conflicts like Danda '।')
    if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN'; // Bengali
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'; // Telugu
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'; // Tamil
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN'; // Gujarati
    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN'; // Malayalam
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN'; // Kannada
    if (/[\u0A00-\u0A7F]/.test(text)) return 'pa-IN'; // Punjabi / Gurmukhi
    if (/[\u0B00-\u0B7F]/.test(text)) return 'or-IN'; // Odia
    
    // DON'T CHANGE THE HINDI PART (Left exactly as requested, just evaluates after other Indic scripts)
    if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'; // Hindi / Devanagari
    
    // Other Non-Latin Scripts
    if (/[\u0E00-\u0E7F]/.test(text)) return 'th-TH'; // Thai
    if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return 'ko-KR'; // Korean
    if (/[\u3040-\u30FF\u4E00-\u9FAF]/.test(text)) return 'ja-JP'; // Japanese
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh-CN'; // Chinese
    if (/[\u0590-\u05FF]/.test(text)) return 'he-IL'; // Hebrew
    if (/[\u0600-\u06FF]/.test(text)) {
      if (/[\u067E\u0686\u0698\u06AF]/.test(text)) return 'fa-IR'; // Persian-specific letters
      if (/[\u0679\u0688\u0691\u06BA\u06BE\u06D2]/.test(text)) return 'ur-PK'; // Urdu-specific letters
      return 'ar-SA'; // Arabic
    }
    if (/[\u0400-\u04FF]/.test(text)) {
      if (/[іїєґ]/i.test(text)) return 'uk-UA'; // Ukrainian-specific
      return 'ru-RU'; // Russian
    }
    if (/[\u0530-\u058F]/.test(text)) return 'hy-AM'; // Armenian
    if (/[\u10A0-\u10FF]/.test(text)) return 'ka-GE'; // Georgian
    if (/[\u1200-\u137F]/.test(text)) return 'am-ET'; // Amharic
    
    // Latin Extended & Specific Latin Char Matching
    if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text)) return 'vi-VN'; // Vietnamese
    if (/[ąćęłńóśźż]/i.test(text)) return 'pl-PL'; // Polish
    if (/[şğ]/i.test(text)) return 'tr-TR'; // Turkish
    if (/[ãõ]/i.test(text)) return 'pt-BR'; // Portuguese
    if (/[ñ¿¡]/i.test(text)) return 'es-ES'; // Spanish
    if (/[àèìòù]/i.test(text) && !/[áéíóú]/i.test(text)) return 'it-IT'; // Italian (approximate)
    if (/[œæç]/i.test(text)) return 'fr-FR'; // French
    if (/[äöüß]/i.test(text)) return 'de-DE'; // German
    if (/[ëï]/i.test(text)) return 'nl-NL'; // Dutch
    
    // Default fallback
    return 'en-US';
  };

  const getVoiceForLanguage = (langCode) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const primaryLang = langCode.split('-')[0].toLowerCase();
    
    // 1. Exact match (e.g. 'hi-IN' or 'en-US')
    let voice = voices.find(v => v.lang.toLowerCase().replace('_', '-') === langCode.toLowerCase());
    if (voice) return voice;

    // 2. Primary language prefix match (e.g. starts with 'hi' or 'en')
    voice = voices.find(v => v.lang.toLowerCase().startsWith(primaryLang));
    if (voice) return voice;

    // 3. Name-based match for Hindi voices
    if (primaryLang === 'hi') {
      voice = voices.find(v => 
        v.name.toLowerCase().includes('hindi') || 
        v.name.toLowerCase().includes('hi-in') || 
        v.name.toLowerCase().includes('kalpana') ||
        v.name.toLowerCase().includes('hemant') ||
        v.name.toLowerCase().includes('swara') ||
        v.name.toLowerCase().includes('madhur')
      );
      if (voice) return voice;
      // Do NOT fall back to an English voice (voices[0]) for Hindi text!
      // Returning null allows browser's native cloud/system Hindi TTS engine to handle utterance.lang = 'hi-IN'.
      return null;
    }

    // 4. Name-based match for English voices
    if (primaryLang === 'en') {
      voice = voices.find(v => 
        v.name.includes('Natural') || 
        v.name.includes('Google') || 
        v.name.includes('Samantha') || 
        v.name.includes('Daniel') ||
        v.name.includes('Zira') ||
        v.name.includes('David')
      );
      if (voice) return voice;
      return voices[0] || null;
    }

    return null;
  };


  // Split text into small sentence chunks (~150 chars) to bypass browser length limits
  const createChunks = (fullText, maxLen = 150) => {
    if (!fullText) return [];
    // Support international punctuation: Danda (Hindi/Bengali/etc), CJK periods, Arabic question marks
    const sentences = fullText.match(/[^.!?\n\r।॥。！？؟]+[.!?\n\r।॥。！？؟]+/g) || [fullText];
    const chunks = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + ' ' + sentence).length <= maxLen) {
        current = current ? (current + ' ' + sentence) : sentence;
      } else {
        if (current) chunks.push(current.trim());
        if (sentence.length > maxLen) {
          // Safe split for extremely long sentences without proper punctuation
          const parts = sentence.match(new RegExp(`.{1,${maxLen}}(\\s+|$)`, 'g'));
          if (parts) {
            parts.forEach(p => chunks.push(p.trim()));
          } else {
            // Absolute fallback hard-split
            for (let i = 0; i < sentence.length; i += maxLen) {
              chunks.push(sentence.substring(i, i + maxLen).trim());
            }
          }
          current = '';
        } else {
          current = sentence;
        }
      }
    }
    if (current) chunks.push(current.trim());
    return chunks.filter(c => c.length > 0);
  };

  // Helper to keep Audio State and Ref synchronized
  const setAudioState = (playing, paused) => {
    isPlayingRef.current = playing;
    isPausedRef.current = paused;
    setIsPlayingAudio(playing);
    setIsPausedAudio(paused);
  };

  // Speed-Synchronized Realtime Timer Controller
  const startSpeedTimer = (targetRate = playbackSpeedRef.current) => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    const intervalMs = Math.max(250, Math.round(1000 / targetRate));
    
    progressTimerRef.current = setInterval(() => {
      if (isPausedRef.current || !isPlayingRef.current) {
        clearInterval(progressTimerRef.current);
        return;
      }
      secondsPlayedRef.current += 1;
      const mins = Math.floor(secondsPlayedRef.current / 60);
      const secs = (secondsPlayedRef.current % 60).toString().padStart(2, '0');
      setElapsedTimeStr(`${mins}:${secs}`);
    }, intervalMs);
  };

  // Play chunk using Speech Synthesis (Human Spoken Voiceover)
  const playChunk = (index, targetRate = playbackSpeedRef.current) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPausedRef.current || !isPlayingRef.current) return;

    const chunks = chunksRef.current;
    if (!chunks || index >= chunks.length) {
      setAudioState(false, false);
      setIsEnded(true);
      setAudioProgress(100);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    chunkIndexRef.current = index;
    const text = chunks[index];
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const detectedLang = localLanguage === 'hi' ? 'hi-IN' : (localLanguage === 'en' ? 'en-US' : detectLanguage(text));
    utterance.lang = detectedLang;
    utterance.rate = Math.max(0.5, Math.min(3.0, targetRate));
    utterance.pitch = 1.0;

    const voice = getVoiceForLanguage(detectedLang);
    if (voice) utterance.voice = voice;


    // Word boundary event for smooth progress bar updates
    utterance.onboundary = (event) => {
      if (isPausedRef.current || !isPlayingRef.current) return;
      const chunkStartOffset = chunkCharOffsetsRef.current[index] || 0;
      const currentCharPos = chunkStartOffset + (event.charIndex || 0);
      if (totalArticleCharsRef.current > 0) {
        const pct = Math.min(99, Math.round((currentCharPos / totalArticleCharsRef.current) * 100));
        setAudioProgress(pct);
      }
    };

    utterance.onend = () => {
      if (isPausedRef.current || !isPlayingRef.current) return;

      if (chunkIndexRef.current < chunks.length - 1) {
        const nextIdx = chunkIndexRef.current + 1;
        playChunk(nextIdx, playbackSpeedRef.current);
      } else {
        setAudioState(false, false);
        setIsEnded(true);
        setAudioProgress(100);
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      }
    };

    utterance.onerror = (err) => {
      if (isPausedRef.current || !isPlayingRef.current) return;
      console.warn("Speech synthesis chunk warning", err);
      if (chunkIndexRef.current < chunks.length - 1) {
        playChunk(chunkIndexRef.current + 1, playbackSpeedRef.current);
      } else {
        setAudioState(false, false);
        setIsEnded(true);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Fallback Audio Reader using browser Speech Synthesis if ElevenLabs is unavailable
  const startFallbackSpeech = (targetRate = playbackSpeedRef.current) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("Text-to-speech audio reader is not supported in this browser.");
      setAudioState(false, false);
      setIsLoadingAudio(false);
      return;
    }

    setAudioMode('fallback');
    setAudioState(true, false);
    setIsEnded(false);
    window.speechSynthesis.cancel();

    // Prepare clean text of FULL article (Title + Author + Body)
    const cleanTitle = cleanHtmlText(activeArticle.title);
    const cleanAuthor = cleanHtmlText(activeArticle.author || (localLanguage === 'hi' ? 'स्टाफ रिपोर्टर' : 'Staff Reporter'));
    const rawBody = activeArticle.content || activeArticle.summary || activeArticle.excerpt || '';
    const cleanBody = cleanHtmlText(rawBody);

    const authorLabel = localLanguage === 'hi' ? 'रिपोर्टर' : (localLanguage === 'ko' ? '기자' : (localLanguage === 'ja' ? '記者' : 'By'));
    const fullTextToRead = `${cleanTitle}. ${authorLabel} ${cleanAuthor}. ${cleanBody}`;

    const chunks = createChunks(fullTextToRead, 150);
    chunksRef.current = chunks;
    chunkIndexRef.current = 0;
    totalArticleCharsRef.current = fullTextToRead.length;

    // Calculate cumulative character offsets for smooth progress
    let cumulativeOffset = 0;
    chunkCharOffsetsRef.current = chunks.map(c => {
      const pos = cumulativeOffset;
      cumulativeOffset += c.length + 1;
      return pos;
    });

    if (chunks.length === 0) {
      alert("No readable article text available.");
      setAudioState(false, false);
      return;
    }

    setAudioProgress(0);
    setElapsedTimeStr('0:00');
    secondsPlayedRef.current = 0;

    startSpeedTimer(targetRate);
    playChunk(0, targetRate);
  };

  // Start ElevenLabs HTML5 Audio Player
  const startElevenLabsAudio = async (audioBlob, targetRate = playbackSpeedRef.current) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioObjUrlRef.current) {
        URL.revokeObjectURL(audioObjUrlRef.current);
        audioObjUrlRef.current = null;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      audioObjUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.playbackRate = targetRate;

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          const totalSecs = Math.floor(audio.duration);
          const m = Math.floor(totalSecs / 60);
          const s = (totalSecs % 60).toString().padStart(2, '0');
          setDurationStr(`${m}:${s}`);
        }
      };

      audio.ontimeupdate = () => {
        if (!audio.duration || isNaN(audio.duration) || !isFinite(audio.duration)) return;
        const current = audio.currentTime;
        const dur = audio.duration;
        const pct = Math.min(100, Math.round((current / dur) * 100));
        setAudioProgress(pct);

        const mins = Math.floor(current / 60);
        const secs = (Math.floor(current) % 60).toString().padStart(2, '0');
        setElapsedTimeStr(`${mins}:${secs}`);
      };

      audio.onended = () => {
        setAudioState(false, false);
        setIsEnded(true);
        setAudioProgress(100);
      };

      audio.onerror = (e) => {
        console.warn("ElevenLabs audio playback error, falling back to browser speech synthesis:", e);
        startFallbackSpeech(targetRate);
      };

      setAudioMode('elevenlabs');
      setAudioState(true, false);
      setIsEnded(false);
      await audio.play();
    } catch (err) {
      console.warn("Error starting ElevenLabs audio, activating fallback:", err);
      startFallbackSpeech(targetRate);
    }
  };

  // Fetch ElevenLabs Audio from Server Route with Automatic Fallback
  const fetchAndPlayAudio = async (targetRate = playbackSpeedRef.current) => {
    setIsLoadingAudio(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      const cleanTitle = cleanHtmlText(activeArticle.title);
      const cleanAuthor = cleanHtmlText(activeArticle.author || (localLanguage === 'hi' ? 'स्टाफ रिपोर्टर' : 'Staff Reporter'));
      const rawBody = activeArticle.content || activeArticle.summary || activeArticle.excerpt || '';
      const cleanBody = cleanHtmlText(rawBody);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cleanTitle,
          author: cleanAuthor,
          text: cleanBody,
          language: localLanguage
        })
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('audio')) {
        const audioBlob = await response.blob();
        setIsLoadingAudio(false);
        await startElevenLabsAudio(audioBlob, targetRate);
      } else {
        // Fallback flag or API key missing/invalid
        setIsLoadingAudio(false);
        startFallbackSpeech(targetRate);
      }
    } catch (err) {
      console.warn("ElevenLabs TTS request failed, activating fallback:", err);
      setIsLoadingAudio(false);
      startFallbackSpeech(targetRate);
    }
  };

  // Instant Zero-Latency Play / Pause Toggle
  const toggleAudio = () => {
    if (isLoadingAudio) return;

    // 1. REPLAY: If finished (ended) -> Replay from beginning
    if (isEnded) {
      handleReplay();
      return;
    }

    // 2. If currently PLAYING and NOT paused -> PAUSE
    if (isPlayingRef.current && !isPausedRef.current) {
      setAudioState(true, true);
      if (audioMode === 'elevenlabs' && audioRef.current) {
        audioRef.current.pause();
      } else if (audioMode === 'fallback') {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      }
      return;
    }

    // 3. If currently PAUSED -> RESUME
    if (isPlayingRef.current && isPausedRef.current) {
      setAudioState(true, false);
      if (audioMode === 'elevenlabs' && audioRef.current) {
        audioRef.current.playbackRate = playbackSpeedRef.current;
        audioRef.current.play().catch(() => {});
      } else if (audioMode === 'fallback') {
        startSpeedTimer(playbackSpeedRef.current);
        playChunk(chunkIndexRef.current, playbackSpeedRef.current);
      }
      return;
    }

    // 4. Initial Start -> Fetch ElevenLabs audio (or fallback)
    fetchAndPlayAudio(playbackSpeedRef.current);
  };

  // Replay from beginning (0:00)
  const handleReplay = () => {
    if (isLoadingAudio) return;

    if (audioMode === 'elevenlabs' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = playbackSpeedRef.current;
      audioRef.current.play().catch(() => {});
      setAudioState(true, false);
      setIsEnded(false);
      setAudioProgress(0);
      setElapsedTimeStr('0:00');
      return;
    }

    if (audioMode === 'fallback') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setAudioState(true, false);
      setIsEnded(false);
      chunkIndexRef.current = 0;
      secondsPlayedRef.current = 0;
      setAudioProgress(0);
      setElapsedTimeStr('0:00');
      startSpeedTimer(playbackSpeedRef.current);
      playChunk(0, playbackSpeedRef.current);
      return;
    }

    // If not yet started, fetch & play from beginning
    fetchAndPlayAudio(playbackSpeedRef.current);
  };

  // Update speed dynamically & sync elapsed time
  const updateSpeed = (newSpeed) => {
    const rate = Math.max(0.5, Math.min(3.0, parseFloat(newSpeed.toFixed(2))));
    setPlaybackSpeed(rate);
    playbackSpeedRef.current = rate;

    if (audioMode === 'elevenlabs' && audioRef.current) {
      audioRef.current.playbackRate = rate;
      return;
    }

    if (audioMode === 'fallback') {
      const currentOffset = chunkCharOffsetsRef.current[chunkIndexRef.current] || 0;
      const contentSeconds = Math.round(currentOffset / 15);
      secondsPlayedRef.current = contentSeconds;

      const mins = Math.floor(contentSeconds / 60);
      const secs = (contentSeconds % 60).toString().padStart(2, '0');
      setElapsedTimeStr(`${mins}:${secs}`);

      if (isPlayingRef.current && !isPausedRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        startSpeedTimer(rate);
        playChunk(chunkIndexRef.current, rate);
      }
    }
  };

  // Interactive Audio Seeking (Slide or click to any position)
  const handleSeekProgress = (targetPct) => {
    if (audioMode === 'elevenlabs' && audioRef.current) {
      if (audioRef.current.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
        const targetTime = (targetPct / 100) * audioRef.current.duration;
        audioRef.current.currentTime = targetTime;
        setAudioProgress(targetPct);
        setIsEnded(false);
        const mins = Math.floor(targetTime / 60);
        const secs = (Math.floor(targetTime) % 60).toString().padStart(2, '0');
        setElapsedTimeStr(`${mins}:${secs}`);
      }
      return;
    }

    // Fallback seeking through sentence chunks
    const chunks = chunksRef.current;
    if (!chunks || chunks.length === 0) return;

    const targetChunkIdx = Math.min(
      chunks.length - 1,
      Math.max(0, Math.floor((targetPct / 100) * chunks.length))
    );

    const targetCharOffset = chunkCharOffsetsRef.current[targetChunkIdx] || 0;
    const estimatedContentSeconds = Math.round(targetCharOffset / 15);
    secondsPlayedRef.current = estimatedContentSeconds;

    const mins = Math.floor(estimatedContentSeconds / 60);
    const secs = (estimatedContentSeconds % 60).toString().padStart(2, '0');
    setElapsedTimeStr(`${mins}:${secs}`);
    setAudioProgress(targetPct);
    setIsEnded(false);

    chunkIndexRef.current = targetChunkIdx;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (isPlayingRef.current && !isPausedRef.current) {
        startSpeedTimer(playbackSpeedRef.current);
        playChunk(targetChunkIdx, playbackSpeedRef.current);
      }
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  if (!article) return null;

  return (


    <>
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        article={article} 
      />

      <div className="modal-overlay" onClick={onClose}>
        <div 
          className="modal-content" 
          onClick={(e) => e.stopPropagation()}
          style={{ width: '96%', maxWidth: '1280px', maxHeight: '92vh', overflowY: 'auto', padding: '42px 56px' }}
        >
          <button className="btn-close-modal" onClick={onClose} aria-label="Close article">
            <X size={20} />
          </button>

          {/* Reader Utility Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color, #eee)', paddingBottom: '16px', marginBottom: '24px' }}>
            <div className="article-modal-header" dir="ltr">
              <div className="article-modal-category">
                <span className="category-tag-badge">
                  {activeArticle.category || "NEWS"} {isDeepDive && ("💎 " + (getStaticTranslation(localLanguage, "MEMBER EXCLUSIVE") || t("MEMBER EXCLUSIVE")))}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <LanguageSelector 
                minimal={true} 
                value={localLanguage} 
                onChange={setLocalLanguage} 
                isTranslating={localIsTranslating} 
              />
              <span style={{ color: 'var(--border-color, #eee)', fontSize: '12px' }}>|</span>
              
              {/* Functional Text Resizer Pill (A- / A+ / Keyboard Ctrl+ / Ctrl-) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary, #f5f5f5)', borderRadius: '6px', padding: '4px 12px' }}>
                <button 
                  onClick={() => setZoomLevel(prev => Math.max(0.7, +(prev - 0.15).toFixed(2)))} 
                  style={{ fontWeight: 800, fontSize: '14px', padding: '2px 6px', color: 'var(--text-primary)', border: 'none', background: 'none', cursor: 'pointer' }}
                  title="Decrease Text & Document Size (Ctrl - or A-)"
                >
                  A-
                </button>
                <span style={{ color: 'var(--border-color, #ccc)', fontSize: '12px' }}>|</span>
                <button 
                  onClick={() => setZoomLevel(prev => Math.min(1.8, +(prev + 0.15).toFixed(2)))} 
                  style={{ fontWeight: 800, fontSize: '14px', padding: '2px 6px', color: 'var(--text-primary)', border: 'none', background: 'none', cursor: 'pointer' }}
                  title="Increase Text & Document Size (Ctrl + or A+)"
                >
                  A+
                </button>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>

              {/* Bookmark */}
              <button onClick={() => setIsBookmarked(!isBookmarked)} style={{ color: isBookmarked ? '#dc2626' : 'var(--text-secondary)' }}>
                <Bookmark size={18} fill={isBookmarked ? '#dc2626' : 'none'} />
              </button>

              {/* Share */}
              <button onClick={handleShare} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }} title="Share Article">
                <Share2 size={18} />
              </button>
            </div>
          </div>

        {/* Kicker Section */}
        {activeArticle.kicker ? (
          <div 
            className="article-kicker-wrapper"
            style={{
              padding: '0 24px',
              marginTop: '16px',
              marginBottom: '-8px'
            }}
          >
            <span 
              className="article-kicker-text"
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--accent-gold, #d97706)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {activeArticle.kicker}
            </span>
          </div>
        ) : (
          activeArticle.category && (
            <div 
              className="article-kicker-wrapper"
              style={{
                padding: '0 24px',
                marginTop: '16px',
                marginBottom: '-8px'
              }}
            >
              <span 
                className="article-kicker-text"
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: 'var(--accent-blue, #2563eb)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                {activeArticle.category}
              </span>
            </div>
          )
        )}

        {/* Article Headline with Dynamic Zoom Scaling */}
        <h1 
          className="article-modal-title" 
          style={{ fontSize: `${2.8 * zoomLevel}rem` }}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {activeArticle.title}
        </h1>

        {/* Meta Info */}
        <div className="article-modal-meta" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="article-modal-author">
            {activeArticle.author || getStaticTranslation(localLanguage, "THE DAILY BRIEF BUREAU") || t("THE DAILY BRIEF BUREAU")}
          </div>
          <div className="article-modal-time">
            <Clock size={14} />
            {activeArticle.time || getStaticTranslation(localLanguage, "Just now") || t("Just now")}
          </div>
        </div>

        {/* Optional Article Cover Media (Video, Document, or Image) */}
        <div className="article-modal-hero-img-container" style={{ width: activeArticle.coverWidth || '100%', margin: '0 auto 24px auto' }}>
          <ArticleMediaCover
            article={activeArticle}
            className="article-modal-hero-img"
            style={{
              width: '100%',
              height: activeArticle.coverHeight === 'auto' ? 'auto' : (activeArticle.coverHeight || '440px'),
              minHeight: activeArticle.coverHeight === 'auto' ? '300px' : undefined,
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden'
            }}
            imageStyle={{
              maxHeight: activeArticle.coverHeight === 'auto' ? 'none' : (activeArticle.coverHeight || '480px'),
              borderRadius: 'var(--radius-md)'
            }}
            controls={true}
            autoPlay={true}
            muted={true}
            loop={true}
            priority={true}
            showCaption={true}
          />
        </div>

        {/* Executive Takeaways Box */}
        {activeArticle.takeaways && activeArticle.takeaways.length > 0 && (
          <div 
            style={{ 
              background: 'var(--accent-emerald-light, #ecfdf5)', 
              borderLeft: '4px solid var(--accent-emerald, #059669)', 
              padding: '20px 24px', 
              borderRadius: 'var(--radius-md, 8px)', 
              marginBottom: '28px' 
            }} 
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-emerald, #059669)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} />
              <span>{getStaticTranslation(localLanguage, "Executive Takeaways") || t("Executive Takeaways")}</span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: 0 }}>
              {activeArticle.takeaways.map((point, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                  <Check size={18} color="var(--accent-emerald, #059669)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Body Content */}
        <div 
          className="article-rich-body"
          style={{ fontSize: `${1.125 * zoomLevel}rem`, lineHeight: `${1.75 * zoomLevel}` }}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {activeArticle.content && (activeArticle.content.includes('<') || activeArticle.content.includes('>')) ? (
            <SafeArticleBody content={activeArticle.content} className="article-html-content" adConfig={activeArticle} adPlacements={activeArticle.adPlacements} />
          ) : (
            paragraphs.slice(0, isGated ? 1 : paragraphs.length).map((paragraph, idx) => {
              const activeAds = Array.isArray(activeArticle?.adPlacements) && activeArticle.adPlacements.length > 0
                ? activeArticle.adPlacements.filter(a => a && a.enabled)
                : (activeArticle?.placeholderAdEnabled ? [activeArticle] : []);

              const matchingAds = activeAds.filter(a => {
                const targetIdx = parseInt(a.placementValue || a.placeholderAdPositionValue || '2');
                const pType = a.placementType || a.placeholderAdPositionType || 'after_paragraph';
                if (pType === 'after_intro') return idx === 0;
                if (pType === 'before_related') return idx === paragraphs.length - 1;
                return idx === Math.min(paragraphs.length - 1, Math.max(0, targetIdx - 1));
              });

              return (
                <React.Fragment key={idx}>
                  <p style={{ marginBottom: '24px' }}>
                    {paragraph}
                  </p>
                  {matchingAds.map((ad, i) => (
                    <ArticleAdBanner key={ad.id || i} adConfig={ad} alignment={ad.alignment} label={ad.label} contentType={ad.contentType} content={ad.content} />
                  ))}
                </React.Fragment>
              );
            })
          )}

          {/* Gated Paywall Banner for Deep Dives */}
          {isGated && (
            <div style={{ position: 'relative', marginTop: '24px', minHeight: '260px' }}>
              {/* Blurred teaser snippet */}
              <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none', opacity: 0.5 }}>
                <p style={{ marginBottom: '16px' }}>
                  Our quantitative models show a 78% shift in capital allocation towards private AI infrastructure networks. Across sovereign wealth funds in Dresden, Tokyo, and Abu Dhabi, government mandates are rewriting national industrial policies...
                </p>
                <p style={{ marginBottom: '16px' }}>
                  The 50-page breakdown includes full data tables, regulatory risk maps, and executive forecasts through 2030...
                </p>
              </div>

              {/* Paywall Overlay Card */}
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, #ffffff 85%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '30px 20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }}>
                <div style={{ background: '#fef2f2', border: '1px solid rgba(220,38,38,0.2)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <Lock size={26} color="#dc2626" />
                </div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 800, color: '#111', marginBottom: '6px' }}>
                  {localT("Deep Dives 💎 Member Exclusive")}
                </h3>
                <p style={{ fontSize: '14px', color: '#555', maxWidth: '460px', marginBottom: '18px', lineHeight: 1.45 }}>
                  {localT("This investigative report and raw dataset are restricted to registered Daily Brief members. Please log in or sign up to continue reading.")}
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    onClick={onOpenLogin}
                    style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '12px 24px', fontWeight: 800, fontSize: '14px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Lock size={16} />
                    <span>{localT("Log In to Unlock Story")}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onLoginSuccess) {
                        onLoginSuccess({ email: 'demo@dailybrief.com', name: 'Member Subscriber', isPremium: true });
                      }
                    }}
                    style={{ background: '#111', color: '#fff', border: 'none', padding: '12px 20px', fontWeight: 700, fontSize: '13px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <UserCheck size={16} />
                    <span>{localT("1-Click Free Member Access")}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};
