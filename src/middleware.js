import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();

  // 1. Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // 2. CSRF Guard for State-Changing Requests
  const method = request.method;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host && !originHost.endsWith(host) && !host.endsWith(originHost)) {
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
