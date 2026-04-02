'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import MacroDashboard from '@/components/MacroDashboard';
import StockScreener from '@/components/StockScreener';
import StockDetail from '@/components/StockDetail';
import Watchlist from '@/components/Watchlist';
import PriceAlerts from '@/components/PriceAlerts';

type Tab = 'macro' | 'screener' | 'watchlist' | 'alerts';

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

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: macroData } = await supabase
        .from('macro_indicators')
        .select('*')
        .order('run_date', { ascending: false })
        .limit(1)
        .single();

      if (macroData) {
        setMacro(macroData);
        setLastRun(macroData.run_date);
      }

      // Get the latest run date first
      const { data: latestRun } = await supabase
        .from('screener_results')
        .select('run_date')
        .order('run_date', { ascending: false })
        .limit(1)
        .single();

      const latestDate = latestRun?.run_date || macroData?.run_date;

      const { data: stockData } = await supabase
        .from('screener_results')
        .select('*')
        .eq('run_date', latestDate)
        .order('combined_score', { ascending: false, nullsFirst: false })
        .limit(800);

      if (stockData) setStocks(stockData);
      setLoading(false);
    }

    fetchData();
  }, []);

  const latestPrices = useMemo(() => {
    const map: Record<string, number> = {};
    stocks.forEach(s => {
      if (s.ticker && s.price) map[s.ticker] = s.price;
    });
    return map;
  }, [stocks]);

  function handleSelectTicker(ticker: string) {
    setSelectedTicker(ticker);
  }

  function handleBack() {
    setSelectedTicker(null);
  }

  async function handleAddToWatchlist(ticker: string) {
    const { error } = await supabase.from('watchlist').upsert({
      ticker: ticker,
      position_status: 'watching',
    }, { onConflict: 'ticker' });

    if (!error) {
      alert(`${ticker} added to watchlist`);
    }
  }

  async function triggerPipeline() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Pipeline triggered! Data will refresh in ~15-20 minutes.');
      } else {
        alert(`Failed to trigger: ${data.error || 'Unknown error'}. You can still trigger manually from GitHub Actions.`);
      }
    } catch {
      alert('Failed to trigger pipeline. You can still trigger manually from GitHub Actions.');
    }
    setRefreshing(false);
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'macro', label: 'Macro', icon: '◉' },
    { key: 'screener', label: 'Value Scanner', icon: '⊞' },
    { key: 'watchlist', label: 'Watchlist', icon: '★' },
    { key: 'alerts', label: 'Alerts', icon: '⚡' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <header style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => { setSelectedTicker(null); setActiveTab('macro'); }}
          >
            <PulseLogo />
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Market<span style={{ color: 'var(--brand)' }}>Pulse</span>
              </h1>
              {lastRun && (
                <div className="flex items-center gap-2" style={{ marginTop: -1 }}>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Updated {new Date(lastRun + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <button
                    onClick={triggerPipeline}
                    disabled={refreshing}
                    className="text-xs px-2 py-0.5 rounded font-medium"
                    style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid var(--brand)', opacity: refreshing ? 0.5 : 1 }}
                  >
                    {refreshing ? 'Refreshing...' : '↻ Refresh'}
                  </button>
                </div>
              )}
            </div>
          </div>
          {!selectedTicker && (
            <nav className="flex gap-0.5 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5"
                  style={{
                    background: activeTab === tab.key ? 'var(--bg-primary)' : 'transparent',
                    color: activeTab === tab.key ? 'var(--brand)' : 'var(--text-secondary)',
                    boxShadow: activeTab === tab.key ? 'var(--card-shadow)' : 'none',
                    fontWeight: activeTab === tab.key ? 600 : 500,
                  }}
                >
                  <span style={{ fontSize: 11, opacity: activeTab === tab.key ? 1 : 0.5 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
          {selectedTicker && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="px-3 py-1.5 rounded-md text-sm font-medium"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                ← Back
              </button>
              <span className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>{selectedTicker}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <PulseLogo />
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading MarketPulse...</div>
          </div>
        ) : selectedTicker ? (
          <StockDetail
            ticker={selectedTicker}
            onBack={handleBack}
            onAddToWatchlist={handleAddToWatchlist}
          />
        ) : activeTab === 'macro' ? (
          <MacroDashboard data={macro} />
        ) : activeTab === 'screener' ? (
          <StockScreener stocks={stocks} onSelectTicker={handleSelectTicker} onAddToWatchlist={handleAddToWatchlist} />
        ) : activeTab === 'watchlist' ? (
          <Watchlist onSelectTicker={handleSelectTicker} latestPrices={latestPrices} stocks={stocks} />
        ) : activeTab === 'alerts' ? (
          <PriceAlerts latestPrices={latestPrices} onSelectTicker={handleSelectTicker} />
        ) : null}
      </main>
    </div>
  );
}
