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

    const isVideo = gdriveInfo.fileType === 'video';

    return {
      type: 'gdrive',
      mediaType: 'embed',
      url: gdriveInfo.previewUrl,
      streamUrl: `https://drive.usercontent.google.com/download?id=${gdriveInfo.fileId}&export=download`,
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
            ${isVideo ? `
              <video 
                src="https://drive.usercontent.google.com/download?id=${gdriveInfo.fileId}&export=download" 
                controls 
                autoplay 
                muted 
                loop 
                playsinline 
                style="width: 100%; height: 480px; object-fit: cover; display: block; background: #000000;"
                onended="this.currentTime=0;this.play();"
              ></video>
            ` : `
              <iframe 
                src="${gdriveInfo.previewUrl}" 
                title="${gdriveInfo.label}" 
                frameborder="0" 
                allow="autoplay; encrypted-media; fullscreen" 
                allowfullscreen 
                style="width: 100%; height: 480px; border: none; display: block; background: #000000;"
              ></iframe>
            `}
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

  const match = cleanUrl.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^&]+&)*id=|thumbnail\?(?:[^&]+&)*id=)|docs\.google\.com\/(?:document|presentation|spreadsheets|file)\/d\/|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]{25,})/i);

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
 * Formats any cover image URL (including Google Drive file/doc links) into high-resolution direct image / thumbnail
 */
export function formatCoverImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
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
    return { streamUrl: '', embedUrl: '', isGDrive: false, isYouTube: false, isVimeo: false };
  }
  const cleanUrl = url.trim();

  const gdrive = parseGoogleDriveUrl(cleanUrl);
  if (gdrive) {
    return {
      streamUrl: `/api/proxy-drive-video?id=${gdrive.fileId}`,
      directDownloadUrl: `https://drive.usercontent.google.com/download?id=${gdrive.fileId}&export=download`,
      altStreamUrl: `https://drive.google.com/uc?export=download&id=${gdrive.fileId}`,
      embedUrl: `https://drive.google.com/file/d/${gdrive.fileId}/preview?autoplay=1&loop=1`,
      isGDrive: true,
      fileId: gdrive.fileId,
      fileType: gdrive.fileType,
      isDoc: gdrive.isDoc || gdrive.isPresentation || gdrive.isSpreadsheet
    };
  }

  const ytMatch = cleanUrl.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      streamUrl: '',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&mute=1&controls=1`,
      isGDrive: false,
      isYouTube: true
    };
  }

  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+))/i) || cleanUrl.match(/player\.vimeo\.com\/video\/(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const vimeoId = vimeoMatch[1];
    return {
      streamUrl: '',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&loop=1&muted=1&autopause=0`,
      isGDrive: false,
      isVimeo: true
    };
  }

  return {
    streamUrl: cleanUrl,
    embedUrl: cleanUrl,
    isGDrive: false,
    isYouTube: false,
    isVimeo: false
  };
}


