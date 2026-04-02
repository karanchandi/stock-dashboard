'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import PriceChart from './PriceChart';
import TickerFeed from './TickerFeed';

interface StockDetailProps {
  ticker: string;
  onBack: () => void;
  onAddToWatchlist: (ticker: string) => void;
}

function Card({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg p-3 ${className || ''}`} style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}>
      <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {children}
    </div>
  );
}

function Signal({ color }: { color: 'green' | 'yellow' | 'red' | 'gray' }) {
  const colors = { green: '#1D9E75', yellow: '#EF9F27', red: '#E24B4A', gray: '#9ca3af' };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[color], marginRight: 6 }} />;
}

function scoreColor(score: number | null): 'green' | 'yellow' | 'red' | 'gray' {
  if (score == null) return 'gray';
  if (score >= 65) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

function fmt(v: any, decimals = 2): string {
  if (v == null) return '-';
  return Number(v).toFixed(decimals);
}

function fmtPct(v: any): string {
  if (v == null) return '-';
  const n = Number(v);
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function fmtGrowth(v: any): string {
  if (v == null) return '-';
  const pct = Number(v) * 100;
  if (Math.abs(pct) > 999) return `${pct > 0 ? '>' : '<'}${pct > 0 ? '+' : '-'}999%`;
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

function fmtMcap(mc: any): string {
  if (mc == null) return '-';
  const n = Number(mc);
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtDollar(v: any): string {
  if (v == null) return '-';
  const n = Number(v);
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function StockDetail({ ticker, onBack, onAddToWatchlist }: StockDetailProps) {
  const [stock, setStock] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStock() {
      setLoading(true);

      // Get latest data for this ticker
      const { data: latest } = await supabase
        .from('screener_results')
        .select('*')
        .eq('ticker', ticker)
        .order('run_date', { ascending: false })
        .limit(1)
        .single();

      if (latest) setStock(latest);

      // Get historical data for score trends
      const { data: hist } = await supabase
        .from('screener_results')
        .select('run_date, price, combined_score, value_score, analyst_score, insider_score')
        .eq('ticker', ticker)
        .order('run_date', { ascending: true })
        .limit(90);

      if (hist) setHistory(hist);
      setLoading(false);
    }

    fetchStock();
  }, [ticker]);

  if (loading) {
    return <div className="text-center py-20 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading {ticker}...</div>;
  }

  if (!stock) {
    return <div className="text-center py-20 text-sm" style={{ color: 'var(--text-secondary)' }}>No data for {ticker}</div>;
  }

  const s = stock;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-md text-sm"
            style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            Back
          </button>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {s.ticker} <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {s.subsector} · {s.exchange} · {s.market_cap_tier}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>${fmt(s.price)}</div>
            <div className="text-xs" style={{ color: s.pct_from_52w_high < -20 ? '#E24B4A' : 'var(--text-secondary)' }}>
              {fmtPct(s.pct_from_52w_high)} from 52w high
            </div>
          </div>
          <button
            onClick={() => onAddToWatchlist(ticker)}
            className="px-3 py-1.5 rounded-md text-sm font-medium"
            style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', color: 'var(--text-primary)' }}
          >
            + Watchlist
          </button>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-4 gap-3">
        <Card label="Combined score">
          <div className="text-2xl font-semibold"><Signal color={scoreColor(s.combined_score)} />{fmt(s.combined_score, 1)}</div>
        </Card>
        <Card label="Value score">
          <div className="text-lg font-semibold"><Signal color={scoreColor(s.value_score)} />{fmt(s.value_score, 1)}</div>
        </Card>
        <Card label="Analyst score">
          <div className="text-lg font-semibold"><Signal color={scoreColor(s.analyst_score)} />{fmt(s.analyst_score, 1)}</div>
        </Card>
        <Card label="Insider score">
          <div className="text-lg font-semibold"><Signal color={scoreColor(s.insider_score)} />{fmt(s.insider_score, 1)}</div>
        </Card>
      </div>

      {/* Interactive price chart */}
      <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}>
        <PriceChart ticker={s.ticker} compact={false} />
      </div>

      {/* Historical score trends */}
      {history.length > 1 && (
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}>
          <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Score trends (builds over time with daily runs)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="run_date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="combined_score" stroke="#378ADD" strokeWidth={2} dot={false} name="Combined" />
              <Line type="monotone" dataKey="value_score" stroke="#1D9E75" strokeWidth={1.5} dot={false} name="Value" />
              <Line type="monotone" dataKey="analyst_score" stroke="#EF9F27" strokeWidth={1.5} dot={false} name="Analyst" />
              <Line type="monotone" dataKey="insider_score" stroke="#534AB7" strokeWidth={1.5} dot={false} name="Insider" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            <span className="text-xs" style={{ color: '#378ADD' }}>● Combined</span>
            <span className="text-xs" style={{ color: '#1D9E75' }}>● Value</span>
            <span className="text-xs" style={{ color: '#EF9F27' }}>● Analyst</span>
            <span className="text-xs" style={{ color: '#534AB7' }}>● Insider</span>
          </div>
        </div>
      )}

      {/* News & Sentiment */}
      <TickerFeed ticker={s.ticker} />

      {/* Valuation metrics */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Valuation</div>
        <div className="grid grid-cols-4 gap-3">
          <Card label="P/E ratio"><div className="text-lg font-semibold">{fmt(s.pe_ratio, 1)}</div></Card>
          <Card label="Forward P/E"><div className="text-lg font-semibold">{fmt(s.forward_pe, 1)}</div></Card>
          <Card label="P/B ratio"><div className="text-lg font-semibold">{fmt(s.pb_ratio, 2)}</div></Card>
          <Card label="EV/EBITDA"><div className="text-lg font-semibold">{fmt(s.ev_ebitda, 1)}</div></Card>
        </div>
      </div>

      {/* Financials */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Financials</div>
        <div className="grid grid-cols-4 gap-3">
          <Card label="Market cap"><div className="text-lg font-semibold">{fmtMcap(s.market_cap)}</div></Card>
          <Card label="Annual revenue"><div className="text-lg font-semibold">{fmtMcap(s.total_revenue)}</div></Card>
          <Card label="Net income"><div className="text-lg font-semibold" style={{ color: s.net_income > 0 ? '#1D9E75' : s.net_income < 0 ? '#E24B4A' : 'var(--text-primary)' }}>{fmtMcap(s.net_income)}</div></Card>
          <Card label="Profit margin"><div className="text-lg font-semibold">{s.profit_margin ? `${(s.profit_margin * 100).toFixed(1)}%` : '-'}</div></Card>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-3">
          <Card label="Revenue growth"><div className="text-lg font-semibold" style={{ color: s.revenue_growth > 0 ? '#1D9E75' : s.revenue_growth < 0 ? '#E24B4A' : 'var(--text-primary)' }}>{fmtGrowth(s.revenue_growth)}</div></Card>
          <Card label="Earnings growth"><div className="text-lg font-semibold" style={{ color: s.earnings_growth > 0 ? '#1D9E75' : s.earnings_growth < 0 ? '#E24B4A' : 'var(--text-primary)' }}>{fmtGrowth(s.earnings_growth)}</div></Card>
          <Card label="Free cash flow"><div className="text-lg font-semibold">{fmtMcap(s.free_cashflow)}</div></Card>
          <Card label="Operating margin"><div className="text-lg font-semibold">{s.operating_margin ? `${(s.operating_margin * 100).toFixed(1)}%` : '-'}</div></Card>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-4 gap-3">
          <Card label="D/E ratio"><div className="text-lg font-semibold">{fmt(s.debt_to_equity, 1)}</div></Card>
          <Card label="ROE"><div className="text-lg font-semibold">{s.return_on_equity ? `${(s.return_on_equity * 100).toFixed(1)}%` : '-'}</div></Card>
          <Card label="Beta"><div className="text-lg font-semibold">{fmt(s.beta, 2)}</div></Card>
          <Card label="Avg volume"><div className="text-lg font-semibold">{s.avg_volume ? `${(s.avg_volume / 1e6).toFixed(1)}M` : '-'}</div></Card>
        </div>
      </div>

      {/* Dividend */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Dividend & income</div>
        <div className="grid grid-cols-4 gap-3">
          <Card label="Dividend yield"><div className="text-lg font-semibold" style={{ color: s.dividend_yield_pct > 3 ? '#1D9E75' : 'var(--text-primary)' }}>{s.dividend_yield_pct ? `${fmt(s.dividend_yield_pct, 2)}%` : 'None'}</div></Card>
          <Card label="Dividend rate"><div className="text-lg font-semibold">{s.dividend_rate ? `$${fmt(s.dividend_rate, 2)}` : '-'}</div></Card>
          <Card label="Payout ratio"><div className="text-lg font-semibold">{s.payout_ratio ? `${(s.payout_ratio * 100).toFixed(0)}%` : '-'}</div></Card>
          <Card label="Free cash flow"><div className="text-lg font-semibold">{fmtDollar(s.free_cashflow)}</div></Card>
        </div>
      </div>

      {/* Analyst */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Analyst consensus</div>
        <div className="grid grid-cols-4 gap-3">
          <Card label="Consensus"><div className="text-lg font-semibold capitalize">{s.analyst_consensus || '-'}</div></Card>
          <Card label="Target price"><div className="text-lg font-semibold">{s.target_price ? `$${fmt(s.target_price)}` : '-'}</div></Card>
          <Card label="Upside"><div className="text-lg font-semibold" style={{ color: s.upside_pct > 0 ? '#1D9E75' : s.upside_pct < 0 ? '#E24B4A' : 'var(--text-primary)' }}>{fmtPct(s.upside_pct)}</div></Card>
          <Card label="# Analysts"><div className="text-lg font-semibold">{s.num_analysts || '-'}</div></Card>
        </div>
      </div>

      {/* Earnings */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Earnings</div>
        <div className="grid grid-cols-4 gap-3">
          <Card label="Next earnings date">
            <div className="text-lg font-semibold">{s.next_earnings_date ? new Date(s.next_earnings_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</div>
          </Card>
          <Card label="EPS estimate (next Q)">
            <div className="text-lg font-semibold">{s.eps_estimate ? `$${fmt(s.eps_estimate)}` : '-'}</div>
          </Card>
          <Card label="EPS actual (last Q)">
            <div className="text-lg font-semibold">{s.eps_actual != null ? `$${fmt(s.eps_actual)}` : '-'}</div>
          </Card>
          <Card label="EPS surprise">
            <div className="text-lg font-semibold" style={{ color: s.eps_surprise_pct > 0 ? '#1D9E75' : s.eps_surprise_pct < 0 ? '#E24B4A' : 'var(--text-primary)' }}>
              {s.eps_surprise_pct != null ? (
                <span>
                  {s.eps_surprise_pct > 0 ? 'Beat ' : 'Miss '}
                  {Math.abs(s.eps_surprise_pct).toFixed(1)}%
                </span>
              ) : '-'}
            </div>
          </Card>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-3">
          <Card label="Trailing EPS (TTM)">
            <div className="text-lg font-semibold">{s.trailing_eps ? `$${fmt(s.trailing_eps)}` : '-'}</div>
          </Card>
          <Card label="Forward EPS">
            <div className="text-lg font-semibold">{s.forward_eps ? `$${fmt(s.forward_eps)}` : '-'}</div>
          </Card>
          <Card label="EPS current year">
            <div className="text-lg font-semibold">{s.eps_current_year ? `$${fmt(s.eps_current_year)}` : '-'}</div>
          </Card>
          <Card label="Earnings growth">
            <div className="text-lg font-semibold" style={{ color: s.earnings_growth > 0 ? '#1D9E75' : s.earnings_growth < 0 ? '#E24B4A' : 'var(--text-primary)' }}>
              {fmtGrowth(s.earnings_growth)}
            </div>
          </Card>
        </div>
      </div>

      {/* 52-week range */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>52-week range</div>
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}>
          <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
            <span>${fmt(s.low_52w)}</span>
            <span>${fmt(s.high_52w)}</span>
          </div>
          <div className="relative h-2 rounded-full" style={{ background: 'var(--border)' }}>
            {s.low_52w && s.high_52w && s.price && (
              <div
                className="absolute top-0 w-3 h-2 rounded-full"
                style={{
                  background: '#378ADD',
                  left: `${Math.min(100, Math.max(0, ((s.price - s.low_52w) / (s.high_52w - s.low_52w)) * 100))}%`,
                  transform: 'translateX(-50%)',
                }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            <span>52w low</span>
            <span>Current: ${fmt(s.price)}</span>
            <span>52w high</span>
          </div>
        </div>
      </div>

      {/* Insider activity */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Insider activity (90 days)</div>
        <div className="grid grid-cols-4 gap-3">
          <Card label="Insider buys"><div className="text-lg font-semibold" style={{ color: s.buy_count > 0 ? '#1D9E75' : 'var(--text-primary)' }}>{s.buy_count ?? '-'}</div></Card>
          <Card label="Insider sells"><div className="text-lg font-semibold" style={{ color: s.sell_count > 0 ? '#E24B4A' : 'var(--text-primary)' }}>{s.sell_count ?? '-'}</div></Card>
          <Card label="Net insider $"><div className="text-lg font-semibold" style={{ color: (s.insider_net_value ?? 0) > 0 ? '#1D9E75' : (s.insider_net_value ?? 0) < 0 ? '#E24B4A' : 'var(--text-primary)' }}>{fmtDollar(s.insider_net_value)}</div></Card>
          <Card label="Insider score"><div className="text-lg font-semibold"><Signal color={scoreColor(s.insider_score)} />{fmt(s.insider_score, 1)}</div></Card>
        </div>
      </div>
    </div>
  );
}
