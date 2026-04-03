'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import MacroDashboard from '@/components/MacroDashboard';
import StockScreener from '@/components/StockScreener';
import StockDetail from '@/components/StockDetail';
import Watchlist from '@/components/Watchlist';
import PriceAlerts from '@/components/PriceAlerts';
import CommodityDashboard from '@/components/CommodityDashboard';
import ThemeToggle from '@/components/ThemeToggle';

type Tab = 'macro' | 'screener' | 'commodities' | 'watchlist' | 'alerts';

function PulseLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="7" fill="var(--brand)" />
      <path d="M5 15H9L11 9L14 19L17 11L19 15H23" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('macro');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [macro, setMacro] = useState<any>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [lastRun, setLastRun] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: macroData } = await supabase
        .from('macro_indicators').select('*').order('run_date', { ascending: false }).limit(1).single();
      if (macroData) { setMacro(macroData); setLastRun(macroData.run_date); }

      const { data: latestRun } = await supabase
        .from('screener_results').select('run_date').order('run_date', { ascending: false }).limit(1).single();
      const latestDate = latestRun?.run_date || macroData?.run_date;

      const { data: stockData } = await supabase
        .from('screener_results').select('*').eq('run_date', latestDate)
        .order('combined_score', { ascending: false, nullsFirst: false }).limit(800);
      if (stockData) setStocks(stockData);
      setLoading(false);
    }
    fetchData();
  }, []);

  const latestPrices = useMemo(() => {
    const map: Record<string, number> = {};
    stocks.forEach(s => { if (s.ticker && s.price) map[s.ticker] = s.price; });
    return map;
  }, [stocks]);

  function handleSelectTicker(ticker: string) { setSelectedTicker(ticker); }
  function handleBack() { setSelectedTicker(null); }

  async function handleAddToWatchlist(ticker: string) {
    const { error } = await supabase.from('watchlist').upsert({ ticker, position_status: 'watching' }, { onConflict: 'ticker' });
    if (!error) alert(`${ticker} added to watchlist`);
  }

  async function triggerPipeline() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success) alert('Pipeline triggered! Data will refresh in ~30-40 minutes.');
      else alert(`Failed: ${data.error || 'Unknown error'}`);
    } catch { alert('Failed to trigger pipeline.'); }
    setRefreshing(false);
  }

  function switchTab(tab: Tab) {
    setSelectedTicker(null);
    setActiveTab(tab);
    setMobileMenuOpen(false);
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'macro', label: 'Macro', icon: '◉' },
    { key: 'screener', label: 'Scanner', icon: '⊞' },
    { key: 'commodities', label: 'Commodities', icon: '⬡' },
    { key: 'watchlist', label: 'Watchlist', icon: '★' },
    { key: 'alerts', label: 'Alerts', icon: '⚡' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <header style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          {/* Top row: logo + theme + mobile hamburger */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer" onClick={() => switchTab('macro')}>
              <PulseLogo />
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Market<span style={{ color: 'var(--brand)' }}>Pulse</span>
                </h1>
                {lastRun && (
                  <div className="flex items-center gap-2" style={{ marginTop: -1 }}>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(lastRun + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); triggerPipeline(); }}
                      disabled={refreshing}
                      className="text-xs px-1.5 py-0.5 rounded font-medium hidden sm:inline-block"
                      style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid var(--brand)', opacity: refreshing ? 0.5 : 1 }}
                    >
                      {refreshing ? '...' : '↻'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {/* Mobile hamburger */}
              <button
                className="sm:hidden px-2 py-1.5 rounded-md"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{mobileMenuOpen ? '✕' : '☰'}</span>
              </button>
              {/* Desktop nav */}
              <nav className="hidden sm:flex gap-0.5 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => switchTab(tab.key)}
                    className="px-3 lg:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1"
                    style={{
                      background: activeTab === tab.key && !selectedTicker ? 'var(--bg-primary)' : 'transparent',
                      color: activeTab === tab.key && !selectedTicker ? 'var(--brand)' : 'var(--text-secondary)',
                      boxShadow: activeTab === tab.key && !selectedTicker ? 'var(--card-shadow)' : 'none',
                      fontWeight: activeTab === tab.key && !selectedTicker ? 600 : 500,
                    }}
                  >
                    <span style={{ fontSize: 10, opacity: activeTab === tab.key && !selectedTicker ? 1 : 0.5 }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Mobile dropdown nav */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-2 flex flex-col gap-1 p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => switchTab(tab.key)}
                  className="px-3 py-2 rounded-md text-sm font-medium text-left flex items-center gap-2"
                  style={{
                    background: activeTab === tab.key ? 'var(--bg-primary)' : 'transparent',
                    color: activeTab === tab.key ? 'var(--brand)' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab.key ? 600 : 400,
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
              <button
                onClick={(e) => { e.stopPropagation(); triggerPipeline(); setMobileMenuOpen(false); }}
                disabled={refreshing}
                className="px-3 py-2 rounded-md text-sm font-medium text-left flex items-center gap-2"
                style={{ color: 'var(--brand)' }}
              >
                ↻ {refreshing ? 'Refreshing...' : 'Refresh data'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <PulseLogo />
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading MarketPulse...</div>
          </div>
        ) : selectedTicker ? (
          <div>
            <button
              onClick={handleBack}
              className="mb-3 px-3 py-1.5 rounded-md text-sm font-medium"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              ← Back to {tabs.find(t => t.key === activeTab)?.label}
            </button>
            <StockDetail ticker={selectedTicker} onBack={handleBack} onAddToWatchlist={handleAddToWatchlist} />
          </div>
        ) : activeTab === 'macro' ? (
          <MacroDashboard data={macro} />
        ) : activeTab === 'screener' ? (
          <StockScreener stocks={stocks} onSelectTicker={handleSelectTicker} onAddToWatchlist={handleAddToWatchlist} />
        ) : activeTab === 'commodities' ? (
          <CommodityDashboard />
        ) : activeTab === 'watchlist' ? (
          <Watchlist onSelectTicker={handleSelectTicker} latestPrices={latestPrices} stocks={stocks} />
        ) : activeTab === 'alerts' ? (
          <PriceAlerts latestPrices={latestPrices} onSelectTicker={handleSelectTicker} />
        ) : null}
      </main>
    </div>
  );
}
