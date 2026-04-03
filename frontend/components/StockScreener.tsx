'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
import StockRowDropdown from './StockRowDropdown';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

interface Stock {
  [key: string]: any;
}

type SortKey = string;

function Signal({ color }: { color: string }) {
  const colors: Record<string, string> = { green: '#1D9E75', yellow: '#EF9F27', red: '#E24B4A', gray: '#9ca3af' };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[color] || colors.gray, marginRight: 4 }} />;
}

function scoreColor(score: number | null): string {
  if (score == null) return 'gray';
  if (score >= 65) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

function formatMarketCap(mc: number | null): string {
  if (mc == null) return '-';
  const abs = Math.abs(mc);
  const sign = mc < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function fmt(v: number | null, decimals = 2): string {
  if (v == null) return '-';
  return v.toFixed(decimals);
}

interface ScreenerProps {
  stocks: Stock[];
  onSelectTicker?: (ticker: string) => void;
  onAddToWatchlist?: (ticker: string) => void;
}

const COLUMN_TOOLTIPS: Record<string, string> = {
  ticker: 'Stock ticker symbol',
  name: 'Company name',
  subsector: 'Industry subsector classification',
  market_cap: 'Total market capitalization',
  price: 'Current stock price (last close)',
  target_price: 'Average analyst 12-month price target',
  upside_pct: 'Percentage upside from current price to analyst target',
  analyst_consensus: 'Wall Street analyst consensus: strong buy, buy, hold, sell',
  combined_score: 'Overall Rating — weighted blend of Value (50%), Analyst (30%), and Insider (20%) scores. Range 0-100.',
  value_score: 'Composite of P/E, P/B, EV/EBITDA, dividend yield, debt/equity, and 52-week position. Lower valuations score higher. Range 0-100.',
  analyst_score: 'Based on upside to target price, consensus rating, earnings growth estimates, and buy recommendation momentum. Range 0-100.',
  insider_score: 'SEC Form 4 insider buying/selling activity over 90 days. Cluster buying and large purchases score higher. Range 0-100.',
  pe_ratio: 'Price-to-Earnings ratio (trailing 12 months). Lower = potentially undervalued.',
  total_revenue: 'Total annual revenue (trailing 12 months).',
  net_income: 'Net income attributable to common shareholders (trailing 12 months). Green = profitable, red = loss.',
  dividend_yield_pct: 'Annual dividend as percentage of stock price. Higher = more income.',
};

export default function StockScreener({ stocks, onSelectTicker, onAddToWatchlist }: ScreenerProps) {
  const [sortKey, setSortKey] = useState<SortKey>('combined_score');
  const [sortAsc, setSortAsc] = useState(false);
  const [filterSubsector, setFilterSubsector] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [selectedTickers, setSelectedTickers] = useState<Set<string>>(new Set());
  const [alertModal, setAlertModal] = useState<{ ticker: string; price: number } | null>(null);
  const [alertType, setAlertType] = useState('below');
  const [alertPrice, setAlertPrice] = useState('');
  const [alertNotes, setAlertNotes] = useState('');

  // Presets
  const [presets, setPresets] = useState<any[]>([]);
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [activePresetId, setActivePresetId] = useState<number | null>(null);

  async function fetchPresets() {
    const { data } = await supabase.from('saved_filters').select('*').order('created_at', { ascending: false });
    if (data) setPresets(data);
  }
  useEffect(() => { fetchPresets(); }, []);

  async function savePreset() {
    if (!presetName.trim()) return;
    const tickerList = selectedTickers.size > 0 ? Array.from(selectedTickers).join(',') : '';
    await supabase.from('saved_filters').insert({
      name: presetName.trim(),
      subsector: filterSubsector,
      sort_key: sortKey,
      sort_asc: sortAsc,
      search: tickerList || searchTerm,
    });
    setPresetName('');
    setShowPresetSave(false);
    fetchPresets();
  }

  function loadPreset(preset: any) {
    setActivePresetId(preset.id);
    setFilterSubsector(preset.subsector || 'All');
    setSortKey(preset.sort_key || 'combined_score');
    setSortAsc(preset.sort_asc || false);
    // Check if search contains comma-separated tickers
    if (preset.search && preset.search.includes(',')) {
      const tickers = new Set<string>(preset.search.split(',').map((t: string) => t.trim()));
      setSelectedTickers(tickers);
      setFilterBySelected(true);
      setSearchTerm('');
    } else {
      setSearchTerm(preset.search || '');
      setSelectedTickers(new Set());
      setFilterBySelected(false);
    }
  }

  function clearPreset() {
    setActivePresetId(null);
    setFilterSubsector('All');
    setSortKey('combined_score');
    setSortAsc(false);
    setSearchTerm('');
    setSelectedTickers(new Set());
    setFilterBySelected(false);
  }

  async function deletePreset(id: number) {
    await supabase.from('saved_filters').delete().eq('id', id);
    if (activePresetId === id) clearPreset();
    fetchPresets();
  }

  function toggleTicker(ticker: string) {
    const next = new Set(selectedTickers);
    if (next.has(ticker)) next.delete(ticker); else next.add(ticker);
    setSelectedTickers(next);
  }

  const [filterBySelected, setFilterBySelected] = useState(false);

  function applyTickerFilter() {
    if (selectedTickers.size > 0) setFilterBySelected(true);
  }

  function clearTickerFilter() {
    setFilterBySelected(false);
    setSelectedTickers(new Set());
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
    if (filterBySelected && selectedTickers.size > 0) {
      result = result.filter((s) => selectedTickers.has(s.ticker));
    } else if (searchTerm) {
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
  }, [stocks, filterSubsector, searchTerm, sortKey, sortAsc, selectedTickers]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  }

  function handleTickerClick(ticker: string) {
    setExpandedTicker(expandedTicker === ticker ? null : ticker);
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
      'Ticker': s.ticker, 'Company': s.name, 'Subsector': s.subsector,
      'Market Cap': s.market_cap, 'Price': s.price, 'Target': s.target_price,
      'Upside %': s.upside_pct, 'Consensus': s.analyst_consensus,
      'Overall Rating': s.combined_score, 'Value Score': s.value_score,
      'Analyst Score': s.analyst_score, 'Insider Score': s.insider_score,
      'P/E': s.pe_ratio, 'Revenue': s.total_revenue, 'Net Income': s.net_income,
      'Div Yield %': s.dividend_yield_pct,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Value Scanner');
    ws['!cols'] = Object.keys(exportData[0] || {}).map(k => ({ wch: Math.max(k.length, 12) }));
    XLSX.writeFile(wb, `marketpulse_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-2 py-2.5 text-left text-xs font-medium cursor-pointer select-none whitespace-nowrap"
      style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
      onClick={() => handleSort(field)}
      title={COLUMN_TOOLTIPS[field] || ''}
    >
      {label} {sortKey === field ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  const inputStyle = {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', outline: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 13,
  };

  if (stocks.length === 0) {
    return <div className="text-center py-20 text-sm" style={{ color: 'var(--text-secondary)' }}>No data available. Run the pipeline first.</div>;
  }

  return (
    <div className="space-y-3">
      {/* Alert modal */}
      {alertModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-lg p-5 w-96 space-y-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow-hover)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Alert for {alertModal.ticker}</h3>
              <button onClick={() => setAlertModal(null)} className="text-xs" style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Current: ${alertModal.price.toFixed(2)}</p>
            <div className="grid grid-cols-2 gap-3">
              <select style={inputStyle} className="w-full" value={alertType} onChange={e => setAlertType(e.target.value)}>
                <option value="below">Drops below</option>
                <option value="above">Rises above</option>
              </select>
              <input style={inputStyle} className="w-full" type="number" value={alertPrice} onChange={e => setAlertPrice(e.target.value)} placeholder="Target $" />
            </div>
            <input style={inputStyle} className="w-full" value={alertNotes} onChange={e => setAlertNotes(e.target.value)} placeholder="Notes (optional)" />
            <button onClick={createAlert} className="w-full px-4 py-2 rounded-md text-sm font-medium" style={{ background: 'var(--brand)', color: 'white' }}>Create alert</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="text"
          placeholder="Search ticker or name..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setSelectedTickers(new Set()); }}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{ ...inputStyle, width: 200 }}
        />
        <div className="flex gap-1 flex-wrap">
          {subsectors.map((sub) => (
            <button
              key={sub}
              onClick={() => { setFilterSubsector(sub); setSelectedTickers(new Set()); }}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
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
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{filtered.length} stocks{selectedTickers.size > 0 ? ` · ${selectedTickers.size} selected` : ''}</span>
          {selectedTickers.size > 0 && !filterBySelected && (
            <button onClick={applyTickerFilter} className="text-xs px-2 py-0.5 rounded font-medium" style={{ color: 'white', background: 'var(--brand)' }}>Show selected only</button>
          )}
          {filterBySelected && (
            <button onClick={clearTickerFilter} className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--red)', background: 'var(--red-light)' }}>Show all</button>
          )}
          {selectedTickers.size > 0 && !filterBySelected && (
            <button onClick={() => setSelectedTickers(new Set())} className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>Clear selection</button>
          )}
          <button onClick={exportToExcel} className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}>
            Export Excel
          </button>
          <button onClick={() => setShowPresetSave(!showPresetSave)} className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: 'var(--brand)', color: 'white' }}>
            Save list
          </button>
        </div>
      </div>

      {/* Presets row */}
      {(presets.length > 0 || showPresetSave) && (
        <div className="flex items-center gap-2 flex-wrap">
          {showPresetSave && (
            <div className="flex items-center gap-1">
              <input value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="List name..." className="px-2 py-1 rounded text-xs" style={{ ...inputStyle, width: 130 }} onKeyDown={e => e.key === 'Enter' && savePreset()} />
              <button onClick={savePreset} className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'var(--brand)', color: 'white' }}>Save</button>
            </div>
          )}
          {presets.map((preset) => (
            <div key={preset.id} className="flex items-center gap-0">
              <button onClick={() => loadPreset(preset)} className="px-2.5 py-1 rounded-l-md text-xs font-medium" style={{ background: activePresetId === preset.id ? 'var(--brand)' : 'var(--brand-light)', color: activePresetId === preset.id ? 'white' : 'var(--brand)', border: '1px solid var(--brand)', borderRight: 'none' }}>
                {preset.name}
              </button>
              <button onClick={() => deletePreset(preset.id)} className="px-1.5 py-1 rounded-r-md text-xs" style={{ background: activePresetId === preset.id ? 'var(--brand)' : 'var(--brand-light)', color: activePresetId === preset.id ? 'white' : 'var(--brand)', border: '1px solid var(--brand)' }}>✕</button>
            </div>
          ))}
          {activePresetId && <button onClick={clearPreset} className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--text-secondary)' }}>Clear filter</button>}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
        <div className="overflow-x-auto table-scroll" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-xs" style={{ minWidth: 1300 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th className="px-2 py-2.5 text-center text-xs font-medium" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', width: 30 }}>
                  <span title="Select tickers to create custom lists">☐</span>
                </th>
                <SortHeader label="Ticker" field="ticker" />
                <SortHeader label="Company" field="name" />
                <SortHeader label="Subsector" field="subsector" />
                <SortHeader label="Mkt Cap" field="market_cap" />
                <SortHeader label="Price" field="price" />
                <SortHeader label="Target" field="target_price" />
                <SortHeader label="Upside %" field="upside_pct" />
                <SortHeader label="Consensus" field="analyst_consensus" />
                <SortHeader label="Overall" field="combined_score" />
                <SortHeader label="Value" field="value_score" />
                <SortHeader label="Analyst" field="analyst_score" />
                <SortHeader label="Insider" field="insider_score" />
                <SortHeader label="P/E" field="pe_ratio" />
                <SortHeader label="Revenue" field="total_revenue" />
                <SortHeader label="Net Income" field="net_income" />
                <SortHeader label="Div Yield" field="dividend_yield_pct" />
                <th className="px-2 py-2.5 text-center text-xs font-medium" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const isSelected = selectedTickers.has(s.ticker);
                return (
                  <Fragment key={s.ticker + i}>
                    <tr
                      className="transition-all cursor-pointer hover:opacity-80"
                      style={{
                        borderBottom: expandedTicker === s.ticker ? 'none' : '0.5px solid var(--border)',
                        background: isSelected ? 'var(--brand-light)' : expandedTicker === s.ticker ? 'var(--bg-secondary)' : 'transparent',
                      }}
                      onClick={() => handleTickerClick(s.ticker)}
                    >
                      <td className="px-2 py-2 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTicker(s.ticker)}
                          style={{ accentColor: 'var(--brand)', cursor: 'pointer' }}
                        />
                      </td>
                      <td className="px-2 py-2 font-bold" style={{ color: 'var(--brand)' }}>{s.ticker}</td>
                      <td className="px-2 py-2 max-w-[130px] truncate" style={{ color: 'var(--text-secondary)' }}>{s.name}</td>
                      <td className="px-2 py-2" style={{ color: 'var(--text-secondary)' }}>{s.subsector}</td>
                      <td className="px-2 py-2" style={{ color: 'var(--text-secondary)' }}>{formatMarketCap(s.market_cap)}</td>
                      <td className="px-2 py-2 font-semibold">${fmt(s.price)}</td>
                      <td className="px-2 py-2" style={{ color: 'var(--text-secondary)' }}>{s.target_price ? `$${fmt(s.target_price)}` : '-'}</td>
                      <td className="px-2 py-2 font-medium" style={{ color: s.upside_pct > 0 ? 'var(--green)' : s.upside_pct < 0 ? 'var(--red)' : 'var(--text-secondary)' }}>
                        {s.upside_pct ? `${s.upside_pct > 0 ? '+' : ''}${fmt(s.upside_pct, 1)}%` : '-'}
                      </td>
                      <td className="px-2 py-2 capitalize" style={{ color: 'var(--text-secondary)' }}>{s.analyst_consensus || '-'}</td>
                      <td className="px-2 py-2 font-bold">
                        <Signal color={scoreColor(s.combined_score)} />
                        {fmt(s.combined_score, 1)}
                      </td>
                      <td className="px-2 py-2">{fmt(s.value_score, 1)}</td>
                      <td className="px-2 py-2">{fmt(s.analyst_score, 1)}</td>
                      <td className="px-2 py-2">{fmt(s.insider_score, 1)}</td>
                      <td className="px-2 py-2">{fmt(s.pe_ratio, 1)}</td>
                      <td className="px-2 py-2">{formatMarketCap(s.total_revenue)}</td>
                      <td className="px-2 py-2" style={{ color: s.net_income > 0 ? 'var(--green)' : s.net_income < 0 ? 'var(--red)' : 'var(--text-primary)' }}>{formatMarketCap(s.net_income)}</td>
                      <td className="px-2 py-2">{s.dividend_yield_pct ? `${fmt(s.dividend_yield_pct, 1)}%` : '-'}</td>
                      <td className="px-2 py-2 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => onAddToWatchlist?.(s.ticker)} className="px-1.5 py-0.5 rounded text-xs" style={{ color: 'var(--brand)', background: 'var(--brand-light)' }} title="Add to watchlist">★</button>
                          <button onClick={() => setAlertModal({ ticker: s.ticker, price: s.price })} className="px-1.5 py-0.5 rounded text-xs" style={{ color: 'var(--yellow)', background: 'var(--yellow-light)' }} title="Set price alert">⚡</button>
                        </div>
                      </td>
                    </tr>
                    {expandedTicker === s.ticker && (
                      <tr key={`${s.ticker}-dropdown`}>
                        <td colSpan={18} style={{ padding: 0, borderBottom: '0.5px solid var(--border)' }}>
                          <StockRowDropdown stock={s} onViewFullDetails={(t) => onSelectTicker?.(t)} onAddToWatchlist={(t) => onAddToWatchlist?.(t)} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
