import { NextResponse } from 'next/server';
import { queryD1 } from '../../../../lib/edgeDb';

export const runtime = 'edge';

const FALLBACK_HOMEPAGE_ARTICLE_SECTIONS = [
  {
    id: "zone-hero-lead",
    zoneName: "Zone 1: Dominant Hero Lead Story (Top-Left Large Stage)",
    zoneBadge: "HERO LEAD",
    zoneType: "hero_lead",
    sectionTitle: "Main Top Story",
    category: "All",
    selectionMode: "auto",
    pinnedArticleId: null,
    itemCount: 1,
    sortOrder: "latest",
    enabled: true
  },
  {
    id: "zone-hero-sub-1",
    zoneName: "Zone 2: Hero Sub Lead 1 (Left Box under Main Lead)",
    zoneBadge: "HERO SUB 1",
    zoneType: "hero_sub_1",
    sectionTitle: "Featured Sub Lead 1",
    category: "All",
    selectionMode: "auto",
    pinnedArticleId: null,
    itemCount: 1,
    sortOrder: "latest",
    enabled: true
  },
  {
    id: "zone-hero-sub-2",
    zoneName: "Zone 3: Hero Sub Lead 2 (Right Box under Main Lead)",
    zoneBadge: "HERO SUB 2",
    zoneType: "hero_sub_2",
    sectionTitle: "Featured Sub Lead 2",
    category: "All",
    selectionMode: "auto",
    pinnedArticleId: null,
    itemCount: 1,
    sortOrder: "latest",
    enabled: true
  },
  {
    id: "zone-hero-second-lead",
    zoneName: "Zone 4: Second Major Lead (Center Column Top)",
    zoneBadge: "SECOND LEAD",
    zoneType: "hero_second_lead",
    sectionTitle: "Second Major Story",
    category: "All",
    selectionMode: "auto",
    pinnedArticleId: null,
    itemCount: 1,
    sortOrder: "latest",
    enabled: true
  },
  {
    id: "zone-hero-stacked",
    zoneName: "Zone 5: Center Column Stacked News Rows",
    zoneBadge: "STACKED ROWS",
    zoneType: "hero_stacked",
    sectionTitle: "Top News Stack",
    category: "All",
    selectionMode: "auto",
    pinnedArticleId: null,
    itemCount: 3,
    sortOrder: "latest",
    enabled: true
  },
  {
    id: "zone-editorial-opinion",
    zoneName: "Zone 6: Column 3 Editorial Opinion Crest Box",
    zoneBadge: "EDITORIAL OPINION",
    zoneType: "opinion",
    sectionTitle: "EDITORIAL OPINION",
    category: "Opinion & Essays",
    selectionMode: "auto",
    pinnedArticleId: null,
    itemCount: 1,
    sortOrder: "latest",
    enabled: true
  },
  {
    id: "zone-band-1",
    zoneName: "Zone 7: Section Band 1 (Lead Feature + Horizontal Cards)",
    zoneBadge: "SECTION BAND 1",
    zoneType: "section_band",
    sectionTitle: "National Affairs",
    category: "Global Affairs",
    selectionMode: "auto",
    pinnedArticleId: null,
    itemCount: 4,
    sortOrder: "latest",
    enabled: true
  },
  {
    id: "zone-band-2",
    zoneName: "Zone 8: Section Band 2 (World & Geopolitics Column)",
    zoneBadge: "SECTION BAND 2",
    zoneType: "section_band",
    sectionTitle: "World & Geopolitics",
    category: "Global Affairs",
    selectionMode: "auto",
    pinnedArticleId: null,
    itemCount: 4,
    sortOrder: "latest",
    enabled: true
  },
  {
    id: "zone-dept-1",
    zoneName: "Zone 9: Department Grid 1 (Business & Markets)",
    zoneBadge: "DEPARTMENT 1",
    zoneType: "department_grid",
    sectionTitle: "Business, Markets & Economy",
    category: "Markets & Economy",
    selectionMode: "auto",
    pinnedArticleId: null,
    itemCount: 4,
    sortOrder: "latest",
    enabled: true
  },
  {
    id: "zone-dept-2",
    zoneName: "Zone 10: Department Grid 2 (Technology & AI)",
    zoneBadge: "DEPARTMENT 2",
    zoneType: "department_grid",
    sectionTitle: "Technology, AI & Space",
    category: "Tech & AI",
    selectionMode: "auto",
    pinnedArticleId: null,
    itemCount: 4,
    sortOrder: "latest",
    enabled: true
  },
  {
    id: "zone-deep-dives",
    zoneName: "Zone 11: Special Investigations (Deep Dives 💎)",
    zoneBadge: "DEEP DIVES",
    zoneType: "deep_dives",
    sectionTitle: "Deep Dives 💎",
    category: "Deep Dives 💎",
    selectionMode: "auto",
    pinnedArticleId: null,
    itemCount: 3,
    sortOrder: "latest",
    enabled: true
  }
];

let memorySections = FALLBACK_HOMEPAGE_ARTICLE_SECTIONS;

export async function GET() {
  try {
    await queryD1(`CREATE TABLE IF NOT EXISTS homepage_articles (id TEXT PRIMARY KEY, data TEXT, updated_at TEXT);`);
    const rows = await queryD1('SELECT data FROM homepage_articles WHERE id = "current_homepage_articles" LIMIT 1;');
    if (rows && rows.length > 0 && rows[0].data) {
      const parsed = JSON.parse(rows[0].data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memorySections = parsed;
        return NextResponse.json(
          { success: true, data: parsed },
          { headers: { 'Cache-Control': 'public, max-age=2, s-maxage=5, stale-while-revalidate=59' } }
        );
      }
    }
    return NextResponse.json(
      { success: true, data: memorySections },
      { headers: { 'Cache-Control': 'public, max-age=2, s-maxage=5, stale-while-revalidate=59' } }
    );
  } catch (err) {
    return NextResponse.json(
      { success: true, data: memorySections },
      { headers: { 'Cache-Control': 'public, max-age=2, s-maxage=5, stale-while-revalidate=59' } }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const sections = body.sections || [];
    memorySections = sections;
    await queryD1(`CREATE TABLE IF NOT EXISTS homepage_articles (id TEXT PRIMARY KEY, data TEXT, updated_at TEXT);`);
    await queryD1(
      `INSERT INTO homepage_articles (id, data, updated_at) VALUES ("current_homepage_articles", ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP;`,
      [JSON.stringify(sections)]
    );
    return NextResponse.json({ success: true, data: sections });
  } catch (err) {
    return NextResponse.json({ success: true, data: memorySections });
  }
}
