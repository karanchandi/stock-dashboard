'use client';

import { useEffect, useState } from 'react';

interface TickerFeedProps {
  ticker: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SentimentDot({ sentiment }: { sentiment: string }) {
  const color = sentiment === 'Bullish' ? '#1D9E75' : sentiment === 'Bearish' ? '#E24B4A' : '#9ca3af';
  return <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color, marginRight: 4 }} />;
}

export default function TickerFeed({ ticker }: TickerFeedProps) {
  const [activeTab, setActiveTab] = useState<'news' | 'stocktwits' | 'reddit'>('news');
  const [news, setNews] = useState<any[]>([]);
  const [sentiment, setSentiment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);

      const [newsRes, sentRes] = await Promise.all([
        fetch(`/api/news?ticker=${encodeURIComponent(ticker)}`).then(r => r.json()).catch(() => ({ articles: [] })),
        fetch(`/api/sentiment?ticker=${encodeURIComponent(ticker)}`).then(r => r.json()).catch(() => null),
      ]);

      setNews(newsRes.articles || []);
      setSentiment(sentRes);
      setLoading(false);
    }
    fetchAll();
  }, [ticker]);

  const tabs = [
    { key: 'news' as const, label: `News (${news.length})` },
    { key: 'stocktwits' as const, label: `Stocktwits${sentiment?.stocktwits ? ` (${sentiment.stocktwits.total_messages})` : ''}` },
    { key: 'reddit' as const, label: `Reddit${sentiment?.reddit ? ` (${sentiment.reddit.mention_count})` : ''}` },
  ];

  return (
    <div className="rounded-lg" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)' }}>
      {/* Sentiment summary bar */}
      {sentiment?.stocktwits?.bullish_pct != null && (
        <div className="px-3 py-2 flex items-center gap-3" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Sentiment:</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden flex" style={{ background: 'var(--border)' }}>
            <div style={{ width: `${sentiment.stocktwits.bullish_pct}%`, background: '#1D9E75', height: '100%' }} />
            <div style={{ width: `${sentiment.stocktwits.bearish_pct}%`, background: '#E24B4A', height: '100%' }} />
          </div>
          <span className="text-xs" style={{ color: '#1D9E75' }}>{sentiment.stocktwits.bullish_pct}% Bull</span>
          <span className="text-xs" style={{ color: '#E24B4A' }}>{sentiment.stocktwits.bearish_pct}% Bear</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="px-3 py-1 rounded-md text-xs font-medium transition-all"
            style={{
              background: activeTab === t.key ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-3 py-2 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="text-xs py-4 text-center" style={{ color: 'var(--text-secondary)' }}>Loading feed...</div>
        ) : activeTab === 'news' ? (
          news.length > 0 ? (
            <div className="space-y-2">
              {news.map((a, i) => (
                <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80">
                  <div className="text-xs font-medium" style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{a.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {a.source} · {a.pubDate ? timeAgo(a.pubDate) : ''}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-xs py-4 text-center" style={{ color: 'var(--text-secondary)' }}>No recent news found</div>
          )
        ) : activeTab === 'stocktwits' ? (
          sentiment?.stocktwits?.posts?.length > 0 ? (
            <div className="space-y-2">
              {sentiment.stocktwits.posts.map((p: any) => (
                <div key={p.id} className="pb-2" style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <SentimentDot sentiment={p.sentiment} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>@{p.username}</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.created_at ? timeAgo(p.created_at) : ''}</span>
                    {p.likes > 0 && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>♥ {p.likes}</span>}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{p.body}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs py-4 text-center" style={{ color: 'var(--text-secondary)' }}>No Stocktwits posts found</div>
          )
        ) : activeTab === 'reddit' ? (
          sentiment?.reddit?.posts?.length > 0 ? (
            <div className="space-y-2">
              {sentiment.reddit.posts.map((p: any, i: number) => (
                <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80">
                  <div className="text-xs font-medium" style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{p.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    r/{p.subreddit} · ↑{p.score} · {p.num_comments} comments · {p.created ? timeAgo(new Date(p.created).toISOString()) : ''}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-xs py-4 text-center" style={{ color: 'var(--text-secondary)' }}>No Reddit posts found this week</div>
          )
        ) : null}
      </div>
    </div>
  );
}
