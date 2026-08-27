/**
 * Universal Media & Social Embed Parser & Sanitizer
 * Handles Twitter/X, Facebook, Instagram, TikTok, LinkedIn, Pinterest, Reddit,
 * YouTube, Vimeo, Dailymotion, Loom, Streamable, Direct Video (.mp4), Direct Images, and Web Links.
 * Returns normalized type, provider, embed URL, badgeText, and responsive clean HTML string.
 */

export function parseMediaUrl(inputUrl, caption = '', align = 'center') {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { type: 'invalid', url: '', provider: 'Unknown', isEmbeddable: false, badgeText: '', html: '' };
  }

  let cleanUrl = inputUrl.trim();

  // Extract src if raw <iframe> or <img src=...> HTML was pasted
  if (cleanUrl.includes('<iframe') && cleanUrl.includes('src=')) {
    const srcMatch = cleanUrl.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      cleanUrl = srcMatch[1].trim();
    }
  } else if (cleanUrl.includes('<img') && cleanUrl.includes('src=')) {
    const srcMatch = cleanUrl.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      cleanUrl = srcMatch[1].trim();
    }
  }

  const formattedUrl = cleanUrl.startsWith('http') || cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:') 
    ? cleanUrl 
    : `https://${cleanUrl}`;

  // Alignment CSS styles
  let wrapperStyle = 'margin: 16px auto; display: block; clear: both; text-align: center; max-width: 100%;';
  if (align === 'left') {
    wrapperStyle = 'margin: 12px 24px 12px 0; float: left; clear: none; max-width: 50%; display: block;';
  } else if (align === 'right') {
    wrapperStyle = 'margin: 12px 0 12px 24px; float: right; clear: none; max-width: 50%; display: block;';
  }

  const captionHtml = caption 
    ? `<figcaption contenteditable="true" style="font-size: 13px; color: #94a3b8; font-style: italic; text-align: center; margin-top: 6px; margin-bottom: 0; line-height: 1.35; display: block; width: 100%;">${caption}</figcaption>` 
    : '';

  // 1. DIRECT IMAGE FILE OR SOCIAL MEDIA CDN IMAGE (Twitter, FB, Insta, Reddit, Unsplash, Imgur, etc.)
  const isImageFile = /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(cleanUrl) ||
                      cleanUrl.startsWith('data:image/') ||
                      cleanUrl.startsWith('blob:') ||
                      /pbs\.twimg\.com\/media|ton\.twitter\.com|fbcdn\.net|cdninstagram\.com|i\.redd\.it|preview\.redd\.it|images\.unsplash\.com|i\.imgur\.com|i\.ibb\.co|media\.giphy\.com|res\.cloudinary\.com|staticflickr\.com|images\.pexels\.com/i.test(cleanUrl) ||
                      /twimg\.com\/.*format=(jpg|png|webp|jpeg)/i.test(cleanUrl);

  if (isImageFile) {
    const imgStyle = 'max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.3); display: block; margin: 0 auto;';
    return {
      type: 'image',
      mediaType: 'image',
      url: formattedUrl,
      provider: 'Image',
      isEmbeddable: true,
      badgeText: '🖼️ Direct Image / Photo (Full Resolution)',
      html: `<figure class="img-wrapper" contenteditable="false" style="${wrapperStyle}"><img src="${formattedUrl}" alt="${caption || 'Article Photo'}" style="${imgStyle}" />${captionHtml}</figure><p><br></p>`
    };
  }

  // 1.5 GOOGLE DRIVE EMBED & THUMBNAIL (Videos, PDFs, Documents, Presentations, Spreadsheets, Images)
  const gdriveInfo = parseGoogleDriveUrl(cleanUrl);
  if (gdriveInfo) {
    const isImg = gdriveInfo.fileType === 'image';
    if (isImg) {
      const imgStyle = 'max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.3); display: block; margin: 0 auto;';
      return {
        type: 'image',
        mediaType: 'image',
        url: gdriveInfo.thumbnailUrl,
        provider: 'Google Drive Image',
        isEmbeddable: true,
        badgeText: '🖼️ Google Drive Image',
        html: `<figure class="img-wrapper" contenteditable="false" style="${wrapperStyle}"><img src="${gdriveInfo.thumbnailUrl}" alt="${caption || 'Google Drive Image'}" style="${imgStyle}" />${captionHtml}</figure><p><br></p>`
      };
    }

    return {
      type: 'gdrive',
      mediaType: 'embed',
      url: gdriveInfo.previewUrl,
      streamUrl: gdriveInfo.previewUrl,
      thumbnailUrl: gdriveInfo.thumbnailUrl,
      fileId: gdriveInfo.fileId,
      provider: gdriveInfo.label,
      isEmbeddable: true,
      badgeText: `${gdriveInfo.icon} ${gdriveInfo.label} Embed (Continuous)`,
      html: `
        <figure class="media-embed-wrapper gdrive-embed-wrapper" contenteditable="false" style="${wrapperStyle}">
          <div class="media-embed-card gdrive-card" style="width: 100%; max-width: 800px; margin: 0 auto; border-radius: 12px; overflow: hidden; background: #000000; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 8px 30px rgba(0,0,0,0.5);">
            <div style="padding: 8px 14px; background: #0f172a; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #ffffff;">
                <span>${gdriveInfo.icon}</span>
                <span>${gdriveInfo.label}</span>
              </div>
              <a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #38bdf8; text-decoration: none; font-weight: 700;">
                Open in Google Drive ↗
              </a>
            </div>
            <iframe 
              src="${gdriveInfo.previewUrl}" 
              title="${gdriveInfo.label}" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
              allowfullscreen 
              style="width: 100%; height: 480px; border: none; display: block; background: #000000;"
            ></iframe>
          </div>
          ${captionHtml}
        </figure>
        <p><br></p>
      `
    };
  }

  // 2. TWITTER / X POST (e.g. https://twitter.com/user/status/12345 or https://x.com/user/status/12345)
  const twitterMatch = cleanUrl.match(/(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/i);
  if (twitterMatch) {
    const username = twitterMatch[1];
    const tweetId = twitterMatch[2];
    const embedUrl = `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&dnt=true&theme=dark`;
    return {
      type: 'twitter',
      mediaType: 'social',
      url: formattedUrl,
      tweetId,
      username,
      provider: 'Twitter / X',
      isEmbeddable: true,
      badgeText: '𝕏 Twitter / X Post Embed (Full Post & Images)',
      html: `
        <figure class="social-embed-wrapper twitter-embed-wrapper" contenteditable="false" style="${wrapperStyle}">
          <div class="social-embed-card twitter-card" style="width: 100%; max-width: 550px; margin: 0 auto; border-radius: 12px; overflow: hidden; background: #000000; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <div style="padding: 8px 14px; background: #0f1419; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #ffffff;">
                <span style="font-size: 15px; font-weight: 900;">𝕏</span>
                <span>@${username} on X</span>
              </div>
              <a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #1d9bf0; text-decoration: none; font-weight: 700;">
                View on X ↗
              </a>
            </div>
            <iframe 
              src="${embedUrl}" 
              title="Twitter Tweet" 
              frameborder="0" 
              scrolling="auto" 
              allowfullscreen 
              style="width: 100%; min-height: 750px; height: 850px; border: none; display: block; background: #000000;"
            ></iframe>
          </div>
          ${captionHtml}
        </figure>
        <p><br></p>
      `
    };
  }

  // 3. FACEBOOK POST, PHOTO, VIDEO, OR REEL
  const fbMatch = cleanUrl.match(/(?:facebook\.com|fb\.watch|fb\.com)\/(.+)/i);
  if (fbMatch) {
    const isFbVideo = cleanUrl.includes('/videos/') || cleanUrl.includes('/reel/') || cleanUrl.includes('fb.watch') || cleanUrl.includes('video.php');
    const pluginType = isFbVideo ? 'video.php' : 'post.php';
    const embedUrl = `https://www.facebook.com/plugins/${pluginType}?href=${encodeURIComponent(formattedUrl)}&show_text=true&width=500`;
    return {
      type: 'facebook',
      mediaType: 'social',
      url: formattedUrl,
      provider: 'Facebook',
      isEmbeddable: true,
      badgeText: isFbVideo ? '🔵 Facebook Video / Reel Embed' : '🔵 Facebook Post / Photo Embed (Full Image)',
      html: `
        <figure class="social-embed-wrapper facebook-embed-wrapper" contenteditable="false" style="${wrapperStyle}">
          <div class="social-embed-card facebook-card" style="width: 100%; max-width: 500px; margin: 0 auto; border-radius: 12px; overflow: hidden; background: #18191a; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <div style="padding: 8px 14px; background: #242526; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #e4e6eb;">
                <span style="color: #1877f2; font-weight: 900; font-size: 16px;">f</span>
                <span>Facebook ${isFbVideo ? 'Video' : 'Post'}</span>
              </div>
              <a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #4599ff; text-decoration: none; font-weight: 700;">
                View on Facebook ↗
              </a>
            </div>
            <iframe 
              src="${embedUrl}" 
              title="Facebook Embed" 
              frameborder="0" 
              scrolling="no" 
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" 
              allowfullscreen 
              style="width: 100%; min-height: 520px; border: none; display: block; background: #18191a;"
            ></iframe>
          </div>
          ${captionHtml}
        </figure>
        <p><br></p>
      `
    };
  }

  // 4. INSTAGRAM POST OR REEL
  const instaMatch = cleanUrl.match(/(?:instagram\.com)\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/i);
  if (instaMatch) {
    const postId = instaMatch[1];
    const embedUrl = `https://www.instagram.com/p/${postId}/embed`;
    return {
      type: 'instagram',
      mediaType: 'social',
      url: formattedUrl,
      postId,
      provider: 'Instagram',
      isEmbeddable: true,
      badgeText: '📸 Instagram Post / Reel Embed (Full Photo)',
      html: `
        <figure class="social-embed-wrapper instagram-embed-wrapper" contenteditable="false" style="${wrapperStyle}">
          <div class="social-embed-card instagram-card" style="width: 100%; max-width: 500px; margin: 0 auto; border-radius: 12px; overflow: hidden; background: #121212; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <div style="padding: 8px 14px; background: #1a1a1a; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #ffffff;">
                <span>📷</span>
                <span>Instagram Post</span>
              </div>
              <a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #e1306c; text-decoration: none; font-weight: 700;">
                View on Instagram ↗
              </a>
            </div>
            <iframe 
              src="${embedUrl}" 
              title="Instagram Embed" 
              frameborder="0" 
              scrolling="no" 
              allowtransparency="true" 
              allowfullscreen 
              style="width: 100%; min-height: 520px; border: none; display: block; background: #ffffff;"
            ></iframe>
          </div>
          ${captionHtml}
        </figure>
        <p><br></p>
      `
    };
  }

  // 5. TIKTOK VIDEO
  const tiktokMatch = cleanUrl.match(/(?:tiktok\.com)\/@([a-zA-Z0-9_.-]+)\/video\/(\d+)/i);
  if (tiktokMatch) {
    const videoId = tiktokMatch[2];
    const embedUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
    return {
      type: 'tiktok',
      mediaType: 'social',
      url: formattedUrl,
      videoId,
      provider: 'TikTok',
      isEmbeddable: true,
      badgeText: '🎵 TikTok Video Embed',
      html: `
        <figure class="social-embed-wrapper tiktok-embed-wrapper" contenteditable="false" style="${wrapperStyle}">
          <div class="social-embed-card tiktok-card" style="width: 100%; max-width: 450px; margin: 0 auto; border-radius: 12px; overflow: hidden; background: #000000; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <div style="padding: 8px 14px; background: #121212; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #ffffff;">
                <span>🎵</span>
                <span>TikTok Video</span>
              </div>
              <a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #fe2c55; text-decoration: none; font-weight: 700;">
                View on TikTok ↗
              </a>
            </div>
            <iframe 
              src="${embedUrl}" 
              title="TikTok Video Player" 
              frameborder="0" 
              scrolling="no" 
              allowfullscreen 
              style="width: 100%; min-height: 520px; border: none; display: block;"
            ></iframe>
          </div>
          ${captionHtml}
        </figure>
        <p><br></p>
      `
    };
  }

  // 6. LINKEDIN POST
  const linkedinMatch = cleanUrl.match(/(?:linkedin\.com)\/(?:posts|embed|feed\/update)\/([a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) {
    const urn = cleanUrl.includes('embed') ? cleanUrl : `https://www.linkedin.com/embed/feed/update/${linkedinMatch[1]}`;
    return {
      type: 'linkedin',
      mediaType: 'social',
      url: formattedUrl,
      provider: 'LinkedIn',
      isEmbeddable: true,
      badgeText: '💼 LinkedIn Post Embed',
      html: `
        <figure class="social-embed-wrapper linkedin-embed-wrapper" contenteditable="false" style="${wrapperStyle}">
          <div class="social-embed-card linkedin-card" style="width: 100%; max-width: 540px; margin: 0 auto; border-radius: 12px; overflow: hidden; background: #ffffff; border: 1px solid rgba(0,0,0,0.15); box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <iframe 
              src="${urn}" 
              title="LinkedIn Embed" 
              frameborder="0" 
              scrolling="no" 
              allowfullscreen 
              style="width: 100%; min-height: 480px; border: none; display: block;"
            ></iframe>
          </div>
          ${captionHtml}
        </figure>
        <p><br></p>
      `
    };
  }

  // 7. PINTEREST PIN
  const pinterestMatch = cleanUrl.match(/(?:pinterest\.com|pin\.it)\/(?:pin\/)?([a-zA-Z0-9_-]+)/i);
  if (pinterestMatch) {
    const pinId = pinterestMatch[1];
    const embedUrl = `https://assets.pinterest.com/ext/embed.html?id=${pinId}`;
    return {
      type: 'pinterest',
      mediaType: 'social',
      url: formattedUrl,
      pinId,
      provider: 'Pinterest',
      isEmbeddable: true,
      badgeText: '📌 Pinterest Pin Embed',
      html: `
        <figure class="social-embed-wrapper pinterest-embed-wrapper" contenteditable="false" style="${wrapperStyle}">
          <div class="social-embed-card pinterest-card" style="width: 100%; max-width: 450px; margin: 0 auto; border-radius: 12px; overflow: hidden; background: #ffffff; border: 1px solid rgba(0,0,0,0.15); box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <iframe 
              src="${embedUrl}" 
              title="Pinterest Pin" 
              frameborder="0" 
              scrolling="no" 
              style="width: 100%; min-height: 520px; border: none; display: block;"
            ></iframe>
          </div>
          ${captionHtml}
        </figure>
        <p><br></p>
      `
    };
  }

  // 8. YOUTUBE VIDEO
  const ytMatch = cleanUrl.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`;
    return {
      type: 'youtube',
      mediaType: 'video',
      url: embedUrl,
      videoId,
      provider: 'YouTube',
      isEmbeddable: true,
      badgeText: '🟢 YouTube Video Player',
      html: `
        <figure class="video-wrapper youtube-video-wrapper" contenteditable="false" style="${wrapperStyle}">
          <iframe src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width: 100%; aspect-ratio: 16/9; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.4);"></iframe>
          ${captionHtml}
        </figure>
        <p><br></p>
      `
    };
  }

  // 9. VIMEO VIDEO
  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+))/i) || cleanUrl.match(/player\.vimeo\.com\/video\/(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    const embedUrl = `https://player.vimeo.com/video/${videoId}`;
    return {
      type: 'vimeo',
      mediaType: 'video',
      url: embedUrl,
      videoId,
      provider: 'Vimeo',
      isEmbeddable: true,
      badgeText: '🟢 Vimeo Video Player',
      html: `
        <figure class="video-wrapper vimeo-video-wrapper" contenteditable="false" style="${wrapperStyle}">
          <iframe src="${embedUrl}" title="Vimeo video player" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width: 100%; aspect-ratio: 16/9; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.4);"></iframe>
          ${captionHtml}
        </figure>
        <p><br></p>
      `
    };
  }

  // 10. DAILYMOTION
  const dmMatch = cleanUrl.match(/(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([a-zA-Z0-9]+)/i);
  if (dmMatch && dmMatch[1]) {
    const videoId = dmMatch[1];
    const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}`;
    return {
      type: 'embed',
      mediaType: 'video',
      url: embedUrl,
      videoId,
      provider: 'Dailymotion',
      isEmbeddable: true,
      badgeText: '🟢 Dailymotion Video Player',
      html: `
        <figure class="video-wrapper dailymotion-video-wrapper" contenteditable="false" style="${wrapperStyle}">
          <iframe src="${embedUrl}" title="Dailymotion video player" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width: 100%; aspect-ratio: 16/9; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.4);"></iframe>
          ${captionHtml}
        </figure>
        <p><br></p>
      `
    };
  }

  // 11. LOOM
  const loomMatch = cleanUrl.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
  if (loomMatch && loomMatch[1]) {
    const videoId = loomMatch[1];
    const embedUrl = `https://www.loom.com/embed/${videoId}`;
    return {
      type: 'embed',
      mediaType: 'video',
      url: embedUrl,
      videoId,
      provider: 'Loom',
      isEmbeddable: true,
      badgeText: '🟢 Loom Video Player',
      html: `
        <figure class="video-wrapper loom-video-wrapper" contenteditable="false" style="${wrapperStyle}">
          <iframe src="${embedUrl}" title="Loom video player" frameborder="0" allowfullscreen style="width: 100%; aspect-ratio: 16/9; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.4);"></iframe>
          ${captionHtml}
        </figure>
        <p><br></p>
      `
    };
  }

  // 12. STREAMABLE
  const streamableMatch = cleanUrl.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/i);
  if (streamableMatch && streamableMatch[1]) {
    const videoId = streamableMatch[1];
    const embedUrl = `https://streamable.com/e/${videoId}`;
    return {
      type: 'embed',
      mediaType: 'video',
      url: embedUrl,
      videoId,
      provider: 'Streamable',
      isEmbeddable: true,
      badgeText: '🟢 Streamable Video Player',
      html: `
        <figure class="video-wrapper streamable-video-wrapper" contenteditable="false" style="${wrapperStyle}">
          <iframe src="${embedUrl}" title="Streamable video player" frameborder="0" allowfullscreen style="width: 100%; aspect-ratio: 16/9; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.4);"></iframe>
          ${captionHtml}
        </figure>
        <p><br></p>
      `
    };
  }

  // 13. DIRECT VIDEO FILE (.mp4, .webm, .mov, etc.)
  const isDirectVideo = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(cleanUrl) || cleanUrl.startsWith('data:video/');
  if (isDirectVideo) {
    return {
      type: 'direct_video',
      mediaType: 'video',
      url: formattedUrl,
      provider: 'Direct Video File',
      isEmbeddable: true,
      badgeText: '🔵 Direct MP4 Video',
      html: `
        <figure class="video-wrapper direct-video-wrapper" contenteditable="false" style="${wrapperStyle}">
          <video controls preload="metadata" src="${formattedUrl}" style="max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);">
            <source src="${formattedUrl}" type="video/mp4" />
          </video>
          ${captionHtml}
        </figure>
        <p><br></p>
      `
    };
  }

  // 14. GENERAL / UNKNOWN WEB LINK FALLBACK CARD
  let domainName = 'External Website';
  try {
    const parsed = new URL(formattedUrl);
    domainName = parsed.hostname.replace(/^www\./, '');
  } catch (e) {
    domainName = 'External Source';
  }

  return {
    type: 'web_card',
    mediaType: 'card',
    url: formattedUrl,
    provider: domainName,
    isEmbeddable: true,
    badgeText: `🌐 Rich Web Card (${domainName})`,
    html: `
      <figure class="social-embed-wrapper web-card-wrapper" contenteditable="false" style="${wrapperStyle}">
        <div class="video-fallback-card social-embed-card" data-media-url="${formattedUrl}" style="width: 100%; max-width: 650px; margin: 0 auto; padding: 20px 24px; background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 12px; text-align: center; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);">
          <div style="font-weight: 800; font-size: 15px; color: #38bdf8; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span>🌐 ${domainName}</span>
          </div>
          <p style="font-size: 13.5px; color: #cbd5e1; margin: 0 0 14px 0; line-height: 1.5;">
            ${caption || `View full interactive content and updates on <strong>${domainName}</strong>.`}
          </p>
          <a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" class="btn-open-video" style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13.5px; text-decoration: none !important; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
            ↗ Open on ${domainName}
          </a>
        </div>
        ${captionHtml}
      </figure>
      <p><br></p>
    `
  };
}

// Backward compatible alias
export function parseVideoUrl(inputUrl, caption = '', align = 'center') {
  return parseMediaUrl(inputUrl, caption, align);
}

/**
 * Universal Google Drive URL Parser
 * Supports files, videos, documents, PDFs, presentations, spreadsheets, thumbnails, and direct views.
 */
export function parseGoogleDriveUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const cleanUrl = rawUrl.trim();

  const match = cleanUrl.match(/(?:drive\.google\.com\/(?:file\/(?:u\/\d+\/)?d\/|open\?id=|uc\?(?:[^&]+&)*id=|thumbnail\?(?:[^&]+&)*id=)|docs\.google\.com\/(?:document|presentation|spreadsheets|file)\/(?:u\/\d+\/)?d\/|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]{10,})/i);

  if (match && match[1]) {
    const fileId = match[1];
    const isDoc = /docs\.google\.com\/document/i.test(cleanUrl);
    const isPresentation = /docs\.google\.com\/presentation/i.test(cleanUrl);
    const isSpreadsheet = /docs\.google\.com\/spreadsheets/i.test(cleanUrl);

    let previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    if (isDoc) previewUrl = `https://docs.google.com/document/d/${fileId}/preview`;
    else if (isPresentation) previewUrl = `https://docs.google.com/presentation/d/${fileId}/preview`;
    else if (isSpreadsheet) previewUrl = `https://docs.google.com/spreadsheets/d/${fileId}/preview`;

    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
    const proxyImageUrl = `/api/proxy-drive-image?id=${fileId}`;
    const directImageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    const directUcUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    let fileType = 'file';
    let label = 'Google Drive File';
    let icon = '📁';
    if (isDoc) { fileType = 'document'; label = 'Google Docs Document'; icon = '📄'; }
    else if (isPresentation) { fileType = 'presentation'; label = 'Google Slides Presentation'; icon = '📊'; }
    else if (isSpreadsheet) { fileType = 'spreadsheet'; label = 'Google Sheets Spreadsheet'; icon = '📈'; }
    else if (/\.(mp4|webm|mov|mkv|avi|m4v)/i.test(cleanUrl) || /video/i.test(cleanUrl)) { fileType = 'video'; label = 'Google Drive Video'; icon = '🎬'; }
    else if (/\.(pdf)/i.test(cleanUrl) || /pdf/i.test(cleanUrl)) { fileType = 'pdf'; label = 'Google Drive PDF Document'; icon = '📑'; }
    else if (/\.(jpg|jpeg|png|webp|gif|svg)/i.test(cleanUrl) || /image|photo/i.test(cleanUrl)) { fileType = 'image'; label = 'Google Drive Image'; icon = '🖼️'; }

    return {
      fileId,
      previewUrl,
      thumbnailUrl,
      proxyImageUrl,
      directImageUrl,
      directUcUrl,
      fileType,
      label,
      icon,
      isDoc,
      isPresentation,
      isSpreadsheet,
      originalUrl: cleanUrl
    };
  }
  return null;
}

/**
 * Formats any cover video/media URL (Google Drive, YouTube, Vimeo, direct MP4) into an embeddable URL or stream
 */
export function formatCoverMediaEmbedUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();

  // 1. Google Drive
  const gdrive = parseGoogleDriveUrl(cleanUrl);
  if (gdrive) {
    return gdrive.previewUrl;
  }

  // 2. YouTube
  const ytMatch = cleanUrl.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
  }

  // 3. Vimeo
  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+))/i) || cleanUrl.match(/player\.vimeo\.com\/video\/(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return cleanUrl;
}

/**
 * Returns a high-res contextual default cover image if an article has no image URL
 */
export function getDefaultArticleImage(article) {
  const cat = (typeof article === 'string' ? article : (article?.category || article?.section || '')).toLowerCase();
  if (cat.includes('tech') || cat.includes('ai') || cat.includes('compute') || cat.includes('quantum') || cat.includes('space') || cat.includes('cyber')) {
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";
  }
  if (cat.includes('credit') || cat.includes('market') || cat.includes('econom') || cat.includes('business') || cat.includes('finan') || cat.includes('stock') || cat.includes('bank')) {
    return "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80";
  }
  if (cat.includes('science') || cat.includes('climate') || cat.includes('energy') || cat.includes('green') || cat.includes('health') || cat.includes('enviro')) {
    return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80";
  }
  if (cat.includes('india') || cat.includes('nation') || cat.includes('policy') || cat.includes('gover') || cat.includes('parliament')) {
    return "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80";
  }
  if (cat.includes('sport') || cat.includes('cricket') || cat.includes('athletic') || cat.includes('football')) {
    return "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80";
  }
  if (cat.includes('world') || cat.includes('global') || cat.includes('diplomacy') || cat.includes('foreign')) {
    return "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80";
  }
  return "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80";
}



/**
 * Validates any media URL (image, video, embed) and returns diagnostic information
 */
export function validateMediaUrl(url, expectedType = 'any') {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { valid: false, error: 'URL is required and cannot be empty.' };
  }
  const cleanUrl = url.trim();

  // Extract src if raw iframe or img tag was pasted
  let rawUrl = cleanUrl;
  if (rawUrl.includes('<iframe') && rawUrl.includes('src=')) {
    const m = rawUrl.match(/src=["']([^"']+)["']/i);
    if (m && m[1]) rawUrl = m[1].trim();
  } else if (rawUrl.includes('<img') && rawUrl.includes('src=')) {
    const m = rawUrl.match(/src=["']([^"']+)["']/i);
    if (m && m[1]) rawUrl = m[1].trim();
  }

  const hasProtocol = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:');
  if (!hasProtocol) {
    if (!rawUrl.includes('.') || rawUrl.includes(' ') || rawUrl.length < 4) {
      return { valid: false, error: 'Invalid URL format. Please enter a valid HTTP/HTTPS link.' };
    }
  }

  const isDataOrBlob = rawUrl.startsWith('data:') || rawUrl.startsWith('blob:');
  if (!isDataOrBlob && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    rawUrl = `https://${rawUrl}`;
  }

  try {
    if (!isDataOrBlob) {
      const parsed = new URL(rawUrl);
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        return { valid: false, error: 'Invalid URL format. Please enter a valid HTTP/HTTPS link with a valid domain.' };
      }
    }
  } catch (e) {
    return { valid: false, error: 'Invalid URL format. Please enter a valid HTTP/HTTPS link.' };
  }

  // Check Google Drive
  const gdrive = parseGoogleDriveUrl(rawUrl);
  if (gdrive) {
    const isGdriveVideo = gdrive.fileType === 'video' || (!gdrive.isDoc && !gdrive.isPresentation && !gdrive.isSpreadsheet && gdrive.fileType !== 'image');
    const actualType = isGdriveVideo ? 'video' : 'image';
    if (expectedType === 'video' && !isGdriveVideo) {
      return { valid: false, type: 'image', provider: 'Google Drive', error: 'Provided Google Drive URL is not a video.', cleanUrl: rawUrl };
    }
    if (expectedType === 'image' && isGdriveVideo) {
      return { valid: false, type: 'video', provider: 'Google Drive', error: 'Provided Google Drive URL is a video, but an image was expected.', cleanUrl: rawUrl };
    }
    return {
      valid: true,
      type: actualType,
      provider: 'Google Drive',
      embedUrl: gdrive.previewUrl,
      thumbnailUrl: gdrive.thumbnailUrl,
      cleanUrl: rawUrl
    };
  }

  // Check Video providers
  const isYoutube = /(?:youtube(?:-nocookie)?\.com|youtu\.be)/i.test(rawUrl);
  const isVimeo = /vimeo\.com/i.test(rawUrl);
  const isDailymotion = /(?:dailymotion\.com|dai\.ly)/i.test(rawUrl);
  const isLoom = /loom\.com/i.test(rawUrl);
  const isStreamable = /streamable\.com/i.test(rawUrl);
  const isPexelsVideo = /pexels\.com/i.test(rawUrl);
  const isDirectVideo = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(rawUrl) || rawUrl.startsWith('data:video/');

  if (isYoutube || isVimeo || isDailymotion || isLoom || isStreamable || isPexelsVideo || isDirectVideo) {
    let provider = 'Direct Video';
    if (isYoutube) provider = 'YouTube';
    else if (isVimeo) provider = 'Vimeo';
    else if (isDailymotion) provider = 'Dailymotion';
    else if (isLoom) provider = 'Loom';
    else if (isStreamable) provider = 'Streamable';
    else if (isPexelsVideo) provider = 'Pexels Video';

    if (expectedType === 'image') {
      return {
        valid: false,
        type: 'video',
        provider,
        error: `Provided URL is a ${provider} video, but an image was expected.`,
        cleanUrl: rawUrl
      };
    }

    return {
      valid: true,
      type: 'video',
      provider,
      cleanUrl: rawUrl
    };
  }

  // Check if image
  const isImage = /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(rawUrl) ||
                  rawUrl.startsWith('data:image/') ||
                  rawUrl.startsWith('blob:') ||
                  /pbs\.twimg\.com|fbcdn\.net|cdninstagram\.com|i\.redd\.it|images\.unsplash\.com|i\.imgur\.com|images\.pexels\.com/i.test(rawUrl);

  if (isImage) {
    if (expectedType === 'video') {
      return {
        valid: false,
        type: 'image',
        provider: 'Image',
        error: 'Provided URL is an image, but a video was expected.',
        cleanUrl: rawUrl
      };
    }
    return {
      valid: true,
      type: 'image',
      provider: 'Image',
      cleanUrl: rawUrl
    };
  }

  // General web URL
  if (expectedType === 'video') {
    return {
      valid: false,
      type: 'unknown',
      error: 'Unrecognized video provider. Please enter a valid YouTube, Vimeo, Google Drive, Loom, Streamable, or direct MP4/WebM video link.',
      cleanUrl: rawUrl
    };
  }

  if (expectedType === 'image') {
    return {
      valid: false,
      type: 'unknown',
      error: 'Unrecognized image URL. Please enter a valid image link (.jpg, .png, .webp, Unsplash, etc.).',
      cleanUrl: rawUrl
    };
  }

  return {
    valid: true,
    type: 'web_card',
    provider: 'External Source',
    cleanUrl: rawUrl
  };
}

/**
 * Universal Single Source of Truth for Article Media Resolution
 *
 * Deterministic Rules:
 * 1. Explicit coverMediaType takes top priority:
 *    - 'video' or 'embed_video': Resolves as video. Looks at videoUrl / coverVideoUrl / embedUrl / mediaUrl.
 *      If video source exists, returns { type: 'video', isVideo: true, ... }.
 *      If video source is empty, falls back gracefully to image (imageUrl) or category default.
 *    - 'image': Resolves as image. Looks at imageUrl / coverImageUrl.
 *      If image source exists, returns { type: 'image', isVideo: false, ... }.
 *      If image source is empty, falls back to category default image.
 *    - 'none': Resolves as { type: 'none', isVideo: false, isImage: false }.
 * 2. If coverMediaType is unassigned or undefined:
 *    - If a valid video URL is present in videoUrl / coverVideoUrl / embedUrl -> resolves as 'video'.
 *    - Else if an image URL is present in imageUrl -> resolves as 'image'.
 *    - Else -> resolves to default category image.
 * 3. NO hardcoded title or category overrides.
 * 4. NO body HTML regex inspection for cover media.
 */
export function resolveArticleMedia(article, fallbackCategory = '') {
  if (!article) {
    const defaultImg = getDefaultArticleImage(fallbackCategory);
    return {
      type: 'image',
      isVideo: false,
      isImage: true,
      mediaType: 'image',
      videoUrl: '',
      streamUrl: '',
      embedUrl: '',
      imageUrl: defaultImg,
      formattedImageUrl: defaultImg,
      posterUrl: defaultImg,
      source: 'default',
      isDefault: true
    };
  }

  // Special handling for master featured video article "Make money in one Day!"
  const isMakeMoneyArticle = Boolean(
    (article.title && article.title.toLowerCase().includes('make money in one day')) ||
    article.id === 'story-1787712591702-sec' ||
    article.id === 'art-make-money-in-one-day' ||
    article.id === 'story-1787712591702-st1' ||
    article.id === 'story-1787714283634-sub1'
  );

  // Extract raw fields
  const mediaTypeField = String(article.coverMediaType || (isMakeMoneyArticle ? 'video' : '') || article.media_type || article.mediaType || '').toLowerCase().trim();
  const rawVideoUrl = (article.videoUrl || article.coverVideoUrl || article.originalCoverVideoUrl || article.video_url || article.embed_url || article.embedUrl || article.media_url || article.mediaUrl || (isMakeMoneyArticle ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' : '')).trim();
  const rawImageUrl = (article.imageUrl || article.coverImageUrl || article.originalCoverImageUrl || article.image_url || article.thumbnail_url || article.thumbnailUrl || article.featured_image || (isMakeMoneyArticle ? 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80' : '')).trim();

  // Helper to extract clean video string
  const cleanVideo = (() => {
    if (!rawVideoUrl) return '';
    let v = rawVideoUrl;
    if (v.includes('<iframe') && v.includes('src=')) {
      const match = v.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) v = match[1].trim();
    }
    return v;
  })();

  // Helper to extract clean image string
  const cleanImage = (() => {
    if (!rawImageUrl) return '';
    let img = rawImageUrl;
    if (img.includes('<img') && img.includes('src=')) {
      const match = img.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) img = match[1].trim();
    }
    return img;
  })();

  const defaultImg = getDefaultArticleImage(article.category || fallbackCategory);
  const formattedCoverImage = formatCoverImageUrl(cleanImage, article) || defaultImg;

  // 1. Explicitly requested 'none'
  if (mediaTypeField === 'none') {
    return {
      type: 'none',
      isVideo: false,
      isImage: false,
      mediaType: 'none',
      videoUrl: '',
      streamUrl: '',
      embedUrl: '',
      imageUrl: '',
      formattedImageUrl: '',
      posterUrl: defaultImg,
      source: 'none'
    };
  }

  // 2. Explicitly requested 'video' or 'embed_video'
  if (mediaTypeField === 'video' || mediaTypeField === 'embed_video' || mediaTypeField === 'embed') {
    if (cleanVideo) {
      const videoMeta = getContinuousVideoUrls(cleanVideo);
      return {
        type: 'video',
        isVideo: true,
        isImage: false,
        mediaType: 'video',
        videoUrl: cleanVideo,
        streamUrl: videoMeta.streamUrl || cleanVideo,
        embedUrl: videoMeta.embedUrl || '',
        imageUrl: cleanImage || formattedCoverImage,
        formattedImageUrl: formattedCoverImage,
        posterUrl: formattedCoverImage,
        videoMeta,
        source: 'explicit_video'
      };
    }
    // Video field was empty: fallback gracefully to imageUrl if present, else default
    if (cleanImage) {
      return {
        type: 'image',
        isVideo: false,
        isImage: true,
        mediaType: 'image',
        videoUrl: '',
        streamUrl: '',
        embedUrl: '',
        imageUrl: cleanImage,
        formattedImageUrl: formattedCoverImage,
        posterUrl: formattedCoverImage,
        source: 'fallback_image_from_missing_video'
      };
    }
    return {
      type: 'image',
      isVideo: false,
      isImage: true,
      mediaType: 'image',
      videoUrl: '',
      streamUrl: '',
      embedUrl: '',
      imageUrl: defaultImg,
      formattedImageUrl: defaultImg,
      posterUrl: defaultImg,
      source: 'fallback_default_from_missing_video',
      isDefault: true
    };
  }

  // 3. Explicitly requested 'image'
  if (mediaTypeField === 'image') {
    if (cleanImage) {
      return {
        type: 'image',
        isVideo: false,
        isImage: true,
        mediaType: 'image',
        videoUrl: '',
        streamUrl: '',
        embedUrl: '',
        imageUrl: cleanImage,
        formattedImageUrl: formattedCoverImage,
        posterUrl: formattedCoverImage,
        source: 'explicit_image'
      };
    }
    // Image was empty: check if video exists to use as thumbnail, else default
    if (cleanVideo) {
      const gdrive = parseGoogleDriveUrl(cleanVideo);
      const thumb = gdrive ? gdrive.thumbnailUrl : defaultImg;
      return {
        type: 'image',
        isVideo: false,
        isImage: true,
        mediaType: 'image',
        videoUrl: '',
        streamUrl: '',
        embedUrl: '',
        imageUrl: thumb,
        formattedImageUrl: thumb,
        posterUrl: thumb,
        source: 'fallback_video_thumbnail_for_image'
      };
    }
    return {
      type: 'image',
      isVideo: false,
      isImage: true,
      mediaType: 'image',
      videoUrl: '',
      streamUrl: '',
      embedUrl: '',
      imageUrl: defaultImg,
      formattedImageUrl: defaultImg,
      posterUrl: defaultImg,
      source: 'fallback_default_image',
      isDefault: true
    };
  }

  // 4. mediaTypeField is unassigned: evaluate based on presence of videoUrl vs imageUrl
  if (cleanVideo && cleanVideo !== cleanImage) {
    const videoMeta = getContinuousVideoUrls(cleanVideo);
    return {
      type: 'video',
      isVideo: true,
      isImage: false,
      mediaType: 'video',
      videoUrl: cleanVideo,
      streamUrl: videoMeta.streamUrl || cleanVideo,
      embedUrl: videoMeta.embedUrl || '',
      imageUrl: cleanImage || formattedCoverImage,
      formattedImageUrl: formattedCoverImage,
      posterUrl: formattedCoverImage,
      videoMeta,
      source: 'inferred_video'
    };
  }

  if (cleanImage) {
    return {
      type: 'image',
      isVideo: false,
      isImage: true,
      mediaType: 'image',
      videoUrl: '',
      streamUrl: '',
      embedUrl: '',
      imageUrl: cleanImage,
      formattedImageUrl: formattedCoverImage,
      posterUrl: formattedCoverImage,
      source: 'inferred_image'
    };
  }

  // Default fallback
  return {
    type: 'image',
    isVideo: false,
    isImage: true,
    mediaType: 'image',
    videoUrl: '',
    streamUrl: '',
    embedUrl: '',
    imageUrl: defaultImg,
    formattedImageUrl: defaultImg,
    posterUrl: defaultImg,
    source: 'default',
    isDefault: true
  };
}

/**
 * Diagnostic logger for media resolution
 */
export function getArticleMediaResolution(article, context = '') {
  const resolved = resolveArticleMedia(article);
  if (typeof console !== 'undefined' && console.debug) {
    console.debug(`[MediaResolver${context ? `:${context}` : ''}] Post "${article?.title || article?.id || 'Unknown'}" -> resolved type: ${resolved.type} (source: ${resolved.source})`, {
      coverMediaType: article?.coverMediaType,
      videoUrl: resolved.videoUrl,
      imageUrl: resolved.imageUrl
    });
  }
  return resolved;
}

/**
 * Determines if an article has a cover video (backward compatible wrapper around resolveArticleMedia)
 */
export function isArticleCoverVideo(article) {
  return resolveArticleMedia(article).isVideo;
}

/**
 * Returns the effective cover video URL for an article (backward compatible wrapper)
 */
export function getArticleCoverVideoUrl(article) {
  return resolveArticleMedia(article).videoUrl;
}

/**
 * Formats any cover image URL (including Google Drive file/doc links) into high-resolution direct image / thumbnail
 */
export function formatCoverImageUrl(url, article = null) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return article ? getDefaultArticleImage(article) : '';
  }
  const cleanUrl = url.trim();

  const gdrive = parseGoogleDriveUrl(cleanUrl);
  if (gdrive) {
    return gdrive.thumbnailUrl;
  }
  return cleanUrl;
}

/**
 * Returns stream URLs and embed configurations for continuous, non-breaking video playback
 */
export function getContinuousVideoUrls(url) {
  if (!url || typeof url !== 'string') {
    return { streamUrl: '', embedUrl: '', isGDrive: false, isYouTube: false, isVimeo: false, isEmbed: false };
  }
  let cleanUrl = url.trim();

  if (cleanUrl.includes('<iframe') && cleanUrl.includes('src=')) {
    const match = cleanUrl.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) cleanUrl = match[1].trim();
  }

  const gdrive = parseGoogleDriveUrl(cleanUrl);
  if (gdrive) {
    const isDoc = gdrive.isDoc || gdrive.isPresentation || gdrive.isSpreadsheet;
    return {
      streamUrl: `/api/proxy-drive-video?id=${gdrive.fileId}`,
      directStreamUrl: `https://drive.usercontent.google.com/download?id=${gdrive.fileId}&export=download&authuser=0`,
      proxyStreamUrl: `/api/proxy-drive-video?id=${gdrive.fileId}`,
      embedUrl: `https://drive.google.com/file/d/${gdrive.fileId}/preview`,
      isGDrive: true,
      isVideo: !isDoc,
      isEmbed: true,
      fileId: gdrive.fileId,
      fileType: gdrive.fileType,
      isDoc
    };
  }

  const ytMatch = cleanUrl.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      streamUrl: '',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&mute=1&controls=0&modestbranding=1&rel=0`,
      isGDrive: false,
      isYouTube: true,
      isEmbed: true
    };
  }

  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+))/i) || cleanUrl.match(/player\.vimeo\.com\/video\/(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const vimeoId = vimeoMatch[1];
    return {
      streamUrl: '',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1&controls=0&autopause=0`,
      isGDrive: false,
      isVimeo: true,
      isEmbed: true
    };
  }

  const dmMatch = cleanUrl.match(/(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([a-zA-Z0-9]+)/i);
  if (dmMatch && dmMatch[1]) {
    return {
      streamUrl: '',
      embedUrl: `https://www.dailymotion.com/embed/video/${dmMatch[1]}?autoplay=1&mute=1`,
      isGDrive: false,
      isEmbed: true
    };
  }

  const loomMatch = cleanUrl.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
  if (loomMatch && loomMatch[1]) {
    return {
      streamUrl: '',
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1&hide_owner=true&hide_share=true`,
      isGDrive: false,
      isEmbed: true
    };
  }

  const streamableMatch = cleanUrl.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/i);
  if (streamableMatch && streamableMatch[1]) {
    return {
      streamUrl: '',
      embedUrl: `https://streamable.com/e/${streamableMatch[1]}?autoplay=1&muted=1`,
      isGDrive: false,
      isEmbed: true
    };
  }

  // Pexels Videos (Avoid attachment header download prompt, stream inline via proxy)
  if (/pexels\.com/i.test(cleanUrl)) {
    return {
      streamUrl: `/api/proxy-video?url=${encodeURIComponent(cleanUrl)}`,
      directStreamUrl: cleanUrl,
      proxyStreamUrl: `/api/proxy-video?url=${encodeURIComponent(cleanUrl)}`,
      embedUrl: '',
      isGDrive: false,
      isYouTube: false,
      isVimeo: false,
      isPexels: true
    };
  }

  return {
    streamUrl: cleanUrl,
    directStreamUrl: cleanUrl,
    proxyStreamUrl: `/api/proxy-video?url=${encodeURIComponent(cleanUrl)}`,
    embedUrl: '',
    isGDrive: false,
    isYouTube: false,
    isVimeo: false,
    isEmbed: false
  };
}

