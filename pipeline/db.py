"""
Database connection module for Supabase.
Uses service role key for write access (pipeline).
"""
import os
import json
import math
from supabase import create_client, Client


def get_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    return create_client(url, key)


class SafeEncoder(json.JSONEncoder):
    """JSON encoder that converts inf, -inf, NaN, and numpy types to None."""
    def default(self, obj):
        try:
            val = float(obj)
            if math.isnan(val) or math.isinf(val):
                return None
            return val
        except (TypeError, ValueError, OverflowError):
            return str(obj)

    def encode(self, obj):
        obj = self._sanitize(obj)
        return super().encode(obj)

    def _sanitize(self, obj):
        if isinstance(obj, dict):
            return {k: self._sanitize(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._sanitize(v) for v in obj]
        elif isinstance(obj, float):
            if math.isnan(obj) or math.isinf(obj):
                return None
            return obj
        else:
            try:
                val = float(obj)
                if math.isnan(val) or math.isinf(val):
                    return None
            except (TypeError, ValueError, OverflowError):
                pass
            return obj


def force_clean(obj):
    """Convert entire data structure to JSON-safe format."""
    return json.loads(json.dumps(obj, cls=SafeEncoder))


def upsert_screener_results(client: Client, results: list[dict], run_date: str):
    """Upsert screener results for a given run date."""
    for row in results:
        row["run_date"] = run_date
    clean = force_clean(results)
    client.table("screener_results").upsert(
        clean, on_conflict="run_date,ticker"
    ).execute()


def upsert_macro_indicators(client: Client, data: dict, run_date: str):
    """Upsert macro indicators for a given run date."""
    data["run_date"] = run_date
    clean = force_clean(data)
    client.table("macro_indicators").upsert(
        clean, on_conflict="run_date"
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
