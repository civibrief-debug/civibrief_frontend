import { NextResponse } from 'next/server';

export const runtime = 'edge';

const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_KEY || '8f3c77ea4f58f821b75dfe278c671288';

const CITIES = [
  { name: 'NEW DELHI', q: 'New Delhi', country: 'IN' },
  { name: 'MUMBAI', q: 'Mumbai', country: 'IN' },
  { name: 'BENGALURU', q: 'Bengaluru', country: 'IN' },
  { name: 'NEW YORK', q: 'New York', country: 'US' },
  { name: 'LONDON', q: 'London', country: 'GB' },
  { name: 'TOKYO', q: 'Tokyo', country: 'JP' },
  { name: 'PARIS', q: 'Paris', country: 'FR' },
  { name: 'DUBAI', q: 'Dubai', country: 'AE' },
  { name: 'SINGAPORE', q: 'Singapore', country: 'SG' },
  { name: 'SYDNEY', q: 'Sydney', country: 'AU' }
];

const FALLBACK_WEATHER = [
  { city: 'NEW DELHI', temp: '31°C', condition: 'Sunny', icon: '☀️', humidity: '58%', wind: '12 km/h' },
  { city: 'MUMBAI', temp: '29°C', condition: 'Light Rain', icon: '🌧️', humidity: '82%', wind: '18 km/h' },
  { city: 'BENGALURU', temp: '25°C', condition: 'Partly Cloudy', icon: '⛅', humidity: '65%', wind: '14 km/h' },
  { city: 'NEW YORK', temp: '24°C', condition: 'Clear Sky', icon: '🌤️', humidity: '52%', wind: '10 km/h' },
  { city: 'LONDON', temp: '19°C', condition: 'Overcast', icon: '☁️', humidity: '70%', wind: '15 km/h' },
  { city: 'TOKYO', temp: '28°C', condition: 'Sunny', icon: '☀️', humidity: '60%', wind: '8 km/h' },
  { city: 'PARIS', temp: '22°C', condition: 'Scattered Clouds', icon: '⛅', humidity: '55%', wind: '11 km/h' },
  { city: 'DUBAI', temp: '38°C', condition: 'Clear', icon: '☀️', humidity: '45%', wind: '16 km/h' },
  { city: 'SINGAPORE', temp: '30°C', condition: 'Thunderstorm', icon: '⛈️', humidity: '85%', wind: '12 km/h' },
  { city: 'SYDNEY', temp: '20°C', condition: 'Breezy', icon: '🌤️', humidity: '50%', wind: '22 km/h' }
];

function getWeatherEmoji(condition = '', iconCode = '') {
  const cond = condition.toLowerCase();
  if (cond.includes('thunder') || cond.includes('storm')) return '⛈️';
  if (cond.includes('drizzle') || cond.includes('rain')) return '🌧️';
  if (cond.includes('snow')) return '❄️';
  if (cond.includes('mist') || cond.includes('fog') || cond.includes('haze')) return '🌫️';
  if (cond.includes('clear')) return iconCode.includes('n') ? '🌙' : '☀️';
  if (cond.includes('cloud')) return '⛅';
  return '🌤️';
}

export async function GET() {
  try {
    const promises = CITIES.map(async (c) => {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(c.q)}&units=metric&appid=${OPENWEATHER_KEY}`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'DailyBrief/1.0' },
          signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
        });

        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();

        const mainCond = data.weather?.[0]?.main || 'Clear';
        const desc = data.weather?.[0]?.description || mainCond;
        const iconCode = data.weather?.[0]?.icon || '';
        const temp = Math.round(data.main?.temp);

        return {
          city: c.name,
          temp: `${temp > 0 ? temp : 0}°C`,
          condition: desc.charAt(0).toUpperCase() + desc.slice(1),
          icon: getWeatherEmoji(desc, iconCode),
          humidity: `${data.main?.humidity || 60}%`,
          wind: `${Math.round((data.wind?.speed || 3) * 3.6)} km/h`
        };
      } catch (err) {
        const fallback = FALLBACK_WEATHER.find(f => f.city === c.name) || FALLBACK_WEATHER[0];
        return fallback;
      }
    });

    const results = await Promise.all(promises);
    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    console.error('Weather Ticker API Error:', err);
    return NextResponse.json({ success: true, data: FALLBACK_WEATHER });
  }
}
