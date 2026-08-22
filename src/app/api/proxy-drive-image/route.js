import { NextResponse } from 'next/server';

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
    const imageUrls = [
      `https://drive.google.com/thumbnail?id=${cleanId}&sz=w2000`,
      `https://lh3.googleusercontent.com/d/${cleanId}`,
      `https://drive.google.com/uc?export=view&id=${cleanId}`
    ];

    let response = null;
    let imageStream = null;

    for (const targetUrl of imageUrls) {
      try {
        const res = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
          },
          redirect: 'follow'
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('image') || res.status === 200) {
            response = res;
            imageStream = res.body;
            break;
          }
        }
      } catch (e) {
        // Try next URL
      }
    }

    if (response && imageStream) {
      const headers = new Headers();
      headers.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
      headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200');
      headers.set('Access-Control-Allow-Origin', '*');
      if (response.headers.get('content-length')) {
        headers.set('Content-Length', response.headers.get('content-length'));
      }

      return new NextResponse(imageStream, {
        status: 200,
        headers
      });
    }

    // Fallback: Redirect to thumbnail URL
    return NextResponse.redirect(`https://drive.google.com/thumbnail?id=${cleanId}&sz=w2000`);
  } catch (error) {
    console.error('Error proxying Google Drive image:', error);
    return NextResponse.redirect(`https://drive.google.com/thumbnail?id=${cleanId}&sz=w1600`);
  }
}
