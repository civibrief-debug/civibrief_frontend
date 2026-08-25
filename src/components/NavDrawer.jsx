'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '../data/newsData';
import { useTranslation } from '../context/TranslationContext';
import { 
  X, 
  Search, 
  ChevronDown, 
  ChevronUp,
  PlayCircle, 
  Mic, 
  Image as ImageIcon, 
  Eye, 
  Folder, 
  Lightbulb, 
  Smartphone, 
  Grid, 
  Mail, 
  PenTool, 
  Newspaper,
  Send,
  MessageCircle,
  Radio
} from 'lucide-react';

export function NavDrawer({ onClose, onSelectCategory, onOpenSearch, isLoggedIn, onOpenLogin }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCat, setExpandedCat] = useState(null);

  const handleCategoryClick = (categoryName, subSection = null) => {
    const isGated = categoryName.toLowerCase().includes('deep dive') || 
                    categoryName.toLowerCase().includes('sovereign ai') ||
                    categoryName.toLowerCase().includes('ebook') ||
                    categoryName.toLowerCase().includes('edition') ||
                    categoryName.toLowerCase().includes('paper');
    if (isGated && !isLoggedIn) {
      if (onOpenLogin) onOpenLogin();
      onClose();
      return;
    }

    if (categoryName.toLowerCase() === 'home' || categoryName.toLowerCase() === 'top stories') {
      router.push('/');
      if (onSelectCategory) onSelectCategory('top-stories');
      onClose();
      return;
    }

    const found = CATEGORIES.find(c => c.name.toLowerCase() === categoryName.toLowerCase() || c.slug === categoryName.toLowerCase());
    const slug = found ? found.slug : categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const targetUrl = subSection 
      ? `/section/${slug}?subsection=${encodeURIComponent(subSection)}`
      : `/section/${slug}`;

    router.push(targetUrl);
    if (onSelectCategory) {
      onSelectCategory(categoryName);
    }
    onClose();
  };

  const toggleSubSections = (catName) => {
    setExpandedCat(expandedCat === catName ? null : catName);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onOpenSearch) {
      onOpenSearch(searchQuery);
    }
    onClose();
  };

  const DRAWER_SUBSECTIONS = {
    "News": ["India News", "World News", "States", "Cities", "Politics", "Diplomacy"],
    "Opinion": ["Editorials", "Commentary", "Columns", "Letters", "Interview"],
    "Business": ["Economy", "Markets", "Companies", "Industry", "Money & Wealth"],
    "Sport": ["Basketball", "Olympics", "Asian Games", "Wrestling", "FIFA World Cup", "Cricket", "Football", "Tennis", "Motorsport"],
    "Tech & AI": ["Artificial Intelligence", "Chips & Silicon", "Cybersecurity", "Gadgets", "Software"],
    "Science": ["Space", "Climate & Environment", "Biotech", "Physics", "Health & Medicine"],
    "Entertainment": ["Movies", "Reviews", "Music", "Theatre", "Art & Dance", "OTT & Television"],
    "Data": ["Data Stories", "Graphic News", "Fact Checks", "Data Visualizations"],
    "Education": ["Higher Education", "Competitive Exams", "Career Advice", "Schools"],
    "Health": ["Public Health", "Nutrition & Fitness", "Medical Science", "Mental Well-being"],
    "Life & Style": ["Fashion", "Travel", "Luxury", "Motoring", "Homes"],
    "Society": ["Culture", "History", "People", "Gender & Rights"],
    "Books": ["Book Reviews", "Author Interviews", "Excerpts", "Publishing"],
    "Elections": ["Election News", "Poll Analysis", "Constituency Map", "Voter Pulse"],
    "Food": ["Recipes", "Restaurant Reviews", "Food Trends", "Culinary History"],
    "Brandhub": ["Sponsored Content", "Brand Stories", "Press Releases"]
  };

  const CATEGORY_COLUMNS = [
    [
      { name: "LIVE NOW", isLive: true },
      { name: "Opinion", hasSub: true },
      { name: "Data", hasSub: true },
      { name: "Books", hasSub: true },
      { name: "Real Estate", hasSub: false }
    ],
    [
      { name: "News", hasSub: true },
      { name: "Business", hasSub: true },
      { name: "Education", hasSub: true },
      { name: "Children", hasSub: false },
      { name: "Agriculture", hasSub: false }
    ],
    [
      { name: "States", hasSub: false },
      { name: "Sport", hasSub: true },
      { name: "Health", hasSub: true },
      { name: "Elections", hasSub: true },
      { name: "Brandhub", hasSub: true }
    ],
    [
      { name: "Cities", hasSub: false },
      { name: "Tech & AI", hasSub: true },
      { name: "Life & Style", hasSub: true },
      { name: "Food", hasSub: true }
    ],
    [
      { name: "Entertainment", hasSub: true },
      { name: "Science", hasSub: true },
      { name: "Society", hasSub: true },
      { name: "Environment", hasSub: false }
    ]
  ];

  const MEDIA_COLUMN_1 = [
    { label: "Videos", Icon: PlayCircle },
    { label: "Podcast", Icon: Mic },
    { label: "Photos", Icon: ImageIcon },
    { label: "Visual Stories", Icon: Eye },
    { label: "Specials", Icon: Folder },
    { label: "DB Explains", Icon: Lightbulb }
  ];

  const MEDIA_COLUMN_2 = [
    { label: "DB Crossword", Icon: Grid },
    { label: "DB Games", Icon: Grid },
    { label: "Newsletter", Icon: Mail },
    { label: "Lit For Life", Icon: PenTool },
    { label: "The Huddle", Icon: Newspaper }
  ];


  return (
    <div className="nav-drawer-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Top Header inside Drawer */}
        <div className="nav-drawer-header">
          <button onClick={onClose} className="drawer-close-btn" aria-label="Close menu">
            <X size={22} />
          </button>
          
          <form onSubmit={handleSearchSubmit} className="drawer-search-box">
            <Search size={18} color="#555" />
            <input 
              type="text" 
              placeholder={t("Search")} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="drawer-search-input"
            />
          </form>
        </div>

        {/* Main Categories & Media Grid */}
        <div className="nav-drawer-body">
          {/* Left Categories Grid (5 Columns) */}
          <div className="drawer-categories-grid">
            {CATEGORY_COLUMNS.map((col, colIdx) => (
              <div key={colIdx} className="drawer-col">
                {col.map((item, itemIdx) => {
                  const hasSub = item.hasSub && DRAWER_SUBSECTIONS[item.name];
                  const isExpanded = expandedCat === item.name;

                  return (
                    <div key={itemIdx} className="drawer-cat-block">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <button 
                          className={`drawer-cat-btn ${item.isLive ? 'live-item' : ''} ${isExpanded ? 'cat-expanded' : ''}`}
                          style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', color: 'inherit' }}
                          onClick={() => handleCategoryClick(item.name)}
                        >
                          {item.isLive && <span className="live-dot" />}
                          <span className="cat-name">{t(item.name)}</span>
                        </button>
                        {hasSub && (
                          <button
                            type="button"
                            onClick={() => toggleSubSections(item.name)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#94a3b8' }}
                            title="Toggle Subsections"
                          >
                            {isExpanded ? <ChevronUp size={14} className="chevron-icon" /> : <ChevronDown size={14} className="chevron-icon" />}
                          </button>
                        )}
                      </div>

                      {hasSub && isExpanded && (
                        <div className="drawer-sub-accordion">
                          {DRAWER_SUBSECTIONS[item.name].map((sub, sIdx) => (
                            <button
                              key={sIdx}
                              className="drawer-sub-item-btn"
                              onClick={() => handleCategoryClick(item.name, sub)}
                            >
                              <span>{t(sub)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Vertical Divider */}
          <div className="drawer-v-divider" />

          {/* Right Media & Special Links Section */}
          <div className="drawer-media-section">
            {/* Sub-column 1 */}
            <div className="media-col">
              {MEDIA_COLUMN_1.map((item, idx) => (
                <button 
                  key={idx} 
                  className="media-link-btn"
                  onClick={() => handleCategoryClick(item.label)}
                >
                  <item.Icon size={18} className="media-icon" />
                  <span>{t(item.label)}</span>
                </button>
              ))}
            </div>

            {/* Sub-column 2 */}
            <div className="media-col">
              {MEDIA_COLUMN_2.map((item, idx) => (
                <button 
                  key={idx} 
                  className="media-link-btn"
                  onClick={() => handleCategoryClick(item.label)}
                >
                  <item.Icon size={18} className="media-icon" />
                  <span>{t(item.label)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Social Bar inside Drawer */}
        <div className="nav-drawer-footer">
          <div className="social-connect-group">
            <span className="connect-label">{t("Connect with us")}</span>
            <div className="social-icons-row">
              <span className="social-box" title="WhatsApp"><MessageCircle size={15} /></span>
              <span className="social-box" title="X / Twitter"><span style={{ fontWeight: 800, fontSize: '13px' }}>𝕏</span></span>
              <span className="social-box" title="Facebook">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </span>
              <span className="social-box" title="Instagram">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </span>
              <span className="social-box" title="LinkedIn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </span>
              <span className="social-box" title="YouTube">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#fff"/></svg>
              </span>
              <span className="social-box" title="Spotify"><Radio size={15} /></span>
              <span className="social-box" title="Telegram"><Send size={15} /></span>
            </div>
          </div>

          <div className="footer-v-divider">|</div>

          <a href="/careers" className="best-places-link">
            Daily Brief Best Places to Work <span className="arrow">→</span>
          </a>
        </div>
      </div>
  );
}
