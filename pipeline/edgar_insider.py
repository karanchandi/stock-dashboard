"""
EDGAR Insider Trading Module
Pulls SEC Form 4 filings to identify insider buying/selling patterns.
"""
import urllib.request
import json
import xml.etree.ElementTree as ET
import time
import sys
import warnings
from datetime import datetime, timedelta

warnings.filterwarnings("ignore")

HEADERS = {
    "User-Agent": "StockValueScreener/1.0 contact@stockscreener.dev",
    "Accept": "application/json",
}

# CIK lookup cache
CIK_CACHE = {}


def get_cik(ticker):
    """Look up SEC CIK number for a ticker."""
    if ticker in CIK_CACHE:
        return CIK_CACHE[ticker]
    try:
        url = f"https://efts.sec.gov/LATEST/search-index?q=%22{ticker}%22&forms=4&dateRange=custom&startdt=2025-01-01&enddt=2026-12-31"
        req = urllib.request.Request(url, headers=HEADERS)
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())
        hits = data.get("hits", {}).get("hits", [])
        for hit in hits:
            source = hit.get("_source", {})
            names = source.get("display_names", [])
            ciks = source.get("ciks", [])
            for j, name in enumerate(names):
                if f"({ticker}" in name.upper() or f" {ticker} " in name.upper() or f" {ticker})" in name.upper():
                    if j < len(ciks):
                        CIK_CACHE[ticker] = ciks[j]
                        return ciks[j]
            # Fallback: use the company CIK (usually index 1, index 0 is the insider)
            if len(ciks) > 1:
                CIK_CACHE[ticker] = ciks[1]
                return ciks[1]
        return None
    except Exception:
        return None


def get_company_cik_from_tickers(ticker):
    """Use SEC company tickers JSON to look up CIK."""
    try:
        url = "https://www.sec.gov/files/company_tickers.json"
        req = urllib.request.Request(url, headers=HEADERS)
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())
        for entry in data.values():
            if entry.get("ticker", "").upper() == ticker.upper():
                cik = str(entry["cik_str"]).zfill(10)
                CIK_CACHE[ticker] = cik
                return cik
        return None
    except Exception:
        return None


# Load the CIK mapping once
_TICKER_CIK_MAP = None

def _load_cik_map():
    global _TICKER_CIK_MAP
    if _TICKER_CIK_MAP is not None:
        return _TICKER_CIK_MAP
    try:
        url = "https://www.sec.gov/files/company_tickers.json"
        req = urllib.request.Request(url, headers=HEADERS)
        resp = urllib.request.urlopen(req, timeout=20)
        data = json.loads(resp.read())
        _TICKER_CIK_MAP = {}
        for entry in data.values():
            t = entry.get("ticker", "").upper()
            cik = str(entry["cik_str"]).zfill(10)
            _TICKER_CIK_MAP[t] = cik
        return _TICKER_CIK_MAP
    except Exception:
        _TICKER_CIK_MAP = {}
        return _TICKER_CIK_MAP


def lookup_cik(ticker):
    """Fast CIK lookup from SEC ticker map."""
    cik_map = _load_cik_map()
    clean = ticker.upper().replace(".TO", "").replace(".AX", "").replace(".JO", "").replace(".L", "").replace(".HK", "").replace(".SI", "").replace(".V", "").replace(".DE", "")
    return cik_map.get(clean)


def fetch_insider_filings(cik, days_back=90):
    """Fetch recent Form 4 filings for a company from EDGAR."""
    if not cik:
        return []

    try:
        cik_clean = cik.lstrip("0") if isinstance(cik, str) else str(cik)
        url = f"https://data.sec.gov/submissions/CIK{cik.zfill(10)}.json"
        req = urllib.request.Request(url, headers=HEADERS)
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())

        recent = data.get("filings", {}).get("recent", {})
        forms = recent.get("form", [])
        dates = recent.get("filingDate", [])
        accessions = recent.get("accessionNumber", [])
        primary_docs = recent.get("primaryDocument", [])

        cutoff = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        filings = []

        for i, form in enumerate(forms):
            if form == "4" and i < len(dates) and dates[i] >= cutoff:
                filings.append({
                    "form": form,
                    "date": dates[i],
                    "accession": accessions[i] if i < len(accessions) else None,
                    "doc": primary_docs[i] if i < len(primary_docs) else None,
                })

        return filings
    except Exception:
        return []


def parse_form4_xml(cik, accession, doc):
    """Parse a Form 4 XML filing to extract transaction details."""
    if not accession or not doc:
        return None
    try:
        acc_formatted = accession.replace("-", "")
        # Strip XSL prefix (e.g. "xslF345X05/form4.xml" -> "form4.xml")
        raw_doc = doc.split("/")[-1] if "/" in doc else doc
        url = f"https://www.sec.gov/Archives/edgar/data/{cik.lstrip('0')}/{acc_formatted}/{raw_doc}"
        req = urllib.request.Request(url, headers=HEADERS)
        resp = urllib.request.urlopen(req, timeout=10)
        content = resp.read()

        root = ET.fromstring(content)
        ns = {"": "http://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000320193&type=4&dateb=&owner=include&count=40"}

        # Try without namespace
        reporter = root.find(".//reportingOwner/reportingOwnerId/rptOwnerName")
        reporter_name = reporter.text if reporter is not None else "Unknown"

        title_elem = root.find(".//reportingOwner/reportingOwnerRelationship/officerTitle")
        title = title_elem.text if title_elem is not None else ""

        is_director = root.find(".//reportingOwner/reportingOwnerRelationship/isDirector")
        is_officer = root.find(".//reportingOwner/reportingOwnerRelationship/isOfficer")

        role = title
        if not role:
            if is_director is not None and is_director.text == "1":
                role = "Director"
            elif is_officer is not None and is_officer.text == "1":
                role = "Officer"

        transactions = []
        for txn in root.findall(".//nonDerivativeTransaction"):
            code_elem = txn.find(".//transactionCoding/transactionCode")
            shares_elem = txn.find(".//transactionAmounts/transactionShares/value")
            price_elem = txn.find(".//transactionAmounts/transactionPricePerShare/value")
            acq_disp_elem = txn.find(".//transactionAmounts/transactionAcquiredDisposedCode/value")

            code = code_elem.text if code_elem is not None else ""
            shares = float(shares_elem.text) if shares_elem is not None else 0
            price = float(price_elem.text) if price_elem is not None and price_elem.text else 0
            acq_disp = acq_disp_elem.text if acq_disp_elem is not None else ""

            if code in ("P", "S"):  # P=Purchase, S=Sale
                transactions.append({
                    "type": "Buy" if code == "P" else "Sell",
                    "shares": shares,
                    "price": price,
                    "value": shares * price,
                    "acquired_disposed": acq_disp,
                })

        if transactions:
            return {
                "reporter": reporter_name,
                "title": role,
                "transactions": transactions,
            }
        return None
    except Exception:
        return None


def analyze_insider_activity(ticker, days_back=90, max_filings=15):
    """Analyze insider trading activity for a ticker."""
    cik = lookup_cik(ticker)
    if not cik:
        return None

    filings = fetch_insider_filings(cik, days_back)
    if not filings:
        return {"ticker": ticker, "cik": cik, "filing_count": 0,
                "buy_count": 0, "sell_count": 0, "net_shares": 0,
                "net_value": 0, "insider_score": None, "notable_buys": []}

    buy_count = 0
    sell_count = 0
    total_buy_value = 0
    total_sell_value = 0
    total_buy_shares = 0
    total_sell_shares = 0
    notable_buys = []
    unique_buyers = set()

    parsed = 0
    for filing in filings[:max_filings]:
        result = parse_form4_xml(cik, filing.get("accession"), filing.get("doc"))
        if result:
            parsed += 1
            for txn in result["transactions"]:
                if txn["type"] == "Buy":
                    buy_count += 1
                    total_buy_value += txn["value"]
                    total_buy_shares += txn["shares"]
                    unique_buyers.add(result["reporter"])
                    if txn["value"] > 50000:
                        notable_buys.append({
                            "insider": result["reporter"],
                            "title": result["title"],
                            "shares": txn["shares"],
                            "price": txn["price"],
                            "value": txn["value"],
                            "date": filing["date"],
                        })
                elif txn["type"] == "Sell":
                    sell_count += 1
                    total_sell_value += txn["value"]
                    total_sell_shares += txn["shares"]
        time.sleep(0.12)  # SEC rate limit: 10 req/sec

    net_value = total_buy_value - total_sell_value
    net_shares = total_buy_shares - total_sell_shares

    # Score insider activity (0-100)
    insider_score = 50  # neutral baseline
    if buy_count > 0 or sell_count > 0:
        buy_ratio = buy_count / (buy_count + sell_count) if (buy_count + sell_count) > 0 else 0.5
        insider_score = buy_ratio * 60  # 0-60 from ratio

        # Cluster buying bonus (multiple insiders buying)
        if len(unique_buyers) >= 3:
            insider_score += 20
        elif len(unique_buyers) >= 2:
            insider_score += 10

        # Large purchase bonus
        if total_buy_value > 1_000_000:
            insider_score += 15
        elif total_buy_value > 500_000:
            insider_score += 10
        elif total_buy_value > 100_000:
            insider_score += 5

        insider_score = min(100, max(0, insider_score))

    # No activity = neutral
    if buy_count == 0 and sell_count == 0:
        insider_score = None

    return {
        "ticker": ticker,
        "cik": cik,
        "filing_count": len(filings),
        "parsed_count": parsed,
        "buy_count": buy_count,
        "sell_count": sell_count,
        "unique_buyers": len(unique_buyers),
        "total_buy_value": round(total_buy_value, 2),
        "total_sell_value": round(total_sell_value, 2),
        "net_value": round(net_value, 2),
        "net_shares": round(net_shares, 2),
        "insider_score": round(insider_score, 2) if insider_score is not None else None,
        "notable_buys": sorted(notable_buys, key=lambda x: x["value"], reverse=True)[:5],
    }


def run_insider_scan(tickers):
    """Run insider analysis on a list of tickers. Returns dict keyed by ticker."""
    results = {}
    total = len(tickers)
    print(f"Scanning EDGAR insider filings for {total} US-listed tickers...")

    for i, ticker in enumerate(tickers):
        # Skip non-US tickers (EDGAR is US only)
        if any(suffix in ticker for suffix in [".TO", ".AX", ".JO", ".L", ".HK", ".SI", ".V", ".DE"]):
            continue

        pct = (i + 1) / total * 100
        sys.stdout.write(f"\r[{pct:5.1f}%] Insider scan: {ticker:<15} ({i+1}/{total})")
        sys.stdout.flush()

        data = analyze_insider_activity(ticker, days_back=90, max_filings=10)
        if data:
            results[ticker] = data

        time.sleep(0.15)

    print(f"\n  Insider data retrieved for {len(results)} US tickers")
    return results


if __name__ == "__main__":
    test = ["LEU", "XOM", "NTR", "AWK"]
    results = run_insider_scan(test)
    for t, d in results.items():
        print(f"\n{t}:")
        print(f"  Filings: {d['filing_count']}, Buys: {d['buy_count']}, Sells: {d['sell_count']}")
        print(f"  Buy value: ${d['total_buy_value']:,.0f}, Sell value: ${d['total_sell_value']:,.0f}")
        print(f"  Net: ${d['net_value']:,.0f}")
        print(f"  Insider Score: {d['insider_score']}")
        if d['notable_buys']:
            print("  Notable buys:")
            for b in d['notable_buys']:
                print(f"    {b['insider']} ({b['title']}): {b['shares']:.0f} @ ${b['price']:.2f} = ${b['value']:,.0f} on {b['date']}")
