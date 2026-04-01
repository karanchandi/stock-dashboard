'use client';

import { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceChartProps {
  ticker: string;
  compact?: boolean; // true for inline dropdown, false for full detail page
}

interface PricePoint {
  time: number;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

const RANGES = [
  { key: '1d', label: '1D' },
  { key: '5d', label: '5D' },
  { key: '1mo', label: '1M' },
  { key: '6mo', label: '6M' },
  { key: 'ytd', label: 'YTD' },
  { key: '1y', label: '1Y' },
  { key: '5y', label: '5Y' },
  { key: 'max', label: 'Max' },
];

function formatTime(ts: number, range: string): string {
  const d = new Date(ts);
  if (range === '1d') return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (range === '5d') return d.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric' });
  if (range === '1mo' || range === '6mo' || range === 'ytd') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function formatPrice(v: number): string {
  return `$${v.toFixed(2)}`;
}

export default function PriceChart({ ticker, compact = false }: PriceChartProps) {
  const [range, setRange] = useState('6mo');
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChart = useCallback(async (r: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/chart?ticker=${encodeURIComponent(ticker)}&range=${r}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPrices(data.prices || []);
      setMeta(data);
    } catch {
      setError('Unable to load chart data');
      setPrices([]);
    }
    setLoading(false);
  }, [ticker]);

  useEffect(() => {
    fetchChart(range);
  }, [range, fetchChart]);

  const firstPrice = prices.length > 0 ? prices[0].close : 0;
  const lastPrice = prices.length > 0 ? prices[prices.length - 1].close : 0;
  const priceChange = lastPrice - firstPrice;
  const pctChange = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;
  const lineColor = isPositive ? '#1D9E75' : '#E24B4A';
  const fillColor = isPositive ? 'rgba(29,158,117,0.08)' : 'rgba(226,75,74,0.08)';

  const chartHeight = compact ? 180 : 300;

  return (
    <div>
      {/* Price header */}
      <div className="flex items-baseline gap-3 mb-2">
        {meta?.regularMarketPrice && (
          <span className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            ${Number(meta.regularMarketPrice).toFixed(2)}
          </span>
        )}
        {prices.length > 0 && (
          <span className="text-sm font-medium" style={{ color: lineColor }}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{pctChange.toFixed(2)}%)
          </span>
        )}
      </div>

      {/* Range buttons */}
      <div className="flex gap-1 mb-3">
        {RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className="px-2.5 py-1 rounded text-xs font-medium transition-all"
            style={{
              background: range === r.key ? 'var(--text-primary)' : 'transparent',
              color: range === r.key ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: range === r.key ? 'none' : '0.5px solid var(--border)',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center" style={{ height: chartHeight }}>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Loading chart...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center" style={{ height: chartHeight }}>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{error}</span>
        </div>
      ) : prices.length > 0 ? (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={prices} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.12} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tickFormatter={(ts: number) => formatTime(ts, range)}
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              width={50}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12,
                padding: '8px 12px',
              }}
              labelFormatter={(ts: any) => {
                const d = new Date(ts);
                return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
              }}
              formatter={(value: any) => [formatPrice(Number(value)), 'Price']}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={lineColor}
              strokeWidth={1.5}
              fill={`url(#gradient-${ticker})`}
              dot={false}
              activeDot={{ r: 3, fill: lineColor, stroke: 'var(--bg-primary)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center" style={{ height: chartHeight }}>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>No price data available</span>
        </div>
      )}
    </div>
  );
}
