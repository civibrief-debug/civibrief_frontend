import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../lib/rateLimit';

export const runtime = 'edge';

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];

const FALLBACK_INDICES = [
  { symbol: "SENSEX", value: "81,452.30", change: "+0.64%", isPositive: true },
  { symbol: "NIFTY 50", value: "24,820.15", change: "+0.58%", isPositive: true },
  { symbol: "S&P 500", value: "5,468.20", change: "-0.12%", isPositive: false },
  { symbol: "NASDAQ", value: "17,340.50", change: "+0.85%", isPositive: true },
  { symbol: "BRENT CRUDE", value: "$78.40", change: "-1.10%", isPositive: false },
  { symbol: "GOLD", value: "$2,430/oz", change: "+0.15%", isPositive: true },
];

// High-performance Server-Side Memory SWR Cache for instant 0ms responses
if (!globalThis.__marketMemoryCache) {
  globalThis.__marketMemoryCache = null;
}
let isRevalidatingMarket = false;

async function fetchFreshMarket(apiKey) {
  const symbolsParam = JSON.stringify(SYMBOLS);
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;

  const res = await fetch(url, {
    headers: {
      'X-MBX-APIKEY': apiKey
    },
    signal: AbortSignal.timeout ? AbortSignal.timeout(1500) : undefined
  });

  if (!res.ok) {
    throw new Error(`Binance API error: ${res.statusText}`);
  }

  const data = await res.json();

  const cryptoIndices = data.map((item) => {
    const price = parseFloat(item.lastPrice);
    const priceChangePercent = parseFloat(item.priceChangePercent);
    const isPositive = priceChangePercent >= 0;

    let formattedSymbol = item.symbol.replace("USDT", "");
    if (formattedSymbol === "BTC") formattedSymbol = "BITCOIN";
    if (formattedSymbol === "ETH") formattedSymbol = "ETHEREUM";
    if (formattedSymbol === "BNB") formattedSymbol = "BINANCE BNB";
    if (formattedSymbol === "SOL") formattedSymbol = "SOLANA";

    const formattedPrice = price >= 100 
      ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
      : `$${price.toFixed(4)}`;

    const formattedChange = `${isPositive ? '+' : ''}${priceChangePercent.toFixed(2)}%`;

    return {
      symbol: formattedSymbol,
      value: formattedPrice,
      change: formattedChange,
      isPositive
    };
  });

  return [
    ...FALLBACK_INDICES.slice(0, 2), // SENSEX, NIFTY 50
    ...cryptoIndices.slice(0, 3),    // BITCOIN, ETHEREUM, BNB
    ...FALLBACK_INDICES.slice(2, 4), // S&P 500, NASDAQ
    ...cryptoIndices.slice(3),       // SOLANA, XRP
    ...FALLBACK_INDICES.slice(4),    // BRENT CRUDE, GOLD
  ];
}

export async function GET(req) {
  try {
    const cached = globalThis.__marketMemoryCache;
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < 30000) {
        return new Response(cached.jsonString, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=60',
            'X-Cache': 'HIT-FRESH'
          }
        });
      }
    }

    const apiKey = process.env.BINANCE_API_KEY;

    if (!apiKey) {
      const jsonString = JSON.stringify({ success: true, data: FALLBACK_INDICES });
      globalThis.__marketMemoryCache = { jsonString, timestamp: Date.now() };
      return new Response(jsonString, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
          'X-Cache': 'HIT-FALLBACK'
        }
      });
    }

    if (!checkRateLimit(req, 60, 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const marketData = await fetchFreshMarket(apiKey);
    const jsonString = JSON.stringify({ success: true, data: marketData });
    globalThis.__marketMemoryCache = { jsonString, timestamp: Date.now() };

    return new Response(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    const jsonString = JSON.stringify({ success: true, data: FALLBACK_INDICES });
    globalThis.__marketMemoryCache = { jsonString, timestamp: Date.now() };
    return new Response(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
        'X-Cache': 'FALLBACK-ERROR'
      }
    });
  }
}
