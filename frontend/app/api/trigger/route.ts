import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const GITHUB_TOKEN = process.env.GITHUB_PAT;
  const REPO = 'karanchandi/stock-dashboard';

  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/actions/workflows/daily_refresh.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' }),
      }
    );

    if (res.status === 204) {
      return NextResponse.json({ success: true, message: 'Pipeline triggered successfully' });
    } else {
      const errorText = await res.text();
      return NextResponse.json({ error: `GitHub API returned ${res.status}: ${errorText}` }, { status: res.status });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to trigger pipeline' }, { status: 500 });
  }
}
