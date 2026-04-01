"""
Database connection module for Supabase.
Uses service role key for write access (pipeline).
"""
import os
from supabase import create_client, Client


def get_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    return create_client(url, key)


def upsert_screener_results(client: Client, results: list[dict], run_date: str):
    """Upsert screener results for a given run date."""
    for row in results:
        row["run_date"] = run_date
    client.table("screener_results").upsert(
        results, on_conflict="run_date,ticker"
    ).execute()


def upsert_macro_indicators(client: Client, data: dict, run_date: str):
    """Upsert macro indicators for a given run date."""
    data["run_date"] = run_date
    client.table("macro_indicators").upsert(
        data, on_conflict="run_date"
    ).execute()


def log_run_start(client: Client, run_type: str) -> int:
    """Log the start of a pipeline run. Returns the run ID."""
    result = client.table("run_log").insert({
        "run_type": run_type,
        "status": "running"
    }).execute()
    return result.data[0]["id"]


def log_run_end(client: Client, run_id: int, status: str,
                tickers_processed: int = 0, tickers_failed: int = 0,
                error_message: str = None):
    """Log the end of a pipeline run."""
    update = {
        "finished_at": "now()",
        "status": status,
        "tickers_processed": tickers_processed,
        "tickers_failed": tickers_failed,
    }
    if error_message:
        update["error_message"] = error_message[:1000]
    client.table("run_log").update(update).eq("id", run_id).execute()
