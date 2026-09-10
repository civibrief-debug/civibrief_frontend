import { NextResponse } from 'next/server';
import { queryD1 } from '../../../../lib/edgeDb';

export const runtime = 'edge';

// High-performance Server-Side Memory SWR Cache for instant 0ms responses
if (!globalThis.__serverAdsCache) {
  globalThis.__serverAdsCache = null;
}
let isRevalidatingAds = false;

export async function GET() {
  try {
    // 1. Instant 0ms Memory Cache Hit
    const cached = globalThis.__serverAdsCache;
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < 30000) {
        return new Response(cached.jsonString, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=15, s-maxage=60, stale-while-revalidate=300',
            'X-Cache': 'HIT-FRESH'
          }
        });
      } else if (age < 300000) {
        if (!isRevalidatingAds) {
          isRevalidatingAds = true;
          (async () => {
            try {
              const freshRows = await queryD1('SELECT data FROM homepage_ads WHERE id = "current_homepage_ads" LIMIT 1;');
              if (freshRows && freshRows.length > 0 && freshRows[0].data) {
                const parsed = JSON.parse(freshRows[0].data);
                const jsonString = JSON.stringify({ success: true, data: parsed });
                globalThis.__serverAdsCache = { jsonString, timestamp: Date.now() };
              }
            } catch (e) {} finally {
              isRevalidatingAds = false;
            }
          })();
        }
        return new Response(cached.jsonString, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=15, s-maxage=60, stale-while-revalidate=300',
            'X-Cache': 'HIT-STALE'
          }
        });
      }
    }

    // 2. Cold Start: Fetch directly without slow redundant CREATE TABLE
    const rows = await queryD1('SELECT data FROM homepage_ads WHERE id = "current_homepage_ads" LIMIT 1;');
    if (rows && rows.length > 0 && rows[0].data) {
      const parsed = JSON.parse(rows[0].data);
      if (Array.isArray(parsed)) {
        const jsonString = JSON.stringify({ success: true, data: parsed });
        globalThis.__serverAdsCache = { jsonString, timestamp: Date.now() };
        return new Response(jsonString, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=15, s-maxage=60, stale-while-revalidate=300',
            'X-Cache': 'MISS'
          }
        });
      }
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (err) {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const ads = body.ads || [];

    await queryD1(`CREATE TABLE IF NOT EXISTS homepage_ads (id TEXT PRIMARY KEY, data TEXT, updated_at TEXT);`);
    await queryD1(
      `INSERT INTO homepage_ads (id, data, updated_at) VALUES ("current_homepage_ads", ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP;`,
      [JSON.stringify(ads)]
    );

    // Immediately update memory cache for 0ms freshness
    globalThis.__serverAdsCache = {
      jsonString: JSON.stringify({ success: true, data: ads }),
      timestamp: Date.now()
    };

    return NextResponse.json({ success: true, data: ads });
  } catch (err) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
