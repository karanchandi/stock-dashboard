'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import MacroDashboard from '@/components/MacroDashboard';
import StockScreener from '@/components/StockScreener';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'macro' | 'screener'>('macro');
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-secondary)' }}>
      <header className="border-b" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Stock Dashboard
            </h1>
            {lastRun && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Last refresh: {new Date(lastRun).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <button
              onClick={() => setActiveTab('macro')}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{
                background: activeTab === 'macro' ? 'var(--bg-primary)' : 'transparent',
                color: activeTab === 'macro' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'macro' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              Macro dashboard
            </button>
            <button
              onClick={() => setActiveTab('screener')}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{
                background: activeTab === 'screener' ? 'var(--bg-primary)' : 'transparent',
                color: activeTab === 'screener' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'screener' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              Stock screener
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading data...</div>
          </div>
        ) : activeTab === 'macro' ? (
          <MacroDashboard data={macro} />
        ) : (
          <StockScreener stocks={stocks} />
        )}
      </main>
    </div>
  );
}
