import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const inputUrl = body?.url?.trim();

    if (!inputUrl) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    const cleanUrl = inputUrl.startsWith('http') || inputUrl.startsWith('data:') ? inputUrl : `https://${inputUrl}`;

    // 1. DIRECT IMAGE URL
    const isDirectImg = /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(cleanUrl) ||
                        cleanUrl.startsWith('data:image/') ||
                        /pbs\.twimg\.com\/media|ton\.twitter\.com|fbcdn\.net|cdninstagram\.com|i\.redd\.it|preview\.redd\.it|images\.unsplash\.com|i\.imgur\.com|i\.ibb\.co|res\.cloudinary\.com|pinimg\.com|media\.giphy\.com/i.test(cleanUrl) ||
                        /twimg\.com\/.*format=(jpg|png|webp|jpeg)/i.test(cleanUrl);

    if (isDirectImg) {
      return NextResponse.json({
        success: true,
        imageUrl: cleanUrl,
        provider: 'Direct Image',
        caption: ''
      });
    }

    // 2. TWITTER / X (Uncompressed full original photo)
    const twitterMatch = cleanUrl.match(/(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/i);
    if (twitterMatch) {
      const user = twitterMatch[1];
      const id = twitterMatch[2];
      try {
        const res = await fetch(`https://api.fxtwitter.com/${user}/status/${id}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
          const data = await res.json();
          const photoUrl = data.tweet?.media?.photos?.[0]?.url || data.tweet?.media?.all?.[0]?.url;
          if (photoUrl) {
            return NextResponse.json({
              success: true,
              imageUrl: photoUrl,
              provider: 'Twitter / X',
              caption: data.tweet?.text ? `Photo via @${user} on X: "${data.tweet.text.slice(0, 80)}..."` : `Photo credit: @${user} on X`
            });
          }
        }
      } catch (err) {
        console.warn('FxTwitter extract warning:', err?.message);
      }
    }

    // 3. YOUTUBE VIDEO THUMBNAIL
    const ytMatch = cleanUrl.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      const maxResUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      return NextResponse.json({
        success: true,
        imageUrl: maxResUrl,
        provider: 'YouTube Thumbnail',
        caption: 'Video still / thumbnail from YouTube'
      });
    }

    // 4. INSTAGRAM & THREADS (Extract 100% Full Uncropped HD Photo)
    const instaMatch = cleanUrl.match(/(?:instagram\.com)\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/i);
    if (instaMatch) {
      const postId = instaMatch[1];
      try {
        const embedUrl = `https://www.instagram.com/p/${postId}/embed/`;
        const res = await fetch(embedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15'
          },
          signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
          const html = await res.text();
          // Priority 1: Match EmbeddedMediaImage
          const mainImgMatch = html.match(/class=["'][^"']*EmbeddedMediaImage[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
                               html.match(/src=["']([^"']+)["'][^>]+class=["'][^"']*EmbeddedMediaImage[^"']*["']/i);
          
          let targetImg = mainImgMatch ? mainImgMatch[1].replace(/&amp;/g, '&') : null;

          // Priority 2: Find all uncropped 1080p images in embed
          if (!targetImg) {
            const allImgMatches = [...html.matchAll(/https:\/\/[^"'\\]+?(?:fbcdn\.net|scontent\.cdninstagram\.com)[^"'\\]+/g)]
              .map(m => m[0].replace(/\\u0026/g, '&').replace(/&amp;/g, '&').replace(/\\/g, ''))
              .filter(u => !u.includes('profile_pic') && !u.includes('s100x100') && !u.includes('s150x150'));
            
            if (allImgMatches.length > 0) {
              const uncropped = allImgMatches.find(u => !/stp=c\d+/i.test(u)) || allImgMatches[0];
              targetImg = uncropped;
            }
          }

          if (targetImg) {
            return NextResponse.json({
              success: true,
              imageUrl: targetImg,
              provider: 'Instagram Photo (Full Uncropped)',
              caption: 'Photo credit: Instagram'
            });
          }
        }
      } catch (e) {
        console.warn('Instagram uncropped extract warning:', e?.message);
      }
    }

    // 5. FACEBOOK / PINTEREST / REDDIT / TIKTOK / GENERAL WEBPAGES (MicroLink API)
    try {
      const mlRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(cleanUrl)}`, {
        signal: AbortSignal.timeout(6000)
      });
      if (mlRes.ok) {
        const data = await mlRes.json();
        if (data?.data?.image?.url && !data.data.image.url.includes('static.cdninstagram.com/rsrc.php')) {
          const captionText = data?.data?.title ? `Image via ${data.data.title}` : '';
          return NextResponse.json({
            success: true,
            imageUrl: data.data.image.url,
            provider: 'Social / Web Photo',
            caption: captionText
          });
        }
      }
    } catch (e) {
      console.warn('MicroLink extraction warning:', e?.message);
    }

    // 6. DIRECT OPENGRAPH & TWITTER CARDS SCRAPER
    try {
      const pageRes = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.html)'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (pageRes.ok) {
        const html = await pageRes.text();
        
        // Find meta image tags
        const ogImageMatch = html.match(/<meta[^>]+property=["'](?:og:image:secure_url|og:image)["'][^>]+content=["']([^"']+)["']/i) ||
                             html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["'](?:og:image:secure_url|og:image)["']/i) ||
                             html.match(/<meta[^>]+name=["'](?:twitter:image:src|twitter:image)["'][^>]+content=["']([^"']+)["']/i) ||
                             html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["'](?:twitter:image:src|twitter:image)["']/i) ||
                             html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i);

        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                           html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);

        if (ogImageMatch && ogImageMatch[1]) {
          let extractedImg = ogImageMatch[1].trim().replace(/&amp;/g, '&');
          if (!extractedImg.startsWith('http') && !extractedImg.startsWith('//')) {
            extractedImg = new URL(extractedImg, cleanUrl).href;
          } else if (extractedImg.startsWith('//')) {
            extractedImg = 'https:' + extractedImg;
          }

          const captionText = titleMatch && titleMatch[1] ? `Image: ${titleMatch[1].trim()}` : '';

          return NextResponse.json({
            success: true,
            imageUrl: extractedImg,
            provider: 'Webpage Photo',
            caption: captionText
          });
        }
      }
    } catch (fetchErr) {
      console.warn('Webpage OpenGraph fetch warning:', fetchErr?.message);
    }

    // 7. GUARANTEED UNIVERSAL SNAPSHOT PROXY (Never produces a broken image)
    const universalSnapshotUrl = `https://api.microlink.io?url=${encodeURIComponent(cleanUrl)}&screenshot=true&embed=screenshot.url`;
    return NextResponse.json({
      success: true,
      imageUrl: universalSnapshotUrl,
      provider: 'Universal Social Image',
      caption: 'Source: ' + cleanUrl
    });

  } catch (err) {
    console.error('Extract Media Image Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
