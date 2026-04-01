'use client';

import { useState, useMemo } from 'react';

interface Stock {
  ticker: string;
  name: string;
  exchange: string;
  subsector: string;
  market_cap_tier: string;
  price: number;
  market_cap: number;
  combined_score: number;
  value_score: number;
  analyst_score: number;
  insider_score: number;
  pe_ratio: number;
  pb_ratio: number;
  dividend_yield_pct: number;
  upside_pct: number;
  analyst_consensus: string;
  buy_count: number;
  sell_count: number;
  insider_net_value: number;
}

type SortKey = keyof Stock;

function Signal({ color }: { color: 'green' | 'yellow' | 'red' | 'gray' }) {
  const colors = { green: '#1D9E75', yellow: '#EF9F27', red: '#E24B4A', gray: '#9ca3af' };
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[color], marginRight: 4 }} />
  );
}

function scoreColor(score: number | null): 'green' | 'yellow' | 'red' | 'gray' {
  if (score == null) return 'gray';
  if (score >= 65) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

function formatMarketCap(mc: number | null): string {
  if (mc == null) return '-';
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(1)}T`;
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(1)}B`;
  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(0)}M`;
  return `$${mc.toLocaleString()}`;
}

function formatNum(v: number | null, decimals = 2): string {
  if (v == null) return '-';
  return v.toFixed(decimals);
}

function formatDollar(v: number | null): string {
  if (v == null) return '-';
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function StockScreener({ stocks, onSelectTicker }: { stocks: Stock[]; onSelectTicker?: (ticker: string) => void }) {
  const [sortKey, setSortKey] = useState<SortKey>('combined_score');
  const [sortAsc, setSortAsc] = useState(false);
  const [filterSubsector, setFilterSubsector] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const subsectors = useMemo(() => {
    const subs = [...new Set(stocks.map((s) => s.subsector).filter(Boolean))].sort();
    return ['All', ...subs];
  }, [stocks]);

  const filtered = useMemo(() => {
    let result = stocks;
    if (filterSubsector !== 'All') {
      result = result.filter((s) => s.subsector === filterSubsector);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) => s.ticker?.toLowerCase().includes(term) || s.name?.toLowerCase().includes(term)
      );
    }
    result.sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return result;
  }, [stocks, filterSubsector, searchTerm, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-2 py-2 text-left text-xs font-medium cursor-pointer select-none whitespace-nowrap"
      style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
      onClick={() => handleSort(field)}
    >
      {label} {sortKey === field ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  if (stocks.length === 0) {
    return (
      <div className="text-center py-20 text-sm" style={{ color: 'var(--text-secondary)' }}>
        No screener data available yet. Run the pipeline first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <input
          type="text"
          placeholder="Search ticker or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{
            background: 'var(--bg-primary)',
            border: '0.5px solid var(--border)',
            color: 'var(--text-primary)',
            outline: 'none',
            width: 220,
          }}
        />
        <div className="flex gap-1 flex-wrap">
          {subsectors.map((sub) => (
            <button
              key={sub}
              onClick={() => setFilterSubsector(sub)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                background: filterSubsector === sub ? 'var(--text-primary)' : 'var(--bg-primary)',
                color: filterSubsector === sub ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: '0.5px solid var(--border)',
              }}
            >
              {sub}
            </button>
          ))}
        </div>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>
          {filtered.length} stocks
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 1100 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <SortHeader label="Ticker" field="ticker" />
                <SortHeader label="Company" field="name" />
                <SortHeader label="Subsector" field="subsector" />
                <SortHeader label="Price" field="price" />
                <SortHeader label="Mkt cap" field="market_cap" />
                <SortHeader label="Combined" field="combined_score" />
                <SortHeader label="Value" field="value_score" />
                <SortHeader label="Analyst" field="analyst_score" />
                <SortHeader label="Insider" field="insider_score" />
                <SortHeader label="P/E" field="pe_ratio" />
                <SortHeader label="P/B" field="pb_ratio" />
                <SortHeader label="Div yield" field="dividend_yield_pct" />
                <SortHeader label="Upside %" field="upside_pct" />
                <SortHeader label="Consensus" field="analyst_consensus" />
                <SortHeader label="Ins buys" field="buy_count" />
                <SortHeader label="Ins sells" field="sell_count" />
                <SortHeader label="Ins net $" field="insider_net_value" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr
                  key={s.ticker + i}
                  className="hover:opacity-80 transition-opacity"
                  style={{ borderBottom: '0.5px solid var(--border)' }}
                >
                  <td className="px-2 py-2 font-semibold">
                    <button onClick={() => onSelectTicker?.(s.ticker)} className="hover:underline" style={{ color: '#378ADD', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 'inherit' }}>{s.ticker}</button>
                  </td>
                  <td className="px-2 py-2 max-w-[160px] truncate" style={{ color: 'var(--text-secondary)' }}>{s.name}</td>
                  <td className="px-2 py-2" style={{ color: 'var(--text-secondary)' }}>{s.subsector}</td>
                  <td className="px-2 py-2 font-medium">${formatNum(s.price)}</td>
                  <td className="px-2 py-2" style={{ color: 'var(--text-secondary)' }}>{formatMarketCap(s.market_cap)}</td>
                  <td className="px-2 py-2 font-semibold">
                    <Signal color={scoreColor(s.combined_score)} />
                    {formatNum(s.combined_score, 1)}
                  </td>
                  <td className="px-2 py-2">{formatNum(s.value_score, 1)}</td>
                  <td className="px-2 py-2">{formatNum(s.analyst_score, 1)}</td>
                  <td className="px-2 py-2">{formatNum(s.insider_score, 1)}</td>
                  <td className="px-2 py-2">{formatNum(s.pe_ratio, 1)}</td>
                  <td className="px-2 py-2">{formatNum(s.pb_ratio, 2)}</td>
                  <td className="px-2 py-2">{s.dividend_yield_pct ? `${formatNum(s.dividend_yield_pct, 1)}%` : '-'}</td>
                  <td className="px-2 py-2" style={{ color: s.upside_pct > 0 ? '#1D9E75' : s.upside_pct < 0 ? '#E24B4A' : 'var(--text-secondary)' }}>
                    {s.upside_pct ? `${s.upside_pct > 0 ? '+' : ''}${formatNum(s.upside_pct, 1)}%` : '-'}
                  </td>
                  <td className="px-2 py-2 capitalize" style={{ color: 'var(--text-secondary)' }}>{s.analyst_consensus || '-'}</td>
                  <td className="px-2 py-2" style={{ color: s.buy_count > 0 ? '#1D9E75' : 'var(--text-secondary)' }}>
                    {s.buy_count ?? '-'}
                  </td>
                  <td className="px-2 py-2" style={{ color: s.sell_count > 0 ? '#E24B4A' : 'var(--text-secondary)' }}>
                    {s.sell_count ?? '-'}
                  </td>
                  <td className="px-2 py-2" style={{ color: (s.insider_net_value ?? 0) > 0 ? '#1D9E75' : (s.insider_net_value ?? 0) < 0 ? '#E24B4A' : 'var(--text-secondary)' }}>
                    {s.insider_net_value != null ? formatDollar(s.insider_net_value) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
