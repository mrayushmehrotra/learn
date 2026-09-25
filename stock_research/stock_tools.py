import argparse
import contextlib
import io
import json
import logging
import re
import sys
import threading
import time
from typing import Dict, List, Optional

# Silence yfinance's noisy "Failed to retrieve the news" logger which
# spams the dashboard logs when bulk-scanning 500+ tickers.
logging.getLogger("yfinance").setLevel(logging.CRITICAL)
logging.getLogger("yfinance").propagate = False

try:
    import yfinance as yf
    # also silence the internal logger yfinance creates at import time
    logging.getLogger("yfinance").setLevel(logging.CRITICAL)
except ImportError:
    print("yfinance not installed. Run: pip install yfinance")
    sys.exit(1)

# Simple TTL cache for news so bulk scans don't hammer Yahoo.
_NEWS_CACHE: Dict[str, tuple[float, List[Dict]]] = {}
_NEWS_LOCK = threading.Lock()
_NEWS_TTL = 600  # seconds

INDIAN_INDICES = {"^NSEI", "^BSESN", "^NSEBANK"}

def _resolve_ticker(ticker: str) -> str:
    t = ticker.upper().strip()
    if t in INDIAN_INDICES or t.endswith(".NS") or t.endswith(".BO"):
        return t
    if re.match(r"^[A-Z0-9&.-]{1,20}$", t):
        return t + ".NS"
    safe = re.sub(r"[^A-Z0-9]", "", t)
    if safe:
        return safe + ".NS"
    return t


def get_stock_data(ticker: str) -> Optional[Dict]:
    """Real-time quote via the INDstocks (INDmoney) API instead of yfinance."""
    try:
        from indmoney_api import get_stock_data as _im_get_stock_data
        return _im_get_stock_data(ticker)
    except Exception:
        return None


def get_stock_news(ticker: str, max_articles: int = 10) -> List[Dict]:
    # INDstocks has no news endpoint; keep yfinance for news but never spam the
    # server log.  Results are cached for _NEWS_TTL to keep bulk scans fast.
    cache_key = f"{ticker}:{max_articles}"
    now = time.time()
    with _NEWS_LOCK:
        hit = _NEWS_CACHE.get(cache_key)
        if hit and now - hit[0] < _NEWS_TTL:
            return hit[1]

    # Silence yfinance which logs "Failed to retrieve the news ..." at ERROR
    # level for every ticker that has no news.  We capture both stdout/stderr
    # and temporarily raise the log level.
    yf_logger = logging.getLogger("yfinance")
    prev_level = yf_logger.level
    yf_logger.setLevel(logging.CRITICAL)
    try:
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            stock = yf.Ticker(ticker)
            news = stock.news or []
    except Exception:
        news = []
    finally:
        yf_logger.setLevel(prev_level)

    results: List[Dict] = []
    for article in (news or [])[:max_articles]:
        content = article.get("content", {})
        results.append({
            "title": content.get("title"),
            "publisher": content.get("provider", {}).get("displayName"),
            "link": (
                (content.get("clickThroughUrl") or {}).get("url")
                or (content.get("canonicalUrl") or {}).get("url")
            ),
            "summary": content.get("summary"),
            "pub_date": content.get("pubDate"),
            "type": content.get("contentType"),
            "thumbnail": (
                content.get("thumbnail", {}).get("originalUrl")
                if content.get("thumbnail")
                else None
            ),
        })

    with _NEWS_LOCK:
        _NEWS_CACHE[cache_key] = (now, results)
    return results


def format_data(data: Dict) -> str:
    symbol = data["symbol"].replace(".NS", "")
    company = data["company"]
    price = data["price"]
    change = data["change"]
    change_pct = data["change_pct"]
    sign = "+" if change is not None and change >= 0 else ""
    ccy = "₹" if data.get("currency") == "INR" else (data["currency"] or "")

    lines = [
        f"{symbol} - {company}",
        f"Price: {ccy}{price}",
        f"Change: {sign}{ccy}{change} ({sign}{change_pct}%)" if change is not None else "",
        f"Open: {ccy}{data['open']}  |  High: {ccy}{data['high']}  |  Low: {ccy}{data['low']}",
        f"Volume: {_fmt_num(data['volume'])}" if data["volume"] else "",
        f"Avg Volume: {_fmt_num(data['avg_volume'])}" if data["avg_volume"] else "",
        f"Market Cap: {_fmt_num(data['market_cap'])}" if data["market_cap"] else "",
        f"P/E: {data['pe_ratio']}" if data["pe_ratio"] else "",
        f"52W High: {ccy}{data['fifty_two_week_high']}  |  52W Low: {ccy}{data['fifty_two_week_low']}",
    ]
    return "\n".join(line for line in lines if line)


def _fmt_num(n):
    if n is None:
        return ""
    if n >= 1e12:
        return f"{n/1e12:.2f}T"
    if n >= 1e7:
        return f"{n/1e7:.2f}Cr"
    if n >= 1e5:
        return f"{n/1e5:.2f}L"
    return f"{n:,}"


def format_news(news: List[Dict]) -> str:
    if not news:
        return "No news available."
    lines = []
    for i, article in enumerate(news, 1):
        lines.append(f"{i}. {article['title']}")
        if article.get("publisher"):
            lines.append(f"   Publisher: {article['publisher']}")
        if article.get("pub_date"):
            lines.append(f"   Date: {article['pub_date']}")
        if article.get("summary"):
            import re
            clean = re.sub(r"<[^>]+>", "", article["summary"])
            lines.append(f"   {clean[:200]}{'...' if len(clean) > 200 else ''}")
        if article.get("link"):
            lines.append(f"   {article['link']}")
        lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Stock data and news via yfinance (Indian market)")
    parser.add_argument("ticker", help="Stock ticker (e.g. RELIANCE, TCS, HDFCBANK, ^NSEI)")
    parser.add_argument("--news", "-n", type=int, nargs="?", const=10, default=0,
                        help="Fetch news (optional: specify article count)")
    parser.add_argument("--json", "-j", action="store_true", help="Output as JSON")
    parser.add_argument("--bse", action="store_true", help="Use BSE suffix (.BO) instead of NSE")

    args = parser.parse_args()

    ticker = args.ticker.upper().strip()
    if args.bse and not ticker.endswith(".BO") and ticker not in INDIAN_INDICES:
        ticker = ticker.replace(".NS", "") + ".BO"

    data = get_stock_data(ticker)
    if not data:
        print(f"No data found for {ticker}")
        sys.exit(1)

    news = []
    if args.news:
        news = get_stock_news(ticker, args.news)

    if args.json:
        output = {"data": data, "news": news}
        print(json.dumps(output, indent=2, default=str))
    else:
        print(format_data(data))
        if news:
            print("\n--- News ---")
            print(format_news(news))
