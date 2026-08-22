import { NextResponse } from 'next/server';
import { queryD1 } from '../../../../lib/edgeDb';

export const runtime = 'edge';

const FALLBACK_HOMEPAGE_ADS = [
  {
    id: "ad-masthead-top",
    slotId: "masthead-top",
    slotName: "Masthead Top Banner",
    slotLocation: "Top Header Zone (Below Navigation Bar)",
    dimension: "970x90 Leaderboard / 728x90",
    enabled: true,
    sponsorName: "Binance VIP Institutional",
    badgeText: "SPONSORED",
    headline: "Institutional Crypto Liquidity & 0% Trading Fees",
    subtitle: "Enterprise-grade custody, low-latency API execution and global OTC desks.",
    ctaText: "Explore Platform",
    targetUrl: "https://binance.com",
    contentType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=1200&q=80",
    customHtml: "",
    format: "leaderboard"
  },
  {
    id: "ad-hero-bottom",
    slotId: "hero-bottom",
    slotName: "Hero Billboard Banner",
    slotLocation: "Directly Below Top 4 News Stories",
    dimension: "970x250 Premium Billboard",
    enabled: true,
    sponsorName: "Rolex Precision Chronometers",
    badgeText: "OFFICIAL PARTNER",
    headline: "The Oyster Perpetual Deepsea Challenge",
    subtitle: "Guaranteed waterproof to 11,000 meters. The supreme instrument of deep oceanic exploration.",
    ctaText: "Discover Model",
    targetUrl: "https://rolex.com",
    contentType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
    customHtml: "",
    format: "billboard"
  },
  {
    id: "ad-in-feed-mid",
    slotId: "in-feed-mid",
    slotName: "Latest Intelligence In-Feed Sponsor",
    slotLocation: "Inside News Feed (Between Article Rows)",
    dimension: "Native Sponsored Stream Card",
    enabled: true,
    sponsorName: "Google Cloud Platform",
    badgeText: "CLOUD PARTNER",
    headline: "Deploy Scalable AI Models Globally with Vertex AI",
    subtitle: "Build with Gemini 1.5 Pro and enterprise security compliance at planet scale.",
    ctaText: "Start Free Trial",
    targetUrl: "https://cloud.google.com",
    contentType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    customHtml: "",
    format: "in_feed"
  },
  {
    id: "ad-sidebar-sticky",
    slotId: "sidebar-sticky",
    slotName: "Trending Sidebar Medium Rectangle",
    slotLocation: "Right Sidebar (Below Most Read Today)",
    dimension: "300x250 Medium Rectangle",
    enabled: true,
    sponsorName: "Porsche Taycan Turbo GT",
    badgeText: "AUTOMOTIVE",
    headline: "Soul, Electrified: The All-New Porsche Taycan",
    subtitle: "0-100 km/h in 2.2 seconds. Peak performance meets timeless design.",
    ctaText: "Configure Yours",
    targetUrl: "https://porsche.com",
    contentType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=600&q=80",
    customHtml: "",
    format: "rectangle"
  },
  {
    id: "ad-deep-dives-top",
    slotId: "deep-dives-top",
    slotName: "Deep Dives Premium Sponsor",
    slotLocation: "Header of Deep Dives 💎 Investigations",
    dimension: "Full Width Premium Sponsor Banner",
    enabled: true,
    sponsorName: "Financial Times Intelligence",
    badgeText: "EDITORIAL PARTNER",
    headline: "Global Geopolitical Risk Index 2026: Executive Briefing",
    subtitle: "Exclusive macro analysis covering global supply chains, central banking, and semiconductors.",
    ctaText: "Download Report",
    targetUrl: "https://ft.com",
    contentType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    customHtml: "",
    format: "deep_dives"
  }
];

export async function GET() {
  try {
    await queryD1(`CREATE TABLE IF NOT EXISTS homepage_ads (id TEXT PRIMARY KEY, data TEXT, updated_at TEXT);`);
    const rows = await queryD1('SELECT data FROM homepage_ads WHERE id = "current_homepage_ads" LIMIT 1;');
    if (rows && rows.length > 0 && rows[0].data) {
      const parsed = JSON.parse(rows[0].data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return NextResponse.json({ success: true, data: parsed });
      }
    }
    return NextResponse.json({ success: true, data: FALLBACK_HOMEPAGE_ADS });
  } catch (err) {
    return NextResponse.json({ success: true, data: FALLBACK_HOMEPAGE_ADS });
  }
}
