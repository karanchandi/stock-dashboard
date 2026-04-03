import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://www.cameco.com/invest/markets/uranium-price', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      cache: 'no-store',
    });

    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch Cameco page' }, { status: 500 });

    const html = await res.text();

    // Extract all date/spot/longterm rows
    const dateRegex = /<td class="views-field views-field-field-monthly-date">([^<]*)<\/td>/g;
    const spotRegex = /<td headers="view-field-spot-price-table-column"[^>]*>([^<]*)<\/td>/g;
    const ltRegex = /<td headers="view-field-long-term-price-table-column"[^>]*>([^<]*)<\/td>/g;

    const dates: string[] = [];
    const spots: string[] = [];
    const lts: string[] = [];

    let m;
    while ((m = dateRegex.exec(html)) !== null) dates.push(m[1].trim());
    while ((m = spotRegex.exec(html)) !== null) spots.push(m[1].trim());
    while ((m = ltRegex.exec(html)) !== null) lts.push(m[1].trim());

    if (dates.length === 0) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    // Get the most recent entry
    const lastIdx = dates.length - 1;
    const spotPrice = parseFloat(spots[lastIdx]) || null;
    const ltPrice = parseFloat(lts[lastIdx]) || null;
    const date = dates[lastIdx];

    // Get previous month for change calculation
    const prevIdx = lastIdx > 0 ? lastIdx - 1 : null;
    const prevSpot = prevIdx !== null ? (parseFloat(spots[prevIdx]) || null) : null;
    const changePct = spotPrice && prevSpot ? ((spotPrice - prevSpot) / prevSpot) * 100 : null;

    // Build 12-month history for sparkline
    const history = [];
    const startIdx = Math.max(0, dates.length - 12);
    for (let i = startIdx; i < dates.length; i++) {
      history.push({
        date: dates[i],
        spot: parseFloat(spots[i]) || null,
        longTerm: parseFloat(lts[i]) || null,
      });
    }

    return NextResponse.json({
      source: 'Cameco (UxC/TradeTech avg)',
      date,
      spotPrice,
      longTermPrice: ltPrice,
      prevSpotPrice: prevSpot,
      changePct: changePct ? Math.round(changePct * 100) / 100 : null,
      unit: '$/lb U3O8',
      history,
    });
  } catch {
    return NextResponse.json({ error: 'Scrape failed' }, { status: 500 });
  }
}
