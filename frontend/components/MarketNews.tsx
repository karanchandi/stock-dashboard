'use client';

import { useEffect, useState } from 'react';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function MarketNews() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      try {
        const res = await fetch('/api/news?type=macro');
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles || []);
        }
      } catch {}
      setLoading(false);
    }
    fetchNews();
  }, []);

  async function refreshNews() {
    setLoading(true);
    try {
      const res = await fetch('/api/news?type=macro&t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch {}
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          Market news
        </div>
        <button
          onClick={refreshNews}
          className="text-xs px-2 py-0.5 rounded font-medium"
          style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
        >
          ↻ Refresh
        </button>
      </div>
      <div className="rounded-lg" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}>
        {loading ? (
          <div className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-secondary)' }}>Loading news...</div>
        ) : articles.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {articles.map((a, i) => (
              <a
                key={i}
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 hover:opacity-80 transition-opacity"
              >
                <div className="text-xs font-medium" style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {a.title}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {a.source} {a.pubDate ? `· ${timeAgo(a.pubDate)}` : ''}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-secondary)' }}>No news available</div>
        )}
      </div>
    </div>
  );
}
