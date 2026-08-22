-- ============================================================================
-- CLOUDFLARE D1 DATABASE SCHEMA
-- Database ID: d273c042-1c2c-4118-a491-4ca85c0f1148
-- Project: Daily Brief News Platform & Admin Portal
-- Engine: Cloudflare D1 (SQLite compatible)
-- ============================================================================

-- Enable Foreign Key constraints
PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. ARTICLES TABLE
-- Stores main news articles, headlines, lead summaries, content, and metadata
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  kicker TEXT,                          -- Supertitle / Overline tag (e.g. SPECIAL REPORT • PARIS 2026)
  title TEXT NOT NULL,                  -- Main article headline
  category TEXT NOT NULL,               -- Primary Category (e.g. Tech & AI, Global Affairs)
  sub_section TEXT,                     -- Sub-Section (e.g. AI Ethics, Semiconductors)
  author TEXT NOT NULL,                 -- Author Display Name
  author_id TEXT,                       -- Reference to admin user ID
  status TEXT NOT NULL DEFAULT 'Published', -- 'Draft', 'Pending Editor Assignment', 'Published'
  summary TEXT,                         -- Article Lead Summary for feeds & RSS
  content TEXT NOT NULL,                -- HTML/Rich Text Article Body
  image_url TEXT,                       -- Featured Cover Image URL
  has_audio INTEGER DEFAULT 1,          -- 1 = Audio available, 0 = No audio
  featured INTEGER DEFAULT 0,           -- 1 = Featured lead story on homepage
  published_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(featured);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);

-- ----------------------------------------------------------------------------
-- 2. ARTICLE TRANSLATIONS TABLE
-- Caches multi-language translations and TTS voiceover scripts for 50+ languages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_translations (
  id TEXT PRIMARY KEY,                  -- Unique ID e.g. art-123_ta
  article_id TEXT NOT NULL,             -- Foreign key referencing articles(id)
  language_code TEXT NOT NULL,          -- Language Code e.g. 'hi', 'ta', 'gu', 'te', 'fr'
  translated_title TEXT NOT NULL,       -- Translated Headline Title
  translated_summary TEXT,              -- Translated Lead Summary
  translated_content TEXT NOT NULL,     -- Translated Rich Text Body
  translated_author_attribution TEXT,   -- Localized Author Byline
  voiceover_script TEXT,                -- Full spoken audio script for TTS
  tts_locale TEXT,                      -- Native Browser TTS locale (e.g. 'ta-IN')
  language_name TEXT,                   -- Native Language Name (e.g. 'தமிழ்')
  translation_status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  UNIQUE(article_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_translations_lookup ON article_translations(article_id, language_code);

-- ----------------------------------------------------------------------------
-- 3. SUBSCRIBERS TABLE
-- Tracks reader accounts, membership plans, and digital subscription statuses
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,                  -- Subscriber ID e.g. sub-1
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Expired', 'Cancelled'
  plan TEXT NOT NULL DEFAULT 'Digital Premium', -- 'Digital Premium', 'All Access Bundle'
  expiry_date TEXT,                     -- Expiry Date ISO string
  joined_date TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);

-- ----------------------------------------------------------------------------
-- 4. SUPPORT TICKETS TABLE
-- Customer support and billing help tickets submitted by readers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,                  -- Ticket ID e.g. TICK-8041
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,               -- e.g. 'Billing & Access', 'Technical Issue'
  priority TEXT NOT NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Urgent'
  status TEXT NOT NULL DEFAULT 'Open',  -- 'Open', 'In Progress', 'Resolved', 'Closed'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON support_tickets(user_email);

-- ----------------------------------------------------------------------------
-- 5. TICKET MESSAGES TABLE
-- Individual messages inside support ticket threads
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,              -- Foreign key referencing support_tickets(id)
  sender TEXT NOT NULL,                 -- 'user' or 'admin'
  text TEXT NOT NULL,                   -- Message content
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);

-- ----------------------------------------------------------------------------
-- 6. ADMIN USERS TABLE
-- Staff accounts for Super Admin, Editors, and Content Authors
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,                  -- e.g. super-admin-root, adm-author-1
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role_id TEXT NOT NULL,                -- 'super_admin', 'editor', 'content_admin'
  category_scope TEXT DEFAULT '["All Categories"]', -- JSON Array string
  section_scope TEXT DEFAULT '{}',      -- JSON Object string
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- ----------------------------------------------------------------------------
-- 7. ARTICLE COMMENTS & EDITORIAL DISCUSSION THREADS TABLE
-- Real-time 2-way discussion notes between Authors and Editors per article
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_comments (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,             -- Foreign key referencing articles(id)
  sender_id TEXT,
  sender_name TEXT NOT NULL,            -- e.g. 'Ravi', 'Super Admin'
  sender_role TEXT NOT NULL,            -- 'Author', 'Editor', 'Super Admin'
  text TEXT NOT NULL,                   -- Discussion note text
  is_read INTEGER DEFAULT 0,            -- 0 = Unread, 1 = Read
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_article_comments_article ON article_comments(article_id);

-- ----------------------------------------------------------------------------
-- 8. HOMEPAGE ADS CONFIGURATION TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS homepage_ads (
  id TEXT PRIMARY KEY,
  data TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. HOMEPAGE ARTICLE PLACEMENT CONFIGURATION TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS homepage_articles (
  id TEXT PRIMARY KEY,
  data TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

