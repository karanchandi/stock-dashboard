'use client';

import PriceChart from './PriceChart';

interface StockRowDropdownProps {
  stock: any;
  onViewFullDetails: (ticker: string) => void;
  onAddToWatchlist: (ticker: string) => void;
}

function fmt(v: any, decimals = 2): string {
  if (v == null) return '-';
  return Number(v).toFixed(decimals);
}

function fmtMcap(mc: any): string {
  if (mc == null) return '-';
  const n = Number(mc);
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function Signal({ color }: { color: 'green' | 'yellow' | 'red' | 'gray' }) {
  const colors = { green: '#1D9E75', yellow: '#EF9F27', red: '#E24B4A', gray: '#9ca3af' };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[color], marginRight: 4 }} />;
}

function scoreColor(score: number | null): 'green' | 'yellow' | 'red' | 'gray' {
  if (score == null) return 'gray';
  if (score >= 65) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

function MetricBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-md p-2" style={{ background: 'var(--bg-secondary)' }}>
      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      <div className="text-sm font-semibold mt-0.5" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

export default function StockRowDropdown({ stock, onViewFullDetails, onAddToWatchlist }: StockRowDropdownProps) {
  const s = stock;

  return (
    <div className="px-4 py-4" style={{ background: 'var(--bg-primary)', borderTop: '0.5px solid var(--border)' }}>
      <div className="grid grid-cols-3 gap-4">
        {/* Left: Chart */}
        <div className="col-span-2">
          <PriceChart ticker={s.ticker} compact={true} />
        </div>

        {/* Right: Key metrics */}
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>
            Key metrics
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MetricBox label="Combined" value={fmt(s.combined_score, 1)} color={s.combined_score >= 65 ? '#1D9E75' : s.combined_score >= 40 ? '#EF9F27' : '#E24B4A'} />
            <MetricBox label="Mkt cap" value={fmtMcap(s.market_cap)} />
            <MetricBox label="P/E" value={fmt(s.pe_ratio, 1)} />
            <MetricBox label="P/B" value={fmt(s.pb_ratio, 2)} />
            <MetricBox label="Div yield" value={s.dividend_yield_pct ? `${fmt(s.dividend_yield_pct, 2)}%` : 'None'} />
            <MetricBox label="EV/EBITDA" value={fmt(s.ev_ebitda, 1)} />
            <MetricBox label="Target price" value={s.target_price ? `$${fmt(s.target_price)}` : '-'} />
            <MetricBox
              label="Upside"
              value={s.upside_pct ? `${s.upside_pct > 0 ? '+' : ''}${fmt(s.upside_pct, 1)}%` : '-'}
              color={s.upside_pct > 0 ? '#1D9E75' : s.upside_pct < 0 ? '#E24B4A' : undefined}
            />
            <MetricBox label="Consensus" value={s.analyst_consensus || '-'} />
            <MetricBox
              label="Insider net"
              value={s.insider_net_value != null ? (s.insider_net_value >= 0 ? '+' : '') + fmtCompact(s.insider_net_value) : '-'}
              color={s.insider_net_value > 0 ? '#1D9E75' : s.insider_net_value < 0 ? '#E24B4A' : undefined}
            />
          </div>

          {/* 52-week range mini */}
          {s.low_52w && s.high_52w && (
            <div className="rounded-md p-2" style={{ background: 'var(--bg-secondary)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>52-week range</div>
              <div className="flex items-center gap-2 text-xs">
                <span>${fmt(s.low_52w, 0)}</span>
                <div className="flex-1 relative h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                  <div
                    className="absolute top-0 w-2 h-1.5 rounded-full"
                    style={{
                      background: '#378ADD',
                      left: `${Math.min(100, Math.max(0, ((s.price - s.low_52w) / (s.high_52w - s.low_52w)) * 100))}%`,
                      transform: 'translateX(-50%)',
                    }}
                  />
                </div>
                <span>${fmt(s.high_52w, 0)}</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onViewFullDetails(s.ticker)}
              className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
            >
              View full details
            </button>
            <button
              onClick={() => onAddToWatchlist(s.ticker)}
              className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', color: 'var(--text-primary)' }}
            >
              + Watchlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtCompact(v: number): string {
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}
