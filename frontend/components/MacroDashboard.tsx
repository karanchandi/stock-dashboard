'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MacroDrilldown from './MacroDrilldown';

interface MacroData {
  vix: number;
  vix_signal: string;
  fear_greed_index: number;
  fear_greed_label: string;
  yield_3m: number;
  yield_2y: number;
  yield_5y: number;
  yield_10y: number;
  yield_30y: number;
  spread_2s10s: number;
  yield_curve_signal: string;
  fed_funds_rate: string;
  oil_wti: number;
  oil_signal: string;
  gold: number;
  gold_signal: string;
  dxy: number;
  dxy_signal: string;
  sp500: number;
  sp500_signal: string;
  mortgage_30y: number;
  mortgage_15y: number;
  mortgage_signal: string;
  market_regime: string;
}

function Signal({ color }: { color: 'green' | 'yellow' | 'red' }) {
  const colors = { green: '#1D9E75', yellow: '#EF9F27', red: '#E24B4A' };
  return (
    <span
      style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: colors[color], marginRight: 6 }}
    />
  );
}

function SignalBadge({ color, text }: { color: 'green' | 'yellow' | 'red'; text: string }) {
  const styles = {
    green: { background: '#E1F5EE', color: '#0F6E56' },
    yellow: { background: '#FAEEDA', color: '#854F0B' },
    red: { background: '#FCEBEB', color: '#A32D2D' },
  };
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={styles[color]}>
      {text}
    </span>
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

function getVixSignal(v: number): 'green' | 'yellow' | 'red' {
  if (v >= 25) return 'red';
  if (v >= 18) return 'yellow';
  return 'green';
}

function getOilSignal(v: number): 'green' | 'yellow' | 'red' {
  if (v >= 100) return 'red';
  if (v >= 80) return 'yellow';
  return 'green';
}

function getGoldSignal(v: number): 'green' | 'yellow' | 'red' {
  if (v >= 3000) return 'green';
  if (v >= 2000) return 'yellow';
  return 'red';
}

function getDxySignal(v: number): 'green' | 'yellow' | 'red' {
  if (v >= 105) return 'red';
  if (v >= 100) return 'yellow';
  return 'green';
}

function getMortgageSignal(v: number): 'green' | 'yellow' | 'red' {
  if (v >= 7) return 'red';
  if (v >= 6.5) return 'yellow';
  return 'green';
}

function getFearGreedSignal(v: number): 'green' | 'yellow' | 'red' {
  if (v <= 25) return 'red';
  if (v <= 50) return 'yellow';
  return 'green';
}

function getRegimeLabel(regime: string): string {
  if (regime === 'risk_off') return 'Risk-off';
  if (regime === 'cautious') return 'Cautious';
  return 'Risk-on';
}

function getFearGreedLabel(label: string): string {
  return label?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
}

export default function MacroDashboard({ data }: { data: MacroData | null }) {
  const [drilldown, setDrilldown] = useState<{ indicator: string; label: string } | null>(null);

  if (!data) {
    return (
      <div className="text-center py-20 text-sm" style={{ color: 'var(--text-secondary)' }}>
        No macro data available yet. Run the pipeline first.
      </div>
    );
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

  const regimeColor = data.market_regime === 'risk_off' ? 'red' : data.market_regime === 'cautious' ? 'yellow' : 'green';

  const signals: { name: string; value: string; color: 'green' | 'yellow' | 'red'; note: string }[] = [
    { name: 'Fear & greed', value: `${data.fear_greed_index}/100`, color: getFearGreedSignal(data.fear_greed_index), note: getFearGreedLabel(data.fear_greed_label) },
    { name: 'VIX', value: data.vix?.toFixed(1), color: getVixSignal(data.vix), note: data.vix >= 25 ? 'Elevated volatility' : data.vix >= 18 ? 'Above average' : 'Low volatility' },
    { name: 'Yield curve (2s/10s)', value: `${data.spread_2s10s > 0 ? '+' : ''}${data.spread_2s10s?.toFixed(0)} bps`, color: data.spread_2s10s < 0 ? 'red' : data.spread_2s10s < 50 ? 'yellow' : 'green', note: data.spread_2s10s < 0 ? 'Inverted — recession warning' : 'Normalized — watch for lag' },
    { name: 'Oil (WTI)', value: `$${data.oil_wti?.toFixed(2)}`, color: getOilSignal(data.oil_wti), note: data.oil_wti >= 100 ? 'Above $100 — inflation risk' : 'Normal range' },
    { name: 'Gold', value: `$${data.gold?.toLocaleString()}`, color: getGoldSignal(data.gold), note: data.gold >= 3000 ? 'Flight to safety active' : 'Normal' },
    { name: 'DXY (dollar)', value: data.dxy?.toFixed(2), color: getDxySignal(data.dxy), note: data.dxy >= 100 ? 'Strong — headwind for intl stocks' : 'Neutral' },
    { name: '30-yr mortgage', value: `${data.mortgage_30y?.toFixed(2)}%`, color: getMortgageSignal(data.mortgage_30y), note: data.mortgage_30y >= 6.5 ? 'Rising — watch cap rates' : 'Moderate' },
    { name: 'S&P 500', value: data.sp500?.toLocaleString(), color: data.sp500 >= 6800 ? 'green' : data.sp500 >= 6400 ? 'yellow' : 'red', note: data.sp500 < 6400 ? 'Near correction territory' : 'Holding support' },
  ];

  return (
    <div className="space-y-6">
      {/* Regime banner */}
      <div
        className="rounded-lg p-4"
        style={{
          background: 'var(--bg-primary)',
          border: '0.5px solid var(--border)',
          borderLeft: `3px solid ${regimeColor === 'red' ? '#E24B4A' : regimeColor === 'yellow' ? '#EF9F27' : '#1D9E75'}`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Signal color={regimeColor as 'green' | 'yellow' | 'red'} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Market regime: {getRegimeLabel(data.market_regime)}
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {data.market_regime === 'risk_off'
            ? 'Elevated volatility and stress signals suggest caution. Historically a contrarian buying zone for value plays with strong balance sheets.'
            : data.market_regime === 'cautious'
            ? 'Mixed signals — some indicators elevated. Selective positioning recommended.'
            : 'Broad risk appetite. Growth and momentum strategies favored.'}
        </p>
      </div>

      {/* Sentiment row */}
      <div className="grid grid-cols-2 gap-3">
        <Card label="Fear & greed index" onClick={() => setDrilldown({ indicator: 'fear_greed', label: 'Fear & Greed Index' })}>
          <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Signal color={getFearGreedSignal(data.fear_greed_index)} />
            {data.fear_greed_index}
          </div>
          <div className="mt-1">
            <SignalBadge color={getFearGreedSignal(data.fear_greed_index)} text={getFearGreedLabel(data.fear_greed_label)} />
          </div>
          <div className="mt-3 relative h-3 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, #E24B4A, #EF9F27, #1D9E75)' }}>
            <div
              className="absolute top-0 w-1 h-full rounded"
              style={{ left: `${data.fear_greed_index}%`, background: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            <span>Fear</span><span>Greed</span>
          </div>
        </Card>

        <Card label="VIX (volatility index)" onClick={() => setDrilldown({ indicator: 'vix', label: 'VIX Volatility Index' })}>
          <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Signal color={getVixSignal(data.vix)} />
            {data.vix?.toFixed(2)}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
            {data.vix >= 30 ? 'Extreme fear — market stress' : data.vix >= 20 ? 'Elevated — uncertainty high' : 'Normal range'}
          </p>
        </Card>
      </div>

      {/* Yields */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
          Treasury yields & yield curve
        </div>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <Card label="2-year" onClick={() => setDrilldown({ indicator: 'yield_2y', label: '2-Year Treasury Yield' })}>{<div className="text-lg font-semibold">{data.yield_2y?.toFixed(2)}%</div>}</Card>
          <Card label="10-year" onClick={() => setDrilldown({ indicator: 'yield_10y', label: '10-Year Treasury Yield' })}>{<div className="text-lg font-semibold">{data.yield_10y?.toFixed(2)}%</div>}</Card>
          <Card label="30-year" onClick={() => setDrilldown({ indicator: 'yield_30y', label: '30-Year Treasury Yield' })}>{<div className="text-lg font-semibold">{data.yield_30y?.toFixed(2)}%</div>}</Card>
          <Card label="2s/10s spread" onClick={() => setDrilldown({ indicator: 'spread', label: '2s/10s Yield Spread' })}>
            <div className="text-lg font-semibold">
              <Signal color={data.spread_2s10s < 0 ? 'red' : data.spread_2s10s < 50 ? 'yellow' : 'green'} />
              {data.spread_2s10s > 0 ? '+' : ''}{data.spread_2s10s?.toFixed(0)} bps
            </div>
          </Card>
        </div>
        {yieldCurve.length > 0 && (
          <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}>
            <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Yield curve</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={yieldCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="maturity" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                  tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(value: any) => [`${Number(value).toFixed(3)}%`, 'Yield']}
                />
                <Line type="monotone" dataKey="yield" stroke="#378ADD" strokeWidth={2} dot={{ fill: '#378ADD', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Commodities & rates */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
          Commodities & rates
        </div>
        <div className="grid grid-cols-4 gap-3">
          <Card label="WTI crude oil" onClick={() => setDrilldown({ indicator: 'oil', label: 'WTI Crude Oil' })}>
            <div className="text-lg font-semibold"><Signal color={getOilSignal(data.oil_wti)} />${data.oil_wti?.toFixed(2)}</div>
          </Card>
          <Card label="Gold" onClick={() => setDrilldown({ indicator: 'gold', label: 'Gold (spot)' })}>
            <div className="text-lg font-semibold"><Signal color={getGoldSignal(data.gold)} />${data.gold?.toLocaleString()}</div>
          </Card>
          <Card label="DXY (USD index)" onClick={() => setDrilldown({ indicator: 'dxy', label: 'US Dollar Index (DXY)' })}>
            <div className="text-lg font-semibold"><Signal color={getDxySignal(data.dxy)} />{data.dxy?.toFixed(2)}</div>
          </Card>
          <Card label="30-yr mortgage" onClick={() => setDrilldown({ indicator: 'mortgage', label: '30-Year Mortgage Rate' })}>
            <div className="text-lg font-semibold"><Signal color={getMortgageSignal(data.mortgage_30y)} />{data.mortgage_30y?.toFixed(2)}%</div>
          </Card>
        </div>
      </div>

      {/* Signal summary */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
          Signal summary
        </div>
        <div className="space-y-1.5">
          {signals.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}
            >
              <Signal color={s.color} />
              <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{s.value}</span>
              <SignalBadge color={s.color} text={s.note} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
