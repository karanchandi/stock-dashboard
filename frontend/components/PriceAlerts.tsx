'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Alert {
  id: number;
  ticker: string;
  alert_type: string;
  target_price: number;
  created_at: string;
  triggered_at: string | null;
  is_active: boolean;
  notes: string;
}

interface PriceAlertsProps {
  latestPrices: Record<string, number>;
  onSelectTicker?: (ticker: string) => void;
}

function Signal({ color }: { color: 'green' | 'yellow' | 'red' | 'gray' }) {
  const colors = { green: '#1D9E75', yellow: '#EF9F27', red: '#E24B4A', gray: '#9ca3af' };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[color], marginRight: 4 }} />;
}

export default function PriceAlerts({ latestPrices, onSelectTicker }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [newTicker, setNewTicker] = useState('');
  const [newType, setNewType] = useState('below');
  const [newPrice, setNewPrice] = useState('');
  const [newNotes, setNewNotes] = useState('');

  async function fetchAlerts() {
    setLoading(true);
    const { data } = await supabase
      .from('price_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAlerts(data);
    setLoading(false);
  }

  useEffect(() => { fetchAlerts(); }, []);

  // Check which alerts are triggered
  function isTriggered(alert: Alert): boolean {
    const price = latestPrices[alert.ticker];
    if (!price || !alert.is_active) return false;
    if (alert.alert_type === 'below' && price <= alert.target_price) return true;
    if (alert.alert_type === 'above' && price >= alert.target_price) return true;
    return false;
  }

  async function addAlert() {
    if (!newTicker.trim() || !newPrice) return;
    const { error } = await supabase.from('price_alerts').insert({
      ticker: newTicker.toUpperCase().trim(),
      alert_type: newType,
      target_price: parseFloat(newPrice),
      notes: newNotes || null,
    });
    if (!error) {
      setNewTicker(''); setNewPrice(''); setNewNotes(''); setNewType('below');
      setShowAdd(false);
      fetchAlerts();
    }
  }

  async function deleteAlert(id: number) {
    await supabase.from('price_alerts').delete().eq('id', id);
    fetchAlerts();
  }

  async function toggleAlert(id: number, currentActive: boolean) {
    await supabase.from('price_alerts').update({ is_active: !currentActive }).eq('id', id);
    fetchAlerts();
  }

  const triggered = alerts.filter(a => a.is_active && isTriggered(a));
  const active = alerts.filter(a => a.is_active && !isTriggered(a));
  const inactive = alerts.filter(a => !a.is_active);

  const inputStyle = {
    background: 'var(--bg-secondary)',
    border: '0.5px solid var(--border)',
    color: 'var(--text-primary)',
    outline: 'none',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 13,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {alerts.filter(a => a.is_active).length} active alerts
          {triggered.length > 0 && (
            <span style={{ color: '#E24B4A', fontWeight: 600 }}> · {triggered.length} triggered</span>
          )}
        </span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-1.5 rounded-md text-sm font-medium"
          style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
        >
          {showAdd ? 'Cancel' : '+ New alert'}
        </button>
      </div>

      {showAdd && (
        <div className="rounded-lg p-4 space-y-3" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Ticker</label>
              <input style={inputStyle} className="w-full" value={newTicker} onChange={e => setNewTicker(e.target.value)} placeholder="e.g. LEU" />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Alert when price</label>
              <select style={inputStyle} className="w-full" value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="below">Drops below</option>
                <option value="above">Rises above</option>
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Target price</label>
              <input style={inputStyle} className="w-full" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="$" />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Notes</label>
              <input style={inputStyle} className="w-full" value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <button onClick={addAlert} className="px-4 py-1.5 rounded-md text-sm font-medium" style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
            Create alert
          </button>
        </div>
      )}

      {/* Triggered alerts */}
      {triggered.length > 0 && (
        <div>
          <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#E24B4A' }}>Triggered</div>
          {triggered.map(a => (
            <AlertRow key={a.id} alert={a} price={latestPrices[a.ticker]} triggered={true} onDelete={deleteAlert} onToggle={toggleAlert} onSelect={onSelectTicker} />
          ))}
        </div>
      )}

      {/* Active alerts */}
      {active.length > 0 && (
        <div>
          <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Active</div>
          {active.map(a => (
            <AlertRow key={a.id} alert={a} price={latestPrices[a.ticker]} triggered={false} onDelete={deleteAlert} onToggle={toggleAlert} onSelect={onSelectTicker} />
          ))}
        </div>
      )}

      {/* Inactive */}
      {inactive.length > 0 && (
        <div>
          <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Inactive</div>
          {inactive.map(a => (
            <AlertRow key={a.id} alert={a} price={latestPrices[a.ticker]} triggered={false} onDelete={deleteAlert} onToggle={toggleAlert} onSelect={onSelectTicker} />
          ))}
        </div>
      )}

      {alerts.length === 0 && !loading && (
        <div className="text-center py-10 text-sm" style={{ color: 'var(--text-secondary)' }}>
          No price alerts set. Click "+ New alert" to start monitoring.
        </div>
      )}
    </div>
  );
}

function AlertRow({ alert, price, triggered, onDelete, onToggle, onSelect }: {
  alert: Alert; price: number | undefined; triggered: boolean;
  onDelete: (id: number) => void; onToggle: (id: number, active: boolean) => void;
  onSelect?: (ticker: string) => void;
}) {
  const a = alert;
  const direction = a.alert_type === 'below' ? 'drops below' : 'rises above';
  const distancePct = price && a.target_price ? ((price - a.target_price) / a.target_price * 100) : null;

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-4 py-3 mb-1.5"
      style={{
        background: triggered ? 'rgba(226,75,74,0.06)' : 'var(--bg-primary)',
        border: `0.5px solid ${triggered ? 'rgba(226,75,74,0.3)' : 'var(--border)'}`,
      }}
    >
      <Signal color={triggered ? 'red' : a.is_active ? 'green' : 'gray'} />
      <button onClick={() => onSelect?.(a.ticker)} className="text-sm font-semibold hover:underline" style={{ color: '#378ADD' }}>
        {a.ticker}
      </button>
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        {direction} ${a.target_price.toFixed(2)}
      </span>
      {price && (
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          · Current: ${price.toFixed(2)}
          {distancePct != null && (
            <span style={{ color: Math.abs(distancePct) < 5 ? '#EF9F27' : 'var(--text-secondary)' }}>
              {' '}({distancePct > 0 ? '+' : ''}{distancePct.toFixed(1)}% away)
            </span>
          )}
        </span>
      )}
      {a.notes && <span className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>{a.notes}</span>}
      <div className="ml-auto flex gap-2">
        <button onClick={() => onToggle(a.id, a.is_active)} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
          {a.is_active ? 'Pause' : 'Resume'}
        </button>
        <button onClick={() => onDelete(a.id)} className="text-xs px-2 py-1 rounded" style={{ color: '#E24B4A', background: '#FCEBEB' }}>
          Delete
        </button>
      </div>
    </div>
  );
}
