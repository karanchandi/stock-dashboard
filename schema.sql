-- Stock Dashboard Database Schema
-- Run this in Supabase SQL Editor (SQL tab in left sidebar)

-- Screener results: one row per ticker per run date
CREATE TABLE IF NOT EXISTS screener_results (
    id BIGSERIAL PRIMARY KEY,
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ticker TEXT NOT NULL,
    name TEXT,
    exchange TEXT,
    sector TEXT,
    subsector TEXT,
    currency TEXT,
    price NUMERIC,
    market_cap NUMERIC,
    market_cap_tier TEXT,
    
    -- Fundamentals
    pe_ratio NUMERIC,
    forward_pe NUMERIC,
    pb_ratio NUMERIC,
    ev_ebitda NUMERIC,
    dividend_yield NUMERIC,
    dividend_yield_pct NUMERIC,
    dividend_rate NUMERIC,
    payout_ratio NUMERIC,
    debt_to_equity NUMERIC,
    return_on_equity NUMERIC,
    revenue_growth NUMERIC,
    earnings_growth NUMERIC,
    profit_margin NUMERIC,
    operating_margin NUMERIC,
    free_cashflow NUMERIC,
    total_revenue NUMERIC,
    high_52w NUMERIC,
    low_52w NUMERIC,
    pct_from_52w_high NUMERIC,
    avg_volume NUMERIC,
    beta NUMERIC,
    
    -- Analyst data
    target_price NUMERIC,
    target_high NUMERIC,
    target_low NUMERIC,
    upside_pct NUMERIC,
    analyst_rating NUMERIC,
    analyst_consensus TEXT,
    num_analysts INTEGER,
    forward_eps NUMERIC,
    cq_earnings_growth NUMERIC,
    next_yr_earnings_growth NUMERIC,
    buy_shift_mom INTEGER,
    
    -- Insider data (EDGAR)
    buy_count INTEGER,
    sell_count INTEGER,
    unique_buyers INTEGER,
    total_buy_value NUMERIC,
    total_sell_value NUMERIC,
    insider_net_value NUMERIC,
    
    -- Scores
    value_score NUMERIC,
    analyst_score NUMERIC,
    insider_score NUMERIC,
    combined_score NUMERIC,
    
    -- Constraints
    UNIQUE(run_date, ticker)
);

-- Macro indicators: one row per indicator per timestamp
CREATE TABLE IF NOT EXISTS macro_indicators (
    id BIGSERIAL PRIMARY KEY,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Sentiment
    vix NUMERIC,
    vix_signal TEXT,
    fear_greed_index INTEGER,
    fear_greed_label TEXT,
    
    -- Treasury yields
    yield_3m NUMERIC,
    yield_2y NUMERIC,
    yield_5y NUMERIC,
    yield_10y NUMERIC,
    yield_30y NUMERIC,
    spread_2s10s NUMERIC,
    yield_curve_signal TEXT,
    
    -- Fed
    fed_funds_rate TEXT,
    
    -- Commodities
    oil_wti NUMERIC,
    oil_signal TEXT,
    gold NUMERIC,
    gold_signal TEXT,
    dxy NUMERIC,
    dxy_signal TEXT,
    
    -- Equity
    sp500 NUMERIC,
    sp500_signal TEXT,
    
    -- Mortgage rates
    mortgage_30y NUMERIC,
    mortgage_15y NUMERIC,
    mortgage_signal TEXT,
    
    -- Overall
    market_regime TEXT,
    
    UNIQUE(run_date)
);

-- Watchlist: your flagged tickers with notes
CREATE TABLE IF NOT EXISTS watchlist (
    id BIGSERIAL PRIMARY KEY,
    ticker TEXT NOT NULL UNIQUE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    target_buy_price NUMERIC,
    target_sell_price NUMERIC,
    position_status TEXT DEFAULT 'watching',  -- watching, holding, sold
    shares_held NUMERIC DEFAULT 0,
    avg_cost_basis NUMERIC
);

-- Pipeline run log
CREATE TABLE IF NOT EXISTS run_log (
    id BIGSERIAL PRIMARY KEY,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    run_type TEXT NOT NULL,  -- 'scheduled', 'manual'
    status TEXT NOT NULL DEFAULT 'running',  -- 'running', 'success', 'failed'
    tickers_processed INTEGER,
    tickers_failed INTEGER,
    error_message TEXT
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_screener_run_date ON screener_results(run_date);
CREATE INDEX IF NOT EXISTS idx_screener_ticker ON screener_results(ticker);
CREATE INDEX IF NOT EXISTS idx_screener_combined ON screener_results(run_date, combined_score DESC);
CREATE INDEX IF NOT EXISTS idx_screener_subsector ON screener_results(run_date, subsector);
CREATE INDEX IF NOT EXISTS idx_macro_run_date ON macro_indicators(run_date);
CREATE INDEX IF NOT EXISTS idx_watchlist_ticker ON watchlist(ticker);

-- Create a view for the latest screener results (most common query)
CREATE OR REPLACE VIEW latest_screener AS
SELECT * FROM screener_results
WHERE run_date = (SELECT MAX(run_date) FROM screener_results)
ORDER BY combined_score DESC NULLS LAST;

-- Create a view for the latest macro snapshot
CREATE OR REPLACE VIEW latest_macro AS
SELECT * FROM macro_indicators
WHERE run_date = (SELECT MAX(run_date) FROM macro_indicators)
LIMIT 1;

-- Enable Row Level Security (required by Supabase)
ALTER TABLE screener_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_log ENABLE ROW LEVEL SECURITY;

-- Allow read access via anon key (for the dashboard frontend)
CREATE POLICY "Allow public read on screener" ON screener_results FOR SELECT USING (true);
CREATE POLICY "Allow public read on macro" ON macro_indicators FOR SELECT USING (true);
CREATE POLICY "Allow public read on watchlist" ON watchlist FOR SELECT USING (true);
CREATE POLICY "Allow public read on run_log" ON run_log FOR SELECT USING (true);

-- Allow insert/update via service role key (for the pipeline)
CREATE POLICY "Allow service write on screener" ON screener_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service write on macro" ON macro_indicators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service write on watchlist" ON watchlist FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service write on run_log" ON run_log FOR ALL USING (true) WITH CHECK (true);
