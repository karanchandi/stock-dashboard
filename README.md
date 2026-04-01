# Stock Dashboard

## Architecture
- **Data Pipeline**: Python scripts (yfinance + EDGAR + macro) → Supabase PostgreSQL
- **Scheduler**: GitHub Actions (daily 2 AM PT + on-demand)
- **Frontend**: Next.js on Vercel → reads from Supabase
- **Cost**: $0/month (all free tiers)

## Project Structure
```
stock-dashboard/
├── .github/
│   └── workflows/
│       └── daily_refresh.yml      # GitHub Actions scheduler
├── pipeline/
│   ├── ticker_universe.py         # Master ticker list (345 tickers)
│   ├── screener.py                # Fundamentals + analyst (single yfinance pass)
│   ├── edgar_insider.py           # SEC Form 4 insider data
│   ├── macro_indicators.py        # VIX, yields, oil, gold, fear/greed, mortgage
│   ├── db.py                      # Supabase database connection
│   └── run_pipeline.py            # Main entry point for scheduled runs
├── frontend/                      # Next.js app (Phase 3)
│   └── ...
├── requirements.txt
└── README.md
```

## Setup
1. Create accounts: GitHub, Supabase, Vercel
2. Create Supabase project (US West region)
3. Run SQL schema in Supabase SQL editor
4. Add secrets to GitHub repo
5. Push code → GitHub Actions handles the rest

## Database Tables
- `screener_results` — stock fundamentals, value/analyst/insider scores
- `macro_indicators` — VIX, yields, oil, gold, DXY, fear/greed, mortgage rates
- `watchlist` — your flagged stocks with notes
- `run_log` — pipeline execution history

## Refresh Schedule
- Daily at 2:00 AM Pacific (9:00 UTC)
- On-demand via GitHub Actions "Run workflow" button
