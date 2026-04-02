"""
Macro Indicators Module v2
Pulls VIX, treasury yields, oil, gold, DXY, S&P500, and derives signals.
Includes 50-day MA for gold and S&P, YTD performance, sector heatmap.
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


def get_price_and_meta(ticker):
    """Get current price, previous close, and 50-day MA for a ticker."""
    try:
        t = yf.Ticker(ticker)
        info = t.info
        price = safe_float(info.get("regularMarketPrice")) or safe_float(info.get("previousClose"))
        prev_close = safe_float(info.get("regularMarketPreviousClose")) or safe_float(info.get("previousClose"))
        fifty_day_ma = safe_float(info.get("fiftyDayAverage"))
        two_hundred_day_ma = safe_float(info.get("twoHundredDayAverage"))
        return {
            "price": price,
            "prev_close": prev_close,
            "fifty_day_ma": fifty_day_ma,
            "two_hundred_day_ma": two_hundred_day_ma,
        }
    except Exception:
        return {"price": None, "prev_close": None, "fifty_day_ma": None, "two_hundred_day_ma": None}


def get_price(ticker):
    """Get current/latest price for a ticker."""
    return get_price_and_meta(ticker)["price"]


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


def daily_change(price, prev_close):
    """Calculate daily change and percentage."""
    if price is None or prev_close is None or prev_close == 0:
        return None, None
    change = price - prev_close
    pct = (change / prev_close) * 100
    return round(change, 4), round(pct, 2)


# =====================================================================
# SIGNAL CLASSIFIERS (updated thresholds)
# =====================================================================

def classify_vix(vix):
    """Green <15, Yellow 15-25, Red >25"""
    if vix is None: return "unknown"
    if vix >= 25: return "red"
    if vix >= 15: return "yellow"
    return "green"


def classify_oil(price):
    """Green <70, Yellow 70-90, Red >90"""
    if price is None: return "unknown"
    if price >= 90: return "red"
    if price >= 70: return "yellow"
    return "green"


def classify_gold_ma(price, fifty_day_ma):
    """Gold signal based on distance from 50-day MA.
    Green: <3% above MA (calm)
    Yellow: within 3% either way
    Red: >3% above MA (panic safe-haven buying)
    """
    if price is None or fifty_day_ma is None or fifty_day_ma == 0:
        return "unknown"
    pct_above = ((price - fifty_day_ma) / fifty_day_ma) * 100
    if pct_above > 3: return "red"
    if pct_above < -3: return "green"
    return "yellow"


def classify_dxy(val):
    """Green <100, Yellow 100-105, Red >105"""
    if val is None: return "unknown"
    if val >= 105: return "red"
    if val >= 100: return "yellow"
    return "green"


def classify_fear_greed(score):
    """CNN classifications: Red <45 (Fear), Yellow 45-55 (Neutral), Green >55 (Greed)"""
    if score is None: return "unknown"
    if score < 45: return "red"
    if score <= 55: return "yellow"
    return "green"


def classify_yield_curve(spread):
    """Green >50bps, Yellow 0-50bps, Red <0bps"""
    if spread is None: return "unknown"
    if spread < 0: return "red"
    if spread < 50: return "yellow"
    return "green"


def classify_mortgage(rate):
    """Green <6.0, Yellow 6.0-7.0, Red >7.0"""
    if rate is None: return "unknown"
    if rate >= 7.0: return "red"
    if rate >= 6.0: return "yellow"
    return "green"


def classify_sp500_static(price):
    """Static: Green >6800, Yellow 6000-6800, Red <6000"""
    if price is None: return "unknown"
    if price >= 6800: return "green"
    if price >= 6000: return "yellow"
    return "red"


def classify_sp500_ma(price, fifty_day_ma):
    """50-day MA: Green >2% above, Yellow within 2%, Red >2% below"""
    if price is None or fifty_day_ma is None or fifty_day_ma == 0:
        return "unknown"
    pct = ((price - fifty_day_ma) / fifty_day_ma) * 100
    if pct > 2: return "green"
    if pct < -2: return "red"
    return "yellow"


def classify_sp500_ytd(price, ytd_start=5881):
    """YTD: Green >+5%, Yellow -5% to +5%, Red <-5%"""
    if price is None: return "unknown"
    ytd_pct = ((price - ytd_start) / ytd_start) * 100
    if ytd_pct > 5: return "green"
    if ytd_pct < -5: return "red"
    return "yellow"


def classify_fed_proxy(rate_3m):
    """Fed funds proxy from 3-month T-bill.
    Green <3.0 (accommodative), Yellow 3.0-4.5 (neutral), Red >4.5 (restrictive)"""
    if rate_3m is None: return "unknown"
    if rate_3m >= 4.5: return "red"
    if rate_3m >= 3.0: return "yellow"
    return "green"


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

    if score < 45: label = "fear"
    elif score <= 55: label = "neutral"
    else: label = "greed"
    return score, label


def get_sector_performance():
    """Get S&P 500 sector ETF performance."""
    sectors = {
        "XLE": "Energy",
        "XLF": "Financials",
        "XLK": "Technology",
        "XLV": "Healthcare",
        "XLI": "Industrials",
        "XLP": "Consumer Staples",
        "XLY": "Consumer Discretionary",
        "XLU": "Utilities",
        "XLRE": "Real Estate",
        "XLB": "Materials",
        "XLC": "Communication Svcs",
    }
    results = {}
    for ticker, name in sectors.items():
        try:
            t = yf.Ticker(ticker)
            info = t.info
            price = safe_float(info.get("regularMarketPrice"))
            prev = safe_float(info.get("regularMarketPreviousClose")) or safe_float(info.get("previousClose"))
            if price and prev and prev > 0:
                change_pct = round(((price - prev) / prev) * 100, 2)
                results[name] = change_pct
            time.sleep(0.5)
        except Exception:
            pass
    return results


def fetch_macro_data():
    """Pull all macro indicators. Returns a dict ready for DB insert."""
    print("Fetching macro indicators...")
    data = {}

    # --- VIX ---
    print("  VIX...")
    vix_meta = get_price_and_meta("^VIX")
    data["vix"] = vix_meta["price"]
    data["vix_prev_close"] = vix_meta["prev_close"]
    vix_chg, vix_pct = daily_change(data["vix"], vix_meta["prev_close"])
    data["vix_daily_change"] = vix_chg
    data["vix_daily_change_pct"] = vix_pct
    data["vix_signal"] = classify_vix(data["vix"])
    time.sleep(1.0)

    # --- Treasury yields ---
    print("  Treasury yields...")
    yields = get_yield_data()
    data.update(yields)
    y2 = yields.get("yield_2y")
    y10 = yields.get("yield_10y")
    data["spread_2s10s"] = round((y10 - y2) * 100, 1) if y2 and y10 else None
    data["yield_curve_signal"] = classify_yield_curve(data["spread_2s10s"])
    time.sleep(1.0)

    # --- Fed Funds proxy ---
    y3m = yields.get("yield_3m")
    data["fed_funds_proxy"] = y3m
    data["fed_funds_signal"] = classify_fed_proxy(y3m)

    # --- Oil ---
    print("  Oil (WTI)...")
    oil_meta = get_price_and_meta("CL=F")
    data["oil_wti"] = oil_meta["price"]
    data["oil_prev_close"] = oil_meta["prev_close"]
    oil_chg, oil_pct = daily_change(data["oil_wti"], oil_meta["prev_close"])
    data["oil_daily_change"] = oil_chg
    data["oil_daily_change_pct"] = oil_pct
    data["oil_signal"] = classify_oil(data["oil_wti"])
    time.sleep(1.0)

    # --- Gold (with 50-day MA) ---
    print("  Gold...")
    gold_meta = get_price_and_meta("GC=F")
    data["gold"] = gold_meta["price"]
    data["gold_prev_close"] = gold_meta["prev_close"]
    data["gold_50d_ma"] = gold_meta["fifty_day_ma"]
    gold_chg, gold_pct = daily_change(data["gold"], gold_meta["prev_close"])
    data["gold_daily_change"] = gold_chg
    data["gold_daily_change_pct"] = gold_pct
    # Gold signal: distance from 50-day MA
    if data["gold"] and data["gold_50d_ma"] and data["gold_50d_ma"] > 0:
        data["gold_ma_pct"] = round(((data["gold"] - data["gold_50d_ma"]) / data["gold_50d_ma"]) * 100, 2)
    else:
        data["gold_ma_pct"] = None
    data["gold_signal"] = classify_gold_ma(data["gold"], data["gold_50d_ma"])
    time.sleep(1.0)

    # --- DXY ---
    print("  DXY...")
    dxy_meta = get_price_and_meta("DX-Y.NYB")
    data["dxy"] = dxy_meta["price"]
    data["dxy_prev_close"] = dxy_meta["prev_close"]
    dxy_chg, dxy_pct = daily_change(data["dxy"], dxy_meta["prev_close"])
    data["dxy_daily_change"] = dxy_chg
    data["dxy_daily_change_pct"] = dxy_pct
    data["dxy_signal"] = classify_dxy(data["dxy"])
    time.sleep(1.0)

    # --- S&P 500 (triple signal) ---
    print("  S&P 500...")
    sp_meta = get_price_and_meta("^GSPC")
    data["sp500"] = sp_meta["price"]
    data["sp500_prev_close"] = sp_meta["prev_close"]
    data["sp500_50d_ma"] = sp_meta["fifty_day_ma"]
    sp_chg, sp_pct = daily_change(data["sp500"], sp_meta["prev_close"])
    data["sp500_daily_change"] = sp_chg
    data["sp500_daily_change_pct"] = sp_pct

    data["sp500_signal_static"] = classify_sp500_static(data["sp500"])
    data["sp500_signal_ma"] = classify_sp500_ma(data["sp500"], sp_meta["fifty_day_ma"])
    # YTD: S&P opened 2026 around 5881
    sp500_ytd_start = 5881
    if data["sp500"]:
        data["sp500_ytd_pct"] = round(((data["sp500"] - sp500_ytd_start) / sp500_ytd_start) * 100, 2)
    else:
        data["sp500_ytd_pct"] = None
    data["sp500_signal_ytd"] = classify_sp500_ytd(data["sp500"], sp500_ytd_start)
    # Overall S&P signal: worst of the three
    sp_signals = [data["sp500_signal_static"], data["sp500_signal_ma"], data["sp500_signal_ytd"]]
    if "red" in sp_signals:
        data["sp500_signal"] = "red"
    elif "yellow" in sp_signals:
        data["sp500_signal"] = "yellow"
    else:
        data["sp500_signal"] = "green"
    time.sleep(1.0)

    # --- Fear/greed estimate ---
    fg_score, fg_label = estimate_fear_greed(data["vix"])
    data["fear_greed_index"] = fg_score
    data["fear_greed_label"] = fg_label
    data["fear_greed_signal"] = classify_fear_greed(fg_score)

    # --- Mortgage rates (approximated from 10Y + spread) ---
    y10_val = yields.get("yield_10y")
    if y10_val:
        data["mortgage_30y"] = round(y10_val + 2.2, 2)
        data["mortgage_15y"] = round(y10_val + 1.5, 2)
    data["mortgage_signal"] = classify_mortgage(data.get("mortgage_30y"))

    # --- S&P Sector Performance ---
    print("  Sector performance...")
    sectors = get_sector_performance()
    data["sector_performance"] = sectors  # dict of {sector_name: daily_change_pct}

    # --- Overall market regime ---
    # Count red signals across key indicators
    key_signals = [
        data.get("vix_signal"),
        data.get("oil_signal"),
        data.get("sp500_signal"),
        data.get("fear_greed_signal"),
    ]
    red_count = sum(1 for s in key_signals if s == "red")
    yellow_count = sum(1 for s in key_signals if s == "yellow")

    if red_count >= 2:
        data["market_regime"] = "risk_off"
    elif red_count >= 1 or yellow_count >= 3:
        data["market_regime"] = "cautious"
    else:
        data["market_regime"] = "risk_on"

    print(f"  Done. Regime: {data['market_regime']}")
    return data


if __name__ == "__main__":
    data = fetch_macro_data()
    for k, v in sorted(data.items()):
        print(f"  {k}: {v}")
