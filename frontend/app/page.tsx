'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import MacroDashboard from '@/components/MacroDashboard';
import StockScreener from '@/components/StockScreener';
import StockDetail from '@/components/StockDetail';
import Watchlist from '@/components/Watchlist';

type Tab = 'macro' | 'screener' | 'watchlist';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('macro');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [macro, setMacro] = useState<any>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [lastRun, setLastRun] = useState<string>('');
  const [loading, setLoading] = useState(true);

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

      const { data: stockData } = await supabase
        .from('screener_results')
        .select('*')
        .order('combined_score', { ascending: false, nullsFirst: false })
        .limit(500);

      if (stockData) setStocks(stockData);
      setLoading(false);
    }

    fetchData();
  }, []);

  // Build a price lookup for the watchlist
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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'macro', label: 'Macro dashboard' },
    { key: 'screener', label: 'Stock screener' },
    { key: 'watchlist', label: 'Watchlist' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-secondary)' }}>
      <header className="border-b" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-semibold cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
              onClick={() => { setSelectedTicker(null); setActiveTab('macro'); }}
            >
              Stock Dashboard
            </h1>
            {lastRun && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Last refresh: {new Date(lastRun + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
          {!selectedTicker && (
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab.key ? 'var(--bg-primary)' : 'transparent',
                    color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: activeTab === tab.key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
          {selectedTicker && (
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Viewing: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedTicker}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading data...</div>
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
        ) : (
          <Watchlist onSelectTicker={handleSelectTicker} latestPrices={latestPrices} />
        )}
      </main>
    </div>
  );
}
