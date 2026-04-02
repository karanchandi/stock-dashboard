'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import StockRowDropdown from './StockRowDropdown';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

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
  target_price: number;
  analyst_consensus: string;
  buy_count: number;
  sell_count: number;
  insider_net_value: number;
}

type SortKey = keyof Stock;

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

interface ScreenerProps {
  stocks: Stock[];
  onSelectTicker?: (ticker: string) => void;
  onAddToWatchlist?: (ticker: string) => void;
}

export default function StockScreener({ stocks, onSelectTicker, onAddToWatchlist }: ScreenerProps) {
  const [sortKey, setSortKey] = useState<SortKey>('combined_score');
  const [sortAsc, setSortAsc] = useState(false);
  const [filterSubsector, setFilterSubsector] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{ ticker: string; price: number } | null>(null);
  const [alertType, setAlertType] = useState('below');
  const [alertPrice, setAlertPrice] = useState('');
  const [alertNotes, setAlertNotes] = useState('');
  const [presets, setPresets] = useState<{ id: number; name: string; subsector: string; sort_key: string; sort_asc: boolean; search: string }[]>([]);
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Load presets from Supabase
  async function fetchPresets() {
    const { data } = await supabase
      .from('saved_filters')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPresets(data);
  }

  useEffect(() => { fetchPresets(); }, []);

  async function savePreset() {
    if (!presetName.trim()) return;
    await supabase.from('saved_filters').insert({
      name: presetName.trim(),
      subsector: filterSubsector,
      sort_key: sortKey as string,
      sort_asc: sortAsc,
      search: searchTerm,
    });
    setPresetName('');
    setShowPresetSave(false);
    fetchPresets();
  }

  function loadPreset(preset: typeof presets[0]) {
    setFilterSubsector(preset.subsector);
    setSortKey(preset.sort_key as SortKey);
    setSortAsc(preset.sort_asc);
    setSearchTerm(preset.search);
  }

  async function deletePreset(id: number) {
    await supabase.from('saved_filters').delete().eq('id', id);
    fetchPresets();
  }

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

  function handleTickerClick(ticker: string) {
    setExpandedTicker(expandedTicker === ticker ? null : ticker);
  }

  function openAlertModal(ticker: string, price: number) {
    setAlertModal({ ticker, price });
    setAlertPrice('');
    setAlertNotes('');
    setAlertType('below');
  }

  async function createAlert() {
    if (!alertModal || !alertPrice) return;
    await supabase.from('price_alerts').insert({
      ticker: alertModal.ticker,
      alert_type: alertType,
      target_price: parseFloat(alertPrice),
      notes: alertNotes || null,
    });
    setAlertModal(null);
  }

  function exportToExcel() {
    const exportData = filtered.map(s => ({
      'Ticker': s.ticker,
      'Company': s.name,
      'Subsector': s.subsector,
      'Price': s.price,
      'Target Price': s.target_price,
      'Upside %': s.upside_pct,
      'Market Cap': s.market_cap,
      'Combined Score': s.combined_score,
      'Value Score': s.value_score,
      'Analyst Score': s.analyst_score,
      'Insider Score': s.insider_score,
      'P/E': s.pe_ratio,
      'P/B': s.pb_ratio,
      'Div Yield %': s.dividend_yield_pct,
      'Consensus': s.analyst_consensus,
      'Insider Buys': s.buy_count,
      'Insider Sells': s.sell_count,
      'Insider Net $': s.insider_net_value,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, filterSubsector === 'All' ? 'All Stocks' : filterSubsector);

    // Auto-width columns
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length, 12)
    }));
    ws['!cols'] = colWidths;

    const filename = `stock_screener_${filterSubsector === 'All' ? 'all' : filterSubsector.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  const COLUMN_TOOLTIPS: Record<string, string> = {
    ticker: 'Stock ticker symbol',
    name: 'Company name',
    subsector: 'Industry subsector classification',
    price: 'Current stock price (last close)',
    target_price: 'Average analyst 12-month price target',
    upside_pct: 'Percentage upside from current price to analyst target',
    market_cap: 'Total market capitalization',
    combined_score: 'Weighted blend of Value (50%), Analyst (30%), and Insider (20%) scores. Range 0-100.',
    value_score: 'Composite of P/E, P/B, EV/EBITDA, dividend yield, debt/equity, and 52-week position. Lower valuations score higher. Range 0-100.',
    analyst_score: 'Based on upside to target price, consensus rating, earnings growth estimates, and buy recommendation momentum. Range 0-100.',
    insider_score: 'SEC Form 4 insider buying/selling activity. Cluster buying and large purchases score higher. Range 0-100.',
    pe_ratio: 'Price-to-Earnings ratio (trailing 12 months). Lower = potentially cheaper.',
    dividend_yield_pct: 'Annual dividend yield as percentage of stock price',
    analyst_consensus: 'Wall Street analyst consensus: strong buy, buy, hold, sell',
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-2 py-2 text-left text-xs font-medium cursor-pointer select-none whitespace-nowrap"
      style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
      onClick={() => handleSort(field)}
      title={COLUMN_TOOLTIPS[field] || ''}
    >
      {label} {sortKey === field ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  const inputStyle = {
    background: 'var(--bg-secondary)',
    border: '0.5px solid var(--border)',
    color: 'var(--text-primary)',
    outline: 'none',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 13,
  };

  if (stocks.length === 0) {
    return (
      <div className="text-center py-20 text-sm" style={{ color: 'var(--text-secondary)' }}>
        No screener data available yet. Run the pipeline first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alert creation modal */}
      {alertModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-lg p-5 w-96 space-y-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Create alert for {alertModal.ticker}
              </h3>
              <button onClick={() => setAlertModal(null)} className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Current price: ${alertModal.price.toFixed(2)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Alert when</label>
                <select style={inputStyle} className="w-full" value={alertType} onChange={e => setAlertType(e.target.value)}>
                  <option value="below">Drops below</option>
                  <option value="above">Rises above</option>
                </select>
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Target price</label>
                <input style={inputStyle} className="w-full" type="number" value={alertPrice} onChange={e => setAlertPrice(e.target.value)} placeholder="$" />
              </div>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Notes (optional)</label>
              <input style={inputStyle} className="w-full" value={alertNotes} onChange={e => setAlertNotes(e.target.value)} placeholder="Why this alert?" />
            </div>
            <button onClick={createAlert} className="w-full px-4 py-2 rounded-md text-sm font-medium" style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
              Create alert
            </button>
          </div>
        </div>
      )}

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
                background: filterSubsector === sub ? 'var(--brand)' : 'var(--bg-primary)',
                color: filterSubsector === sub ? 'white' : 'var(--text-secondary)',
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
        <button
          onClick={exportToExcel}
          className="px-3 py-1 rounded-md text-xs font-medium"
          style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          Export Excel
        </button>
        <button
          onClick={() => setShowPresetSave(!showPresetSave)}
          className="px-3 py-1 rounded-md text-xs font-medium"
          style={{ background: 'var(--brand)', color: 'white' }}
        >
          Save filter
        </button>
      </div>

      {/* Saved presets */}
      {(presets.length > 0 || showPresetSave) && (
        <div className="flex items-center gap-2 flex-wrap">
          {showPresetSave && (
            <div className="flex items-center gap-1">
              <input
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                placeholder="Preset name..."
                className="px-2 py-1 rounded text-xs"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', width: 140 }}
                onKeyDown={e => e.key === 'Enter' && savePreset()}
              />
              <button onClick={savePreset} className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'var(--brand)', color: 'white' }}>Save</button>
            </div>
          )}
          {presets.map((preset) => (
            <div key={preset.id} className="flex items-center gap-0.5">
              <button
                onClick={() => loadPreset(preset)}
                className="px-2.5 py-1 rounded-l-md text-xs font-medium"
                style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid var(--brand)', borderRight: 'none' }}
              >
                {preset.name}
              </button>
              <button
                onClick={() => deletePreset(preset.id)}
                className="px-1.5 py-1 rounded-r-md text-xs"
                style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid var(--brand)' }}
              >
                ✕
              </button>
            </div>
          ))}
          {presets.length > 0 && <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Saved filters</span>}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 1200 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <SortHeader label="Ticker" field="ticker" />
                <SortHeader label="Company" field="name" />
                <SortHeader label="Subsector" field="subsector" />
                <SortHeader label="Price" field="price" />
                <SortHeader label="Target" field="target_price" />
                <SortHeader label="Upside %" field="upside_pct" />
                <SortHeader label="Mkt cap" field="market_cap" />
                <SortHeader label="Combined" field="combined_score" />
                <SortHeader label="Value" field="value_score" />
                <SortHeader label="Analyst" field="analyst_score" />
                <SortHeader label="Insider" field="insider_score" />
                <SortHeader label="P/E" field="pe_ratio" />
                <SortHeader label="Div yield" field="dividend_yield_pct" />
                <SortHeader label="Consensus" field="analyst_consensus" />
                <th className="px-2 py-2 text-left text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <>
                  <tr
                    key={s.ticker + i}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    style={{
                      borderBottom: expandedTicker === s.ticker ? 'none' : '0.5px solid var(--border)',
                      background: expandedTicker === s.ticker ? 'var(--bg-secondary)' : 'transparent',
                    }}
                    onClick={() => handleTickerClick(s.ticker)}
                  >
                    <td className="px-2 py-2 font-semibold" style={{ color: '#378ADD' }}>{s.ticker}</td>
                    <td className="px-2 py-2 max-w-[140px] truncate" style={{ color: 'var(--text-secondary)' }}>{s.name}</td>
                    <td className="px-2 py-2" style={{ color: 'var(--text-secondary)' }}>{s.subsector}</td>
                    <td className="px-2 py-2 font-medium">${formatNum(s.price)}</td>
                    <td className="px-2 py-2" style={{ color: 'var(--text-secondary)' }}>{s.target_price ? `$${formatNum(s.target_price)}` : '-'}</td>
                    <td className="px-2 py-2" style={{ color: s.upside_pct > 0 ? '#1D9E75' : s.upside_pct < 0 ? '#E24B4A' : 'var(--text-secondary)' }}>
                      {s.upside_pct ? `${s.upside_pct > 0 ? '+' : ''}${formatNum(s.upside_pct, 1)}%` : '-'}
                    </td>
                    <td className="px-2 py-2" style={{ color: 'var(--text-secondary)' }}>{formatMarketCap(s.market_cap)}</td>
                    <td className="px-2 py-2 font-semibold">
                      <Signal color={scoreColor(s.combined_score)} />
                      {formatNum(s.combined_score, 1)}
                    </td>
                    <td className="px-2 py-2">{formatNum(s.value_score, 1)}</td>
                    <td className="px-2 py-2">{formatNum(s.analyst_score, 1)}</td>
                    <td className="px-2 py-2">{formatNum(s.insider_score, 1)}</td>
                    <td className="px-2 py-2">{formatNum(s.pe_ratio, 1)}</td>
                    <td className="px-2 py-2">{s.dividend_yield_pct ? `${formatNum(s.dividend_yield_pct, 1)}%` : '-'}</td>
                    <td className="px-2 py-2 capitalize" style={{ color: 'var(--text-secondary)' }}>{s.analyst_consensus || '-'}</td>
                    <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openAlertModal(s.ticker, s.price)}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}
                      >
                        Set alert
                      </button>
                    </td>
                  </tr>
                  {expandedTicker === s.ticker && (
                    <tr key={`${s.ticker}-dropdown`}>
                      <td colSpan={15} style={{ padding: 0, borderBottom: '0.5px solid var(--border)' }}>
                        <StockRowDropdown
                          stock={s}
                          onViewFullDetails={(t) => onSelectTicker?.(t)}
                          onAddToWatchlist={(t) => onAddToWatchlist?.(t)}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
