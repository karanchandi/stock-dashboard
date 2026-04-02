'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MacroDrilldownProps {
  indicator: string;
  label: string;
  onClose: () => void;
}

const INDICATOR_CONFIG: Record<string, { dbField: string; format: (v: number) => string; color: string }> = {
  vix: { dbField: 'vix', format: (v) => v.toFixed(2), color: '#E24B4A' },
  fear_greed: { dbField: 'fear_greed_index', format: (v) => `${v}`, color: '#EF9F27' },
  oil: { dbField: 'oil_wti', format: (v) => `$${v.toFixed(2)}`, color: '#378ADD' },
  gold: { dbField: 'gold', format: (v) => `$${v.toLocaleString()}`, color: '#EF9F27' },
  dxy: { dbField: 'dxy', format: (v) => v.toFixed(2), color: '#1D9E75' },
  sp500: { dbField: 'sp500', format: (v) => v.toLocaleString(), color: '#378ADD' },
  yield_2y: { dbField: 'yield_2y', format: (v) => `${v.toFixed(3)}%`, color: '#534AB7' },
  yield_10y: { dbField: 'yield_10y', format: (v) => `${v.toFixed(3)}%`, color: '#378ADD' },
  yield_30y: { dbField: 'yield_30y', format: (v) => `${v.toFixed(3)}%`, color: '#1D9E75' },
  spread: { dbField: 'spread_2s10s', format: (v) => `${v.toFixed(0)} bps`, color: '#D85A30' },
  mortgage: { dbField: 'mortgage_30y', format: (v) => `${v.toFixed(2)}%`, color: '#993556' },
};

export default function MacroDrilldown({ indicator, label, onClose }: MacroDrilldownProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const config = INDICATOR_CONFIG[indicator] || { dbField: indicator, format: (v: number) => `${v}`, color: '#378ADD' };

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const { data: rows } = await supabase
        .from('macro_indicators')
        .select(`run_date, ${config.dbField}`)
        .order('run_date', { ascending: true })
        .limit(365);

      if (rows) {
        setData(rows.filter((r: any) => r[config.dbField] != null).map((r: any) => ({
          date: r.run_date,
          value: Number(r[config.dbField]),
        })));
      }
      setLoading(false);
    }
    fetchHistory();
  }, [indicator, config.dbField]);

  const latest = data.length > 0 ? data[data.length - 1].value : null;
  const first = data.length > 0 ? data[0].value : null;
  const change = latest && first ? latest - first : null;
  const changePct = first && change ? (change / first * 100) : null;

  return (
    <div className="rounded-lg p-5" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</h3>
          {latest != null && (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{config.format(latest)}</span>
              {change != null && (
                <span className="text-xs font-medium" style={{ color: change >= 0 ? '#1D9E75' : '#E24B4A' }}>
                  {change >= 0 ? '+' : ''}{config.format(change)} ({changePct! >= 0 ? '+' : ''}{changePct!.toFixed(1)}%)
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-md text-sm"
          style={{ background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          Close
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ height: 250 }}>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Loading history...</span>
        </div>
      ) : data.length > 1 ? (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
              tickFormatter={(d: string) => {
                const dt = new Date(d + 'T00:00:00');
                return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
              minTickGap={40}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
              tickFormatter={(v: any) => config.format(Number(v))}
              width={65}
            />
            <Tooltip
              contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              labelFormatter={(d: any) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
              formatter={(value: any) => [config.format(Number(value)), label]}
            />
            <Line type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center" style={{ height: 250 }}>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Historical data will build over time as daily runs accumulate. Currently {data.length} data point{data.length !== 1 ? 's' : ''}.
          </span>
        </div>
      )}
    </div>
  );
}
