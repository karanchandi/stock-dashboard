'use client';

import { useEffect, useState } from 'react';
import PriceChart from './PriceChart';

interface CommodityData {
  ticker: string;
  name: string;
  sector: string;
  unit: string;
  price: number | null;
  prevClose: number | null;
  changePct: number | null;
  high52w: number | null;
  low52w: number | null;
  breakeven: number;
  breakevenNote: string;
}

const COMMODITY_DEFS: { ticker: string; name: string; sector: string; unit: string; breakeven: number; breakevenNote: string }[] = [
  // Energy
  { ticker: 'CL=F', name: 'WTI Crude Oil', sector: 'Energy', unit: '$/bbl', breakeven: 63, breakevenNote: 'US Permian avg (Dallas Fed 2025)' },
  { ticker: 'BZ=F', name: 'Brent Crude', sector: 'Energy', unit: '$/bbl', breakeven: 47, breakevenNote: 'Global non-OPEC avg (Rystad)' },
  { ticker: 'NG=F', name: 'Natural Gas', sector: 'Energy', unit: '$/MMBtu', breakeven: 2.75, breakevenNote: 'Haynesville avg' },
  { ticker: 'RB=F', name: 'Gasoline (RBOB)', sector: 'Energy', unit: '$/gal', breakeven: 2.50, breakevenNote: 'Refining cost basis' },
  { ticker: 'HO=F', name: 'Heating Oil', sector: 'Energy', unit: '$/gal', breakeven: 3.50, breakevenNote: 'Refining margin proxy' },
  { ticker: 'UX=F', name: 'Uranium (U3O8)', sector: 'Energy', unit: '$/lb', breakeven: 45, breakevenNote: 'ISR $30-40, conventional $50-60' },
  // Precious Metals
  { ticker: 'GC=F', name: 'Gold', sector: 'Precious Metals', unit: '$/oz', breakeven: 1600, breakevenNote: 'Global AISC avg (VanEck 2025)' },
  { ticker: 'SI=F', name: 'Silver', sector: 'Precious Metals', unit: '$/oz', breakeven: 27, breakevenNote: 'AISC avg; byproduct credits vary' },
  { ticker: 'PL=F', name: 'Platinum', sector: 'Precious Metals', unit: '$/oz', breakeven: 1000, breakevenNote: 'South Africa dominated' },
  { ticker: 'PA=F', name: 'Palladium', sector: 'Precious Metals', unit: '$/oz', breakeven: 1100, breakevenNote: 'Often byproduct of Pt/Ni mining' },
  // Industrial Metals
  { ticker: 'HG=F', name: 'Copper', sector: 'Industrial Metals', unit: '$/lb', breakeven: 3.00, breakevenNote: 'Chile/Peru avg $2.50; US higher' },
  { ticker: 'ALI=F', name: 'Aluminum', sector: 'Industrial Metals', unit: '$/ton', breakeven: 2000, breakevenNote: 'Energy ~40% of cost' },
  { ticker: 'LBS=F', name: 'Lumber', sector: 'Industrial Metals', unit: '$/MBF', breakeven: 300, breakevenNote: 'BC/Pacific NW' },
  // Agriculture - Grains
  { ticker: 'ZC=F', name: 'Corn', sector: 'Agriculture', unit: '¢/bu', breakeven: 425, breakevenNote: 'USDA cost of production' },
  { ticker: 'ZW=F', name: 'Wheat', sector: 'Agriculture', unit: '¢/bu', breakeven: 600, breakevenNote: 'Highly variable by region' },
  { ticker: 'ZS=F', name: 'Soybeans', sector: 'Agriculture', unit: '¢/bu', breakeven: 1100, breakevenNote: 'Includes land rent' },
  { ticker: 'ZR=F', name: 'Rice', sector: 'Agriculture', unit: '$/cwt', breakeven: 9.00, breakevenNote: 'LA/AR/CA avg' },
  { ticker: 'KC=F', name: 'Coffee', sector: 'Agriculture', unit: '¢/lb', breakeven: 175, breakevenNote: 'Brazil/Colombia avg' },
  { ticker: 'SB=F', name: 'Sugar', sector: 'Agriculture', unit: '¢/lb', breakeven: 11, breakevenNote: 'Brazil lowest cost' },
  { ticker: 'CC=F', name: 'Cocoa', sector: 'Agriculture', unit: '$/ton', breakeven: 1750, breakevenNote: 'West Africa avg' },
  { ticker: 'CT=F', name: 'Cotton', sector: 'Agriculture', unit: '¢/lb', breakeven: 70, breakevenNote: 'US Delta/Texas' },
  { ticker: 'OJ=F', name: 'Orange Juice', sector: 'Agriculture', unit: '¢/lb', breakeven: 135, breakevenNote: 'FL/Brazil; citrus greening' },
  // Livestock
  { ticker: 'LE=F', name: 'Live Cattle', sector: 'Livestock', unit: '¢/lb', breakeven: 195, breakevenNote: 'Feed costs primary driver' },
  { ticker: 'HE=F', name: 'Lean Hogs', sector: 'Livestock', unit: '¢/lb', breakeven: 82, breakevenNote: 'Corn/soybean meal feed' },
  { ticker: 'GF=F', name: 'Feeder Cattle', sector: 'Livestock', unit: '¢/lb', breakeven: 320, breakevenNote: 'Pasture + supplement' },
];

const SECTORS = ['All', 'Energy', 'Precious Metals', 'Industrial Metals', 'Agriculture', 'Livestock'];

function fmtPrice(v: number | null, unit: string): string {
  if (v == null) return '-';
  if (unit.includes('¢')) return v.toFixed(2) + '¢';
  if (unit.includes('/ton') && v >= 1000) return '$' + v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return '$' + v.toFixed(2);
}

function marginColor(margin: number): string {
  if (margin >= 50) return '#1D9E75';
  if (margin >= 15) return '#378ADD';
  if (margin >= 0) return '#EF9F27';
  return '#E24B4A';
}

function marginLabel(margin: number): string {
  if (margin >= 50) return 'Wide margin';
  if (margin >= 15) return 'Healthy';
  if (margin >= 0) return 'Tight';
  return 'Below breakeven';
}

export default function CommodityDashboard() {
  const [commodities, setCommodities] = useState<CommodityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const results: CommodityData[] = [];

      // Fetch in batches of 5 to avoid rate limits
      for (let i = 0; i < COMMODITY_DEFS.length; i += 5) {
        const batch = COMMODITY_DEFS.slice(i, i + 5);
        const promises = batch.map(async (def) => {
          try {
            const res = await fetch(`/api/chart?ticker=${encodeURIComponent(def.ticker)}&range=5d`);
            if (res.ok) {
              const data = await res.json();
              const prices = data.prices || [];
              const latest = prices[prices.length - 1];
              const prevDay = prices.length > 2 ? prices[prices.length - 2] : null;
              return {
                ...def,
                price: data.regularMarketPrice || latest?.close || null,
                prevClose: data.previousClose || prevDay?.close || null,
                changePct: data.regularMarketPrice && data.previousClose ? ((data.regularMarketPrice - data.previousClose) / data.previousClose) * 100 : null,
                high52w: null,
                low52w: null,
              };
            }
          } catch {}
          return { ...def, price: null, prevClose: null, changePct: null, high52w: null, low52w: null };
        });
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
      }

      setCommodities(results);
      setLoading(false);
    }
    fetchAll();
  }, []);

  const filtered = sector === 'All' ? commodities : commodities.filter(c => c.sector === sector);

  return (
    <div className="space-y-4">
      {/* Sector filter */}
      <div className="flex gap-1 flex-wrap">
        {SECTORS.map(s => (
          <button
            key={s}
            onClick={() => setSector(s)}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              background: sector === s ? 'var(--brand)' : 'var(--bg-primary)',
              color: sector === s ? 'white' : 'var(--text-secondary)',
              border: '0.5px solid var(--border)',
            }}
          >
            {s}
          </button>
        ))}
        <span className="text-xs ml-auto self-center" style={{ color: 'var(--text-tertiary)' }}>
          {filtered.length} commodities
        </span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading commodity data...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => {
            const margin = c.price && c.breakeven ? ((c.price - c.breakeven) / c.breakeven) * 100 : 0;
            const gaugePos = c.price && c.breakeven ? Math.min(100, Math.max(0, (c.price / (c.breakeven * 2)) * 100)) : 50;
            const bePos = 50; // breakeven is always at 50% of the gauge (since max is 2x breakeven)
            const isExpanded = expanded === c.ticker;

            return (
              <div
                key={c.ticker}
                className="rounded-lg overflow-hidden cursor-pointer transition-all"
                style={{
                  background: 'var(--bg-primary)',
                  border: isExpanded ? '1px solid var(--brand)' : '1px solid var(--border)',
                  boxShadow: isExpanded ? 'var(--card-shadow-hover)' : 'var(--card-shadow)',
                }}
                onClick={() => setExpanded(isExpanded ? null : c.ticker)}
              >
                <div className="p-3">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                      <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>{c.sector}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{fmtPrice(c.price, c.unit)}</div>
                      {c.changePct != null && (
                        <div className="text-xs font-medium" style={{ color: c.changePct >= 0 ? '#1D9E75' : '#E24B4A' }}>
                          {c.changePct >= 0 ? '▲' : '▼'} {Math.abs(c.changePct).toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Breakeven gauge */}
                  <div className="relative h-2.5 rounded-full overflow-hidden mb-1" style={{ background: 'var(--bg-tertiary)' }}>
                    {/* Breakeven marker */}
                    <div
                      className="absolute top-0 w-0.5 h-full"
                      style={{ left: `${bePos}%`, background: 'var(--text-secondary)', zIndex: 2 }}
                    />
                    {/* Price fill */}
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${gaugePos}%`,
                        background: `linear-gradient(to right, ${margin < 0 ? '#E24B4A' : margin < 15 ? '#EF9F27' : '#1D9E75'}, ${marginColor(margin)})`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>BE: {fmtPrice(c.breakeven, c.unit)}</span>
                    <span style={{ color: marginColor(margin), fontWeight: 600 }}>
                      {margin >= 0 ? '+' : ''}{margin.toFixed(0)}% — {marginLabel(margin)}
                    </span>
                  </div>
                </div>

                {/* Expanded: chart + details */}
                {isExpanded && (
                  <div className="border-t px-3 pb-3 pt-2" style={{ borderColor: 'var(--border)' }}>
                    <PriceChart ticker={c.ticker} compact={true} />
                    <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <div className="flex justify-between mb-1">
                        <span>Breakeven basis:</span>
                        <span>{c.breakevenNote}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unit:</span>
                        <span>{c.unit}</span>
                      </div>
                    </div>
                    <a
                      href={`https://finance.yahoo.com/quote/${encodeURIComponent(c.ticker)}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 text-center text-xs font-medium py-1.5 rounded-md"
                      style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      View on Yahoo Finance →
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
