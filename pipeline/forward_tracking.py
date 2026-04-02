"""
Forward Tracking Module
Captures top/bottom scored stocks each pipeline run and tracks their forward performance.
Used for backtesting the scoring system over 30/60/90/180/365 day periods.
"""
import sys
from datetime import date, timedelta


def capture_daily_snapshot(client, screener_results, sp500_price, run_date):
    """Capture today's top 20 and bottom 20 stocks by combined score."""
    from db import force_clean

    # Sort by combined score
    scored = [r for r in screener_results if r.get("combined_score") is not None]
    scored.sort(key=lambda x: x["combined_score"], reverse=True)

    if len(scored) < 40:
        print(f"  Only {len(scored)} scored stocks — need at least 40 for tracking. Skipping.")
        return

    top_20 = scored[:20]
    bottom_20 = scored[-20:]

    rows = []
    for stock in top_20:
        rows.append({
            "run_date": run_date,
            "ticker": stock["ticker"],
            "name": stock.get("name", ""),
            "subsector": stock.get("subsector", ""),
            "price_at_signal": stock.get("price"),
            "combined_score": stock.get("combined_score"),
            "value_score": stock.get("value_score"),
            "analyst_score": stock.get("analyst_score"),
            "insider_score": stock.get("insider_score"),
            "ranking": "top_20",
            "sp500_at_signal": sp500_price,
        })

    for stock in bottom_20:
        rows.append({
            "run_date": run_date,
            "ticker": stock["ticker"],
            "name": stock.get("name", ""),
            "subsector": stock.get("subsector", ""),
            "price_at_signal": stock.get("price"),
            "combined_score": stock.get("combined_score"),
            "value_score": stock.get("value_score"),
            "analyst_score": stock.get("analyst_score"),
            "insider_score": stock.get("insider_score"),
            "ranking": "bottom_20",
            "sp500_at_signal": sp500_price,
        })

    clean = force_clean(rows)
    try:
        client.table("forward_tracking").upsert(
            clean, on_conflict="run_date,ticker,ranking"
        ).execute()
        print(f"  Captured {len(rows)} stocks (top 20 + bottom 20) for forward tracking")
    except Exception as e:
        print(f"  Warning: forward tracking insert failed: {e}")


def update_forward_returns(client, current_prices, sp500_price):
    """Update forward returns for historical snapshots that have reached their measurement dates."""
    today = date.today()

    # Check each measurement period
    periods = [
        (30, "price_30d", "return_30d_pct", "sp500_30d", "sp500_return_30d_pct"),
        (60, "price_60d", "return_60d_pct", "sp500_60d", "sp500_return_60d_pct"),
        (90, "price_90d", "return_90d_pct", "sp500_90d", "sp500_return_90d_pct"),
        (180, "price_180d", "return_180d_pct", None, None),
        (365, "price_365d", "return_365d_pct", None, None),
    ]

    for days, price_col, return_col, sp_col, sp_return_col in periods:
        target_date = (today - timedelta(days=days)).isoformat()

        # Find rows from {days} ago that don't have forward prices yet
        try:
            result = client.table("forward_tracking").select(
                "id, ticker, price_at_signal, sp500_at_signal"
            ).eq("run_date", target_date).is_(price_col, "null").execute()

            rows = result.data or []
            if not rows:
                continue

            print(f"  Updating {len(rows)} forward tracking rows for {days}-day returns (from {target_date})")

            for row in rows:
                ticker = row["ticker"]
                current_price = current_prices.get(ticker)
                signal_price = row.get("price_at_signal")

                if current_price and signal_price and signal_price > 0:
                    return_pct = round(((current_price - signal_price) / signal_price) * 100, 2)

                    update = {
                        price_col: current_price,
                        return_col: return_pct,
                    }

                    # Add S&P comparison if columns exist for this period
                    if sp_col and sp500_price and row.get("sp500_at_signal"):
                        sp_signal = row["sp500_at_signal"]
                        if sp_signal > 0:
                            update[sp_col] = sp500_price
                            update[sp_return_col] = round(((sp500_price - sp_signal) / sp_signal) * 100, 2)

                    client.table("forward_tracking").update(update).eq("id", row["id"]).execute()

        except Exception as e:
            print(f"  Warning: failed to update {days}-day returns: {e}")


def run_forward_tracking(client, screener_results, sp500_price, run_date):
    """Main entry point — captures snapshot and updates historical returns."""
    print("Forward Tracking")
    print("-" * 50)

    # Build current price lookup from screener results
    current_prices = {}
    for r in screener_results:
        if r.get("ticker") and r.get("price"):
            current_prices[r["ticker"]] = r["price"]

    # Capture today's top/bottom stocks
    capture_daily_snapshot(client, screener_results, sp500_price, run_date)

    # Update forward returns for historical snapshots
    update_forward_returns(client, current_prices, sp500_price)

    print("  Forward tracking complete.")
