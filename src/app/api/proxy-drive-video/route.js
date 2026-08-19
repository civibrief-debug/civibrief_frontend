import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('id') || searchParams.get('fileId');

  if (!fileId) {
    return NextResponse.json({ error: 'Missing file id' }, { status: 400 });
  }

  const cleanId = fileId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanId) {
    return NextResponse.json({ error: 'Invalid file id' }, { status: 400 });
  }

  try {
    const streamUrls = [
      `https://drive.usercontent.google.com/download?id=${cleanId}&export=download&authuser=0`,
      `https://drive.google.com/uc?export=download&id=${cleanId}&confirm=t`,
      `https://docs.google.com/uc?export=download&id=${cleanId}`
    ];

    let response = null;
    let videoStream = null;

    for (const targetUrl of streamUrls) {
      try {
        const res = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*'
          },
          redirect: 'follow'
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('video') || contentType.includes('octet-stream') || contentType.includes('binary') || res.status === 200 || res.status === 206) {
            response = res;
            videoStream = res.body;
            break;
          }
        }
      } catch (e) {
        // Continue to next URL
      }
    }

    if (response && videoStream) {
      const headers = new Headers();
      headers.set('Content-Type', response.headers.get('content-type') || 'video/mp4');
      headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200');
      headers.set('Accept-Ranges', 'bytes');
      if (response.headers.get('content-length')) {
        headers.set('Content-Length', response.headers.get('content-length'));
      }

      return new NextResponse(videoStream, {
        status: response.status || 200,
        headers
      });
    }

    // Fallback: Redirect directly
    return NextResponse.redirect(`https://drive.usercontent.google.com/download?id=${cleanId}&export=download`);
  } catch (error) {
    console.error('Error proxying Google Drive video:', error);
    return NextResponse.redirect(`https://drive.google.com/uc?export=download&id=${cleanId}`);
  }
}
