'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MacroDrilldownProps {
  indicator: string;
  label: string;
  onClose: () => void;
}

const INDICATOR_TICKERS: Record<string, { ticker: string; format: (v: number) => string; color: string; prefix?: string }> = {
  vix: { ticker: '^VIX', format: (v) => v.toFixed(2), color: '#E24B4A' },
  fear_greed: { ticker: '', format: (v) => `${v}`, color: '#EF9F27' }, // No Yahoo ticker
  oil: { ticker: 'CL=F', format: (v) => `$${v.toFixed(2)}`, color: '#378ADD', prefix: '$' },
  gold: { ticker: 'GC=F', format: (v) => `$${v.toFixed(0)}`, color: '#EF9F27', prefix: '$' },
  dxy: { ticker: 'DX-Y.NYB', format: (v) => v.toFixed(2), color: '#1D9E75' },
  sp500: { ticker: '^GSPC', format: (v) => v.toLocaleString(undefined, { maximumFractionDigits: 0 }), color: '#378ADD' },
  yield_2y: { ticker: '2YY=F', format: (v) => `${v.toFixed(2)}%`, color: '#534AB7' },
  yield_10y: { ticker: '^TNX', format: (v) => `${v.toFixed(2)}%`, color: '#378ADD' },
  yield_30y: { ticker: '^TYX', format: (v) => `${v.toFixed(2)}%`, color: '#1D9E75' },
  spread: { ticker: '', format: (v) => `${v.toFixed(0)} bps`, color: '#D85A30' }, // Calculated, no ticker
  mortgage: { ticker: '', format: (v) => `${v.toFixed(2)}%`, color: '#993556' }, // No direct ticker
};

const RANGES = [
  { key: '1mo', label: '1M' },
  { key: '6mo', label: '6M' },
  { key: '1y', label: '1Y' },
  { key: '5y', label: '5Y' },
  { key: 'max', label: 'Max' },
];

export default function MacroDrilldown({ indicator, label, onClose }: MacroDrilldownProps) {
  const [range, setRange] = useState('1y');
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = INDICATOR_TICKERS[indicator] || { ticker: '', format: (v: number) => `${v}`, color: '#378ADD' };

  useEffect(() => {
    async function fetchData() {
      if (!config.ticker) {
        setError('Historical data for this indicator will build over time from daily snapshots.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/chart?ticker=${encodeURIComponent(config.ticker)}&range=${range}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setPrices(data.prices || []);
      } catch {
        setError('Unable to load historical data');
        setPrices([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [indicator, range, config.ticker]);

  const firstPrice = prices.length > 0 ? prices[0].close : 0;
  const lastPrice = prices.length > 0 ? prices[prices.length - 1].close : 0;
  const priceChange = lastPrice - firstPrice;
  const pctChange = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;
  const lineColor = config.color;

  return (
    <div className="rounded-lg p-5" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</h3>
          {prices.length > 0 && (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {config.format(lastPrice)}
              </span>
              <span className="text-xs font-medium" style={{ color: isPositive ? '#1D9E75' : '#E24B4A' }}>
                {isPositive ? '+' : ''}{config.format(priceChange)} ({isPositive ? '+' : ''}{pctChange.toFixed(2)}%)
              </span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                vs {range === '1mo' ? '1 month' : range === '6mo' ? '6 months' : range === '1y' ? '1 year' : range === '5y' ? '5 years' : 'all time'} ago
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-md text-sm"
          style={{ background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          Close
        </button>
      </div>

      {/* Range buttons */}
      {config.ticker && (
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
      )}

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center" style={{ height: 300 }}>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Loading historical data...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center" style={{ height: 300 }}>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{error}</span>
        </div>
      ) : prices.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={prices} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`macro-gradient-${indicator}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.12} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tickFormatter={(ts: number) => {
                const d = new Date(ts);
                if (range === '1mo') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (range === '6mo' || range === '1y') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }}
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
              axisLine={false}
              tickLine={false}
              minTickGap={50}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => config.format(v)}
              width={65}
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
                const d = new Date(Number(ts));
                return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
              }}
              formatter={(value: any) => [config.format(Number(value)), label]}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={lineColor}
              strokeWidth={1.5}
              fill={`url(#macro-gradient-${indicator})`}
              dot={false}
              activeDot={{ r: 3, fill: lineColor, stroke: 'var(--bg-primary)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
