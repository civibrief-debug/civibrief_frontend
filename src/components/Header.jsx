'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, 
  Sun, 
  Moon, 
  User, 
  Smartphone,
  BookOpen,
  Menu,
  Lock,
  Settings,
  CreditCard,
  LogOut,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MARKET_INDICES, CATEGORIES, CATEGORY_SECTIONS } from '../data/newsData';
import { CrestLogo } from './CrestLogo';
import { NavDrawer } from './NavDrawer';
import AccountDrawer from './AccountDrawer';
import { LanguageSelector } from './LanguageSelector';

export function Header({ 
  onOpenSearch, 
  onOpenNewsletter, 
  onOpenEPaper, 
  onOpenSubscribe, 
  onOpenMenu,
  onCloseMenu,
  isMenuOpen: parentIsMenuOpen,
  onOpenLogin,
  isLoggedIn,
  user,
  onLogout,
  activeCategory: parentActiveCategory, 
  onSelectCategory 
}) {
  const [theme, setTheme] = useState('light');
  const [localCategory, setLocalCategory] = useState('top-stories');
  const [formattedDate, setFormattedDate] = useState('August 3, 2026');
  const [showHeader, setShowHeader] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const [tickerData, setTickerData] = useState(MARKET_INDICES);
  const [weatherData, setWeatherData] = useState([
    { city: 'NEW DELHI', temp: '31°C', condition: 'Sunny', icon: '☀️', humidity: '58%', wind: '12 km/h' },
    { city: 'MUMBAI', temp: '29°C', condition: 'Light Rain', icon: '🌧️', humidity: '82%', wind: '18 km/h' },
    { city: 'BENGALURU', temp: '25°C', condition: 'Partly Cloudy', icon: '⛅', humidity: '65%', wind: '14 km/h' },
    { city: 'NEW YORK', temp: '24°C', condition: 'Clear Sky', icon: '🌤️', humidity: '52%', wind: '10 km/h' },
    { city: 'LONDON', temp: '19°C', condition: 'Overcast', icon: '☁️', humidity: '70%', wind: '15 km/h' },
    { city: 'TOKYO', temp: '28°C', condition: 'Sunny', icon: '☀️', humidity: '60%', wind: '8 km/h' },
    { city: 'PARIS', temp: '22°C', condition: 'Scattered Clouds', icon: '⛅', humidity: '55%', wind: '11 km/h' },
    { city: 'DUBAI', temp: '38°C', condition: 'Clear', icon: '☀️', humidity: '45%', wind: '16 km/h' },
    { city: 'SINGAPORE', temp: '30°C', condition: 'Thunderstorm', icon: '⛈️', humidity: '85%', wind: '12 km/h' },
    { city: 'SYDNEY', temp: '20°C', condition: 'Breezy', icon: '🌤️', humidity: '50%', wind: '22 km/h' }
  ]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef(null);

  const isMenuOpen = parentIsMenuOpen !== undefined ? parentIsMenuOpen : internalMenuOpen;

  // Fetch live Binance & Market indices data
  useEffect(() => {
    const fetchLiveTicker = async () => {
      try {
        const res = await fetch('/api/market-ticker');
        if (!res.ok) return;
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setTickerData(json.data);
        }
      } catch (err) {
        console.warn('Failed to fetch live Binance market ticker (suppressed):', err?.message || err);
      }
    };

    fetchLiveTicker().catch(() => {});
    const interval = setInterval(() => {
      fetchLiveTicker().catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live OpenWeatherMap & Climate data
  useEffect(() => {
    const fetchLiveWeather = async () => {
      try {
        const res = await fetch('/api/weather-ticker');
        if (!res.ok) return;
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setWeatherData(json.data);
        }
      } catch (err) {
        console.warn('Failed to fetch live weather ticker (suppressed):', err?.message || err);
      }
    };

    fetchLiveWeather().catch(() => {});
    const interval = setInterval(() => {
      fetchLiveWeather().catch(() => {});
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleMenu = () => {
    if (parentIsMenuOpen !== undefined) {
      if (isMenuOpen && onCloseMenu) onCloseMenu();
      else if (onOpenMenu) onOpenMenu();
    } else {
      setInternalMenuOpen(!internalMenuOpen);
    }
  };

  const handleCloseMenu = () => {
    if (onCloseMenu) onCloseMenu();
    else setInternalMenuOpen(false);
  };

  const router = useRouter();
  const pathname = usePathname();

  // Dynamically compute active category based strictly on current URL pathname
  const activeCat = useMemo(() => {
    if (!pathname || pathname === '/') return 'top-stories';
    if (pathname.startsWith('/section/')) {
      return pathname.replace('/section/', '').split('/')[0].split('?')[0];
    }
    if (pathname.startsWith('/news/')) {
      const parts = pathname.replace('/news/', '').split('/');
      return parts[parts.length - 1].split('?')[0];
    }
    return localCategory || 'top-stories';
  }, [pathname, localCategory]);

  const handleLogoClick = () => {
    setLocalCategory('top-stories');
    setHoveredCategory(null);
    if (onSelectCategory) onSelectCategory('top-stories');
  };

  useEffect(() => {
    const today = new Date();
    setFormattedDate(today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }));

    let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    let ticking = false;

    const updateScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Hide search bar & header when scrolling DOWN past 100px; show sticky when scrolling UP
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
        setHoveredCategory(null);
        setIsProfileMenuOpen(false);
      } else if (currentScrollY < lastScrollY) {
        setShowHeader(true);
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleCategoryClick = (catSlug, subSectionName = null) => {
    const isDeepDive = catSlug === 'deep-dives' || catSlug.toLowerCase().includes('deep dive') || catSlug.toLowerCase().includes('sovereign ai');
    if (isDeepDive && !isLoggedIn) {
      if (onOpenLogin) onOpenLogin();
      return;
    }

    if (catSlug === 'top-stories' || catSlug === 'all') {
      router.push('/');
      if (onSelectCategory) onSelectCategory('top-stories');
      setLocalCategory('top-stories');
      setHoveredCategory(null);
      return;
    }

    const found = CATEGORIES.find(c => c.name.toLowerCase() === catSlug.toLowerCase() || c.slug === catSlug.toLowerCase());
    const slug = found ? found.slug : catSlug.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const targetUrl = subSectionName 
      ? `/section/${slug}?subsection=${encodeURIComponent(subSectionName)}` 
      : `/section/${slug}`;

    router.push(targetUrl);
    if (onSelectCategory) onSelectCategory(catSlug);
    setLocalCategory(slug);
    setHoveredCategory(null);
  };

  const handleEPaperTrigger = () => {
    if (!isLoggedIn) {
      if (onOpenLogin) onOpenLogin();
      return;
    }
    if (onOpenEPaper) onOpenEPaper();
    else if (onOpenNewsletter) onOpenNewsletter();
  };

  const handleSubscribeTrigger = () => {
    if (onOpenSubscribe) onOpenSubscribe();
    else if (onOpenNewsletter) onOpenNewsletter();
  };

  const activeCatStr = (activeCat || '').toString().toLowerCase();
  const isMarketsSection = 
    activeCatStr === 'markets' || 
    activeCatStr.includes('market') || 
    activeCatStr.includes('econom') ||
    activeCatStr.includes('stock') ||
    activeCatStr.includes('capital');

  const isScienceSection = 
    activeCatStr === 'science' || 
    activeCatStr.includes('science') || 
    activeCatStr.includes('climate') ||
    activeCatStr.includes('weather');

  return (
    <header className={`header-wrapper ${isScrolled ? 'is-scrolled' : ''} ${showHeader ? 'show-header' : 'hide-header'}`}>
      {/* Financial Ticker Top Bar - Appears ONLY when in Markets & Economy section (Live API without external Binance redirect) */}
      {isMarketsSection && (
        <div 
          className="ticker-bar"
          title="Live Global Market Indices"
          style={{ display: 'block' }}
        >
          <div className="ticker-wrapper">
            {tickerData.concat(tickerData).map((item, idx) => (
              <div key={idx} className="ticker-item">
                <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{item.symbol}:</span>
                <span style={{ color: '#f8fafc' }}>{item.value}</span>
                <span className={item.isPositive ? 'ticker-pos' : 'ticker-neg'}>
                  {item.change}
                </span>
                <span style={{ color: '#475569', margin: '0 8px' }}>|</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Global Weather & Climate Bar - Appears ONLY when in Science & Climate section */}
      {isScienceSection && (
        <a 
          href="https://weather-forecast-theta-green.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="weather-ticker-bar"
          title="Click to view live interactive weather forecasting dashboard"
          style={{ textDecoration: 'none', cursor: 'pointer', display: 'block' }}
        >
          <div className="weather-ticker-wrapper">
            {weatherData.concat(weatherData).map((w, idx) => (
              <div key={idx} className="weather-ticker-item">
                <span style={{ fontWeight: 800, color: '#38bdf8', letterSpacing: '0.4px' }}>{w.city}:</span>
                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{w.temp}</span>
                <span style={{ fontSize: '13px' }}>{w.icon}</span>
                <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>{w.condition}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>({w.humidity} Hum • {w.wind})</span>
                <span style={{ color: '#334155', margin: '0 10px' }}>|</span>
              </div>
            ))}
          </div>
        </a>
      )}

      {/* Main Newspaper Masthead */}
      <div className="masthead">
        {/* Left Column: Date (Row 1) & Menu + Search (Row 2) */}
        <div className="masthead-left">
          <div className="masthead-date-row">
            <span className="masthead-date">{formattedDate}</span>
          </div>
          <div className="masthead-search-row">
            <button onClick={handleToggleMenu} className="masthead-menu-btn" title={isMenuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}>
              <Menu size={22} strokeWidth={1.5} />
            </button>
            <button onClick={onOpenSearch} className="masthead-search-btn" title="Search Articles">
              <Search size={18} strokeWidth={1.75} />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Center Column: Perfectly Centered Serif Logo with Emblem Crest (The Hindu Style) */}
        <div className="masthead-center">
          <Link href="/" className="brand-logo-hindu" title="Daily Brief Home" onClick={handleLogoClick}>
            <span className="brand-title-word">DAILY</span>
            <CrestLogo className="brand-crest-logo" />
            <span className="brand-title-word">BRIEF</span>
          </Link>
        </div>

        {/* Right Column: Utilities (Translate, Login, Theme in Top Row) & Subscribe Button (Bottom Row) */}
        <div className="masthead-right">
          {/* Row 1: Translate + Login / Member Account + Theme Switcher */}
          <div className="masthead-right-top">
            <LanguageSelector />

            {/* Login / Member Profile Menu */}
            {isLoggedIn ? (
              <div className="profile-dropdown-wrapper" ref={profileMenuRef} style={{ position: 'relative' }}>
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} 
                  className="masthead-link member-status-active"
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                  title="Open Account Profile Drawer"
                >
                  <span className="gem-badge">💎</span>
                  <span className="link-text">{user?.name || (user?.email ? user.email.split('@')[0] : "SUBSCRIBER")}</span>
                  <ChevronDown size={13} style={{ transform: isProfileMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                <AccountDrawer
                  isOpen={isProfileMenuOpen}
                  onClose={() => setIsProfileMenuOpen(false)}
                  user={user}
                  isLoggedIn={isLoggedIn}
                  onLogout={onLogout}
                  onOpenSubscribe={onOpenSubscribe}
                  onOpenLogin={onOpenLogin}
                />
              </div>
            ) : (
              <button 
                onClick={() => {
                  if (onOpenLogin) onOpenLogin();
                }} 
                className="masthead-link" 
                aria-label="User Login"
                title="User Login / Account" 
                style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              >
                <span className="link-text">LOGIN</span>
                <User size={15} />
              </button>
            )}

            {/* Day / Night Theme Switcher */}
            <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Light / Dark Mode">
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} color="#f59e0b" />}
            </button>
          </div>

          {/* Row 2: Red Subscribe Button */}
          <div className="masthead-right-bottom">
            <button onClick={handleSubscribeTrigger} className="subscribe-btn-red" title="Subscribe to Daily Brief Premium">
              SUBSCRIBE
            </button>
          </div>
        </div>
      </div>



      {/* Primary Category Navigation Bar OR Drawer Panel */}
      {isMenuOpen ? (
        <>
          <div className="nav-drawer-backdrop-overlay" onClick={handleCloseMenu} />
          <div className="nav-drawer-inline-container">
            <NavDrawer 
              onClose={handleCloseMenu}
              onSelectCategory={(cat) => {
                if (onSelectCategory) onSelectCategory(cat);
                handleCloseMenu();
              }}
              onOpenSearch={(query) => {
                handleCloseMenu();
                if (onOpenSearch) onOpenSearch(query);
              }}
              isLoggedIn={isLoggedIn}
              onOpenLogin={() => {
                handleCloseMenu();
                if (onOpenLogin) onOpenLogin();
              }}
            />
          </div>
        </>
      ) : (
        <nav className="category-nav" onMouseLeave={() => setHoveredCategory(null)}>
          <div className="category-nav-inner">
            <ul className="category-list">
              {CATEGORIES.map((cat) => {
                const hasSections = !!CATEGORY_SECTIONS[cat.slug];
                const isHovered = hoveredCategory === cat.slug;

                const isCatActive = (!pathname || pathname === '/')
                  ? (cat.slug === 'top-stories' || cat.slug === 'all')
                  : (activeCat === cat.slug || activeCat === cat.name.toLowerCase());

                return (
                  <li key={cat.slug} className="category-item-has-mega">
                    <button
                      onClick={() => {
                        if (cat.slug === 'deep-dives' && !isLoggedIn) {
                          if (onOpenLogin) onOpenLogin();
                          return;
                        }
                        handleCategoryClick(cat.slug);
                      }}
                      onMouseEnter={() => {
                        if (hasSections) setHoveredCategory(cat.slug);
                      }}
                      className={`category-link ${isCatActive ? 'active' : ''} ${isHovered ? 'mega-active' : ''}`}
                    >
                      <span>{cat.name}</span>
                      {hasSections && (
                        isHovered ? <ChevronUp size={12} className="cat-chevron" /> : <ChevronDown size={12} className="cat-chevron" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Mega Menu Section Dropdown Panel */}
          {hoveredCategory && CATEGORY_SECTIONS[hoveredCategory] && (
            <div className="mega-menu-panel" onMouseEnter={() => setHoveredCategory(hoveredCategory)}>
              {hoveredCategory === 'deep-dives' && !isLoggedIn ? (
                /* Locked Gated Banner for Deep Dives Mega-Menu */
                <div className="mega-menu-inner" style={{ gridTemplateColumns: '1fr', padding: '24px' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '24px',
                    background: 'var(--bg-secondary, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: '8px',
                    gap: '12px'
                  }}>
                    <div style={{ background: '#fef2f2', border: '1px solid rgba(220,38,38,0.2)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={22} color="#dc2626" />
                    </div>
                    <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Deep Dives 💎 Content Locked for Free Readers
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.4 }}>
                      Special investigative series, interactive data charts, executive policy playbooks, and 5-year tech forecasts are restricted to logged-in members.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                      <button
                        onClick={() => {
                          setHoveredCategory(null);
                          if (onOpenLogin) onOpenLogin();
                        }}
                        style={{
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 800,
                          padding: '10px 20px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Lock size={14} />
                        <span>Log In to Access Deep Dives 💎</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular Mega Menu Content */
                <div className="mega-menu-inner">
                  {/* Left Sub-Sections Column */}
                  <div className="mega-left-column">
                    <div className="mega-section-label">SECTION</div>
                    <div className="mega-subsections-grid">
                      {CATEGORY_SECTIONS[hoveredCategory].sections.map((sub, idx) => (
                        <button
                          key={idx}
                          className="mega-sub-link"
                          onClick={() => {
                            handleCategoryClick(hoveredCategory, sub.name);
                            setHoveredCategory(null);
                          }}
                        >
                          <span className="sub-name">{sub.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vertical Hairline Divider */}
                  <div className="mega-v-divider" />

                  {/* Right Newsletter Spotlight Card */}
                  <div className="mega-right-column">
                    <div className="mega-newsletter-label">
                      {CATEGORY_SECTIONS[hoveredCategory].spotlight.tag}
                    </div>
                    <div className="mega-card">
                      <img 
                        src={CATEGORY_SECTIONS[hoveredCategory]?.spotlight?.image || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80"} 
                        alt={CATEGORY_SECTIONS[hoveredCategory]?.spotlight?.title || 'Spotlight'}
                        className="mega-card-img"
                      />
                      <div className="mega-card-info">
                        <h4 className="mega-card-title">
                          {CATEGORY_SECTIONS[hoveredCategory].spotlight.title}
                        </h4>
                        <p className="mega-card-desc">
                          {CATEGORY_SECTIONS[hoveredCategory].spotlight.desc}
                        </p>
                        <button 
                          className="mega-newsletter-btn"
                          onClick={() => {
                            if (onOpenNewsletter) onOpenNewsletter();
                            setHoveredCategory(null);
                          }}
                        >
                          {CATEGORY_SECTIONS[hoveredCategory].spotlight.cta}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
