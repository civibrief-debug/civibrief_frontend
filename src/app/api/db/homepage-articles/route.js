import { NextResponse } from 'next/server';
import { queryD1 } from '../../../../lib/edgeDb';

export const runtime = 'edge';

// High-performance Server-Side Memory SWR Cache for instant 0ms responses
if (!globalThis.__serverSectionsCache) {
  globalThis.__serverSectionsCache = null;
}
let isRevalidatingSections = false;

function formatSections(rawSections) {
  if (!Array.isArray(rawSections)) return [];
  return rawSections.map(sec => {
    if (!sec) return sec;
    if (sec.sectionTitle) {
      sec.sectionTitle = sec.sectionTitle.replace(/\s*\((?:copy|copied)\)/gi, '').trim();
    }
    if (sec.mainStory && sec.mainStory.title && sec.mainStory.title.toLowerCase().includes('make money')) {
      sec.mainStory.coverMediaType = 'video';
      sec.mainStory.videoUrl = '/videos/make-money-cover.mp4';
      sec.mainStory.imageUrl = '/videos/make-money-poster.jpg';
      sec.mainStory.posterUrl = '/videos/make-money-poster.jpg';
    }
    if (Array.isArray(sec.stories)) {
      sec.stories = sec.stories.map(st => {
        if (st.title && st.title.toLowerCase().includes('make money')) {
          return {
            ...st,
            coverMediaType: 'video',
            videoUrl: '/videos/make-money-cover.mp4',
            imageUrl: '/videos/make-money-poster.jpg',
            posterUrl: '/videos/make-money-poster.jpg'
          };
        }
        return st;
      });
    }
    return sec;
  });
}

export async function GET() {
  try {
    // 1. Instant 0ms Memory Cache Hit
    const cached = globalThis.__serverSectionsCache;
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
        if (!isRevalidatingSections) {
          isRevalidatingSections = true;
          (async () => {
            try {
              const freshRows = await queryD1('SELECT data FROM homepage_articles WHERE id = "current_homepage_articles" LIMIT 1;');
              if (freshRows && freshRows.length > 0 && freshRows[0].data) {
                const parsed = JSON.parse(freshRows[0].data);
                const formatted = formatSections(parsed);
                const jsonString = JSON.stringify({ success: true, data: formatted });
                globalThis.__serverSectionsCache = { jsonString, timestamp: Date.now() };
              }
            } catch (e) {} finally {
              isRevalidatingSections = false;
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
    const rows = await queryD1('SELECT data FROM homepage_articles WHERE id = "current_homepage_articles" LIMIT 1;');
    if (rows && rows.length > 0 && rows[0].data) {
      const parsed = JSON.parse(rows[0].data);
      const formatted = formatSections(parsed);
      const jsonString = JSON.stringify({ success: true, data: formatted });
      globalThis.__serverSectionsCache = { jsonString, timestamp: Date.now() };
      return new Response(jsonString, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=15, s-maxage=60, stale-while-revalidate=300',
          'X-Cache': 'MISS'
        }
      });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (err) {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const sections = body.sections || [];

    await queryD1(`CREATE TABLE IF NOT EXISTS homepage_articles (id TEXT PRIMARY KEY, data TEXT, updated_at TEXT);`);
    await queryD1(
      `INSERT INTO homepage_articles (id, data, updated_at) VALUES ("current_homepage_articles", ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP;`,
      [JSON.stringify(sections)]
    );

    const formatted = formatSections(sections);
    globalThis.__serverSectionsCache = {
      jsonString: JSON.stringify({ success: true, data: formatted }),
      timestamp: Date.now()
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
