"""
Main Pipeline Runner v2
Orchestrates: screener → EDGAR insider → macro indicators → Supabase
All data sanitized before database writes.
"""
import os
import sys
import math
import json
import traceback
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import get_client, upsert_screener_results, upsert_macro_indicators, log_run_start, log_run_end, force_clean


def run_pipeline():
    run_type = os.environ.get("RUN_TYPE", "manual")
    run_date = date.today().isoformat()
    print(f"{'='*60}")
    print(f"Stock Dashboard Pipeline — {run_date}")
    print(f"Run type: {run_type}")
    print(f"{'='*60}\n")

    client = get_client()
    run_id = log_run_start(client, run_type)
    total_processed = 0
    total_failed = 0

    try:
        # --- Phase 1: Screener (fundamentals + analyst in single pass) ---
        print("PHASE 1: Stock Screener (fundamentals + analyst)")
        print("-" * 50)
        from screener import fetch_all_data, score_value, score_analyst, categorize_market_cap
        from ticker_universe import build_universe
        import time

        universe = build_universe()
        results = []
        errors = []

        for i, ticker_info in enumerate(universe):
            ticker = ticker_info["ticker"]
            pct = (i + 1) / len(universe) * 100
            sys.stdout.write(f"\r[{pct:5.1f}%] {ticker:<15} ({i+1}/{len(universe)})")
            sys.stdout.flush()

            data = fetch_all_data(ticker_info)
            if data:
                composite, _ = score_value(data)
                data["value_score"] = round(composite, 2) if composite else None
                data["market_cap_tier"] = categorize_market_cap(data.get("market_cap"))
                data["analyst_score"] = score_analyst(data)
                if data.get("dividend_yield"):
                    data["dividend_yield_pct"] = round(data["dividend_yield"] * 100, 2)
                results.append(data)
            else:
                errors.append(ticker)

            time.sleep(1.2)
            if (i + 1) % 50 == 0:
                print(f"\n  ... pausing 10s (at {i+1}/{len(universe)}) ...")
                time.sleep(10)

        # Retry failures
        if errors:
            print(f"\n\nRetrying {len(errors)} failed tickers...")
            time.sleep(30)
            retry_universe = [t for t in universe if t["ticker"] in errors]
            still_failed = []
            for ticker_info in retry_universe:
                data = fetch_all_data(ticker_info)
                if data:
                    composite, _ = score_value(data)
                    data["value_score"] = round(composite, 2) if composite else None
                    data["market_cap_tier"] = categorize_market_cap(data.get("market_cap"))
                    data["analyst_score"] = score_analyst(data)
                    if data.get("dividend_yield"):
                        data["dividend_yield_pct"] = round(data["dividend_yield"] * 100, 2)
                    results.append(data)
                else:
                    still_failed.append(ticker_info["ticker"])
                time.sleep(2.0)
            errors = still_failed

        total_processed = len(results)
        total_failed = len(errors)
        print(f"\n\nScreener: {total_processed} success, {total_failed} failed")

        # --- Phase 2: EDGAR Insider Data ---
        print(f"\nPHASE 2: EDGAR Insider Data")
        print("-" * 50)
        from edgar_insider import run_insider_scan

        tickers_list = [r["ticker"] for r in results]
        insider_data = run_insider_scan(tickers_list)

        for row in results:
            t = row["ticker"]
            if t in insider_data:
                ins = insider_data[t]
                row["buy_count"] = ins.get("buy_count")
                row["sell_count"] = ins.get("sell_count")
                row["unique_buyers"] = ins.get("unique_buyers")
                row["total_buy_value"] = ins.get("total_buy_value")
                row["total_sell_value"] = ins.get("total_sell_value")
                row["insider_net_value"] = ins.get("net_value")
                row["insider_score"] = ins.get("insider_score")

        # Compute combined score
        for row in results:
            v = row.get("value_score")
            a = row.get("analyst_score")
            i_s = row.get("insider_score")
            parts, weights = [], []
            if v is not None: parts.append(v); weights.append(0.50)
            if a is not None: parts.append(a); weights.append(0.30)
            if i_s is not None: parts.append(i_s); weights.append(0.20)
            if parts:
                tw = sum(weights)
                row["combined_score"] = round(sum(p * w for p, w in zip(parts, weights)) / tw, 2)

        # --- Phase 3: Write to Supabase ---
        print(f"\nPHASE 3: Writing to Supabase")
        print("-" * 50)

        db_fields = {
            "ticker", "name", "exchange", "sector", "subsector", "currency",
            "price", "market_cap", "market_cap_tier",
            "pe_ratio", "forward_pe", "pb_ratio", "ev_ebitda",
            "dividend_yield", "dividend_yield_pct", "dividend_rate", "payout_ratio",
            "debt_to_equity", "return_on_equity", "revenue_growth", "earnings_growth",
            "profit_margin", "operating_margin", "free_cashflow", "total_revenue",
            "avg_volume", "beta",
            "target_price", "target_high", "target_low", "upside_pct",
            "analyst_rating", "analyst_consensus", "num_analysts", "forward_eps",
            "cq_earnings_growth", "next_yr_earnings_growth", "buy_shift_mom",
            "buy_count", "sell_count", "unique_buyers",
            "total_buy_value", "total_sell_value", "insider_net_value",
            "value_score", "analyst_score", "insider_score", "combined_score",
            "next_earnings_date", "eps_estimate", "eps_actual",
            "eps_surprise_pct", "trailing_eps", "eps_current_year",
        }

        clean_results = []
        for row in results:
            clean = {k: v for k, v in row.items() if k in db_fields}
            clean["high_52w"] = row.get("52w_high")
            clean["low_52w"] = row.get("52w_low")
            clean["pct_from_52w_high"] = row.get("pct_from_52w_high")
            clean_results.append(clean)

        # Write in batches — force_clean handles all sanitization
        print(f"Writing {len(clean_results)} rows to Supabase...")
        batch_size = 50
        for i in range(0, len(clean_results), batch_size):
            batch = clean_results[i:i + batch_size]
            upsert_screener_results(client, batch, run_date)
            print(f"  Batch {i // batch_size + 1}: wrote {len(batch)} rows")
        print("  Screener data saved.")

        # --- Phase 4: Macro Indicators ---
        print(f"\nPHASE 4: Macro Indicators")
        print("-" * 50)
        from macro_indicators import fetch_macro_data

        macro = fetch_macro_data()
        upsert_macro_indicators(client, macro, run_date)
        print("  Macro data saved.")

        # Log success
        log_run_end(client, run_id, "success", total_processed, total_failed)
        print(f"\n{'='*60}")
        print(f"Pipeline complete. {total_processed} stocks, {total_failed} failed.")
        print(f"{'='*60}")

    except Exception as e:
        tb = traceback.format_exc()
        print(f"\nPIPELINE ERROR: {e}")
        print(tb)
        log_run_end(client, run_id, "failed", total_processed, total_failed, str(e))
        sys.exit(1)


if __name__ == "__main__":
    run_pipeline()
