import csv
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed, wait
from typing import Dict, List, Optional, Any

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, "equity_stocks.csv")


def load_all_symbols() -> List[Dict[str, str]]:
    stocks = []
    if not os.path.exists(CSV_PATH):
        return stocks
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            symbol = row.get("SYMBOL", "").strip()
            name = row.get("NAME OF COMPANY", "").strip()
            series = row.get("SERIES", row.get(" SERIES", "")).strip()
            if symbol and series == "EQ":
                stocks.append({"symbol": symbol, "name": name})
    return stocks


def _resolve(ticker: str) -> str:
    t = ticker.upper().strip()
    if t in ("^NSEI", "^BSESN", "^NSEBANK") or t.endswith(".NS") or t.endswith(".BO"):
        return t
    import re
    if re.match(r"^[A-Z0-9&.-]{1,20}$", t):
        return t + ".NS"
    safe = re.sub(r"[^A-Z0-9]", "", t)
    return safe + ".NS" if safe else t


def _fetch_batch(symbols: List[str], max_workers: int = 100, timeout: int = 30) -> List[Dict]:
    results = []
    batch_size = 500
    for start in range(0, len(symbols), batch_size):
        batch = symbols[start:start + batch_size]
        batch_results = _fetch_batch_parallel(batch, max_workers, timeout)
        results.extend(batch_results)
    return results


def _fetch_batch_parallel(symbols: List[str], max_workers: int, timeout: int) -> List[Dict]:
    if not symbols:
        return []
    import indmoney_api

    # Fetch all quotes in a single (or few) batched INDstocks calls.
    resolved = [_resolve(s) for s in symbols]
    quotes = indmoney_api.get_stock_data(resolved)

    results = []
    for sym, res in zip(symbols, resolved):
        try:
            d = quotes.get(res)
            if not d or not d.get("price"):
                continue
            price = d["price"]
            if price <= 0:
                continue

            score = calculate_score({
                "price": price,
                "change_pct": d.get("change_pct"),
                "volume": d.get("volume"),
                "avg_vol": d.get("avg_volume"),
                "pe": d.get("pe_ratio"),
                "market_cap": d.get("market_cap"),
                "high_52w": d.get("fifty_two_week_high"),
                "low_52w": d.get("fifty_two_week_low"),
                "day_high": d.get("high"),
                "day_low": d.get("low"),
                "div_yield": d.get("dividend_yield"),
                "beta": None,
                "roe": None,
                "profit_margin": None,
            })

            results.append({
                "symbol": sym,
                "name": d.get("company") or name_map.get(sym, ""),
                "price": round(price, 2) if price else None,
                "change": d.get("change"),
                "change_pct": d.get("change_pct"),
                "volume": d.get("volume"),
                "avg_volume": d.get("avg_volume"),
                "market_cap": d.get("market_cap"),
                "pe": round(d["pe_ratio"], 2) if d.get("pe_ratio") else None,
                "sector": "",
                "industry": "",
                "high_52w": round(d["fifty_two_week_high"], 2) if d.get("fifty_two_week_high") else None,
                "low_52w": round(d["fifty_two_week_low"], 2) if d.get("fifty_two_week_low") else None,
                "day_high": round(d["high"], 2) if d.get("high") else None,
                "day_low": round(d["low"], 2) if d.get("low") else None,
                "div_yield": None,
                "beta": None,
                "roe": None,
                "profit_margin": None,
                "score": round(score, 1),
            })
        except Exception:
            continue

    return results


def calculate_score(data: Dict) -> float:
    score = 0.0
    weights = {
        "momentum": 0,
        "volume": 0,
        "valuation": 0,
        "volatility_position": 0,
        "quality": 0,
    }

    change_pct = data.get("change_pct")
    if change_pct is not None:
        if change_pct > 5:
            score += 25
        elif change_pct > 2:
            score += 20
        elif change_pct > 0:
            score += 10
        elif change_pct > -2:
            score += 5

    volume = data.get("volume", 0) or 0
    avg_vol = data.get("avg_vol", 0) or 0
    if avg_vol > 0:
        vol_ratio = volume / avg_vol
        if vol_ratio > 3:
            score += 20
        elif vol_ratio > 2:
            score += 15
        elif vol_ratio > 1.5:
            score += 10
        elif vol_ratio > 0.5:
            score += 5

    pe = data.get("pe", 0) or 0
    if pe > 0:
        if pe < 15:
            score += 15
        elif pe < 25:
            score += 10
        elif pe < 50:
            score += 5
    else:
        score += 2

    high_52w = data.get("high_52w")
    low_52w = data.get("low_52w")
    price = data.get("price", 0) or 0
    if price and high_52w:
        dist_from_high = (high_52w - price) / high_52w
        if dist_from_high < 0.05:
            score += 20
        elif dist_from_high < 0.1:
            score += 15
        elif dist_from_high < 0.2:
            score += 10
        elif dist_from_high < 0.3:
            score += 5
    if price and low_52w and low_52w > 0:
        dist_from_low = (price - low_52w) / low_52w
        if dist_from_low > 2:
            score += 10

    market_cap = data.get("market_cap", 0) or 0
    if market_cap > 100_000_000_000:
        score += 10
    elif market_cap > 10_000_000_000:
        score += 5

    roe = data.get("roe", 0) or 0
    if roe > 15:
        score += 5
    elif roe > 10:
        score += 3

    profit_margin = data.get("profit_margin", 0) or 0
    if profit_margin > 15:
        score += 5
    elif profit_margin > 5:
        score += 3

    return score


def scan_top(
    min_score: float = 0,
    max_results: int = 50,
    min_price: float = 10,
    max_workers: int = 200,
    timeout: int = 180,
) -> Dict:
    start_time = time.time()
    all_stocks = load_all_symbols()
    symbols = [s["symbol"] for s in all_stocks]
    name_map = {s["symbol"]: s["name"] for s in all_stocks}

    raw_results = _fetch_batch(symbols, max_workers=max_workers, timeout=timeout)

    filtered = [r for r in raw_results if r["score"] >= min_score and (r.get("price") or 0) >= min_price]
    filtered.sort(key=lambda x: x["score"], reverse=True)
    top = filtered[:max_results]

    return {
        "total_symbols": len(symbols),
        "scanned": len(raw_results),
        "time_seconds": round(time.time() - start_time, 1),
        "results": top,
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Stock Scanner")
    parser.add_argument("--min-score", type=float, default=0, help="Minimum score filter")
    parser.add_argument("--max-results", type=int, default=50, help="Max results")
    parser.add_argument("--json", action="store_true", help="JSON output")
    args = parser.parse_args()

    result = scan_top(min_score=args.min_score, max_results=args.max_results)
    if args.json:
        print(json.dumps(result, indent=2, default=str))
    else:
        print(f"Scanned {result['scanned']}/{result['total_symbols']} stocks in {result['time_seconds']}s")
        print(f"{'Symbol':<16} {'Price':>8} {'Chg%':>7} {'Score':>6} {'Vol':>10} {'MktCap':>8} {'Sector'}")
        print("-" * 80)
        for r in result["results"]:
            chg = f"{r['change_pct']:+.1f}%" if r.get("change_pct") is not None else "N/A"
            vol = f"{r['volume']:,}" if r.get("volume") else "N/A"
            mc = ""
            if r.get("market_cap"):
                m = r["market_cap"]
                if m >= 1e12: mc = f"{m/1e12:.1f}T"
                elif m >= 1e9: mc = f"{m/1e9:.1f}B"
                elif m >= 1e6: mc = f"{m/1e6:.1f}M"
            sector = (r.get("sector") or "")[:20]
            print(f"{r['symbol']:<16} {r['price']:>8.2f} {chg:>7} {r['score']:>6.1f} {vol:>10} {mc:>8} {sector}")
