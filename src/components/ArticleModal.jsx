import React, { useState, useEffect, useRef } from 'react';
import ShareModal from './ShareModal';
import SafeArticleBody from './SafeArticleBody';
import ArticleAdBanner from './ArticleAdBanner';
import { useTranslation } from '../context/TranslationContext';

import { LanguageSelector } from './LanguageSelector';
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
  ChevronRight
} from 'lucide-react';

export const ArticleModal = ({ article, onClose, isLoggedIn, onOpenLogin, onLoginSuccess }) => {
  const { language: globalLanguage, translateArticle } = useTranslation();
  const [localLanguage, setLocalLanguage] = useState(globalLanguage);
  const [localIsTranslating, setLocalIsTranslating] = useState(false);
  const [translatedArticle, setTranslatedArticle] = useState(null);

  const articleId = article?.id;
  const articleContent = article?.content;

  // Handle translation when language or article ID changes
  useEffect(() => {
    let isMounted = true;

    if (!article || localLanguage === 'en') {
      setTranslatedArticle(null);
      setLocalIsTranslating(false);
      return;
    }
    setLocalIsTranslating(true);
    translateArticle(article, localLanguage).then(translated => {
      if (isMounted) {
        setTranslatedArticle(translated);
        setLocalIsTranslating(false);
      }
    });
    return () => { isMounted = false; };
  }, [articleId, articleContent, localLanguage, translateArticle]);

  // Cancel playing voiceover only when explicitly switching languages
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
    setIsEnded(false);
    setAudioProgress(0);
    setElapsedTimeStr('0:00');
    isPlayingRef.current = false;
    isPausedRef.current = false;
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  }, [localLanguage]);



  const activeArticle = translatedArticle || article;

  const [zoomLevel, setZoomLevel] = useState(1.0); // 0.7 to 1.8 document zoom scale
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // Numeric speed float (1.0 = Normal)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0); // 0 to 100%
  const [elapsedTimeStr, setElapsedTimeStr] = useState('0:00');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const audioRef = useRef(null);
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

  const isRtl = ['ar', 'he', 'fa', 'ur'].includes(localLanguage);

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

  // Start AI Voiceover Audio Reader across 100% of full article
  const toggleAudioWithRate = (targetRate = playbackSpeedRef.current) => {
    if (localLanguage !== 'en' && localLanguage !== 'hi') return;

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("Text-to-speech audio reader is not supported in this browser.");
      return;
    }

    setAudioState(true, false);
    setIsEnded(false);
    window.speechSynthesis.cancel();

    // Prepare clean text of FULL article (Title + Author + Body)
    const cleanTitle = cleanHtmlText(activeArticle.title);
    const cleanAuthor = cleanHtmlText(activeArticle.author || (localLanguage === 'hi' ? 'स्टाफ रिपोर्टर' : 'Staff Reporter'));
    const rawBody = activeArticle.content || activeArticle.summary || activeArticle.excerpt || '';
    const cleanBody = cleanHtmlText(rawBody);

    const authorLabel = localLanguage === 'hi' ? 'रिपोर्टर' : 'By';
    const fullTextToRead = localLanguage === 'hi'
      ? `${cleanTitle}। ${authorLabel} ${cleanAuthor}। ${cleanBody}`
      : `${cleanTitle}. By ${cleanAuthor}. ${cleanBody}`;

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

  // Instant Zero-Latency Play / Pause / Replay Toggle
  const toggleAudio = () => {
    if (localLanguage !== 'en' && localLanguage !== 'hi') return;

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("Text-to-speech audio reader is not supported in this browser.");
      return;
    }


    // 1. REPLAY FIX: If finished (ended) -> RESET to 0:00 and replay full article from beginning!
    if (isEnded || (chunksRef.current.length > 0 && chunkIndexRef.current >= chunksRef.current.length - 1 && audioProgress >= 98)) {
      window.speechSynthesis.cancel();
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

    // 2. If currently PLAYING and NOT paused -> INSTANT PAUSE SILENCE (0ms delay)
    if (isPlayingRef.current && !isPausedRef.current) {
      setAudioState(true, true);
      window.speechSynthesis.cancel(); // Cuts off speech voiceover instantly
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    // 3. If currently PAUSED -> INSTANT RESUME from exact sentence
    if (isPlayingRef.current && isPausedRef.current) {
      setAudioState(true, false);
      startSpeedTimer(playbackSpeedRef.current);
      playChunk(chunkIndexRef.current, playbackSpeedRef.current);
      return;
    }

    // 4. If NOT started -> Start full article speech reading
    if (chunksRef.current.length > 0 && chunkIndexRef.current < chunksRef.current.length) {
      setAudioState(true, false);
      startSpeedTimer(playbackSpeedRef.current);
      playChunk(chunkIndexRef.current, playbackSpeedRef.current);
    } else {
      toggleAudioWithRate(playbackSpeedRef.current);
    }
  };

  // Update speed dynamically & sync elapsed time to content timestamp (YouTube Style)
  const updateSpeed = (newSpeed) => {
    const rate = Math.max(0.5, Math.min(3.0, parseFloat(newSpeed.toFixed(2))));
    setPlaybackSpeed(rate);
    playbackSpeedRef.current = rate;

    // Convert elapsed seconds to current content position seconds so switching speeds doesn't jump
    const currentOffset = chunkCharOffsetsRef.current[chunkIndexRef.current] || 0;
    const contentSeconds = Math.round(currentOffset / 15);
    secondsPlayedRef.current = contentSeconds;

    const mins = Math.floor(contentSeconds / 60);
    const secs = (contentSeconds % 60).toString().padStart(2, '0');
    setElapsedTimeStr(`${mins}:${secs}`);

    // If audio is currently playing, continue playing from exact current sentence at new speed
    if (isPlayingRef.current && !isPausedRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      startSpeedTimer(rate);
      playChunk(chunkIndexRef.current, rate);
    }
    // If audio is currently paused, DO NOT start playback! Stay paused at exact timestamp!
  };

  // Interactive YouTube-Style Audio Seeking (Slide to any paragraph/part)
  const handleSeekProgress = (targetPct) => {
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
                  {activeArticle.category || "NEWS"} {isDeepDive && "💎 PREMIUM"}
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
            {activeArticle.author || "THE DAILY BRIEF BUREAU"}
          </div>
          <div className="article-modal-time">
            <Clock size={14} />
            {activeArticle.time || "Just now"}
          </div>
        </div>

        {/* Real Functional AI Voiceover News Player Card */}
        {(localLanguage === 'en' || localLanguage === 'hi') && (
          <div style={{
          background: 'linear-gradient(135deg, var(--bg-dark-accent, #0f172a) 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '16px 22px',
          marginBottom: '28px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '18px',
          flexWrap: 'wrap',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
            {/* Play / Pause Voiceover Audio Button */}
            <button 
              onClick={toggleAudio} 
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: (isPlayingAudio && !isPausedAudio) ? 'var(--accent-crimson, #dc2626)' : 'var(--accent-emerald, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                boxShadow: (isPlayingAudio && !isPausedAudio) ? '0 0 18px rgba(220, 38, 38, 0.6)' : '0 0 18px rgba(5, 150, 105, 0.6)',
                flexShrink: 0,
                transition: 'transform 0.15s ease'
              }}
              title={(isPlayingAudio && !isPausedAudio) ? "Pause AI Voiceover" : (isPausedAudio ? "Resume AI Voiceover" : "Play AI Voiceover News")}
            >
              {(isPlayingAudio && !isPausedAudio) ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: '2px' }} />}
            </button>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: (isPlayingAudio && !isPausedAudio) ? '#f87171' : (isPausedAudio ? '#f59e0b' : 'var(--accent-emerald, #34d399)'), textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span dir="ltr">{(isPlayingAudio && !isPausedAudio) ? "🎙️ READING NEWS ALOUD..." : (isPausedAudio ? "⏸️ VOICE PAUSED • CLICK TO RESUME" : "DAILY BRIEF AI VOICEOVER • LISTEN TO ARTICLE")}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }} dir={isRtl ? 'rtl' : 'ltr'}>
                {activeArticle.title}
              </div>
            </div>
          </div>

          {/* Live Audio Playback Seekable Slider Bar (YouTube Style Seeking) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 240px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'var(--font-mono)', minWidth: '36px', fontWeight: 600 }}>
              {elapsedTimeStr}
            </span>
            
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              {/* Visual Colored Progress Track */}
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '6px',
                background: 'rgba(255,255,255,0.18)',
                borderRadius: '3px',
                pointerEvents: 'none',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${audioProgress}%`,
                  height: '100%',
                  background: isPlayingAudio ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' : '#059669',
                  borderRadius: '3px',
                  transition: 'width 0.15s ease-out'
                }} />
              </div>

              {/* Interactive Transparent Range Input Slider for Seeking */}
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={audioProgress}
                onChange={(e) => handleSeekProgress(parseFloat(e.target.value))}
                title="Drag or click to seek to a specific part of the article"
                style={{
                  width: '100%',
                  height: '16px',
                  background: 'transparent',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 2,
                  margin: 0
                }}
              />
            </div>
          </div>

          {/* YouTube Style Playback Speed Trigger Button & Popover Container */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#cbd5e1',
                background: 'rgba(255,255,255,0.12)',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.2s'
              }}
              title="Change Playback Speed (YouTube Style)"
            >
              <Gauge size={15} color="#34d399" />
              <span>{`${playbackSpeed.toFixed(2)}x`}</span>
              <ChevronRight size={14} style={{ transform: showSpeedMenu ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* YouTube Style Playback Speed Popover Menu */}
            {showSpeedMenu && (
              <div 
                ref={speedMenuRef}
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 12px)',
                  right: 0,
                  width: '320px',
                  background: '#0f172a',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                  zIndex: 99999,
                  backdropFilter: 'blur(16px)'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700 }}>
                    <Gauge size={18} color="#34d399" />
                    <span>Playback speed</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    {`${playbackSpeed.toFixed(2)}x`}
                  </span>
                </div>

                {/* Large Speed Readout */}
                <div style={{ textAlign: 'center', fontSize: '26px', fontWeight: 800, marginBottom: '14px', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                  {playbackSpeed.toFixed(2)}x
                </div>

                {/* Speed Slider Bar with - and + buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                  <button 
                    onClick={() => updateSpeed(playbackSpeed - 0.05)}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.12)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Decrease Speed (-0.05x)"
                  >
                    <Minus size={16} />
                  </button>

                  <input 
                    type="range" 
                    min="0.5" 
                    max="3.0" 
                    step="0.05" 
                    value={playbackSpeed}
                    onChange={(e) => updateSpeed(parseFloat(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: '#059669',
                      height: '6px',
                      cursor: 'pointer'
                    }}
                  />

                  <button 
                    onClick={() => updateSpeed(playbackSpeed + 0.05)}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.12)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Increase Speed (+0.05x)"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Speed Preset Pills Row (YouTube Style) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  {[
                    { val: 1.0, label: '1.0', sub: 'Normal' },
                    { val: 1.25, label: '1.25' },
                    { val: 1.5, label: '1.5' },
                    { val: 2.0, label: '2.0' },
                    { val: 3.0, label: '3.0', sub: 'Max' }
                  ].map((preset) => {
                    const isActive = Math.abs(playbackSpeed - preset.val) < 0.01;
                    return (
                      <button
                        key={preset.val}
                        onClick={() => updateSpeed(preset.val)}
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          borderRadius: '20px',
                          background: isActive ? '#059669' : 'rgba(255,255,255,0.1)',
                          color: '#ffffff',
                          border: isActive ? '1px solid #34d399' : '1px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 800 }}>{preset.label}x</div>
                        {preset.sub && <div style={{ fontSize: '9px', opacity: 0.8, textTransform: 'uppercase' }}>{preset.sub}</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Optional Article Cover Media (Video or Image) */}
        {activeArticle.coverMediaType === 'video' && activeArticle.videoUrl ? (
          <div className="article-modal-hero-img-container" style={{ width: activeArticle.coverWidth || '100%', margin: '0 auto 24px auto' }}>
            {/(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(activeArticle.videoUrl) ? (
              <div style={{ width: '100%', height: activeArticle.coverHeight || '420px', borderRadius: 'var(--radius-md)', overflow: 'hidden', ...activeArticle.coverCropStyle }}>
                <iframe
                  src={activeArticle.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  title="Cover Video"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <video 
                src={activeArticle.videoUrl} 
                controls
                autoPlay
                muted
                loop
                playsInline
                className="article-modal-hero-img"
                style={{
                  maxHeight: activeArticle.coverHeight === 'auto' ? 'none' : (activeArticle.coverHeight || '480px'),
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                  display: 'block',
                  ...activeArticle.coverCropStyle
                }}
              />
            )}
            {activeArticle.imageCaption && (
              <div className="article-modal-img-caption" dir={isRtl ? 'rtl' : 'ltr'}>
                {activeArticle.imageCaption}
              </div>
            )}
          </div>
        ) : (activeArticle.imageUrl && (
          <div className="article-modal-hero-img-container" style={{ width: activeArticle.coverWidth || '100%', margin: '0 auto 24px auto' }}>
            <img 
              src={activeArticle.imageUrl} 
              alt={activeArticle.title} 
              className="article-modal-hero-img"
              style={{
                maxHeight: activeArticle.coverHeight === 'auto' ? 'none' : (activeArticle.coverHeight || '480px'),
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)',
                display: 'block',
                ...activeArticle.coverCropStyle
              }}
            />
            {activeArticle.imageCaption && (
              <div className="article-modal-img-caption" dir={isRtl ? 'rtl' : 'ltr'}>
                {activeArticle.imageCaption}
              </div>
            )}
          </div>
        ))}

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
                  Deep Dives 💎 Member Exclusive
                </h3>
                <p style={{ fontSize: '14px', color: '#555', maxWidth: '460px', marginBottom: '18px', lineHeight: 1.45 }}>
                  This investigative report and raw dataset are restricted to registered Daily Brief members. Please log in or sign up to continue reading.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    onClick={onOpenLogin}
                    style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '12px 24px', fontWeight: 800, fontSize: '14px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Lock size={16} />
                    <span>Log In to Unlock Story</span>
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
                    <span>1-Click Free Member Access</span>
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
