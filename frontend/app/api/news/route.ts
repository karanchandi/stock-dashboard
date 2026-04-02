import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const type = searchParams.get('type') || 'ticker';

  const articles: any[] = [];

  try {
    if (type === 'macro') {
      const feeds = [
        'https://news.google.com/rss/search?q=stock+market+today&hl=en-US&gl=US&ceid=US:en',
        'https://news.google.com/rss/search?q=federal+reserve+interest+rates&hl=en-US&gl=US&ceid=US:en',
        'https://news.google.com/rss/search?q=oil+prices+economy&hl=en-US&gl=US&ceid=US:en',
      ];

      for (const feedUrl of feeds) {
        try {
          const res = await fetch(feedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            cache: 'no-store',
          });
          if (res.ok) {
            const xml = await res.text();
            const items = parseRssItems(xml, 5);
            articles.push(...items);
          }
        } catch {}
      }

      const seen = new Set<string>();
      const unique = articles.filter(a => {
        const key = a.title.toLowerCase().substring(0, 50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      unique.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      return NextResponse.json({ articles: unique.slice(0, 15) });

    } else if (ticker) {
      const query = encodeURIComponent(`${ticker} stock`);
      try {
        const res = await fetch(
          `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`,
          { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' }
        );
        if (res.ok) {
          const xml = await res.text();
          const items = parseRssItems(xml, 10);
          articles.push(...items);
        }
      } catch {}

      articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      return NextResponse.json({ articles: articles.slice(0, 10) });
    }

    return NextResponse.json({ articles: [] });
  } catch {
    return NextResponse.json({ articles: [] }, { status: 500 });
  }
}

function parseRssItems(xml: string, limit: number): any[] {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let count = 0;

  while ((match = itemRegex.exec(xml)) !== null && count < limit) {
    const itemXml = match[1];
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    const source = extractTag(itemXml, 'source');

    if (title && link) {
      items.push({
        title: decodeHtmlEntities(title),
        link,
        pubDate: pubDate || '',
        source: source || extractDomain(link),
      });
      count++;
    }
  }
  return items;
}

function extractTag(xml: string, tag: string): string {
  // Try CDATA first
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
  if (cdataMatch) return cdataMatch[1].trim();
  // Plain tag
  const plainMatch = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return plainMatch ? plainMatch[1].trim() : '';
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

function decodeHtmlEntities(text: string): string {
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
}
