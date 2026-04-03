'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PriceChart from './PriceChart';
import TickerFeed from './TickerFeed';

interface WatchlistItem {
  id: number;
  ticker: string;
  notes: string;
  target_buy_price: number | null;
  target_sell_price: number | null;
  position_status: string;
  shares_held: number;
  avg_cost_basis: number | null;
  added_at: string;
}

interface WatchlistProps {
  onSelectTicker: (ticker: string) => void;
  latestPrices: Record<string, number>;
  stocks?: any[];
}

function fmt(v: any, decimals = 2): string {
  if (v == null) return '-';
  return Number(v).toFixed(decimals);
}

function Signal({ color }: { color: string }) {
  const colors: Record<string, string> = { green: '#1D9E75', yellow: '#EF9F27', red: '#E24B4A', gray: '#9ca3af' };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[color] || colors.gray, marginRight: 4 }} />;
}

export default function Watchlist({ onSelectTicker, latestPrices, stocks = [] }: WatchlistProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [newTicker, setNewTicker] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newBuyTarget, setNewBuyTarget] = useState('');
  const [newSellTarget, setNewSellTarget] = useState('');
  const [newStatus, setNewStatus] = useState('watching');
  const [newShares, setNewShares] = useState('');
  const [newCostBasis, setNewCostBasis] = useState('');

  async function fetchWatchlist() {
    setLoading(true);
    const { data } = await supabase.from('watchlist').select('*').order('added_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  }

  useEffect(() => { fetchWatchlist(); }, []);

  async function addItem() {
    if (!newTicker.trim()) return;
    await supabase.from('watchlist').insert({
      ticker: newTicker.toUpperCase().trim(),
      notes: newNotes || null,
      target_buy_price: newBuyTarget ? parseFloat(newBuyTarget) : null,
      target_sell_price: newSellTarget ? parseFloat(newSellTarget) : null,
      position_status: newStatus,
      shares_held: newShares ? parseFloat(newShares) : 0,
      avg_cost_basis: newCostBasis ? parseFloat(newCostBasis) : null,
    });
    setNewTicker(''); setNewNotes(''); setNewBuyTarget(''); setNewSellTarget('');
    setNewStatus('watching'); setNewShares(''); setNewCostBasis('');
    setShowAdd(false);
    fetchWatchlist();
  }

  async function removeItem(id: number) {
    await supabase.from('watchlist').delete().eq('id', id);
    if (items.find(i => i.id === id)?.ticker === selectedItem) setSelectedItem(null);
    fetchWatchlist();
  }

  const activeItem = items.find(i => i.ticker === selectedItem);
  const price = selectedItem ? latestPrices[selectedItem] : null;
  const pnl = activeItem?.shares_held && activeItem?.avg_cost_basis && price
    ? { value: (price - activeItem.avg_cost_basis) * activeItem.shares_held, pct: ((price - activeItem.avg_cost_basis) / activeItem.avg_cost_basis) * 100 }
    : null;

  const inputStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    outline: 'none',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
  };

  const statusColors: Record<string, string> = { watching: '#EF9F27', holding: '#1D9E75', sold: '#9ca3af' };

  return (
    <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: 400 }}>
      {/* Left sidebar — ticker list */}
      <div className="w-full lg:w-72 lg:flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Watchlist <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>({items.length})</span>
          </span>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-2.5 py-1 rounded-md text-xs font-medium"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            {showAdd ? '✕' : '+ Add'}
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="rounded-lg p-3 mb-3 space-y-2" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
            <input style={inputStyle} className="w-full" value={newTicker} onChange={e => setNewTicker(e.target.value)} placeholder="Ticker (e.g. LEU)" />
            <div className="grid grid-cols-2 gap-2">
              <input style={inputStyle} className="w-full" type="number" value={newBuyTarget} onChange={e => setNewBuyTarget(e.target.value)} placeholder="Buy target $" />
              <input style={inputStyle} className="w-full" type="number" value={newSellTarget} onChange={e => setNewSellTarget(e.target.value)} placeholder="Sell target $" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input style={inputStyle} className="w-full" type="number" value={newShares} onChange={e => setNewShares(e.target.value)} placeholder="Shares" />
              <input style={inputStyle} className="w-full" type="number" value={newCostBasis} onChange={e => setNewCostBasis(e.target.value)} placeholder="Cost basis $" />
            </div>
            <select style={inputStyle} className="w-full" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              <option value="watching">Watching</option>
              <option value="holding">Holding</option>
              <option value="sold">Sold</option>
            </select>
            <input style={inputStyle} className="w-full" value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Notes (optional)" />
            <button onClick={addItem} className="w-full px-3 py-2 rounded-md text-xs font-medium" style={{ background: 'var(--brand)', color: 'white' }}>
              Add to watchlist
            </button>
          </div>
        )}

        {/* Ticker list */}
        <div className="flex lg:flex-col gap-1 lg:gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {loading ? (
            <div className="text-xs py-10 text-center" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-xs py-10 text-center" style={{ color: 'var(--text-secondary)' }}>No stocks in watchlist</div>
          ) : items.map(item => {
            const p = latestPrices[item.ticker];
            const isSelected = selectedItem === item.ticker;
            const atBuyTarget = item.target_buy_price && p && p <= item.target_buy_price;
            const atSellTarget = item.target_sell_price && p && p >= item.target_sell_price;

            return (
              <div
                key={item.id}
                className="rounded-lg px-3 py-2.5 cursor-pointer transition-all"
                style={{
                  background: isSelected ? 'var(--brand-light)' : 'var(--bg-primary)',
                  border: isSelected ? '1px solid var(--brand)' : '1px solid var(--border)',
                  boxShadow: isSelected ? 'var(--card-shadow-hover)' : 'var(--card-shadow)',
                }}
                onClick={() => setSelectedItem(isSelected ? null : item.ticker)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: isSelected ? 'var(--brand)' : 'var(--text-primary)' }}>{item.ticker}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-medium capitalize"
                      style={{ background: `${statusColors[item.position_status]}15`, color: statusColors[item.position_status], fontSize: 10 }}
                    >
                      {item.position_status}
                    </span>
                    {atBuyTarget && <span className="text-xs" style={{ color: '#1D9E75' }}>● Buy</span>}
                    {atSellTarget && <span className="text-xs" style={{ color: '#E24B4A' }}>● Sell</span>}
                  </div>
                  {p && <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>${fmt(p)}</span>}
                </div>
                {item.shares_held > 0 && item.avg_cost_basis && p && (
                  <div className="text-xs mt-1" style={{ color: (p - item.avg_cost_basis) >= 0 ? '#1D9E75' : '#E24B4A' }}>
                    {item.shares_held} shares · {((p - item.avg_cost_basis) / item.avg_cost_basis * 100) >= 0 ? '+' : ''}{((p - item.avg_cost_basis) / item.avg_cost_basis * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel — mini dashboard */}
      <div className="flex-1">
        {!selectedItem ? (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-tertiary)' }}>
            <div className="text-4xl mb-3">★</div>
            <div className="text-sm">Select a ticker from your watchlist</div>
            <div className="text-xs mt-1">or add a new one to get started</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedItem}</h2>
                {activeItem?.notes && <p className="text-xs italic mt-0.5" style={{ color: 'var(--text-secondary)' }}>{activeItem.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                {price && (
                  <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>${fmt(price)}</span>
                )}
                <button
                  onClick={() => onSelectTicker(selectedItem)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium"
                  style={{ background: 'var(--brand)', color: 'white' }}
                >
                  Full details →
                </button>
                <button
                  onClick={() => { const item = items.find(i => i.ticker === selectedItem); if (item) removeItem(item.id); }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium"
                  style={{ background: 'var(--red-light)', color: 'var(--red)' }}
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Position P&L */}
            {pnl && (
              <div className="rounded-lg p-3" style={{ background: pnl.value >= 0 ? 'var(--green-light)' : 'var(--red-light)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Position P&L</span>
                  <span className="text-sm font-bold" style={{ color: pnl.value >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {pnl.value >= 0 ? '+' : ''}${Math.abs(pnl.value).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({pnl.pct >= 0 ? '+' : ''}{pnl.pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {activeItem?.shares_held} shares @ ${fmt(activeItem?.avg_cost_basis)}
                  {activeItem?.target_buy_price && <span> · Buy: ${fmt(activeItem.target_buy_price)}</span>}
                  {activeItem?.target_sell_price && <span> · Sell: ${fmt(activeItem.target_sell_price)}</span>}
                </div>
              </div>
            )}

            {/* Price chart */}
            <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
              <PriceChart ticker={selectedItem} compact={false} />
            </div>

            {/* Scores & Key Metrics */}
            {(() => {
              const stockData = stocks.find((s: any) => s.ticker === selectedItem);
              if (!stockData) return null;

              function scoreColor(score: number | null): string {
                if (score == null) return 'gray';
                if (score >= 65) return 'green';
                if (score >= 40) return 'yellow';
                return 'red';
              }
              const sigColors: Record<string, string> = { green: '#1D9E75', yellow: '#EF9F27', red: '#E24B4A', gray: '#9ca3af' };

              return (
                <div className="space-y-3">
                  {/* Scores row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Overall Rating</div>
                      <div className="text-xl font-bold mt-0.5" style={{ color: sigColors[scoreColor(stockData.combined_score)] }}>
                        {stockData.combined_score?.toFixed(1) ?? '-'}
                      </div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Value Score</div>
                      <div className="text-lg font-semibold mt-0.5" style={{ color: sigColors[scoreColor(stockData.value_score)] }}>
                        {stockData.value_score?.toFixed(1) ?? '-'}
                      </div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Analyst Score</div>
                      <div className="text-lg font-semibold mt-0.5" style={{ color: sigColors[scoreColor(stockData.analyst_score)] }}>
                        {stockData.analyst_score?.toFixed(1) ?? '-'}
                      </div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Insider Score</div>
                      <div className="text-lg font-semibold mt-0.5" style={{ color: sigColors[scoreColor(stockData.insider_score)] }}>
                        {stockData.insider_score?.toFixed(1) ?? '-'}
                      </div>
                    </div>
                  </div>

                  {/* Key metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Market Cap</div>
                      <div className="text-sm font-semibold mt-0.5">{stockData.market_cap ? (stockData.market_cap >= 1e12 ? `$${(stockData.market_cap/1e12).toFixed(1)}T` : stockData.market_cap >= 1e9 ? `$${(stockData.market_cap/1e9).toFixed(1)}B` : `$${(stockData.market_cap/1e6).toFixed(0)}M`) : '-'}</div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>P/E Ratio</div>
                      <div className="text-sm font-semibold mt-0.5">{stockData.pe_ratio?.toFixed(1) ?? '-'}</div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Target Price</div>
                      <div className="text-sm font-semibold mt-0.5">{stockData.target_price ? `$${stockData.target_price.toFixed(2)}` : '-'}</div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Upside</div>
                      <div className="text-sm font-semibold mt-0.5" style={{ color: stockData.upside_pct > 0 ? '#1D9E75' : stockData.upside_pct < 0 ? '#E24B4A' : 'var(--text-primary)' }}>
                        {stockData.upside_pct ? `${stockData.upside_pct > 0 ? '+' : ''}${stockData.upside_pct.toFixed(1)}%` : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Div Yield</div>
                      <div className="text-sm font-semibold mt-0.5">{stockData.dividend_yield_pct ? `${stockData.dividend_yield_pct.toFixed(2)}%` : 'None'}</div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Revenue</div>
                      <div className="text-sm font-semibold mt-0.5">{stockData.total_revenue ? (stockData.total_revenue >= 1e12 ? `$${(stockData.total_revenue/1e12).toFixed(1)}T` : stockData.total_revenue >= 1e9 ? `$${(stockData.total_revenue/1e9).toFixed(1)}B` : `$${(stockData.total_revenue/1e6).toFixed(0)}M`) : '-'}</div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Net Income</div>
                      <div className="text-sm font-semibold mt-0.5" style={{ color: stockData.net_income > 0 ? '#1D9E75' : stockData.net_income < 0 ? '#E24B4A' : 'var(--text-primary)' }}>{stockData.net_income ? (Math.abs(stockData.net_income) >= 1e9 ? `$${(stockData.net_income/1e9).toFixed(1)}B` : `$${(stockData.net_income/1e6).toFixed(0)}M`) : '-'}</div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Consensus</div>
                      <div className="text-sm font-semibold mt-0.5 capitalize">{stockData.analyst_consensus || '-'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Next Earnings</div>
                      <div className="text-sm font-semibold mt-0.5">{stockData.next_earnings_date ? new Date(stockData.next_earnings_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>EV/EBITDA</div>
                      <div className="text-sm font-semibold mt-0.5">{stockData.ev_ebitda?.toFixed(1) ?? '-'}</div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>P/E Ratio</div>
                      <div className="text-sm font-semibold mt-0.5">{stockData.pe_ratio?.toFixed(1) ?? '-'}</div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Profit Margin</div>
                      <div className="text-sm font-semibold mt-0.5">{stockData.profit_margin ? `${(stockData.profit_margin * 100).toFixed(1)}%` : '-'}</div>
                    </div>
                  </div>

                  {/* Targets row */}
                  {(activeItem?.target_buy_price || activeItem?.target_sell_price) && (
                    <div className="grid grid-cols-2 gap-3">
                      {activeItem.target_buy_price && (
                        <div className="rounded-lg p-3" style={{ background: 'var(--green-light)', border: '1px solid var(--border)' }}>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Buy target</div>
                          <div className="text-lg font-semibold" style={{ color: price && price <= activeItem.target_buy_price ? 'var(--green)' : 'var(--text-primary)' }}>
                            ${fmt(activeItem.target_buy_price)}
                          </div>
                          {price && <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{((price - activeItem.target_buy_price) / activeItem.target_buy_price * 100).toFixed(1)}% away</div>}
                        </div>
                      )}
                      {activeItem.target_sell_price && (
                        <div className="rounded-lg p-3" style={{ background: 'var(--red-light)', border: '1px solid var(--border)' }}>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sell target</div>
                          <div className="text-lg font-semibold" style={{ color: price && price >= activeItem.target_sell_price ? 'var(--red)' : 'var(--text-primary)' }}>
                            ${fmt(activeItem.target_sell_price)}
                          </div>
                          {price && <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{((activeItem.target_sell_price - price) / price * 100).toFixed(1)}% away</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* News & Sentiment */}
            <TickerFeed ticker={selectedItem} />
          </div>
        )}
      </div>
    </div>
  );
}
