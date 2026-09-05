import { NextResponse } from 'next/server';
import { queryD1 } from '../../../../lib/edgeDb';

export const runtime = 'edge';

export async function GET() {
  try {
    await queryD1(`CREATE TABLE IF NOT EXISTS homepage_articles (id TEXT PRIMARY KEY, data TEXT, updated_at TEXT);`);
    const rows = await queryD1('SELECT data FROM homepage_articles WHERE id = "current_homepage_articles" LIMIT 1;');
    if (rows && rows.length > 0 && rows[0].data) {
      let parsed = JSON.parse(rows[0].data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed = parsed.map(sec => {
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

        return NextResponse.json(
          { success: true, data: parsed },
          { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400' } }
        );
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
    const sections = body.sections || [];

    await queryD1(`CREATE TABLE IF NOT EXISTS homepage_articles (id TEXT PRIMARY KEY, data TEXT, updated_at TEXT);`);
    await queryD1(
      `INSERT INTO homepage_articles (id, data, updated_at) VALUES ("current_homepage_articles", ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP;`,
      [JSON.stringify(sections)]
    );

    return NextResponse.json({ success: true, data: sections });
  } catch (err) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
