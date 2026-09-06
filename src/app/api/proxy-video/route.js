import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
    }
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let cleanUrl = targetUrl.trim();
  if (cleanUrl.includes('6197175') || cleanUrl.includes('make-money-cover')) {
    return NextResponse.redirect(new URL('/videos/make-money-cover.mp4', request.url), {
      status: 301,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  }

  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  // Auto-resolve Pexels webpage to high-speed video download stream
  const pexelsMatch = cleanUrl.match(/(?:pexels\.com\/(?:video|download\/video)\/(?:[a-zA-Z0-9_-]+-)?(\d+)|video-files\/(\d+))/i);
  if (pexelsMatch && (pexelsMatch[1] || pexelsMatch[2])) {
    const pexelsId = pexelsMatch[1] || pexelsMatch[2];
    cleanUrl = `https://www.pexels.com/download/video/${pexelsId}/`;
  }

  try {
    const rangeHeader = request.headers.get('range');
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*'
    };

    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const res = await fetch(cleanUrl, {
      headers: fetchHeaders,
      redirect: 'follow'
    });

    if (!res.ok && res.status !== 206) {
      return NextResponse.redirect(cleanUrl);
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', res.headers.get('content-type') || 'video/mp4');
    
    // CRITICAL: Explicitly set Content-Disposition to inline so browsers STREAM instead of downloading
    responseHeaders.set('Content-Disposition', 'inline');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200');

    if (res.headers.get('content-range')) {
      responseHeaders.set('Content-Range', res.headers.get('content-range'));
    }
    if (res.headers.get('content-length')) {
      responseHeaders.set('Content-Length', res.headers.get('content-length'));
    }

    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('Error proxying online video:', error);
    return NextResponse.redirect(cleanUrl);
  }
}
