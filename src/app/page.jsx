'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Volume2, 
  ArrowUpRight, 
  Sparkles, 
  TrendingUp, 
  Bookmark, 
  Share2, 
  Compass, 
  Flame, 
  Lock,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Megaphone,
  ExternalLink,
  Clock,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Award,
  Globe,
  DollarSign,
  Layers,
  Cpu,
  BookOpen,
  Hash
} from 'lucide-react';
import { 
  BREAKING_NEWS,
  HERO_FEATURED as FALLBACK_HERO_FEATURED, 
  HERO_SECONDARY as FALLBACK_HERO_SECONDARY, 
  MAIN_ARTICLES as FALLBACK_MAIN_ARTICLES, 
  MOST_READ as FALLBACK_MOST_READ, 
  DEEP_DIVES as FALLBACK_DEEP_DIVES 
} from '../data/newsData';
import { ArticleModal } from '../components/ArticleModal';
import { LoginModal } from '../components/LoginModal';
import { CrestLogo } from '../components/CrestLogo';
import { formatCoverMediaEmbedUrl, formatCoverImageUrl, parseGoogleDriveUrl, isArticleCoverVideo, getArticleCoverVideoUrl, getDefaultArticleImage } from '../lib/videoUtils';
import ContinuousCoverVideo from '../components/ContinuousCoverVideo';
import ArticleMediaCover from '../components/ArticleMediaCover';
import LiveAdSlot, { slotMatchesAd } from '../components/LiveAdSlot';
import { useTranslation } from '../context/TranslationContext';

// Instant 0-1ms In-Memory & Local Storage Cache Singletons
let globalMemoryArticles = null;
let globalMemoryAds = null;
let globalMemorySections = null;

const EDITORIAL_OPINION_STATIC = {
  title: "The Architecture of Sovereign Autonomy in an Era of Multipolar Fractures",
  deck: "Why independent institutional capacity and domestic silicon manufacturing constitute the genuine pillars of national security."
};

const FAST_NEWS_WIRES_STATIC = [
  { time: "14 MINS AGO", text: "Reserve Bank maintains repo rate policy stance amid food inflation monitoring." },
  { time: "28 MINS AGO", text: "Cabinet Committee approves ₹76,000 Cr incentive outlay for semiconductor fab assembly." },
  { time: "42 MINS AGO", text: "ISRO launches third ocean surveillance payload aboard upgraded GSLV rocket." },
  { time: "1 HOUR AGO", text: "Bilateral energy agreements concluded for green hydrogen corridor to Europe." }
];

const SPONSORED_SHOWCASE_STATIC = {
  title: "Apex Sovereign Asset Management: Q3 Global Macro Outlook Report",
  subtitle: "Explore institutional research on infrastructure yields ↗"
};

const getInstantCache = (key, fallback = []) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return fallback;
};

export const getCategorySlug = (category) => {
  if (!category) return 'top-stories';
  const c = String(category).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (c.includes('tech') || c.includes('ai')) return 'tech';
  if (c.includes('global') || c.includes('world') || c.includes('nation')) return 'global';
  if (c.includes('market') || c.includes('econom') || c.includes('credit') || c.includes('business')) return 'markets';
  if (c.includes('science') || c.includes('climate')) return 'science';
  if (c.includes('movie') || c.includes('entertainment')) return 'movies';
  if (c.includes('life') || c.includes('style') || c.includes('design')) return 'lifestyle';
  if (c.includes('sport')) return 'sports';
  if (c.includes('opinion') || c.includes('editorial') || c.includes('essay')) return 'opinion';
  if (c.includes('culture')) return 'culture';
  if (c.includes('deep') || c.includes('dive') || c.includes('investig')) return 'deep-dives';
  return 'top-stories';
};

export default function HomePage() {
  const [dbArticles, setDbArticles] = useState([]);
  const [translatedArticles, setTranslatedArticles] = useState(null);
  const [translatedDeepDives, setTranslatedDeepDives] = useState(null);
  const [translatedBreakingNews, setTranslatedBreakingNews] = useState(null);
  const [translatedWires, setTranslatedWires] = useState(null);
  const [translatedOpinion, setTranslatedOpinion] = useState(null);
  const [translatedSponsor, setTranslatedSponsor] = useState(null);

  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { 
    language, 
    t, 
    getSynchronousArticle, 
    getSynchronousArticleList, 
    translateMultipleArticles, 
    translateDeepDives, 
    translateBatch, 
    isTranslating 
  } = useTranslation();

  const [homepageAds, setHomepageAds] = useState([]);
  const [homepageArticleSections, setHomepageArticleSections] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideIndices, setSlideIndices] = useState({});

  // Financial & Currency Converter State
  const [convAmount, setConvAmount] = useState('1000');
  const [convFrom, setConvFrom] = useState('USD');
  const [convTo, setConvTo] = useState('INR');
  const [convResult, setConvResult] = useState('83,900.00');

  // Top Mutual Funds Tab
  const [activeMfTab, setActiveMfTab] = useState('Equity');

  // Breaking ticker index
  const [breakingIndex, setBreakingIndex] = useState(0);

  // Top Stories auto-sliding carousel state (2-second hold, infinite loop)
  const [topStoriesSlideIndex, setTopStoriesSlideIndex] = useState(0);

  // Fetch live articles from database (published only) with SWR background caching
  const fetchLiveArticles = async () => {
    try {
      const res = await fetch('/api/db/articles');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        const publishedOnly = json.data.filter(a => a.status === 'Published');
        globalMemoryArticles = publishedOnly;
        try {
          localStorage.setItem('daily_brief_cached_articles_v3', JSON.stringify(publishedOnly));
        } catch (e) {}
        setDbArticles(prev => {
          if (JSON.stringify(prev) === JSON.stringify(publishedOnly)) return prev;
          return publishedOnly;
        });
      }
    } catch (err) {
      console.warn("Failed to fetch live database articles:", err?.message || err);
    }
  };

  const fetchHomepageAds = async () => {
    try {
      const res = await fetch('/api/db/homepage-ads');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        globalMemoryAds = json.data;
        try {
          localStorage.setItem('daily_brief_cached_ads_v3', JSON.stringify(json.data));
        } catch (e) {}
        setHomepageAds(prev => {
          if (JSON.stringify(prev) === JSON.stringify(json.data)) return prev;
          return json.data;
        });
      }
    } catch (err) {
      console.warn("Failed to fetch homepage ads:", err?.message || err);
    }
  };

  const fetchHomepageArticlePlacements = async () => {
    try {
      const res = await fetch('/api/db/homepage-articles');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        globalMemorySections = json.data;
        try {
          localStorage.setItem('daily_brief_cached_sections_v3', JSON.stringify(json.data));
        } catch (e) {}
        setHomepageArticleSections(prev => {
          if (JSON.stringify(prev) === JSON.stringify(json.data)) return prev;
          return json.data;
        });
      }
    } catch (err) {
      console.warn("Failed to fetch homepage article placements:", err?.message || err);
    }
  };

  useEffect(() => {
    // 1. Instant 0ms hydration from cache on client mount
    try {
      const cachedArticles = globalMemoryArticles || getInstantCache('daily_brief_cached_articles_v3', null);
      if (cachedArticles && cachedArticles.length > 0) {
        setDbArticles(cachedArticles);
      }
      const cachedAds = globalMemoryAds || getInstantCache('daily_brief_cached_ads_v3', null);
      if (cachedAds && cachedAds.length > 0) {
        setHomepageAds(cachedAds);
      }
      const cachedSections = globalMemorySections || getInstantCache('daily_brief_cached_sections_v3', null);
      if (cachedSections && cachedSections.length > 0) {
        setHomepageArticleSections(cachedSections);
      }
    } catch (e) {}

    // 2. Fetch live data
    fetchLiveArticles().catch(() => {});
    fetchHomepageAds().catch(() => {});
    fetchHomepageArticlePlacements().catch(() => {});

    // Fast 6s background polling
    const interval = setInterval(() => {
      fetchLiveArticles().catch(() => {});
      fetchHomepageAds().catch(() => {});
      fetchHomepageArticlePlacements().catch(() => {});
    }, 6000);

    // Instant sync on tab focus or visibility return
    const handleFocus = () => {
      fetchLiveArticles().catch(() => {});
      fetchHomepageAds().catch(() => {});
      fetchHomepageArticlePlacements().catch(() => {});
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveArticles().catch(() => {});
        fetchHomepageAds().catch(() => {});
        fetchHomepageArticlePlacements().catch(() => {});
      }
    };
    const handleStorage = (e) => {
      if (e.key === 'daily_brief_cached_ads_v3' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setHomepageAds(parsed);
        } catch (err) {}
      }
      if (e.key === 'daily_brief_cached_sections_v3' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setHomepageArticleSections(parsed);
        } catch (err) {}
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Breaking News ticker rotator
  useEffect(() => {
    const timer = setInterval(() => {
      setBreakingIndex(prev => (prev + 1) % (BREAKING_NEWS.length || 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Top Stories continuous auto-sliding carousel & template 1 slide rotations
  useEffect(() => {
    const timer = setInterval(() => {
      setTopStoriesSlideIndex(prev => prev + 1);
      setSlideIndices(prev => {
        const next = { ...prev };
        if (Array.isArray(homepageArticleSections)) {
          homepageArticleSections.forEach(inst => {
            if (inst && inst.templateType === 'hero_lead') {
              const slideCount = Array.isArray(inst.slides) && inst.slides.length > 0 
                ? inst.slides.length 
                : (Array.isArray(inst.slideStories) && inst.slideStories.length > 0 ? inst.slideStories.length : 1);
              if (slideCount > 1) {
                const current = next[inst.instanceId] || 0;
                next[inst.instanceId] = (current + 1) % slideCount;
              }
            }
          });
        }
        return next;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [homepageArticleSections]);

  const isDeepDiveArticle = (a) => {
    if (!a) return false;
    const cat = (a.category || '').toLowerCase();
    const id = (a.id || '').toLowerCase();
    return id.startsWith('deep-dive-') || cat.includes('deep dive') || cat === 'special investigations' || (cat === 'investigation' && id.startsWith('deep-dive-'));
  };

  // Merge database articles with fallbacks and all homepage placement sections
  const combinedArticlesPool = useMemo(() => {
    const baseList = Array.isArray(dbArticles) && dbArticles.length > 0 ? dbArticles : [];
    const fallbacks = [FALLBACK_HERO_FEATURED, ...FALLBACK_HERO_SECONDARY, ...FALLBACK_MAIN_ARTICLES];

    // Extract all articles and stories embedded inside homepage placement builder instances
    const sectionArticles = [];
    if (Array.isArray(homepageArticleSections)) {
      homepageArticleSections.forEach(inst => {
        if (!inst || inst.enabled === false) return;
        if (inst.mainStory) sectionArticles.push(inst.mainStory);
        if (Array.isArray(inst.subStories)) sectionArticles.push(...inst.subStories);
        if (Array.isArray(inst.slides)) sectionArticles.push(...inst.slides);
        if (Array.isArray(inst.slideStories)) sectionArticles.push(...inst.slideStories);
        if (Array.isArray(inst.stories)) sectionArticles.push(...inst.stories);
      });
    }

    const seenIds = new Set();
    const seenTitles = new Set();
    const merged = [];

    [...sectionArticles, ...baseList, ...fallbacks].forEach(item => {
      if (!item) return;
      const id = item.id || '';
      const title = (item.title || '').trim().toLowerCase();
      if ((id && seenIds.has(id)) || (title && seenTitles.has(title))) return;
      if (id) seenIds.add(id);
      if (title) seenTitles.add(title);
      merged.push(item);
    });

    return merged;
  }, [dbArticles, homepageArticleSections]);

  // Handle translation when articles, deep dives, wires, breaking news, or language change
  useEffect(() => {
    let isMounted = true;
    if (language === 'en') {
      setTranslatedArticles(null);
      setTranslatedDeepDives(null);
      setTranslatedBreakingNews(null);
      setTranslatedWires(null);
      setTranslatedOpinion(null);
      setTranslatedSponsor(null);
      return;
    }

    if (combinedArticlesPool.length > 0) {
      translateMultipleArticles(combinedArticlesPool, language).then(translated => {
        if (isMounted && translated) setTranslatedArticles(translated);
      });
    }

    if (FALLBACK_DEEP_DIVES && FALLBACK_DEEP_DIVES.length > 0) {
      translateDeepDives(FALLBACK_DEEP_DIVES, language).then(translated => {
        if (isMounted && translated) setTranslatedDeepDives(translated);
      });
    }

    if (BREAKING_NEWS && BREAKING_NEWS.length > 0) {
      translateBatch(BREAKING_NEWS, language).then(translated => {
        if (isMounted && translated) setTranslatedBreakingNews(translated);
      });
    }

    // Translate wires from placement builder or fallback
    const opInst = Array.isArray(homepageArticleSections) 
      ? homepageArticleSections.find(s => s && s.enabled !== false && (s.sectionRegion === 'hero_col3' || s.templateType === 'opinion'))
      : null;

    const wireItems = opInst?.intelligenceStream?.items && Array.isArray(opInst.intelligenceStream.items) && opInst.intelligenceStream.items.length > 0
      ? opInst.intelligenceStream.items.map(w => w.text)
      : FAST_NEWS_WIRES_STATIC.map(w => w.text);

    translateBatch(wireItems, language).then(translated => {
      if (isMounted && translated) {
        const rawList = opInst?.intelligenceStream?.items && Array.isArray(opInst.intelligenceStream.items) && opInst.intelligenceStream.items.length > 0
          ? opInst.intelligenceStream.items
          : FAST_NEWS_WIRES_STATIC;
        const mapped = rawList.map((w, idx) => ({
          time: t(w.time),
          text: translated[idx] || w.text
        }));
        setTranslatedWires(mapped);
      }
    });

    // Translate opinion box from placement builder or fallback
    const opinionTitle = opInst?.editorialOpinion?.title || EDITORIAL_OPINION_STATIC.title;
    const opinionDeck = opInst?.editorialOpinion?.deck || opInst?.editorialOpinion?.content || EDITORIAL_OPINION_STATIC.deck;

    translateBatch([opinionTitle, opinionDeck], language).then(translated => {
      if (isMounted && translated) {
        setTranslatedOpinion({
          title: translated[0] || opinionTitle,
          deck: translated[1] || opinionDeck
        });
      }
    });

    // Translate sponsored showcase from placement builder or fallback
    const sponsorTitle = opInst?.sponsoredShowcase?.headline || opInst?.sponsoredShowcase?.title || SPONSORED_SHOWCASE_STATIC.title;
    const sponsorSubtitle = opInst?.sponsoredShowcase?.subtext || opInst?.sponsoredShowcase?.subtitle || SPONSORED_SHOWCASE_STATIC.subtitle;

    translateBatch([sponsorTitle, sponsorSubtitle], language).then(translated => {
      if (isMounted && translated) {
        setTranslatedSponsor({
          title: translated[0] || sponsorTitle,
          subtitle: translated[1] || sponsorSubtitle
        });
      }
    });

    return () => { isMounted = false; };
  }, [combinedArticlesPool, language, translateMultipleArticles, translateDeepDives, translateBatch, t, homepageArticleSections]);

  const activeArticles = useMemo(() => {
    const rawPool = combinedArticlesPool.filter(a => !isDeepDiveArticle(a));
    if (language === 'en') return rawPool;
    if (translatedArticles && translatedArticles.length > 0) {
      return translatedArticles.filter(a => !isDeepDiveArticle(a));
    }
    return getSynchronousArticleList(rawPool, language);
  }, [combinedArticlesPool, language, translatedArticles, getSynchronousArticleList]);

  const activeDeepDives = useMemo(() => {
    if (language === 'en') return FALLBACK_DEEP_DIVES;
    if (translatedDeepDives && translatedDeepDives.length > 0) return translatedDeepDives;
    return getSynchronousArticleList(FALLBACK_DEEP_DIVES, language);
  }, [language, translatedDeepDives, getSynchronousArticleList]);

  const activeBreakingNews = useMemo(() => {
    if (language === 'en') return BREAKING_NEWS;
    if (translatedBreakingNews && translatedBreakingNews.length > 0) return translatedBreakingNews;
    return BREAKING_NEWS.map(b => t(b));
  }, [language, translatedBreakingNews, t]);

  // Helper to find placed template instance by region or type
  const getInstanceForRegion = (regionId, templateType = null) => {
    if (!Array.isArray(homepageArticleSections)) return null;
    return homepageArticleSections.find(s => {
      if (!s || s.enabled === false) return false;
      if (s.sectionRegion === regionId) return true;
      if (templateType && s.templateType === templateType) return true;
      if (regionId === 'hero_col1' && (s.column === 'left' || s.templateType === 'hero_lead')) return true;
      if (regionId === 'hero_col2' && (s.column === 'center' || s.templateType === 'hero_second_lead' || s.templateType === 'hero_stacked')) return true;
      if (regionId === 'hero_col3' && (s.column === 'right' || s.templateType === 'opinion')) return true;
      return false;
    });
  };

  // Helper to find all placed template instances in a specific hero column
  const getInstancesForColumn = (regionId) => {
    if (!Array.isArray(homepageArticleSections) || homepageArticleSections.length === 0) {
      if (regionId === 'hero_col1') return [{ instanceId: 'default-hero-lead', templateType: 'hero_lead', sectionRegion: 'hero_col1' }];
      if (regionId === 'hero_col2') return [
        { instanceId: 'default-second-lead', templateType: 'hero_second_lead', sectionRegion: 'hero_col2' },
        { instanceId: 'default-stacked', templateType: 'hero_stacked', sectionRegion: 'hero_col2' }
      ];
      if (regionId === 'hero_col3') return [{ instanceId: 'default-opinion', templateType: 'opinion', sectionRegion: 'hero_col3' }];
      return [];
    }

    const matched = homepageArticleSections.filter(i => {
      if (!i || i.enabled === false) return false;
      if (i.sectionRegion === regionId) return true;
      if (!i.sectionRegion) {
        if (regionId === 'hero_col1' && (i.column === 'left' || i.templateType === 'hero_lead')) return true;
        if (regionId === 'hero_col2' && (i.column === 'center' || i.templateType === 'hero_second_lead' || i.templateType === 'hero_stacked')) return true;
        if (regionId === 'hero_col3' && (i.column === 'right' || i.templateType === 'opinion')) return true;
      }
      return false;
    });

    if (matched.length > 0) return matched;

    // Fallback if that specific column is empty
    if (regionId === 'hero_col1') return [{ instanceId: 'default-hero-lead', templateType: 'hero_lead', sectionRegion: 'hero_col1' }];
    if (regionId === 'hero_col2') return [
      { instanceId: 'default-second-lead', templateType: 'hero_second_lead', sectionRegion: 'hero_col2' },
      { instanceId: 'default-stacked', templateType: 'hero_stacked', sectionRegion: 'hero_col2' }
    ];
    if (regionId === 'hero_col3') return [{ instanceId: 'default-opinion', templateType: 'opinion', sectionRegion: 'hero_col3' }];
    return [];
  };

  const activeOpinion = useMemo(() => {
    const inst = getInstanceForRegion('hero_col3', 'opinion');
    const rawTitle = inst?.editorialOpinion?.title || EDITORIAL_OPINION_STATIC.title;
    const rawDeck = inst?.editorialOpinion?.deck || inst?.editorialOpinion?.content || EDITORIAL_OPINION_STATIC.deck;

    if (language === 'en') {
      return { title: rawTitle, deck: rawDeck };
    }
    if (translatedOpinion && translatedOpinion.title) return translatedOpinion;
    return {
      title: t(rawTitle),
      deck: t(rawDeck)
    };
  }, [language, translatedOpinion, t, homepageArticleSections]);

  const activeWires = useMemo(() => {
    const inst = getInstanceForRegion('hero_col3', 'opinion');
    const rawItems = inst?.intelligenceStream?.items && Array.isArray(inst.intelligenceStream.items) && inst.intelligenceStream.items.length > 0
      ? inst.intelligenceStream.items
      : FAST_NEWS_WIRES_STATIC;

    if (language === 'en') {
      return rawItems.map(w => ({ time: w.time, text: w.text }));
    }
    if (translatedWires && translatedWires.length > 0) return translatedWires;
    return rawItems.map(w => ({
      time: t(w.time),
      text: t(w.text)
    }));
  }, [language, translatedWires, t, homepageArticleSections]);

  const activeSponsor = useMemo(() => {
    const inst = getInstanceForRegion('hero_col3', 'opinion');
    const rawTitle = inst?.sponsoredShowcase?.headline || inst?.sponsoredShowcase?.title || SPONSORED_SHOWCASE_STATIC.title;
    const rawSub = inst?.sponsoredShowcase?.subtext || inst?.sponsoredShowcase?.subtitle || SPONSORED_SHOWCASE_STATIC.subtitle;

    if (language === 'en') {
      return { title: rawTitle, subtitle: rawSub };
    }
    if (translatedSponsor && translatedSponsor.title) return translatedSponsor;
    return {
      title: t(rawTitle),
      subtitle: t(rawSub)
    };
  }, [language, translatedSponsor, t, homepageArticleSections]);

  // Helper to get configuration for a homepage editorial zone
  const getZoneConfig = (zoneId) => {
    return (homepageArticleSections || []).find(s => s && (s.id === zoneId || s.instanceId === zoneId || s.sectionRegion === zoneId));
  };

  // Safe helper to enrich article stub with full master database record and instant synchronous translation
  const enrichArticle = (art) => {
    if (!art) return art;
    const baseArt = language !== 'en' ? getSynchronousArticle(art, language) : art;

    const rawTitle = (art.originalTitle || art.title || '').trim().toLowerCase();
    const match = (activeArticles || []).find(a => 
      (art.id && a.id === art.id) || 
      (rawTitle && ((a.originalTitle && a.originalTitle.trim().toLowerCase() === rawTitle) || (a.title && a.title.trim().toLowerCase() === rawTitle)))
    ) || (dbArticles || []).find(a => 
      (art.id && a.id === art.id) || 
      (rawTitle && (a.title && a.title.trim().toLowerCase() === rawTitle))
    );

    if (match) {
      const translatedMatch = language !== 'en' ? getSynchronousArticle(match, language) : match;
      return { ...baseArt, ...translatedMatch };
    }
    return baseArt;
  };

  // Safe handler to open modal with full hydrated article
  const handleOpenArticle = (story) => {
    if (!story) return;
    const full = enrichArticle(story);
    setSelectedArticle(full);
  };

  // Helper to dynamically resolve articles for a zone or template instance
  const resolveZoneArticles = (zoneOrId, defaultCategory = 'all', defaultCount = 6) => {
    // Check if zoneOrId maps to a template instance with concrete stories
    const inst = typeof zoneOrId === 'string' ? (getInstanceForRegion(zoneOrId) || getZoneConfig(zoneOrId)) : zoneOrId;

    if (inst) {
      if (Array.isArray(inst.slides) && inst.slides.length > 0) {
        return inst.slides.map(enrichArticle);
      }
      if (Array.isArray(inst.slideStories) && inst.slideStories.length > 0) {
        return inst.slideStories.map(enrichArticle);
      }
      if (Array.isArray(inst.stories) && inst.stories.length > 0) {
        return inst.stories.map(enrichArticle);
      }
      if (inst.mainStory) {
        const pool = [inst.mainStory, ...(Array.isArray(inst.subStories) ? inst.subStories : [])].map(enrichArticle);
        if (pool.length >= defaultCount) return pool.slice(0, defaultCount);
        
        // Fill remaining with category-matched articles
        const seen = new Set(pool.map(a => a.id || a.title));
        const filled = [...pool];
        for (const a of activeArticles) {
          if (!seen.has(a.id) && !seen.has(a.title) && filled.length < defaultCount) {
            filled.push(a);
            seen.add(a.id);
          }
        }
        return filled.slice(0, defaultCount);
      }
    }

    const config = inst;
    const count = config?.itemCount || defaultCount;

    // 1. Multi-Pinned or Single Pinned Story Mode
    if (config?.selectionMode === 'manual') {
      if (Array.isArray(config?.pinnedArticles) && config.pinnedArticles.length > 0) {
        const pinnedList = [];
        const pinnedIds = new Set();
        config.pinnedArticles.forEach(pa => {
          const found = activeArticles.find(a => a.id === (pa.id || pa));
          if (found) {
            pinnedList.push(found);
            pinnedIds.add(found.id);
          } else if (typeof pa === 'object' && pa.title) {
            pinnedList.push(enrichArticle(pa));
            if (pa.id) pinnedIds.add(pa.id);
          }
        });
        if (pinnedList.length > 0) {
          if (pinnedList.length >= count) return pinnedList.slice(0, count);
          const remaining = activeArticles.filter(a => !pinnedIds.has(a.id));
          return [...pinnedList, ...remaining].slice(0, count);
        }
      } else if (config?.pinnedArticleId) {
        const pinned = activeArticles.find(a => a.id === config.pinnedArticleId);
        if (pinned) {
          const remaining = activeArticles.filter(a => a.id !== pinned.id);
          return [pinned, ...remaining].slice(0, count);
        }
      }
    }

    // 2. Multi-Category or Single Category Filter Mode
    const rawCategories = Array.isArray(config?.categories) && config.categories.length > 0
      ? config.categories
      : [config?.category || defaultCategory || 'all'];

    const targetCategories = rawCategories.map(c => (c || 'all').toLowerCase().trim());
    if (targetCategories.includes('all') || targetCategories.includes('top stories')) {
      return activeArticles.slice(0, count).map(enrichArticle);
    }

    const matchesCategory = (artCat, targetCat) => {
      const c = (artCat || '').toLowerCase().trim();
      return c === targetCat || c.includes(targetCat) || targetCat.includes(c) ||
             (targetCat.includes('global') && (c.includes('global') || c.includes('world') || c.includes('nation') || c.includes('policy') || c.includes('diplomacy'))) ||
             (targetCat.includes('nation') && (c.includes('nation') || c.includes('india') || c.includes('policy') || c.includes('affair') || c.includes('govern') || c.includes('credit'))) ||
             (targetCat.includes('india') && (c.includes('india') || c.includes('nation') || c.includes('policy') || c.includes('govern'))) ||
             (targetCat.includes('market') && (c.includes('market') || c.includes('econom') || c.includes('credit') || c.includes('business') || c.includes('finan'))) ||
             (targetCat.includes('credit') && (c.includes('credit') || c.includes('bank') || c.includes('market') || c.includes('econom') || c.includes('finan'))) ||
             (targetCat.includes('tech') && (c.includes('tech') || c.includes('ai') || c.includes('compute') || c.includes('silicon'))) ||
             (targetCat.includes('science') && (c.includes('science') || c.includes('climate') || c.includes('space') || c.includes('energy')));
    };

    const filtered = activeArticles.filter(a => {
      return targetCategories.some(tc => matchesCategory(a.category, tc));
    });

    if (filtered.length > 0) {
      if (filtered.length < count) {
        const seen = new Set(filtered.map(a => a.id));
        const filled = [...filtered];
        for (const a of activeArticles) {
          if (!seen.has(a.id) && filled.length < count) {
            filled.push(a);
            seen.add(a.id);
          }
        }
        return filled.slice(0, count).map(enrichArticle);
      }
      return filtered.slice(0, count).map(enrichArticle);
    }

    return activeArticles.slice(0, count).map(enrichArticle);
  };

  // Top Stories Auto-sliding Carousel Pool (resolves Top Stories from Template 1 / Hero Lead Stage)
  const topStoriesList = useMemo(() => {
    // 1. Priority: Placed Template 1 (Hero Lead Stage) with multi-slide carousel
    const heroInst = getInstanceForRegion('hero_col1', 'hero_lead');
    if (heroInst) {
      if (Array.isArray(heroInst.slides) && heroInst.slides.length > 0) {
        return heroInst.slides.map(enrichArticle);
      }
      if (Array.isArray(heroInst.slideStories) && heroInst.slideStories.length > 0) {
        return heroInst.slideStories.map(enrichArticle);
      }
      if (heroInst.mainStory) {
        return [heroInst.mainStory, ...(Array.isArray(heroInst.subStories) ? heroInst.subStories : [])].map(enrichArticle);
      }
    }

    // 2. Legacy zone configuration
    const leadConfig = getZoneConfig('zone-hero-lead');
    if (leadConfig?.selectionMode === 'manual' && leadConfig?.pinnedArticleId) {
      const pinned = activeArticles.find(a => a.id === leadConfig.pinnedArticleId);
      if (pinned) {
        const remaining = activeArticles.filter(a => a.id !== pinned.id).slice(0, 4);
        return [pinned, ...remaining].map(enrichArticle);
      }
    }
    const resolved = resolveZoneArticles('zone-hero-lead', 'All', 5);
    if (Array.isArray(resolved) && resolved.length >= 2) return resolved.map(enrichArticle);
    if (activeArticles.length >= 2) return activeArticles.slice(0, 5).map(enrichArticle);
    return [FALLBACK_HERO_FEATURED, ...FALLBACK_HERO_SECONDARY.slice(0, 4)];
  }, [activeArticles, homepageArticleSections]);

  const currentHeroIndex = topStoriesList.length > 0 ? (topStoriesSlideIndex % topStoriesList.length) : 0;

  // Sub-Stories below the Hero Lead Stage
  const heroSubStories = useMemo(() => {
    const heroInst = getInstanceForRegion('hero_col1', 'hero_lead');
    if (heroInst && Array.isArray(heroInst.subStories) && heroInst.subStories.length >= 2) {
      return heroInst.subStories.map(enrichArticle);
    }
    return [
      resolveZoneArticles('zone-hero-sub-1', 'All', 1)[0] || activeArticles[2] || FALLBACK_HERO_SECONDARY[1],
      resolveZoneArticles('zone-hero-sub-2', 'All', 1)[0] || activeArticles[3] || FALLBACK_HERO_SECONDARY[2]
    ].map(enrichArticle);
  }, [homepageArticleSections, activeArticles]);

  const leadStory = topStoriesList[currentHeroIndex] || topStoriesList[0] || activeArticles[0] || FALLBACK_HERO_FEATURED;
  
  // Second Lead Story (Column 2 Top Feature)
  const secondLead = useMemo(() => {
    const secInst = getInstanceForRegion('hero_col2', 'hero_second_lead');
    if (secInst && secInst.mainStory) {
      return enrichArticle(secInst.mainStory);
    }
    return resolveZoneArticles('zone-hero-second-lead', 'All', 1)[0] || activeArticles[1] || FALLBACK_HERO_SECONDARY[0] || FALLBACK_HERO_FEATURED;
  }, [homepageArticleSections, activeArticles]);

  const subLead1 = heroSubStories[0] || activeArticles[2] || FALLBACK_HERO_SECONDARY[1];
  const subLead2 = heroSubStories[1] || activeArticles[3] || FALLBACK_HERO_SECONDARY[2];

  // Stacked News Feed (Column 2 Bottom Stack)
  const heroStackedStories = useMemo(() => {
    const stackInst = getInstanceForRegion('hero_col2', 'hero_stacked');
    if (stackInst && Array.isArray(stackInst.stories) && stackInst.stories.length > 0) {
      return stackInst.stories.map(enrichArticle);
    }
    return resolveZoneArticles('zone-hero-stacked', 'All', 3);
  }, [homepageArticleSections, activeArticles]);

  const subLead3 = heroStackedStories[0] || activeArticles[4] || FALLBACK_HERO_SECONDARY[3];
  const subLead4 = heroStackedStories[1] || activeArticles[5] || FALLBACK_MAIN_ARTICLES[0];
  const subLead5 = heroStackedStories[2] || activeArticles[6] || FALLBACK_MAIN_ARTICLES[1];

  // Dynamic Department pools based on Admin Homepage Article Placement
  const band1Stories = useMemo(() => {
    return resolveZoneArticles('national_global', 'National Affairs', 6);
  }, [homepageArticleSections, activeArticles]);

  const band2Stories = useMemo(() => {
    return resolveZoneArticles('world_geopolitics', 'World & Geopolitics', 6);
  }, [homepageArticleSections, activeArticles]);

  const businessStories = useMemo(() => {
    return resolveZoneArticles('markets_economy', 'Markets & Economy', 6);
  }, [homepageArticleSections, activeArticles]);

  const techStories = useMemo(() => {
    return resolveZoneArticles('tech_ai', 'Tech & AI', 6);
  }, [homepageArticleSections, activeArticles]);

  const forYouStories = useMemo(() => {
    return (activeArticles.length >= 8 ? activeArticles.slice(4, 8) : FALLBACK_MAIN_ARTICLES.slice(0, 4)).map(enrichArticle);
  }, [activeArticles]);

  // Custom user-created dynamic blocks from admin
  const customDynamicSections = useMemo(() => {
    if (!Array.isArray(homepageArticleSections)) return [];
    return homepageArticleSections.filter(s => s && typeof s.id === 'string' && s.id.startsWith('zone-custom-') && s.enabled !== false);
  }, [homepageArticleSections]);

  const isRtl = ['ar', 'he', 'fa', 'ur'].includes(language);

  // Currency Converter calculation
  const handleCurrencyConvert = () => {
    const val = parseFloat(convAmount) || 0;
    const ratesToINR = {
      USD: 83.90,
      EUR: 92.15,
      GBP: 108.40,
      AED: 22.84,
      JPY: 0.57,
      INR: 1.0
    };
    const inrValue = val * (ratesToINR[convFrom] || 1);
    const finalVal = inrValue / (ratesToINR[convTo] || 1);
    setConvResult(finalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleDeepDiveClick = (dive) => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
    } else {
      setSelectedArticle(dive);
    }
  };

  // Dynamic Template Renderer for all 4 Core Templates + Duplicated Copies placed in Hero Columns
  const renderFrontendHeroTemplate = (inst, idx) => {
    if (!inst) return null;
    const type = inst.templateType || 'hero_second_lead';

    // 1. Template 1: Dominant Hero Lead Stage with Sliding Carousel + 2 Sub-stories
    if (type === 'hero_lead') {
      const rawSlides = Array.isArray(inst.slides) && inst.slides.length > 0
        ? inst.slides
        : (Array.isArray(inst.slideStories) && inst.slideStories.length > 0 ? inst.slideStories : [inst.mainStory || leadStory]);
      const slidesList = rawSlides.map(enrichArticle);
      const activeIdx = (slideIndices[inst.instanceId] !== undefined ? slideIndices[inst.instanceId] : currentHeroIndex) % (slidesList.length || 1);
      const currentSlide = slidesList[activeIdx] || slidesList[0];

      const rawSubs = Array.isArray(inst.subStories) && inst.subStories.length > 0
        ? inst.subStories
        : (heroSubStories && heroSubStories.length > 0 ? heroSubStories : [subLead1, subLead2].filter(Boolean));
      const subStoriesList = rawSubs.map(enrichArticle);

      return (
        <div key={inst.instanceId || `hero-lead-${idx}`} style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '20px' }}>
          {/* Top Stories Smooth Auto-Sliding Carousel */}
          <div className="hero-lead-carousel-wrapper" style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
            <div 
              className="hero-lead-carousel-track"
              style={{
                display: 'flex',
                width: '100%',
                transform: `translateX(-${activeIdx * 100}%)`,
                transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
                willChange: 'transform'
              }}
            >
              {slidesList.map((story, sIdx) => (
                <div 
                  key={`top-story-slide-${story.id || sIdx}`}
                  style={{
                    width: '100%',
                    flexShrink: 0,
                    boxSizing: 'border-box'
                  }}
                >
                  <article 
                    className="lead-story-hero-card"
                    onClick={() => handleOpenArticle(story)}
                  >
                    <div className="lead-story-img-box">
                      <ArticleMediaCover
                        article={story}
                        className="lead-story-img"
                        style={{ width: '100%', height: '100%' }}
                        priority={sIdx === 0}
                        autoPlay={true}
                        muted={true}
                        loop={true}
                        controls={false}
                        playsInline={true}
                      />
                      {story.hasAudio && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(185, 0, 20, 0.9)', color: '#ffffff', fontSize: '9.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10 }}>
                          <Volume2 size={12} />
                          <span>{t("AUDIO")}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="news-kicker">
                        {story.kicker ? t(story.kicker.toUpperCase()) : t(story.category || 'TOP STORY')}
                      </span>
                      <h1 className="lead-story-title">
                        {t(story.title)}
                      </h1>
                      <p className="lead-story-deck">
                        {t(story.summary || story.subtitle || story.excerpt)}
                      </p>
                      <div className="lead-story-byline">
                        <span>{t("By")} <strong>{story.author ? t(story.author) : t('Editorial Board')}</strong></span>
                        <span>•</span>
                        <span>{story.readTime || '4 min read'}</span>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>

          {/* Small Dotted Navigation Buttons Below Carousel */}
          {slidesList.length > 1 && (
            <div 
              className="hero-carousel-dots"
              aria-label="Top stories navigation dots"
              suppressHydrationWarning={true}
            >
              {slidesList.map((story, dotIdx) => {
                const isActive = dotIdx === activeIdx;
                return (
                  <button
                    key={`top-dot-${story.id || dotIdx}`}
                    type="button"
                    className={`hero-carousel-dot ${isActive ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSlideIndices(prev => ({ ...prev, [inst.instanceId]: dotIdx }));
                    }}
                    title={`Jump to story ${dotIdx + 1}: ${story.title || ''}`}
                    aria-label={`Jump to slide ${dotIdx + 1}`}
                    aria-current={isActive ? 'true' : undefined}
                    suppressHydrationWarning={true}
                  />
                );
              })}
            </div>
          )}

          {/* 2-Column Compact Sub-Grid below Main Lead */}
          {subStoriesList.length >= 2 && (
            <div className="hero-sub-grid-2col" style={{ marginTop: '14px' }}>
              {subStoriesList.slice(0, 2).map((sub, sIdx) => (
                <article key={sub.id || sIdx} className="sub-story-card" onClick={() => handleOpenArticle(sub)}>
                  <div style={{ width: '100%', height: '140px', overflow: 'hidden', borderRadius: '4px', background: '#000', marginBottom: '8px' }}>
                    <ArticleMediaCover
                      article={sub}
                      style={{ width: '100%', height: '100%' }}
                      priority={true}
                      autoPlay={true}
                      muted={true}
                      loop={true}
                      controls={false}
                      playsInline={true}
                    />
                  </div>
                  <span className="news-kicker" style={{ fontSize: '10px' }}>
                    {sub.kicker ? t(sub.kicker.toUpperCase()) : t(sub.category)}
                  </span>
                  <h3 className="sub-story-title">
                    {t(sub.title)}
                  </h3>
                </article>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 2. Template 2: Medium Featured Story Block (e.g. Make money in one Day!)
    if (type === 'hero_second_lead') {
      const story = enrichArticle(inst.mainStory || inst.slides?.[0] || inst.stories?.[0] || secondLead);

      return (
        <article key={inst.instanceId || `sec-lead-${idx}`} className="second-lead-card" onClick={() => handleOpenArticle(story)} style={{ marginBottom: '20px' }}>
          <div style={{ width: '100%', height: '220px', overflow: 'hidden', borderRadius: '4px', background: '#000', marginBottom: '8px' }}>
            <ArticleMediaCover
              article={story}
              style={{ width: '100%', height: '100%' }}
              priority={true}
              autoPlay={true}
              muted={true}
              loop={true}
              controls={false}
              playsInline={true}
            />
          </div>
          <span className="news-kicker">
            {story.kicker ? t(story.kicker.toUpperCase()) : t(story.category || 'FEATURED')}
          </span>
          <h2 className="second-lead-title">
            {t(story.title)}
          </h2>
          <p className="second-lead-deck">
            {t(story.summary || story.subtitle || story.excerpt)}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
              {story.author ? t(story.author) : t('Senior Correspondent')}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-crimson, #b90014)' }}>
              {t("Read Article")} →
            </span>
          </div>
        </article>
      );
    }

    // 3. Template 3: Compact Story List Block (Stacked Feed)
    if (type === 'hero_stacked') {
      const rawList = Array.isArray(inst.stories) && inst.stories.length > 0
        ? inst.stories
        : (Array.isArray(inst.subStories) && inst.subStories.length > 0 ? inst.subStories : [subLead3, subLead4, subLead5]);
      const storiesList = rawList.map(enrichArticle);

      return (
        <div key={inst.instanceId || `stacked-${idx}`} style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
          {inst.sectionTitle && (
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-crimson, #b90014)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
              {t(inst.sectionTitle)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {storiesList.filter(Boolean).map((story, sIdx) => (
              <article 
                key={`stacked-item-${story.id || sIdx}`}
                className="stacked-story-row"
                onClick={() => handleOpenArticle(story)}
              >
                <div className="stacked-story-content">
                  <span className="news-kicker" style={{ fontSize: '9.5px', marginBottom: '2px' }}>
                    {story.kicker ? t(story.kicker.toUpperCase()) : t(story.category)}
                  </span>
                  <h4 className="stacked-story-title">
                    {t(story.title)}
                  </h4>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {story.author ? t(story.author) : t('News Desk')}
                  </div>
                </div>
                <div style={{ width: '80px', height: '60px', borderRadius: '4px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                  <ArticleMediaCover
                    article={story}
                    style={{ width: '100%', height: '100%' }}
                    autoPlay={true}
                    muted={true}
                    loop={true}
                    controls={false}
                    playsInline={true}
                  />
                </div>
              </article>
            ))}
          </div>

          <Link href={`/section/${getCategorySlug(inst.categories?.[0] || 'top-stories')}`} style={{ fontSize: '11px', fontWeight: 800, color: '#b90014', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
            <span>{t("Read More Top Stories")}</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      );
    }

    // 4. Template 4: Editorial Opinion & Intelligence Rail
    if (type === 'opinion') {
      const opTitle = inst.editorialOpinion?.title || activeOpinion.title;
      const opDeck = inst.editorialOpinion?.deck || inst.editorialOpinion?.content || activeOpinion.deck;
      const opCta = inst.editorialOpinion?.ctaText || "Read Our Editorials";
      const wireList = Array.isArray(inst.intelligenceStream?.items) && inst.intelligenceStream.items.length > 0
        ? inst.intelligenceStream.items
        : activeWires;
      const sponsorTitle = inst.sponsoredShowcase?.headline || inst.sponsoredShowcase?.title || activeSponsor.title;
      const sponsorSub = inst.sponsoredShowcase?.subtext || inst.sponsoredShowcase?.subtitle || activeSponsor.subtitle;

      return (
        <div key={inst.instanceId || `opinion-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          {/* The Hindu-Style Editorial Opinion Box */}
          <div className="the-hindu-opinion-box">
            <div className="opinion-crest-header">
              <CrestLogo style={{ width: '22px', height: '22px' }} />
              <span className="opinion-crest-title">{t(inst.sectionTitle || 'EDITORIAL OPINION')}</span>
            </div>
            <h3 
              className="opinion-main-title"
              onClick={() => setSelectedArticle(leadStory)}
            >
              {t(opTitle)}
            </h3>
            <p className="opinion-deck">
              {t(opDeck)}
            </p>
            <Link href="/section/opinion" className="opinion-read-link">
              <span>{t(opCta)}</span>
              <ArrowRight size={11} />
            </Link>
          </div>

          {/* Ad Dropzone 1: Right Sidebar (Above Intelligence) - dropzone-sidebar-top */}
          {renderLiveAd('sidebar-top')}

          {/* ET-Style Fast News Timeline */}
          <div className="et-fast-news-box">
            <div className="fast-news-header">
              <span className="fast-news-title">{t(inst.intelligenceStream?.badge || "LATEST INTELLIGENCE ⚡")}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>{t(inst.intelligenceStream?.updatedLabel || "UPDATED 2M AGO")}</span>
            </div>

            <div className="fast-news-timeline">
              {wireList.map((wire, wIdx) => (
                <div key={`wire-${wIdx}`} className="fast-news-item" onClick={() => setSelectedArticle(activeArticles[wIdx % activeArticles.length] || leadStory)}>
                  <div className="fast-news-time">{t(wire.time)}</div>
                  <div className="fast-news-text">{t(wire.text)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ad Dropzone 2: Right Sidebar (Below Intelligence) - dropzone-sidebar-bottom */}
          {renderLiveAd('sidebar-bottom')}

          {/* Sponsored Partner Highlight */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '10px 12px' }}>
            <div style={{ fontSize: '9px', fontWeight: 900, color: '#b90014', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              {t(inst.sponsoredShowcase?.badge || "SPONSORED SHOWCASE")}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
              {t(sponsorTitle)}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t(sponsorSub)}
            </div>
          </div>
        </div>
      );
    }

    // 5. Custom / Dynamic section fallback
    const customStory = enrichArticle(inst.mainStory || inst.slides?.[0] || activeArticles[0]);
    return (
      <article key={inst.instanceId || `custom-${idx}`} className="second-lead-card" onClick={() => handleOpenArticle(customStory)} style={{ marginBottom: '20px' }}>
        <div style={{ width: '100%', height: '180px', overflow: 'hidden', borderRadius: '4px', background: '#000', marginBottom: '8px' }}>
          <ArticleMediaCover
            article={customStory}
            style={{ width: '100%', height: '100%' }}
            priority={true}
            autoPlay={true}
            muted={true}
            loop={true}
            controls={false}
            playsInline={true}
          />
        </div>
        <span className="news-kicker">{customStory.kicker ? t(customStory.kicker.toUpperCase()) : t(customStory.category || 'NEWS')}</span>
        <h3 className="second-lead-title">{t(customStory.title)}</h3>
        <p className="second-lead-deck">{t(customStory.summary || customStory.subtitle)}</p>
      </article>
    );
  };

  // Helper to render live ads assigned in admin portal with universal click redirection
  const renderLiveAd = (slotId) => {
    return <LiveAdSlot slotId={slotId} ads={homepageAds} />;
  };

  return (
    <main suppressHydrationWarning style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* =========================================================================
          CENTRAL NEWSPAPER EDITORIAL CONTENT COLUMN (CLEAN FULL-WIDTH LAYOUT)
          ========================================================================= */}
      <div className="newspaper-main-content-column">
        {/* =========================================================================
            ZONE 1: LIVE PROMO STRIPS (ET + THE HINDU STYLE)
            ========================================================================= */}

      {/* 1.2 Top Leaderboard Ad Slot */}
      {renderLiveAd('masthead-top')}

      {/* 1.3 ETPrime-Style Promotional Offer Strip */}
      <div className="et-promo-strip">
        <div className="et-promo-inner">
          <div className="et-promo-text-group">
            <span className="et-promo-badge">{t("PRO EDITION")}</span>
            <span className="et-promo-headline">
              {t("Gift Yourself Financial & Geopolitical Clarity with Daily Brief Prime")}
            </span>
            <span className="et-promo-timer">
              ⏱ {t("Free Trial Offer Extended For")} 04 : 12 : 38
            </span>
          </div>

          <button 
            type="button"
            onClick={() => setIsLoginOpen(true)}
            className="et-promo-btn"
          >
            <span>{t("Start Free Trial @ ₹0")}</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* 1.4 Live Breaking News Alert Wire */}
      <div className="breaking-alert-strip">
        <div className="breaking-alert-inner">
          <div className="breaking-badge">
            <span className="breaking-pulse-dot" />
            <span>{t("BREAKING WIRE")}</span>
          </div>
          <div className="breaking-headline-text">
            {activeBreakingNews[breakingIndex] || activeBreakingNews[0] || BREAKING_NEWS[0]}
          </div>
          <Link href="/edition" style={{ fontSize: '11px', fontWeight: 800, color: '#b90014', textTransform: 'uppercase', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            {t("Today's e-Paper 📰")}
          </Link>
        </div>
      </div>

      {/* 1.5 Above Hero Spotlight Ad Slot (dropzone-hero-above) */}
      {renderLiveAd('hero-above')}

      {/* =========================================================================
          ZONE 2: ABOVE-THE-FOLD HERO MULTI-COLUMN NEWSPAPER CLUSTER
          ========================================================================= */}
      {getZoneConfig('zone-hero-lead')?.enabled !== false && (
        <section className="newspaper-hero-cluster" dir={isRtl ? 'rtl' : 'ltr'}>
          {/* COLUMN 1 (42%): Placed Templates for Col 1 (Left Dominant Stage) */}
          <div className="newspaper-hero-col col-divider-right hero-dominant-col" style={{ display: 'flex', flexDirection: 'column' }}>
            {getInstancesForColumn('hero_col1').map((inst, idx) => (
              <React.Fragment key={inst.instanceId || `col1-inst-${idx}`}>
                {renderFrontendHeroTemplate(inst, idx)}
              </React.Fragment>
            ))}
          </div>

          {/* COLUMN 2 (31%): Placed Templates for Col 2 (Center Features & Stacks) */}
          <div className="newspaper-hero-col col-divider-right" style={{ display: 'flex', flexDirection: 'column' }}>
            {getInstancesForColumn('hero_col2').map((inst, idx) => (
              <React.Fragment key={inst.instanceId || `col2-inst-${idx}`}>
                {renderFrontendHeroTemplate(inst, idx)}
              </React.Fragment>
            ))}
          </div>

          {/* COLUMN 3 (27%): Placed Templates for Col 3 (Right Editorial & Intelligence Rail) */}
          <div className="newspaper-hero-col" style={{ display: 'flex', flexDirection: 'column' }}>
            {(() => {
              const col3Instances = getInstancesForColumn('hero_col3');
              const hasOpinionTemplate = col3Instances.some(inst => (inst.templateType || inst.type) === 'opinion');
              return (
                <>
                  {!hasOpinionTemplate && renderLiveAd('sidebar-top')}
                  {col3Instances.map((inst, idx) => (
                    <React.Fragment key={inst.instanceId || `col3-inst-${idx}`}>
                      {renderFrontendHeroTemplate(inst, idx)}
                    </React.Fragment>
                  ))}
                  {!hasOpinionTemplate && renderLiveAd('sidebar-bottom')}
                </>
              );
            })()}
          </div>
        </section>
      )}

      {/* =========================================================================
          ZONE 3: HIGH-IMPACT MID-PAGE LEADERBOARD AD BREAK (hero-bottom)
          ========================================================================= */}
      {renderLiveAd('hero-bottom')}

      {/* =========================================================================
          ZONE 4: SECOND MAJOR EDITORIAL BAND (NATIONAL, WORLD & MOST READ)
          ========================================================================= */}
      {(getZoneConfig('zone-band-1')?.enabled !== false || getZoneConfig('zone-band-2')?.enabled !== false) && (
        <section className="newspaper-editorial-band" dir={isRtl ? 'rtl' : 'ltr'}>
          {/* Band Col 1 (40%): National / Custom Band 1 Feature + Horizontal Story Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="section-ribbon-header" style={{ marginBottom: '8px' }}>
              <div className="section-ribbon-title">
                <span className="bar" />
                <span>{t(getZoneConfig('zone-band-1')?.sectionTitle || 'National & Global Affairs')}</span>
              </div>
              <Link href="/section/global" className="section-view-all-link">
                <span>{t("View Desk")}</span> <ArrowRight size={11} />
              </Link>
            </div>

            {band1Stories[0] && (
              <article className="lead-story-hero-card" onClick={() => handleOpenArticle(band1Stories[0])}>
                <div style={{ width: '100%', height: '200px', borderRadius: '4px', overflow: 'hidden', background: '#000', marginBottom: '8px' }}>
                  <ArticleMediaCover
                    article={band1Stories[0]}
                    style={{ width: '100%', height: '100%' }}
                    priority={true}
                    autoPlay={true}
                    muted={true}
                    loop={true}
                    controls={false}
                    playsInline={true}
                  />
                </div>
                <span className="news-kicker">{band1Stories[0].kicker ? t(band1Stories[0].kicker) : t(band1Stories[0].category || 'POLICY & INFRASTRUCTURE')}</span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }}>
                  {t(band1Stories[0].title)}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {t(band1Stories[0].summary || band1Stories[0].excerpt)}
                </p>
              </article>
            )}

            {/* Stacked Horizontal Cards */}
            {band1Stories.slice(1, 5).map((art, aIdx) => (
              <article key={`nat-art-${aIdx}`} className="stacked-story-row" onClick={() => handleOpenArticle(art)}>
                <div className="stacked-story-content">
                  <span className="news-kicker" style={{ fontSize: '9.5px' }}>{t(art.category || 'GLOBAL')}</span>
                  <h4 className="stacked-story-title">{t(art.title)}</h4>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{art.author ? t(art.author) : t('Desk')}</div>
                </div>
                <div style={{ width: '80px', height: '60px', borderRadius: '4px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                  <ArticleMediaCover
                    article={art}
                    style={{ width: '100%', height: '100%' }}
                    autoPlay={true}
                    muted={true}
                    loop={true}
                    controls={false}
                    playsInline={true}
                  />
                </div>
              </article>
            ))}
          </div>

          {/* Band Col 2 (32%): World & Geopolitics / Custom Band 2 Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="section-ribbon-header" style={{ marginBottom: '8px' }}>
              <div className="section-ribbon-title">
                <span className="bar" />
                <span>{t(getZoneConfig('zone-band-2')?.sectionTitle || 'World & Geopolitics')}</span>
              </div>
              <Link href="/section/global" className="section-view-all-link">
                <span>{t("More World")}</span> <ArrowRight size={11} />
              </Link>
            </div>

            {band2Stories.slice(0, 4).map((art, idx) => (
              <div 
                key={`world-${idx}`}
                onClick={() => handleOpenArticle(art)}
                style={{ cursor: 'pointer', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}
              >
                <span className="news-kicker" style={{ fontSize: '9.5px' }}>{t(art.category || 'GLOBAL')}</span>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, margin: '2px 0 4px' }}>
                  {t(art.title)}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {t(art.summary || art.excerpt)}
                </p>
              </div>
            ))}

            {/* Visual Feature Card */}
            {(band2Stories[4] || activeArticles[0]) && (
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => handleOpenArticle(band2Stories[4] || activeArticles[0])}>
                <div style={{ width: '100%', height: '120px', background: '#000', overflow: 'hidden' }}>
                  <ArticleMediaCover
                    article={band2Stories[4] || activeArticles[0]}
                    style={{ width: '100%', height: '100%' }}
                    autoPlay={true}
                    muted={true}
                    loop={true}
                    controls={false}
                    playsInline={true}
                  />
                </div>
                <div style={{ padding: '8px 12px' }}>
                  <span className="news-kicker" style={{ fontSize: '9.5px' }}>{t((band2Stories[4] || activeArticles[0])?.category?.toUpperCase() || 'GLOBAL SPOTLIGHT')}</span>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {t((band2Stories[4] || activeArticles[0])?.title)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Band Col 3 (28%): Most Read Today Numbered Ranking (The Hindu + ET Style) */}
          <div>
            <div className="most-read-newspaper-box">
              <div className="most-read-header">
                <Flame size={16} color="#b90014" />
                <span>{t("MOST READ TODAY")}</span>
              </div>

              {(activeArticles.length > 0 ? activeArticles.slice(0, 5) : FALLBACK_MOST_READ).map((item, idx) => (
                <div 
                  key={`rank-${item.id || idx}`} 
                  className="most-read-rank-row"
                  onClick={() => handleOpenArticle(item)}
                >
                  <span className="rank-digit">0{idx + 1}</span>
                  <div className="rank-headline-content">
                    <span className="news-kicker" style={{ fontSize: '9px', marginBottom: '1px' }}>
                      {item.category ? t(item.category.toUpperCase()) : t('NEWS')}
                    </span>
                    <div className="rank-headline-text">
                      {t(item.title)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Rail Sticky Ad Slot */}
            <div style={{ marginTop: '16px' }}>
              {renderLiveAd('sidebar-sticky')}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          ZONE 5: SECTION-BASED NEWSROOM DEPARTMENTS (INDIA, BUSINESS, TECH)
          ========================================================================= */}

      {/* 5.1 Business, Markets & Industry / Department 1 */}
      {getZoneConfig('zone-dept-1')?.enabled !== false && (
        <section className="newspaper-department-section" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="section-ribbon-header">
            <div className="section-ribbon-title">
              <span className="bar" />
              <span>{t(getZoneConfig('zone-dept-1')?.sectionTitle || 'Business, Markets & Economy')}</span>
            </div>
            <Link href="/section/markets" className="section-view-all-link">
              <span>{t("All Business News")}</span> <ArrowRight size={11} />
            </Link>
          </div>

          <div className="department-grid-4col">
            {(businessStories.length > 0 ? businessStories : activeArticles.slice(0, 4)).map((art, idx) => (
              <article key={`biz-${art.id || idx}`} className="dept-card" onClick={() => handleOpenArticle(art)}>
                <div style={{ width: '100%', height: '150px', borderRadius: '4px', overflow: 'hidden', background: '#000', marginBottom: '8px' }}>
                  <ArticleMediaCover
                    article={art}
                    style={{ width: '100%', height: '100%' }}
                    autoPlay={true}
                    muted={true}
                    loop={true}
                    controls={false}
                    playsInline={true}
                  />
                </div>
                <span className="news-kicker" style={{ fontSize: '9.5px' }}>{t(art.category || 'BUSINESS')}</span>
                <h3 className="dept-card-title">{t(art.title)}</h3>
                <div className="dept-card-byline">{art.author ? t(art.author) : t('Markets Desk')}</div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* In-Feed Native Ad Slot Break */}
      {renderLiveAd('in-feed-mid')}

      {/* 5.2 Technology, AI & Space Intelligence / Department 2 */}
      {getZoneConfig('zone-dept-2')?.enabled !== false && (
        <section className="newspaper-department-section" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="section-ribbon-header">
            <div className="section-ribbon-title">
              <span className="bar" />
              <span>{t(getZoneConfig('zone-dept-2')?.sectionTitle || 'Technology, AI & Space')}</span>
            </div>
            <Link href="/section/tech" className="section-view-all-link">
              <span>{t("Explore Tech")}</span> <ArrowRight size={11} />
            </Link>
          </div>

          <div className="department-grid-4col">
            {(techStories.length > 0 ? techStories : activeArticles.slice(2, 6)).map((art, idx) => (
              <article key={`tech-${art.id || idx}`} className="dept-card" onClick={() => handleOpenArticle(art)}>
                <div style={{ width: '100%', height: '150px', borderRadius: '4px', overflow: 'hidden', background: '#000', marginBottom: '8px' }}>
                  <ArticleMediaCover
                    article={art}
                    style={{ width: '100%', height: '100%' }}
                    autoPlay={true}
                    muted={true}
                    loop={true}
                    controls={false}
                    playsInline={true}
                  />
                </div>
                <span className="news-kicker" style={{ fontSize: '9.5px' }}>{t(art.category || 'TECH & AI')}</span>
                <h3 className="dept-card-title">{t(art.title)}</h3>
                <div className="dept-card-byline">{art.author ? t(art.author) : t('Tech Reporter')}</div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Feed Position 2 Ad Slot Break */}
      {renderLiveAd('feed-row-2')}

      {/* =========================================================================
          DYNAMIC CUSTOM MODULAR BLOCKS (ADDED BY ADMIN VIA SLOT BUILDER)
          ========================================================================= */}
      {customDynamicSections.map((customSec) => {
        const customStories = resolveZoneArticles(customSec, customSec.category, customSec.itemCount || 4);
        return (
          <section key={customSec.id} className="newspaper-department-section" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="section-ribbon-header">
              <div className="section-ribbon-title">
                <span className="bar" />
                <span>{t(customSec.sectionTitle || customSec.zoneName)}</span>
                <span style={{ fontSize: '11px', background: 'rgba(185, 0, 20, 0.15)', color: '#b90014', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px' }}>
                  {t(customSec.zoneBadge || customSec.category)}
                </span>
              </div>
              <span className="section-view-all-link">
                <span>{t(customSec.category)} {t("Desk")}</span> <ArrowRight size={11} />
              </span>
            </div>

            <div className="department-grid-4col">
              {customStories.map((art, idx) => (
                <article key={`dyn-${customSec.id}-${art.id || idx}`} className="dept-card" onClick={() => handleOpenArticle(art)}>
                  <div style={{ width: '100%', height: '150px', borderRadius: '4px', overflow: 'hidden', background: '#000', marginBottom: '8px' }}>
                    <ArticleMediaCover
                      article={art}
                      style={{ width: '100%', height: '100%' }}
                      autoPlay={true}
                      muted={true}
                      loop={true}
                      controls={false}
                      playsInline={true}
                    />
                  </div>
                  <span className="news-kicker" style={{ fontSize: '9.5px' }}>{t(art.category || customSec.category)}</span>
                  <h3 className="dept-card-title">{t(art.title)}</h3>
                  <div className="dept-card-byline">{art.author ? t(art.author) : t('Desk Correspondent')}</div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {/* 5.3 Special Investigations & Deep Dives (Dark Feature Box) */}
      {getZoneConfig('zone-deep-dives')?.enabled !== false && (
        <section className="deep-dives-banner">
          <div className="deep-dives-container">
            {renderLiveAd('deep-dives-top')}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div className="category-tag" style={{ color: '#34d399' }}>
                  <Sparkles size={12} />
                  <span>{t("INVESTIGATIVE JOURNALISM")}</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 900, color: '#ffffff', margin: '4px 0' }}>
                  {t("Deep Dives 💎")}
                </h2>
              </div>

              <button 
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  if (!isLoggedIn) setIsLoginOpen(true);
                }}
                style={{ background: 'none', border: 'none', color: '#34d399', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              >
                {t("Explore Archive")} {!isLoggedIn && <Lock size={13} />} <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="deep-dives-grid">
              {activeDeepDives.map((dive) => (
                <article 
                  key={dive.id} 
                  className="deep-card"
                  onClick={() => setSelectedArticle(dive)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <img 
                    src={dive.imageUrl} 
                    alt={dive.title} 
                    className="deep-card-img" 
                  />
                  {!isLoggedIn && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(185, 0, 20, 0.95)', color: '#fff', fontSize: '9.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10 }}>
                      <Lock size={11} />
                      <span>{t("MEMBER EXCLUSIVE")}</span>
                    </div>
                  )}
                  <div className="deep-card-content">
                    <div className="category-tag" style={{ fontSize: '10px' }}>
                      <span>{t(dive.category)}</span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
                      {t(dive.title)}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.45, marginBottom: '10px' }}>
                      {t(dive.subtitle)}
                    </p>
                    <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
                      {t("By")} {dive.author ? t(dive.author) : ''}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          ZONE 6: UTILITY & FINANCIAL ENGAGEMENT MODULES (ET INSPIRED)
          ========================================================================= */}
      <div className="utility-modules-container" dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
        {/* 6.1 Interactive Currency Converter */}
        <div className="utility-card-box" suppressHydrationWarning>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
            <DollarSign size={18} color="#b90014" />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)' }}>
              {t("CURRENCY CONVERTER")}
            </span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {t("Instant conversion at live institutional interbank rates:")}
          </div>

          <div className="converter-row" suppressHydrationWarning>
            <input 
              type="number"
              value={convAmount}
              onChange={(e) => setConvAmount(e.target.value)}
              className="converter-input"
              placeholder="Amount"
              suppressHydrationWarning
            />
            <select 
              value={convFrom} 
              onChange={(e) => setConvFrom(e.target.value)}
              className="converter-select"
              suppressHydrationWarning
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED (د.إ)</option>
              <option value="INR">INR (₹)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
            <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>TO</span>
            <select 
              value={convTo} 
              onChange={(e) => setConvTo(e.target.value)}
              className="converter-select"
              suppressHydrationWarning
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED (د.إ)</option>
            </select>
            <button 
              type="button"
              onClick={handleCurrencyConvert}
              className="converter-convert-btn"
              suppressHydrationWarning
            >
              {t("CONVERT")}
            </button>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '4px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} suppressHydrationWarning>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>{t("Estimated Value:")}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 900, color: '#059669' }}>
              {convResult} {convTo}
            </span>
          </div>
        </div>

        {/* 6.2 Top Mutual Funds Benchmark Performance Table */}
        <div className="utility-card-box" suppressHydrationWarning>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)' }}>
              {t("TOP MUTUAL FUNDS PERFORMANCE")}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
              {t("Return Horizon: 3Y")}
            </span>
          </div>

          <div className="mf-tabs-bar" suppressHydrationWarning>
            {['Equity', 'Debt', 'Hybrid', 'Featured'].map(tab => (
              <button 
                key={tab}
                type="button"
                onClick={() => setActiveMfTab(tab)}
                className={`mf-tab-btn ${activeMfTab === tab ? 'active' : ''}`}
                suppressHydrationWarning
              >
                {t(tab.toUpperCase())}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { name: "Invesco India Largecap Fund", return3Y: "+15.92%", size: "₹1,931 Cr", stars: "★★★★★" },
              { name: "WhiteOak Capital Large Cap Fund", return3Y: "+15.43%", size: "₹1,259 Cr", stars: "★★★★☆" },
              { name: "Bank of India Large Cap Growth", return3Y: "+15.06%", size: "₹223 Cr", stars: "★★★★★" },
              { name: "Quant Large Cap Direct Fund", return3Y: "+14.88%", size: "₹840 Cr", stars: "★★★★☆" }
            ].map((fund, fIdx) => (
              <div key={`fund-${fIdx}`} className="mf-row-item">
                <span className="mf-fund-name">{fund.name}</span>
                <span className="mf-return-val">{fund.return3Y} (3Y)</span>
                <span style={{ color: 'var(--text-muted)' }}>{fund.size}</span>
                <span className="mf-stars">{fund.stars}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6.3 Trending Terms Pill Cloud */}
      <div className="trending-terms-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
        <span className="trending-terms-label">{t("TOP TRENDING TOPICS:")}</span>
        {[
          "Union Budget 2026",
          "Semiconductor Fab Mission",
          "RBI Monetary Policy",
          "ISRO Gaganyaan Mission",
          "Green Hydrogen Hub",
          "Sensex 85,000 Rally",
          "AI Compute Clusters",
          "Sovereign Gold Bonds"
        ].map((term, tIdx) => (
          <span key={`term-${tIdx}`} className="trending-term-pill">
            #{t(term)}
          </span>
        ))}
      </div>

      {/* =========================================================================
          ZONE 7: "FOR YOU" CURATED EDITORIAL BOTTOM SHELF (THE HINDU STYLE)
          ========================================================================= */}
      <section className="for-you-shelf-section" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="section-ribbon-header">
          <div className="section-ribbon-title">
            <span className="bar" />
            <span>{t("Curated For You")}</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
            {t("RECOMMENDED READING")}
          </span>
        </div>

        <div className="department-grid-4col">
          {forYouStories.map((art, idx) => (
            <article key={`foryou-${art.id || idx}`} className="dept-card" onClick={() => handleOpenArticle(art)}>
              <div style={{ width: '100%', height: '150px', borderRadius: '4px', overflow: 'hidden', background: '#000', marginBottom: '8px' }}>
                <ArticleMediaCover
                  article={art}
                  style={{ width: '100%', height: '100%' }}
                  autoPlay={true}
                  muted={true}
                  loop={true}
                  controls={false}
                  playsInline={true}
                />
              </div>
              <span className="news-kicker" style={{ fontSize: '9.5px' }}>{art.category || 'FEATURE'}</span>
              <h3 className="dept-card-title">{art.title}</h3>
              <div className="dept-card-byline">{art.author || 'Desk Correspondent'}</div>
            </article>
          ))}
        </div>
      </section>
      </div>

      {/* =========================================================================
          ZONE 8: MODALS & OVERLAYS
          ========================================================================= */}
      {selectedArticle && (
        <ArticleModal 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
          isLoggedIn={isLoggedIn}
          onOpenLogin={() => {
            setSelectedArticle(null);
            setIsLoginOpen(true);
          }}
          onLoginSuccess={() => {
            setIsLoggedIn(true);
          }}
        />
      )}

      {isLoginOpen && (
        <LoginModal 
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={() => {
            setIsLoggedIn(true);
            setIsLoginOpen(false);
          }}
        />
      )}

      {/* Floating Bottom Footer Anchor Ad */}
      {renderLiveAd('footer-floating')}
    </main>
  );
}
