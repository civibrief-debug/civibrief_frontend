export async function translateText(text, targetLang) {
  if (!text) return text;
  
  // Real Translation via Google's free API endpoint
  // Using this for immediate testing without API keys!
  
  try {
    // Basic HTML extraction for rich text to prevent breaking tags
    let isHtml = text.includes('<p>') || text.includes('<div>') || text.includes('<h1>');
    let textToTranslate = text;
    let htmlWrapperStart = '';
    let htmlWrapperEnd = '';
    
    // Very naive HTML wrapping prevention for simple cases
    if (isHtml) {
      // Just strip tags for the free API to avoid broken HTML strings,
      // or try to translate as is. Google usually preserves simple <p> tags.
      textToTranslate = text;
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Translation API failed');
    
    const data = await response.json();
    
    // Google returns an array of arrays. The first element contains the translated text chunks.
    let translatedText = '';
    if (data && data[0]) {
      data[0].forEach(chunk => {
        if (chunk[0]) translatedText += chunk[0];
      });
    }

    if (isHtml) {
      // If we used the free API on HTML, it might add spaces in tags like < p >
      translatedText = translatedText.replace(/<\s*\/\s*/g, '</').replace(/<\s+/g, '<').replace(/\s+>/g, '>');
      // Add RTL wrapper if needed
      if (['ar', 'he', 'fa', 'ur'].includes(targetLang)) {
        return `<div dir="rtl">${translatedText}</div>`;
      }
    }
    
    return translatedText || text;
  } catch (err) {
    console.error("Translation failed:", err);
    return `[${targetLang.toUpperCase()}] ${text}`; // Fallback to mock on failure
  }
}
