import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const range = searchParams.get('range') || '1mo';

  if (!ticker) {
    return NextResponse.json({ error: 'ticker required' }, { status: 400 });
  }

  // Map range to appropriate interval
  const intervalMap: Record<string, string> = {
    '1d': '5m',
    '5d': '15m',
    '1mo': '1d',
    '6mo': '1d',
    'ytd': '1d',
    '1y': '1wk',
    '5y': '1mo',
    'max': '1mo',
  };

  const interval = intervalMap[range] || '1d';

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}&includePrePost=false`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: res.status });
    }

    const data = await res.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const meta = result.meta || {};

    // Build clean price data
    const prices = timestamps.map((ts: number, i: number) => ({
      time: ts * 1000, // Convert to milliseconds
      open: quotes.open?.[i] ?? null,
      high: quotes.high?.[i] ?? null,
      low: quotes.low?.[i] ?? null,
      close: quotes.close?.[i] ?? null,
      volume: quotes.volume?.[i] ?? null,
    })).filter((p: any) => p.close !== null);

    return NextResponse.json({
      ticker: meta.symbol,
      currency: meta.currency,
      previousClose: meta.chartPreviousClose || meta.previousClose,
      regularMarketPrice: meta.regularMarketPrice,
      prices,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
