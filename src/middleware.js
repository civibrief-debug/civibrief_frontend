import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();

  // 1. Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "media-src 'self' blob: data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.binance.com https://translate.googleapis.com https://api.microlink.io https://api.fxtwitter.com https://*.googleapis.com https:",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://youtu.be https://player.vimeo.com https://www.dailymotion.com https://www.loom.com https://streamable.com https:",
    "frame-ancestors 'none'"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // 2. CSRF Guard for State-Changing Requests
  const method = request.method;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new NextResponse(
            JSON.stringify({ success: false, error: 'CSRF Origin mismatch rejected' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch (err) {
        return new NextResponse(
          JSON.stringify({ success: false, error: 'Invalid origin header' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};

