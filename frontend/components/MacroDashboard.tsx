'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MacroDrilldown from './MacroDrilldown';
import MarketNews from './MarketNews';

interface MacroData {
  [key: string]: any;
}

function Signal({ color }: { color: string }) {
  const colors: Record<string, string> = { green: '#1D9E75', yellow: '#EF9F27', red: '#E24B4A', gray: '#9ca3af', unknown: '#9ca3af' };
  return <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: colors[color] || colors.gray, marginRight: 6 }} />;
}

function DailyChange({ change, pct }: { change: number | null; pct: number | null }) {
  if (change == null || pct == null) return null;
  const isUp = change >= 0;
  return (
    <span className="text-xs font-medium ml-1" style={{ color: isUp ? '#1D9E75' : '#E24B4A' }}>
      {isUp ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
    </span>
  );
}

function YoYChange({ pct }: { pct: number | null }) {
  if (pct == null) return null;
  const isUp = pct >= 0;
  return (
    <div className="text-xs mt-0.5" style={{ color: isUp ? '#1D9E75' : '#E24B4A' }}>
      YoY: {isUp ? '+' : ''}{pct.toFixed(1)}%
    </div>
  );
}

function Card({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      className={`rounded-lg p-3 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}
      onClick={onClick}
    >
      <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}{onClick ? ' →' : ''}</div>
      {children}
    </div>
  );
}

function SignalBadge({ color, text }: { color: string; text: string }) {
  const styles: Record<string, { background: string; color: string }> = {
    green: { background: '#E1F5EE', color: '#0F6E56' },
    yellow: { background: '#FAEEDA', color: '#854F0B' },
    red: { background: '#FCEBEB', color: '#A32D2D' },
  };
  const s = styles[color] || styles.yellow;
  return <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={s}>{text}</span>;
}

function getRegimeLabel(regime: string): string {
  if (regime === 'risk_off') return 'Risk-off';
  if (regime === 'cautious') return 'Cautious';
  return 'Risk-on';
}

function getRegimeColor(regime: string): string {
  if (regime === 'risk_off') return 'red';
  if (regime === 'cautious') return 'yellow';
  return 'green';
}

function getSignalNote(indicator: string, data: MacroData): string {
  switch (indicator) {
    case 'vix': return data.vix >= 25 ? 'Elevated volatility' : data.vix >= 15 ? 'Above average' : 'Low volatility';
    case 'oil': return data.oil_wti >= 90 ? 'Above $90 — inflation risk' : data.oil_wti >= 70 ? 'Elevated' : 'Normal range';
    case 'gold': return data.gold_ma_pct > 3 ? 'Flight to safety active' : data.gold_ma_pct < -3 ? 'Risk appetite returning' : 'Normal range';
    case 'dxy': return data.dxy >= 105 ? 'Strong — headwind' : data.dxy >= 100 ? 'Moderately strong' : 'Neutral';
    case 'mortgage': return data.mortgage_30y >= 7 ? 'Restrictive' : data.mortgage_30y >= 6 ? 'Elevated' : 'Favorable';
    case 'fear_greed': return data.fear_greed_label?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || '';
    default: return '';
  }
}

export default function MacroDashboard({ data }: { data: MacroData | null }) {
  const [drilldown, setDrilldown] = useState<{ indicator: string; label: string } | null>(null);

  if (!data) {
    return <div className="text-center py-20 text-sm" style={{ color: 'var(--text-secondary)' }}>No macro data available yet. Run the pipeline first.</div>;
  }

  if (drilldown) {
    return <MacroDrilldown indicator={drilldown.indicator} label={drilldown.label} onClose={() => setDrilldown(null)} />;
  }

  const yieldCurve = [
    { maturity: '3M', yield: data.yield_3m },
    { maturity: '2Y', yield: data.yield_2y },
    { maturity: '5Y', yield: data.yield_5y },
    { maturity: '10Y', yield: data.yield_10y },
    { maturity: '30Y', yield: data.yield_30y },
  ].filter(d => d.yield != null);

  const regimeColor = getRegimeColor(data.market_regime);
  const regimeColors: Record<string, string> = { red: '#E24B4A', yellow: '#EF9F27', green: '#1D9E75' };

  // Sector performance sorted by change
  const sectors = data.sector_performance || {};
  const sortedSectors = Object.entries(sectors).sort(([, a]: any, [, b]: any) => b - a);

  return (
    <div className="space-y-6">
      {/* Regime banner */}
      <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderLeft: `3px solid ${regimeColors[regimeColor]}` }}>
        <div className="flex items-center gap-2 mb-1">
          <Signal color={regimeColor} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Market regime: {getRegimeLabel(data.market_regime)}
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {data.market_regime === 'risk_off'
            ? 'Multiple stress signals active. Historically a contrarian buying zone for value plays with strong balance sheets.'
            : data.market_regime === 'cautious'
            ? 'Mixed signals — some indicators elevated. Selective positioning recommended.'
            : 'Broad risk appetite. Growth and momentum strategies favored.'}
        </p>
      </div>

      {/* Sentiment row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <Card label="Fear & greed index" onClick={() => setDrilldown({ indicator: 'fear_greed', label: 'Fear & Greed Index' })}>
          <div className="text-2xl font-semibold">
            <Signal color={data.fear_greed_signal || 'gray'} />
            {data.fear_greed_index}
          </div>
          <div className="mt-1">
            <SignalBadge color={data.fear_greed_signal || 'yellow'} text={getSignalNote('fear_greed', data)} />
          </div>
          <div className="mt-3 relative h-3 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, #E24B4A, #EF9F27, #1D9E75)' }}>
            <div className="absolute top-0 w-1 h-full rounded" style={{ left: `${data.fear_greed_index}%`, background: 'var(--text-primary)' }} />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}><span>Fear</span><span>Greed</span></div>
        </Card>

        <Card label="VIX (volatility index)" onClick={() => setDrilldown({ indicator: 'vix', label: 'VIX Volatility Index' })}>
          <div className="text-2xl font-semibold">
            <Signal color={data.vix_signal || 'gray'} />
            {data.vix?.toFixed(2)}
            <DailyChange change={data.vix_daily_change} pct={data.vix_daily_change_pct} />
          </div>
          <YoYChange pct={data.vix_yoy_pct} />
          <div className="mt-1">
            <SignalBadge color={data.vix_signal || 'yellow'} text={getSignalNote('vix', data)} />
          </div>
          {/* VIX gauge — scale 0 to 50+ */}
          <div className="mt-3 relative h-3 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, #1D9E75 0%, #1D9E75 30%, #EF9F27 30%, #EF9F27 50%, #E24B4A 50%, #E24B4A 100%)' }}>
            <div
              className="absolute top-0 w-1.5 h-full rounded"
              style={{ left: `${Math.min(100, Math.max(0, (data.vix || 0) / 50 * 100))}%`, background: 'var(--text-primary)', boxShadow: '0 0 3px rgba(0,0,0,0.3)' }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            <span>Calm</span>
            <span style={{ position: 'relative', left: '-10%' }}>15</span>
            <span>25</span>
            <span>Extreme</span>
          </div>
          {/* Historical context */}
          <div className="flex gap-3 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span>Avg: ~19</span>
            <span>·</span>
            <span>COVID peak: 82</span>
            <span>·</span>
            <span>2022 high: 36</span>
          </div>
        </Card>
      </div>

      {/* S&P 500 — triple signal */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>S&P 500</div>
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', cursor: 'pointer' }} onClick={() => setDrilldown({ indicator: 'sp500', label: 'S&P 500' })}>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {data.sp500?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <DailyChange change={data.sp500_daily_change} pct={data.sp500_daily_change_pct} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md p-2" style={{ background: 'var(--bg-secondary)' }}>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Static level</div>
              <div className="text-sm font-semibold mt-0.5"><Signal color={data.sp500_signal_static || 'gray'} />{data.sp500_signal_static === 'green' ? 'Bullish' : data.sp500_signal_static === 'yellow' ? 'Neutral' : 'Correction'}</div>
            </div>
            <div className="rounded-md p-2" style={{ background: 'var(--bg-secondary)' }}>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>vs 50-day MA</div>
              <div className="text-sm font-semibold mt-0.5">
                <Signal color={data.sp500_signal_ma || 'gray'} />
                {data.sp500_50d_ma ? `${data.sp500 > data.sp500_50d_ma ? '+' : ''}${(((data.sp500 - data.sp500_50d_ma) / data.sp500_50d_ma) * 100).toFixed(1)}%` : '-'}
              </div>
            </div>
            <div className="rounded-md p-2" style={{ background: 'var(--bg-secondary)' }}>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>YTD performance</div>
              <div className="text-sm font-semibold mt-0.5">
                <Signal color={data.sp500_signal_ytd || 'gray'} />
                {data.sp500_ytd_pct != null ? `${data.sp500_ytd_pct > 0 ? '+' : ''}${data.sp500_ytd_pct.toFixed(1)}%` : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Performance Heatmap */}
      {sortedSectors.length > 0 && (
        <div>
          <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
            S&P 500 sector performance (daily)
          </div>
          <div className="grid grid-cols-4 gap-2">
            {sortedSectors.map(([name, change]: [string, any]) => (
              <div key={name} className="rounded-md px-3 py-2" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{name}</div>
                <div className="text-sm font-semibold mt-0.5" style={{ color: change >= 0 ? '#1D9E75' : '#E24B4A' }}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yields */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Treasury yields & rates</div>
        <div className="grid grid-cols-5 gap-3 mb-3">
          <Card label="Fed funds (proxy)" onClick={() => setDrilldown({ indicator: 'yield_2y', label: 'Fed Funds Rate (3M T-bill proxy)' })}>
            <div className="text-lg font-semibold"><Signal color={data.fed_funds_signal || 'gray'} />{data.fed_funds_proxy?.toFixed(2)}%</div>
          </Card>
          <Card label="2-year" onClick={() => setDrilldown({ indicator: 'yield_2y', label: '2-Year Treasury Yield' })}>
            <div className="text-lg font-semibold">{data.yield_2y?.toFixed(2)}%</div>
          </Card>
          <Card label="10-year" onClick={() => setDrilldown({ indicator: 'yield_10y', label: '10-Year Treasury Yield' })}>
            <div className="text-lg font-semibold">{data.yield_10y?.toFixed(2)}%</div>
          </Card>
          <Card label="30-year" onClick={() => setDrilldown({ indicator: 'yield_30y', label: '30-Year Treasury Yield' })}>
            <div className="text-lg font-semibold">{data.yield_30y?.toFixed(2)}%</div>
          </Card>
          <Card label="2s/10s spread" onClick={() => setDrilldown({ indicator: 'spread', label: '2s/10s Yield Spread' })}>
            <div className="text-lg font-semibold">
              <Signal color={data.yield_curve_signal || 'gray'} />
              {data.spread_2s10s > 0 ? '+' : ''}{data.spread_2s10s?.toFixed(0)} bps
            </div>
          </Card>
        </div>
        {yieldCurve.length > 0 && (
          <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}>
            <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Yield curve</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={yieldCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="maturity" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
                <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(value: any) => [`${Number(value).toFixed(3)}%`, 'Yield']} />
                <Line type="monotone" dataKey="yield" stroke="#378ADD" strokeWidth={2} dot={{ fill: '#378ADD', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Commodities & rates */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Commodities & rates</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Card label="WTI crude oil" onClick={() => setDrilldown({ indicator: 'oil', label: 'WTI Crude Oil' })}>
            <div className="text-lg font-semibold">
              <Signal color={data.oil_signal || 'gray'} />${data.oil_wti?.toFixed(2)}
              <DailyChange change={data.oil_daily_change} pct={data.oil_daily_change_pct} />
            </div>
            <YoYChange pct={data.oil_yoy_pct} />
          </Card>
          <Card label="Gold (vs 50d MA)" onClick={() => setDrilldown({ indicator: 'gold', label: 'Gold (Spot)' })}>
            <div className="text-lg font-semibold">
              <Signal color={data.gold_signal || 'gray'} />${data.gold?.toLocaleString()}
              <DailyChange change={data.gold_daily_change} pct={data.gold_daily_change_pct} />
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {data.gold_ma_pct != null ? `${data.gold_ma_pct > 0 ? '+' : ''}${data.gold_ma_pct.toFixed(1)}% from 50d MA` : ''}
            </div>
            <YoYChange pct={data.gold_yoy_pct} />
          </Card>
          <Card label="DXY (USD index)" onClick={() => setDrilldown({ indicator: 'dxy', label: 'US Dollar Index (DXY)' })}>
            <div className="text-lg font-semibold">
              <Signal color={data.dxy_signal || 'gray'} />{data.dxy?.toFixed(2)}
              <DailyChange change={data.dxy_daily_change} pct={data.dxy_daily_change_pct} />
            </div>
            <YoYChange pct={data.dxy_yoy_pct} />
          </Card>
          <Card label="30-yr mortgage" onClick={() => setDrilldown({ indicator: 'mortgage', label: '30-Year Mortgage Rate' })}>
            <div className="text-lg font-semibold">
              <Signal color={data.mortgage_signal || 'gray'} />{data.mortgage_30y?.toFixed(2)}%
            </div>
          </Card>
        </div>
      </div>

      {/* Market News */}
      <MarketNews />
    </div>
  );
}
