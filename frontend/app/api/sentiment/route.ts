import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'ticker required' }, { status: 400 });
  }

  const result: any = { ticker, stocktwits: null, reddit: null };

  // Stocktwits
  try {
    const stRes = await fetch(
      `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(ticker)}.json`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' }
    );
    if (stRes.ok) {
      const stData = await stRes.json();
      const messages = stData.messages || [];

      let bullish = 0;
      let bearish = 0;
      const posts = messages.slice(0, 10).map((m: any) => {
        const sentiment = m.entities?.sentiment?.basic;
        if (sentiment === 'Bullish') bullish++;
        if (sentiment === 'Bearish') bearish++;
        return {
          id: m.id,
          body: m.body?.substring(0, 200),
          username: m.user?.username,
          sentiment: sentiment || 'neutral',
          created_at: m.created_at,
          likes: m.likes?.total || 0,
        };
      });

      const total = bullish + bearish;
      result.stocktwits = {
        bullish_pct: total > 0 ? Math.round((bullish / total) * 100) : null,
        bearish_pct: total > 0 ? Math.round((bearish / total) * 100) : null,
        total_messages: messages.length,
        posts,
      };
    }
  } catch {}

  // Reddit
  try {
    const redditRes = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(ticker)}+subreddit%3Awallstreetbets+OR+subreddit%3Astocks+OR+subreddit%3Ainvesting&sort=new&limit=10&t=week`,
      { headers: { 'User-Agent': 'MarketPulse/1.0' }, cache: 'no-store' }
    );
    if (redditRes.ok) {
      const redditData = await redditRes.json();
      const children = redditData?.data?.children || [];

      const posts = children.map((c: any) => ({
        title: c.data.title?.substring(0, 200),
        subreddit: c.data.subreddit,
        score: c.data.score,
        num_comments: c.data.num_comments,
        url: `https://reddit.com${c.data.permalink}`,
        created: c.data.created_utc * 1000,
      }));

      result.reddit = {
        mention_count: children.length,
        posts,
      };
    }
  } catch {}

  return NextResponse.json(result);
}
