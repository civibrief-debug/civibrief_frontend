import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../lib/rateLimit';

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];

const FALLBACK_INDICES = [
  { symbol: "SENSEX", value: "81,452.30", change: "+0.64%", isPositive: true },
  { symbol: "NIFTY 50", value: "24,820.15", change: "+0.58%", isPositive: true },
  { symbol: "S&P 500", value: "5,468.20", change: "-0.12%", isPositive: false },
  { symbol: "NASDAQ", value: "17,340.50", change: "+0.85%", isPositive: true },
  { symbol: "BRENT CRUDE", value: "$78.40", change: "-1.10%", isPositive: false },
  { symbol: "GOLD", value: "$2,430/oz", change: "+0.15%", isPositive: true },
];

export async function GET(req) {
  if (!checkRateLimit(req, 30, 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  try {
    const apiKey = process.env.BINANCE_API_KEY;

    if (!apiKey) {
      // Return cached fallback indices cleanly without failing if key is unconfigured
      return NextResponse.json({ success: true, data: FALLBACK_INDICES });
    }

    const symbolsParam = JSON.stringify(SYMBOLS);
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;

    const res = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': apiKey
      },
      next: { revalidate: 30 } // Cache for 30 seconds
    });

    if (!res.ok) {
      throw new Error(`Binance API error: ${res.statusText}`);
    }

    const data = await res.json();

    // Map Binance crypto data to ticker format
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

    // Interleave market indices with Binance live crypto prices
    const combinedIndices = [
      ...FALLBACK_INDICES.slice(0, 2), // SENSEX, NIFTY 50
      ...cryptoIndices.slice(0, 3),    // BITCOIN, ETHEREUM, BNB
      ...FALLBACK_INDICES.slice(2, 4), // S&P 500, NASDAQ
      ...cryptoIndices.slice(3),       // SOLANA, XRP
      ...FALLBACK_INDICES.slice(4),    // BRENT CRUDE, GOLD
    ];

    return NextResponse.json({ success: true, data: combinedIndices });
  } catch (error) {
    console.error("Market Ticker Error:", error);
    return NextResponse.json({ success: false, data: FALLBACK_INDICES });
  }
}

