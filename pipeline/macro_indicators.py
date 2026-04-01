"""
Macro Indicators Module
Pulls VIX, treasury yields, oil, gold, DXY, S&P500, and derives signals.
Fear/greed approximated from VIX + market momentum.
"""
import yfinance as yf
import time
import warnings

warnings.filterwarnings("ignore")


def safe_float(val):
    if val is None:
        return None
    try:
        f = float(val)
        return f if f == f else None
    except (ValueError, TypeError):
        return None


def get_price(ticker):
    """Get current/latest price for a ticker."""
    try:
        t = yf.Ticker(ticker)
        info = t.info
        return safe_float(info.get("regularMarketPrice")) or safe_float(info.get("previousClose"))
    except Exception:
        return None


def get_yield_data():
    """Get treasury yield curve data."""
    tickers = {
        "yield_3m": "^IRX",
        "yield_2y": "2YY=F",
        "yield_5y": "^FVX",
        "yield_10y": "^TNX",
        "yield_30y": "^TYX",
    }
    results = {}
    for key, ticker in tickers.items():
        val = get_price(ticker)
        if val is not None:
            results[key] = round(val, 3)
        time.sleep(0.8)
    return results


def classify_vix(vix):
    if vix is None: return "unknown"
    if vix >= 30: return "extreme_fear"
    if vix >= 20: return "elevated"
    if vix >= 15: return "normal"
    return "complacent"


def classify_oil(price):
    if price is None: return "unknown"
    if price >= 100: return "crisis"
    if price >= 85: return "elevated"
    if price >= 60: return "normal"
    return "low"


def classify_gold(price):
    if price is None: return "unknown"
    if price >= 3000: return "safe_haven_bid"
    if price >= 2000: return "elevated"
    return "normal"


def classify_dxy(val):
    if val is None: return "unknown"
    if val >= 105: return "strong_headwind"
    if val >= 100: return "moderately_strong"
    if val >= 95: return "neutral"
    return "weak_tailwind"


def classify_yield_curve(spread):
    if spread is None: return "unknown"
    if spread < 0: return "inverted_recession_warning"
    if spread < 25: return "flat_caution"
    if spread < 100: return "normalizing_watch"
    return "steep_healthy"


def classify_mortgage(rate):
    if rate is None: return "unknown"
    if rate >= 7.0: return "restrictive"
    if rate >= 6.5: return "elevated"
    if rate >= 6.0: return "moderate"
    return "favorable"


def estimate_fear_greed(vix, sp500_change_pct=None):
    """Rough fear/greed estimate based on VIX level."""
    if vix is None: return None, "unknown"
    if vix >= 35: score = 5
    elif vix >= 30: score = 12
    elif vix >= 25: score = 22
    elif vix >= 20: score = 35
    elif vix >= 17: score = 50
    elif vix >= 14: score = 65
    else: score = 80

    if score <= 25: label = "extreme_fear"
    elif score <= 45: label = "fear"
    elif score <= 55: label = "neutral"
    elif score <= 75: label = "greed"
    else: label = "extreme_greed"
    return score, label


def classify_sp500(price):
    if price is None: return "unknown"
    if price >= 6800: return "bullish"
    if price >= 6400: return "cautious"
    return "correction"


def fetch_macro_data():
    """Pull all macro indicators. Returns a dict ready for DB insert."""
    print("Fetching macro indicators...")
    data = {}

    print("  VIX...")
    data["vix"] = get_price("^VIX")
    data["vix_signal"] = classify_vix(data["vix"])
    time.sleep(1.0)

    print("  Treasury yields...")
    yields = get_yield_data()
    data.update(yields)
    y2 = yields.get("yield_2y")
    y10 = yields.get("yield_10y")
    data["spread_2s10s"] = round((y10 - y2) * 100, 1) if y2 and y10 else None
    data["yield_curve_signal"] = classify_yield_curve(data["spread_2s10s"])
    time.sleep(1.0)

    print("  Oil (WTI)...")
    data["oil_wti"] = get_price("CL=F")
    data["oil_signal"] = classify_oil(data["oil_wti"])
    time.sleep(1.0)

    print("  Gold...")
    data["gold"] = get_price("GC=F")
    data["gold_signal"] = classify_gold(data["gold"])
    time.sleep(1.0)

    print("  DXY...")
    data["dxy"] = get_price("DX-Y.NYB")
    data["dxy_signal"] = classify_dxy(data["dxy"])
    time.sleep(1.0)

    print("  S&P 500...")
    data["sp500"] = get_price("^GSPC")
    data["sp500_signal"] = classify_sp500(data["sp500"])
    time.sleep(1.0)

    # Fear/greed estimate
    fg_score, fg_label = estimate_fear_greed(data["vix"])
    data["fear_greed_index"] = fg_score
    data["fear_greed_label"] = fg_label

    # Fed funds (manually updated — changes only ~8x/year)
    data["fed_funds_rate"] = "3.50-3.75"

    # Mortgage rates (approximated from 10Y + spread)
    y10_val = yields.get("yield_10y")
    if y10_val:
        data["mortgage_30y"] = round(y10_val + 2.2, 2)  # typical spread ~220bps
        data["mortgage_15y"] = round(y10_val + 1.5, 2)
    data["mortgage_signal"] = classify_mortgage(data.get("mortgage_30y"))

    # Overall market regime
    red_count = sum(1 for s in [data.get("vix_signal"), data.get("oil_signal"),
                                 data.get("sp500_signal")]
                    if s in ("extreme_fear", "elevated", "crisis", "correction"))
    if red_count >= 2:
        data["market_regime"] = "risk_off"
    elif red_count == 1:
        data["market_regime"] = "cautious"
    else:
        data["market_regime"] = "risk_on"

    print(f"  Done. Regime: {data['market_regime']}")
    return data


if __name__ == "__main__":
    data = fetch_macro_data()
    for k, v in sorted(data.items()):
        print(f"  {k}: {v}")
