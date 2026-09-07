import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Default Trustworthy Newsreader Voices (ElevenLabs Multilingual v2)
const DEFAULT_NEWS_VOICES = {
  default: 'JBFqnCBsd6RMkjVDRZzb', // George - Authoritative, articulate, calm news anchor
  brian: 'nPczCjzI2devNBz1zQrb',   // Brian - Deep, commanding, trustworthy news narrator
  rachel: '21m00Tcm4TlvDq8ikWAM',  // Rachel - Polished, articulate female newsreader
  roger: 'CwhRBWXzGAHq8TQ4Fs17'    // Roger - Confident, authoritative presenter
};

// In-Memory Audio Cache (Edge memory map: hash -> ArrayBuffer)
const AUDIO_CACHE = new Map();
let customVoiceId = null;
let lastVoiceCheck = 0;

/**
 * Strips HTML tags and unescapes common HTML entities for natural narration
 */
function cleanTextForSpeech(htmlOrText) {
  if (!htmlOrText || typeof htmlOrText !== 'string') return '';
  return htmlOrText
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes a fast SHA-256 hash using Web Crypto API for caching
 */
async function computeHash(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/**
 * Checks for custom cloned brand voices on the user's ElevenLabs account
 */
async function getBrandVoiceId(apiKey) {
  const now = Date.now();
  if (customVoiceId && (now - lastVoiceCheck < 600000)) {
    return customVoiceId;
  }

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
      signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.voices)) {
        // Priority 1: Cloned custom voice
        const cloned = data.voices.find(v => v.category === 'cloned');
        if (cloned) {
          customVoiceId = cloned.voice_id;
          lastVoiceCheck = now;
          return customVoiceId;
        }
        // Priority 2: Generated brand voice
        const generated = data.voices.find(v => v.category === 'generated');
        if (generated) {
          customVoiceId = generated.voice_id;
          lastVoiceCheck = now;
          return customVoiceId;
        }
      }
    }
  } catch (err) {
    // Non-fatal, fall back to default newsreader voice
  }

  return DEFAULT_NEWS_VOICES.default;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      text, 
      title = '', 
      author = '', 
      language = 'en', 
      voiceId: requestedVoiceId 
    } = body;

    const apiKey = process.env.ELEVENLABS_API_KEY;

    // Validate API key presence and format
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        fallback: true,
        code: 'MISSING_API_KEY',
        message: 'ELEVENLABS_API_KEY environment variable is not configured. Falling back to browser speech synthesis.'
      }, { status: 200 });
    }

    // Check if key is a 64-char key ID instead of a secret key starting with 'sk_'
    if (!apiKey.startsWith('sk_')) {
      return NextResponse.json({
        success: false,
        fallback: true,
        code: 'INVALID_KEY_FORMAT',
        message: "API key ID provided instead of API Secret Key (starts with 'sk_'). Falling back to browser speech synthesis."
      }, { status: 200 });
    }

    // Prepare news text with natural prosody and cadence:
    // - Punchy headline followed by a deliberate pause
    // - Author byline with a pause
    // - Clean body paragraphs
    const cleanTitle = cleanTextForSpeech(title);
    const cleanAuthor = cleanTextForSpeech(author);
    const cleanBody = cleanTextForSpeech(text);

    if (!cleanBody && !cleanTitle) {
      return NextResponse.json({
        success: false,
        fallback: true,
        error: 'No readable text content provided for speech synthesis.'
      }, { status: 400 });
    }

    let formattedSpeechText = '';
    if (cleanTitle) {
      formattedSpeechText += `${cleanTitle}. ... \n\n`;
    }
    if (cleanAuthor) {
      const bylinePrefix = language === 'hi' ? 'रिपोर्टर' : (language === 'ko' ? '기자' : (language === 'ja' ? '記者' : 'By'));
      formattedSpeechText += `${bylinePrefix} ${cleanAuthor}. ... \n\n`;
    }
    formattedSpeechText += cleanBody;

    // Limit text length to prevent credit overage (up to 5,000 characters per article narration)
    const MAX_SPEECH_CHARS = 5000;
    if (formattedSpeechText.length > MAX_SPEECH_CHARS) {
      formattedSpeechText = formattedSpeechText.slice(0, MAX_SPEECH_CHARS) + '...';
    }

    // Resolve voice ID (Custom Cloned Voice -> User Specified -> George Newsreader)
    const targetVoiceId = requestedVoiceId || await getBrandVoiceId(apiKey);

    // Check in-memory audio cache to prevent redundant ElevenLabs credit usage
    const cacheKey = await computeHash(`${targetVoiceId}_${language}_${formattedSpeechText}`);
    if (AUDIO_CACHE.has(cacheKey)) {
      const cachedBuffer = AUDIO_CACHE.get(cacheKey);
      return new Response(cachedBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'X-TTS-Provider': 'ElevenLabs-Cached',
          'X-TTS-Voice-Id': targetVoiceId
        }
      });
    }

    // Call ElevenLabs Text-to-Speech API with eleven_multilingual_v2
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}?output_format=mp3_44100_128`;
    
    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: formattedSpeechText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.60,         // Professional, consistent newsreader cadence
          similarity_boost: 0.80,  // High vocal clarity and tone fidelity
          style: 0.20,             // Subtle news anchor polish without excessive drama
          use_speaker_boost: true  // Broadcast clarity boost
        }
      })
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      console.warn('ElevenLabs API Error:', response.status, errorJson);

      return NextResponse.json({
        success: false,
        fallback: true,
        status: response.status,
        code: errorJson?.detail?.code || 'ELEVENLABS_API_ERROR',
        message: errorJson?.detail?.message || `ElevenLabs request failed with status ${response.status}. Falling back to browser speech synthesis.`
      }, { status: 200 });
    }

    const audioArrayBuffer = await response.arrayBuffer();

    // Cache the audio buffer (keep up to 15 recent articles in memory)
    if (AUDIO_CACHE.size > 15) {
      const oldestKey = AUDIO_CACHE.keys().next().value;
      AUDIO_CACHE.delete(oldestKey);
    }
    AUDIO_CACHE.set(cacheKey, audioArrayBuffer);

    return new Response(audioArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-TTS-Provider': 'ElevenLabs',
        'X-TTS-Voice-Id': targetVoiceId
      }
    });

  } catch (err) {
    console.error('TTS Route Exception:', err);
    return NextResponse.json({
      success: false,
      fallback: true,
      error: err?.message || 'Internal server error processing audio narration'
    }, { status: 500 });
  }
}
