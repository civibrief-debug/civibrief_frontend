import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let cleanUrl = targetUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
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
