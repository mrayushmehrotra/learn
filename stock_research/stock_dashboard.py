import argparse
import json
import os
import sys
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

import logging as _logging
# Prevent yfinance from flooding the server log with
# "Failed to retrieve the news ..." for every ticker during scans.
_logging.getLogger("yfinance").setLevel(_logging.CRITICAL)

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import datetime
import urllib.request
import xml.etree.ElementTree as ET

def _fetch_headlines(max_items: int = 8) -> list[str]:
    try:
        url = (
            "https://news.google.com/rss/search?"
            "q=stock+market+nifty+sensex+india+finance&hl=en-IN&gl=IN&ceid=IN:en"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            root = ET.fromstring(r.read().decode())
        items: list[str] = []
        for item in root.iter("item"):
            title_el = item.find("title")
            if title_el is not None and title_el.text:
                items.append(title_el.text)
            if len(items) >= max_items:
                break
        return items
    except Exception:
        return []

from stock_tools import get_stock_data, get_stock_news, _resolve_ticker
from concurrent.futures import ThreadPoolExecutor, as_completed, wait

import requests as _requests

import indmoney_api

NIFTY_50 = [
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR",
    "BHARTIARTL", "SBIN", "ITC", "LT", "KOTAKBANK", "BAJFINANCE",
    "WIPRO", "AXISBANK", "ADANIENT", "MARUTI", "TITAN", "ASIANPAINT",
    "HCLTECH", "ULTRACEMCO", "NTPC", "ONGC", "POWERGRID", "SUNPHARMA",
    "BAJAJFINSV",     "JSWSTEEL", "HINDALCO", "TATASTEEL",
    "ADANIPORTS", "GRASIM", "BRITANNIA", "DIVISLAB", "DRREDDY",
    "CIPLA", "APOLLOHOSP", "NESTLEIND", "COALINDIA", "BPCL",
    "SBILIFE", "EICHERMOT", "M&M", "HDFCLIFE", "TATACONSUM",
    "BAJAJ-AUTO", "INDUSINDBK", "HEROMOTOCO", "TRENT", "BEL",
]

_CSV_PATH = os.path.join(HERE, "equity_stocks.csv")
ALL_EQ_SYMBOLS = []
if os.path.exists(_CSV_PATH):
    try:
        import csv
        with open(_CSV_PATH) as f:
            for row in csv.DictReader(f):
                s = row.get("SYMBOL", "").strip()
                series = row.get("SERIES", row.get(" SERIES", "")).strip()
                if s and series == "EQ":
                    ALL_EQ_SYMBOLS.append(s)
    except Exception:
        pass
if not ALL_EQ_SYMBOLS:
    ALL_EQ_SYMBOLS = NIFTY_50[:]

_NIFTY200_CSV = os.path.join(HERE, "nifty200.csv")
NIFTY200_SYMBOLS = []
NIFTY200_NAMES = {}
if os.path.exists(_NIFTY200_CSV):
    try:
        import csv
        with open(_NIFTY200_CSV) as f:
            rows = list(csv.DictReader(f))
        sym_key = "Symbol" if rows and "Symbol" in rows[0] else "symbol" if rows and "symbol" in rows[0] else None
        name_key = "Company Name" if rows and "Company Name" in rows[0] else None
        if sym_key:
            for row in rows:
                s = row.get(sym_key, "").strip()
                if s:
                    NIFTY200_SYMBOLS.append(s)
                    if name_key:
                        NIFTY200_NAMES[s] = row.get(name_key, "").strip()
    except Exception:
        pass
if not NIFTY200_SYMBOLS:
    NIFTY200_SYMBOLS = NIFTY_50[:]
from backtest_tools import (
    run as run_backtest,
    compare_strategies,
    stock_of_the_day,
    STRATEGY_MAP,
    example_strategies,
    format_result_json,
)
from stock_scanner import scan_top

PORT = 9090

INDIAN_INDICES = {"^NSEI", "^BSESN", "^NSEBANK"}


def _safe(val, default=0.0):
    if val is None or (isinstance(val, float) and (np.isnan(val) or np.isinf(val))):
        return default
    return val


def _json_clean(obj):
    if isinstance(obj, float):
        return None if (np.isnan(obj) or np.isinf(obj)) else obj
    if isinstance(obj, (list, tuple)):
        return [_json_clean(v) for v in obj]
    if isinstance(obj, dict):
        return {k: _json_clean(v) for k, v in obj.items()}
    return obj


from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
_SENTIMENT = SentimentIntensityAnalyzer()

_POS_WORDS = {"surge", "jump", "rise", "gain", "bull", "bullish", "profit", "growth",
             "buy", "upgrade", "positive", "outperform", "beat", "strong", "record"}
_NEG_WORDS = {"fall", "drop", "decline", "bear", "bearish", "loss", "sell", "downgrade",
             "negative", "underperform", "miss", "weak", "cut", "slump", "crash"}


def _keyword_sentiment(text: str) -> float:
    text_lower = text.lower()
    pos = sum(1 for w in _POS_WORDS if w in text_lower)
    neg = sum(1 for w in _NEG_WORDS if w in text_lower)
    total = pos + neg
    if total == 0:
        return 0.0
    return (pos - neg) / total


# When bulk-scanning 500+ tickers, skip Yahoo news (no INDstocks
# news endpoint exists and yfinance spams the log).  Single-ticker
# quote/news endpoints still fetch news normally.
_BULK_SCAN = False

_CATALYST_WORDS = (
    "order", "orders", "contract", "win", "wins", "bulk deal", "allot", "allotment",
    "approval", "approved", "partnership", "tie-up", "tie up", "secured", "secures",
    "receives", "bag", "billion", "million", "expansion", "acquisition", "acquires",
    "merger", "investment", "stake", "deal", "signed", "supply", "export", "upgrade",
    "rating", "subsidiary", "capex", "ipo", "inauguration", "record",
)


def _catalyst_news(ticker: str):
    if _BULK_SCAN:
        return 0.0, None
    try:
        news = get_stock_news(ticker + ".NS", 5)
        for article in news:
            title = article.get("title") or ""
            tl = title.lower()
            if not any(w in tl for w in _CATALYST_WORDS):
                continue
            vs = _SENTIMENT.polarity_scores(title)
            if vs["compound"] > 0.1 or _keyword_sentiment(title) > 0:
                return 1.0, title
        return 0.0, None
    except Exception:
        return 0.0, None


def _news_signal(ticker: str):
    if _BULK_SCAN:
        return 0.0, 0.0, None
    try:
        news = get_stock_news(ticker + ".NS", 5)
        if not news:
            return 0.0, 0.0, None
        scores = []
        for article in news:
            title = article.get("title", "")
            try:
                vs = _SENTIMENT.polarity_scores(title)
                scores.append(vs["compound"])
            except Exception:
                scores.append(_keyword_sentiment(title))
        sent = float(np.mean(scores))
        for article in news:
            title = article.get("title") or ""
            tl = title.lower()
            if not any(w in tl for w in _CATALYST_WORDS):
                continue
            vs = _SENTIMENT.polarity_scores(title)
            if vs["compound"] > 0.1 or _keyword_sentiment(title) > 0:
                return sent, 1.0, title
        return sent, 0.0, None
    except Exception:
        return 0.0, 0.0, None


def _sentiment_score(ticker: str) -> float:
    if _BULK_SCAN:
        return 0.0
    try:
        news = get_stock_news(ticker + ".NS", 5)
        if not news:
            return 0.0
        scores = []
        for article in news:
            title = article.get("title", "")
            try:
                vs = _SENTIMENT.polarity_scores(title)
                scores.append(vs["compound"])
            except Exception:
                scores.append(_keyword_sentiment(title))
        return float(np.mean(scores)) if scores else 0.0
    except Exception:
        return 0.0


def _ema_score(close: pd.Series) -> float:
    ema9 = close.ewm(span=9).mean().iloc[-1]
    ema21 = close.ewm(span=21).mean().iloc[-1]
    ema50 = close.ewm(span=50).mean().iloc[-1]
    if pd.isna(ema9) or pd.isna(ema21) or pd.isna(ema50):
        return 0.5
    if ema9 > ema21 > ema50:
        return 1.0
    if ema9 > ema21 and ema21 > ema50 * 0.98:
        return 0.8
    if ema9 < ema21 < ema50:
        return 0.0
    if ema9 < ema21 and ema21 < ema50 * 1.02:
        return 0.2
    return 0.5


def _vwap_distance(close: pd.Series, high: pd.Series, low: pd.Series, volume: pd.Series) -> tuple:
    typical = (high + low + close) / 3
    vwap_series = (typical * volume).cumsum() / volume.cumsum()
    vwap_today = float(_safe(vwap_series.iloc[-1], typical.iloc[-1]))
    price = float(close.iloc[-1])
    dist = (price / vwap_today - 1) * 100
    return dist, vwap_today


def _run_scan(scan_fn, top_n, timeout_sec=60, tickers=None):
    global _BULK_SCAN
    picks = []
    if tickers is None:
        tickers = NIFTY_50
    # Prime the INDstocks quote cache in one batched request so per-symbol scans
    # hit the cache instead of hammering the API with hundreds of requests.
    try:
        indmoney_api.get_stock_data([_resolve_ticker(t) for t in tickers])
    except Exception:
        pass
    _BULK_SCAN = True
    workers = min(30, len(tickers))
    try:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(scan_fn, t): t for t in tickers}
            done, _ = wait(futures, timeout=timeout_sec)
            for f in done:
                r = f.result()
                if r:
                    picks.append(r)
    finally:
        _BULK_SCAN = False
    picks.sort(key=lambda x: x.get("score", 0) or 0, reverse=True)
    return picks[:top_n]


_NIFTY_DATA = None


def _get_nifty_ret_5d() -> float:
    global _NIFTY_DATA
    if _NIFTY_DATA is None:
        _NIFTY_DATA = indmoney_api.get_history("^NSEI", interval="1d", period="1mo")
    if _NIFTY_DATA.empty or len(_NIFTY_DATA) < 6:
        return 0.0
    if isinstance(_NIFTY_DATA.columns, pd.MultiIndex):
        _NIFTY_DATA.columns = _NIFTY_DATA.columns.get_level_values(0)
    nc = _NIFTY_DATA["Close"]
    return (float(nc.iloc[-1]) / float(nc.iloc[-6]) - 1) * 100


def _scan_intraday(t):
    try:
        sd = get_stock_data(t + ".NS")
        if not sd or sd.get("price") is None:
            return None
        price = sd["price"]
        gap_pct = ((sd.get("open") or price) / sd["prev_close"] - 1) * 100

        df = indmoney_api.get_history(t + ".NS", interval="1d", period="3mo")
        if df.empty or len(df) < 20:
            return None
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        close = df["Close"]
        high = df["High"]
        low = df["Low"]
        volume = df["Volume"]

        vol_14 = volume.rolling(14).mean().iloc[-1]
        rvol = float(volume.iloc[-1] / vol_14) if vol_14 > 0 else 1.0

        delta = close.diff()
        gain = delta.where(delta > 0, 0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / loss
        rsi_series = 100 - (100 / (1 + rs))
        current_rsi = float(rsi_series.iloc[-1]) if not pd.isna(rsi_series.iloc[-1]) else 50

        tr = pd.concat([high - low, (high - close.shift()).abs(), (low - close.shift()).abs()], axis=1).max(axis=1)
        atr = float(_safe(tr.rolling(14).mean().iloc[-1]))
        atr_pct = (atr / float(close.iloc[-1])) * 100 if float(close.iloc[-1]) > 0 else 0

        ema_align = _ema_score(close)
        ema20 = float(close.ewm(span=20).mean().iloc[-1])
        ema50 = float(close.ewm(span=50).mean().iloc[-1])

        typical = (high + low + close) / 3
        vwap_series = (typical * volume).cumsum() / volume.cumsum()
        vwap = float(_safe(vwap_series.iloc[-1], typical.iloc[-1]))
        vwap_prev = float(_safe(vwap_series.iloc[-2], vwap))
        vwap_rising = vwap > vwap_prev
        vwap_dist = _safe((float(close.iloc[-1]) / vwap - 1) * 100 if vwap else 0)

        prev_high = float(high.iloc[-2]) if len(high) >= 2 else float(high.max())
        prev_low = float(low.iloc[-2]) if len(low) >= 2 else float(low.min())
        day_high = float(sd.get("high") or price)
        day_low = float(sd.get("low") or price)
        swing_low = min(day_low, prev_low)

        nifty_ret = _get_nifty_ret_5d()
        stock_5d_ret = (float(close.iloc[-1]) / float(close.iloc[-6]) - 1) * 100 if len(close) >= 6 else 0
        rel_strength = stock_5d_ret - nifty_ret

        sent, catalyst, news_title = _news_signal(t)

        rvol_score = _safe(min(rvol / 3, 1))
        atr_score = _safe(min(atr_pct / 4, 1))
        gap_score = _safe(min(abs(gap_pct) / 3, 1))
        vwap_near = _safe(1 - min(abs(vwap_dist) / 2, 1))
        rsi_score = _safe(1 - abs(current_rsi - 50) / 50)
        rs_score = _safe(min(max((rel_strength + 5) / 10, 0), 1))
        sent_score = _safe((sent + 1) / 2)
        catalyst_score = catalyst * (1.0 if sent >= 0 else 0.5)

        score = round(
            rvol_score * 15 +
            atr_score * 5 +
            gap_score * 10 +
            ema_align * 15 +
            vwap_near * 10 +
            rsi_score * 10 +
            rs_score * 10 +
            sent_score * 5 +
            catalyst_score * 20,
            1,
        )

        # --- Institutional Intraday Momentum Strategy v1.0 ---
        entry_price = float(price)
        r_atr = 0.8 * atr
        r_vwap = max(entry_price - vwap, 0)
        r_swing = max(entry_price - swing_low, 0)
        R = max(r_atr, r_vwap, r_swing) or (price * 0.01)
        stop_loss = entry_price - R
        target_1 = entry_price + R
        target_2 = entry_price + 2 * R
        target_3 = max(entry_price + 3 * R, prev_high)
        risk_reward = (target_2 - entry_price) / R if R else 0

        conf = 0.0
        if ema20 > ema50 and price > ema20:
            conf += 20
        elif ema20 > ema50:
            conf += 10
        if price > vwap and vwap_rising:
            conf += 15
        elif price > vwap:
            conf += 8
        if price > ema20:
            conf += 10
        if rel_strength > 0.5:
            conf += 15
        elif rel_strength > 0:
            conf += 7
        if rvol > 2.0:
            conf += 15
        elif rvol > 1.5:
            conf += 10
        elif rvol > 1.0:
            conf += 5
        if 1.0 <= atr_pct <= 4.0:
            conf += 10
        elif atr_pct > 0.5:
            conf += 5
        if day_high > day_low and (price - day_low) / (day_high - day_low) > 0.5:
            conf += 10
        conf += 2.5
        if risk_reward >= 2:
            conf += 10
        elif risk_reward >= 1.5:
            conf += 5
        if catalyst and sent >= 0:
            conf += 10
        conf = round(min(conf, 100), 1)

        if gap_pct > 5 or (0 < gap_pct < 0.5):
            conf = min(conf, 69)
        if conf >= 85:
            signal = "BUY"
        elif conf >= 70:
            signal = "WATCH"
        else:
            signal = "NO_TRADE"

        return {
            "ticker": t,
            "price": round(price, 2),
            "signal": signal,
            "confidence": conf,
            "entry": round(entry_price, 2),
            "stop_loss": round(stop_loss, 2),
            "target_1": round(target_1, 2),
            "target_2": round(target_2, 2),
            "target_3": round(target_3, 2),
            "risk_reward": round(risk_reward, 2),
            "gap_pct": round(gap_pct, 2),
            "rvol": round(rvol, 2),
            "atr_pct": round(atr_pct, 2),
            "rsi": round(_safe(current_rsi, 50), 1),
            "ema": round(ema_align, 2),
            "vwap_dist": round(vwap_dist, 2),
            "rel_str": round(rel_strength, 2),
            "sent": round(sent, 2),
            "news": news_title,
            "catalyst": round(catalyst_score, 2),
            "score": score if not (isinstance(score, float) and np.isnan(score)) else 0,
            "change_pct": _safe(sd.get("change_pct")),
        }
    except Exception:
        return None


def _intraday_picks(top_n=15):
    _get_nifty_ret_5d()
    tickers = ALL_EQ_SYMBOLS[:500]
    return _run_scan(_scan_intraday, top_n, timeout_sec=300, tickers=tickers)


def _midterm_picks(strategy, start, movement_min, movement_max, top_n=10):
    return stock_of_the_day(
        start=start, strategy=strategy,
        movement_min=movement_min, movement_max=movement_max,
    )


def _scan_swing(t):
    try:
        sd = get_stock_data(t + ".NS")
        if not sd or sd.get("price") is None or sd["price"] < 20:
            return None
        price = sd["price"]
        df = indmoney_api.get_history(t + ".NS", interval="1d", period="6mo")
        if df.empty or len(df) < 60:
            return None
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        close = df["Close"]
        avg_6mo = float(close.mean())
        gain_pct = (price / avg_6mo - 1) * 100

        high = df["High"]
        low = df["Low"]
        volume = df["Volume"]
        tr = pd.concat([high - low, (high - close.shift()).abs(), (low - close.shift()).abs()], axis=1).max(axis=1)
        atr = float(_safe(tr.rolling(14).mean().iloc[-1]))
        atr_pct = (atr / float(close.iloc[-1])) * 100 if float(close.iloc[-1]) > 0 else 0

        vol_ratio = float(volume.iloc[-1]) / float(_safe(volume.tail(20).mean(), 1))

        delta = close.diff()
        gain = delta.where(delta > 0, 0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / loss
        rsi_series = 100 - (100 / (1 + rs))
        current_rsi = float(rsi_series.iloc[-1]) if not pd.isna(rsi_series.iloc[-1]) else 50

        dist_from_ideal = abs(gain_pct - 35)
        swing_score = max(0, 100 - dist_from_ideal * 2.5)
        vol_score = _safe(min(vol_ratio / 2, 1)) * 10
        atr_bonus = _safe(min(atr_pct / 3, 1)) * 10
        rsi_ok = 10 if 30 <= current_rsi <= 80 else 0

        score = round(swing_score + vol_score + atr_bonus + rsi_ok, 1)

        return {
            "ticker": t,
            "price": round(price, 2),
            "avg_6mo": round(avg_6mo, 2),
            "gain_pct": round(gain_pct, 2),
            "atr_pct": round(atr_pct, 2),
            "rsi": round(current_rsi, 1),
            "vol_ratio": round(vol_ratio, 2),
            "score": score if not (isinstance(score, float) and np.isnan(score)) else 0,
            "change_pct": _safe(sd.get("change_pct")),
        }
    except Exception:
        return None


def _swing_picks(top_n=15):
    return _run_scan(_scan_swing, top_n, timeout_sec=120, tickers=NIFTY_50)


_NSE_SESSION = threading.local()


def _get_nse_session():
    if not hasattr(_NSE_SESSION, "session") or _NSE_SESSION.session is None:
        s = _requests.Session()
        s.headers.update({
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        })
        s.get("https://www.nseindia.com/", timeout=15)
        _NSE_SESSION.session = s
    return _NSE_SESSION.session


def _fetch_large_deals():
    try:
        ses = _get_nse_session()
        r = ses.get(
            "https://www.nseindia.com/api/snapshot-capital-market-largedeal",
            timeout=15,
            headers={"Referer": "https://www.nseindia.com/market-data/large-deals"},
        )
        if r.status_code != 200:
            return None
        data = r.json()
        out = {"as_on_date": data.get("as_on_date", "")}
        for key, label in [("BULK_DEALS_DATA", "Bulk Deals"), ("BLOCK_DEALS_DATA", "Block Deals")]:
            deals = data.get(key, [])
            for d in deals:
                d["category"] = label
            out[key] = deals
        all_symbols = list({d["symbol"] for k in ("BULK_DEALS_DATA", "BLOCK_DEALS_DATA") for d in data.get(k, [])})
        out["symbols"] = all_symbols
        return out
    except Exception:
        return None


def _fetch_option_snapshot(symbol):
    try:
        ses = _get_nse_session()
        r = ses.get(
            "https://www.nseindia.com/api/option-chain-equities?symbol=" + symbol,
            timeout=15,
            headers={"Referer": "https://www.nseindia.com/option-chain"},
        )
        if r.status_code != 200:
            return None
        data = r.json()
        records = data.get("records", {})
        chain = records.get("data") or []
        underlying = records.get("underlyingValue") or 0
        if not chain:
            return None
        expiry = chain[0].get("expiryDate", "")
        best = None
        if underlying:
            best = min(chain, key=lambda c: abs((c.get("strikePrice") or 0) - float(underlying)))
        else:
            best = chain[0]
        strike = best.get("strikePrice") or 0
        ce = best.get("CE") or {}
        pe = best.get("PE") or {}
        return {
            "underlying": round(float(underlying), 2) if underlying else None,
            "expiry": expiry,
            "strike": strike,
            "ce_premium": _safe(ce.get("lastPrice")),
            "pe_premium": _safe(pe.get("lastPrice")),
            "ce_oi": _safe(ce.get("openInterest")),
            "pe_oi": _safe(pe.get("openInterest")),
            "ce_iv": round(float(_safe(ce.get("impliedVolatility"), 0)) * 100, 2) if ce.get("impliedVolatility") else None,
            "pe_iv": round(float(_safe(pe.get("impliedVolatility"), 0)) * 100, 2) if pe.get("impliedVolatility") else None,
            "ce_change": _safe(ce.get("changeinOpenInterest")),
            "pe_change": _safe(pe.get("changeinOpenInterest")),
        }
    except Exception:
        return None


def _rsi_series(close, period=14):
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = (-delta.clip(upper=0))
    if loss.sum() == 0:
        return pd.Series(100.0, index=close.index)
    avg_gain = gain.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def _scan_vwap_ema(t, name=""):
    """
    VWAP EMA Crossover scanner on NIFTY 200 intraday bars.

    - Default VWAP (volume-weighted typical price, session anchored)
    - Fast 9-period EMA of the close
    A stock is surfaced when VWAP crosses the 9 EMA:
      - Golden cross: VWAP crossed from below to above the 9 EMA (bullish)
      - Death cross:  VWAP crossed from above to below the 9 EMA (bearish)
    """
    try:
        df = indmoney_api.get_history(t + ".NS", interval="5m", period="5d")
        if df.empty or len(df) < 30:
            return None
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        close = df["Close"]
        high = df["High"]
        low = df["Low"]
        volume = df["Volume"].replace(0, 1)

        # Daily-anchored VWAP (session VWAP) — must reset each trading day.
        # The old code used a 5-day cumulative VWAP which understated today's
        # VWAP by ~10-15 pts (e.g. MUTHOOTFIN 2924 vs true 2935).
        latest_date = df.index[-1].date()
        # continuous 9 EMA (not anchored)
        ema9_series = close.ewm(span=9, adjust=False).mean()
        # daily VWAP series for the latest session only
        mask_today = df.index.date == latest_date
        # fallback to full frame if today's slice is too small (e.g. pre-open)
        if int(mask_today.sum()) < 2:
            typical = (high + low + close) / 3
            vwap_series = (typical * volume).cumsum() / volume.cumsum()
            vwap_today_series = vwap_series[mask_today]
        else:
            typical_today = (high[mask_today] + low[mask_today] + close[mask_today]) / 3
            vol_today = volume[mask_today]
            vwap_today_series = (typical_today * vol_today).cumsum() / vol_today.cumsum()
            # build a diff series aligned to full df for crossover check: use
            # daily VWAP for today, NaN before
            vwap_series = vwap_today_series

        if len(vwap_today_series) < 2:
            return None

        # Use daily VWAP vs continuous EMA9 for crossover
        vwap_prev = float(vwap_today_series.iloc[-2])
        vwap_cur = float(vwap_today_series.iloc[-1])
        ema9_prev = float(ema9_series.iloc[-2])
        ema9_cur = float(ema9_series.iloc[-1])
        prev_diff = vwap_prev - ema9_prev
        cur_diff = vwap_cur - ema9_cur

        # Cross detection: sign change between the two most recent bars
        golden = prev_diff <= 0 < cur_diff
        death = prev_diff >= 0 > cur_diff
        holding_bull = cur_diff > 0
        holding_bear = cur_diff < 0

        if not (golden or death or holding_bull or holding_bear):
            return None

        price = float(close.iloc[-1])
        vwap = float(vwap_series.iloc[-1])
        ema9 = float(ema9_series.iloc[-1])
        diff_pct = (cur_diff / price) * 100 if price else 0

        if golden:
            signal = "GOLDEN_CROSS"
            bias = "bullish"
            strength = 100
        elif death:
            signal = "DEATH_CROSS"
            bias = "bearish"
            strength = 100
        elif holding_bull:
            signal = "HOLDING_ABOVE"
            bias = "bullish"
            strength = 70
        else:
            signal = "HOLDING_BELOW"
            bias = "bearish"
            strength = 70

        # ATR for a quick reference stop / risk reading
        tr = pd.concat(
            [
                high - low,
                (high - close.shift()).abs(),
                (low - close.shift()).abs(),
            ],
            axis=1,
        ).max(axis=1)
        atr = float(tr.rolling(14).mean().iloc[-1])
        if pd.isna(atr) or atr <= 0:
            atr = price * 0.01

        return {
            "ticker": t,
            "name": name,
            "price": round(price, 2),
            "vwap": round(vwap, 2),
            "ema9": round(ema9, 2),
            "diff_pct": round(diff_pct, 3),
            "signal": signal,
            "bias": bias,
            "strength": strength,
            "atr": round(atr, 2),
        }
    except Exception:
        return None


def _vwap_ema_picks(signal_filter="ALL", top_n=30, options_only: bool = True):
    tickers = NIFTY200_SYMBOLS
    # User wants VWAP+EMA9 for option-enabled Nifty 200 only — filter via
    # IndMoney F&O master (OPTSTK/FUTSTK). Falls back to full Nifty 200 if
    # F&O fetch fails.
    if options_only:
        try:
            filtered = indmoney_api.filter_option_enabled(tickers)
            if filtered:
                tickers = filtered
        except Exception:
            pass
    # Fill missing company names from the INDstocks instruments master (the
    # nifty200.csv only contains symbols, so names come from here).
    if not NIFTY200_NAMES:
        try:
            NIFTY200_NAMES.update(indmoney_api.instrument_names(tickers))
        except Exception:
            pass
    else:
        # also fill any missing names for filtered tickers
        try:
            missing = [t for t in tickers if t not in NIFTY200_NAMES]
            if missing:
                NIFTY200_NAMES.update(indmoney_api.instrument_names(missing))
        except Exception:
            pass
    workers = min(30, len(tickers))
    picks = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_scan_vwap_ema, t, NIFTY200_NAMES.get(t, "")): t for t in tickers}
        done, _ = wait(futures, timeout=180)
        for f in done:
            r = f.result()
            if not r:
                continue
            if signal_filter == "ALL" or r["signal"] == signal_filter:
                picks.append(r)
    order = {
        "GOLDEN_CROSS": 0,
        "HOLDING_ABOVE": 1,
        "DEATH_CROSS": 2,
        "HOLDING_BELOW": 3,
    }
    picks.sort(key=lambda x: order.get(x.get("signal"), 9))
    return picks[:top_n]


class DashboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=HERE, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        if path == "/api/quote":
            self._handle_quote(params)
        elif path == "/api/news":
            self._handle_news(params)
        elif path == "/api/backtest":
            self._handle_backtest(params)
        elif path == "/api/compare":
            self._handle_compare(params)
        elif path == "/api/stock-of-day":
            self._handle_stock_of_day(params)
        elif path == "/api/strategies":
            self._send_json(example_strategies())
        elif path == "/api/bullish-news":
            self._handle_bullish_news()
        elif path == "/api/large-deals":
            self._handle_large_deals()
        elif path == "/api/market-overview":
            self._handle_market_overview()
        elif path == "/api/vwap-scanner":
            self._handle_vwap_scanner(params)
        elif path == "/api/nifty200-rsi":
            self._handle_nifty200_rsi()
        elif path == "/api/vwap-ema":
            self._handle_vwap_ema(params)
        elif path == "/api/strategy-docs":
            self._handle_strategy_docs(params)
        elif path == "/api/sol-chart":
            self._handle_sol_chart(params)
        elif path == "/":
            self._serve_file("stock_dashboard.html")
        else:
            super().do_GET()

    def _serve_file(self, filename):
        filepath = os.path.join(HERE, filename)
        if not os.path.exists(filepath):
            self.send_error(404)
            return
        ext = filename.split(".")[-1]
        types = {"html": "text/html", "css": "text/css", "js": "application/javascript"}
        self.send_response(200)
        self.send_header("Content-Type", types.get(ext, "text/plain"))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        with open(filepath, "rb") as f:
            self.wfile.write(f.read())

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(_json_clean(data), indent=2, default=str).encode())

    def _get_param(self, params, key, default=None):
        vals = params.get(key, [])
        return vals[0] if vals else default

    def _get_float(self, params, key, default=None):
        v = self._get_param(params, key)
        if v is None:
            return default
        try:
            return float(v)
        except (ValueError, TypeError):
            return default

    def _handle_quote(self, params):
        ticker = self._get_param(params, "ticker", "").upper()
        if not ticker:
            self._send_json({"error": "Missing ticker parameter"}, 400)
            return
        resolved = _resolve_ticker(ticker)
        data = get_stock_data(resolved)
        if not data:
            self._send_json({"error": f"No data for {ticker}"}, 404)
            return
        self._send_json(data)

    def _handle_news(self, params):
        ticker = self._get_param(params, "ticker", "").upper()
        count = int(self._get_param(params, "count", "10"))
        if not ticker:
            self._send_json({"error": "Missing ticker parameter"}, 400)
            return
        resolved = _resolve_ticker(ticker)
        news = get_stock_news(resolved, count)
        self._send_json({"ticker": ticker, "resolved": resolved, "news": news})

    def _handle_backtest(self, params):
        ticker = self._get_param(params, "ticker", "").upper()
        strategy = self._get_param(params, "strategy", "ma_crossover")
        start = self._get_param(params, "start", "1y")
        stop_loss = self._get_float(params, "stop_loss")
        trailing_stop = self._get_float(params, "trailing_stop")

        if not ticker:
            self._send_json({"error": "Missing ticker parameter"}, 400)
            return
        if strategy not in STRATEGY_MAP:
            self._send_json(
                {"error": f"Unknown strategy. Choose: {', '.join(STRATEGY_MAP.keys())}"}, 400
            )
            return

        try:
            resolved = _resolve_ticker(ticker)
            result = run_backtest(
                ticker=resolved, strategy=strategy, start=start,
                stop_loss_pct=stop_loss, trailing_stop_pct=trailing_stop,
            )
            data = format_result_json(result)
            data["strategy"] = strategy
            data["ticker"] = ticker
            data["resolved"] = resolved
            self._send_json(data)
        except Exception as e:
            self._send_json({"error": str(e)}, 500)

    def _handle_compare(self, params):
        ticker = self._get_param(params, "ticker", "").upper()
        start = self._get_param(params, "start", "1y")
        stop_loss = self._get_float(params, "stop_loss")
        trailing_stop = self._get_float(params, "trailing_stop")

        if not ticker:
            self._send_json({"error": "Missing ticker parameter"}, 400)
            return

        try:
            resolved = _resolve_ticker(ticker)
            results = compare_strategies(
                ticker=resolved, start=start,
                stop_loss_pct=stop_loss, trailing_stop_pct=trailing_stop,
            )
            self._send_json({"ticker": ticker, "resolved": resolved, "strategies": results})
        except Exception as e:
            self._send_json({"error": str(e)}, 500)

    def _handle_stock_of_day(self, params):
        mode = self._get_param(params, "mode", "midterm")

        try:
            if mode == "intraday":
                picks = _intraday_picks()
                self._send_json({"mode": "intraday", "picks": picks})
            elif mode == "swing":
                picks = _swing_picks()
                self._send_json({"mode": "swing", "picks": picks})
            elif mode == "options":
                self._send_json({"mode": "options", "picks": [], "info": "Deprecated — use swing mode instead"})
            else:
                strategy = self._get_param(params, "strategy", "sma_50_trend")
                start = self._get_param(params, "start", "1y")
                movement_min = self._get_float(params, "movement_min", 10)
                movement_max = self._get_float(params, "movement_max", 30)
                top = stock_of_the_day(
                    start=start, strategy=strategy,
                    movement_min=movement_min, movement_max=movement_max,
                )
                self._send_json({"mode": "midterm", "strategy": strategy, "movement_filter": f"{movement_min}%-{movement_max}%", "picks": top})
        except Exception as e:
            self._send_json({"error": str(e)}, 500)

    def _handle_bullish_news(self):
        try:
            gainers = []
            with ThreadPoolExecutor(max_workers=10) as pool:
                futures = {pool.submit(get_stock_data, t + ".NS"): t for t in NIFTY_50}
                for fut in as_completed(futures):
                    t = futures[fut]
                    try:
                        d = fut.result()
                        if d and d.get("change_pct") is not None and d["change_pct"] > 0:
                            gainers.append((t, d["change_pct"], d["price"]))
                    except Exception:
                        pass
            gainers.sort(key=lambda x: x[1], reverse=True)
            top = gainers[:8]
            all_news = []
            for t, chg, price in top:
                try:
                    news = get_stock_news(t + ".NS", 3)
                    all_news.append({"ticker": t, "change_pct": chg, "price": price, "news": news})
                except Exception:
                    pass
            self._send_json({"gainers": all_news})
        except Exception as e:
            self._send_json({"error": str(e)}, 500)

    def _handle_large_deals(self):
        try:
            data = _fetch_large_deals()
            if not data:
                self._send_json({"error": "Could not fetch large deals data"}, 502)
                return
            news_map = {}
            if data.get("symbols"):
                with ThreadPoolExecutor(max_workers=10) as pool:
                    futures = {pool.submit(get_stock_news, s + ".NS", 3): s for s in data["symbols"]}
                    for fut in as_completed(futures):
                        s = futures[fut]
                        try:
                            news = fut.result()
                            if news:
                                news_map[s] = news
                        except Exception:
                            pass
            data["news"] = news_map
            self._send_json(data)
        except Exception as e:
            self._send_json({"error": str(e)}, 500)

    def _handle_market_overview(self):
        try:
            indices = {}
            for sym, label in [("^NSEI", "NIFTY 50"), ("^BSESN", "SENSEX")]:
                data = get_stock_data(sym)
                if data:
                    indices[label] = {
                        "price": data["price"], "change": data["change"],
                        "change_pct": data["change_pct"], "prev_close": data["prev_close"],
                    }
            headlines = _fetch_headlines(8)
            self._send_json({"indices": indices, "headlines": headlines})
        except Exception as e:
            self._send_json({"error": str(e)}, 500)

    def _handle_scanner(self, params):
        try:
            min_score = self._get_float(params, "min_score", 0)
            max_results = int(self._get_param(params, "max_results", "100"))
            min_price = self._get_float(params, "min_price", 10)
            result = scan_top(min_score=min_score, max_results=max_results, min_price=min_price)
            self._send_json(result)
        except Exception as e:
            self._send_json({"error": str(e)}, 500)

    def _handle_nifty200_rsi(self):
        try:
            results = _fetch_nifty200_rsi_data()
            self._send_json({"count": len(results), "stocks": results})
        except Exception as e:
            self._send_json({"error": str(e)}, 500)

    def _handle_strategy_docs(self, params):
        try:
            doc_id = self._get_param(params, "doc", "")
            strategy_dir = os.path.join(HERE, "docs", "strategy")
            if not os.path.exists(strategy_dir):
                self._send_json({"error": "Strategy directory not found"}, 404)
                return

            files = [f for f in os.listdir(strategy_dir) if f.endswith(".md")]

            if doc_id:
                safe_doc = os.path.basename(doc_id)
                file_path = os.path.join(strategy_dir, safe_doc)
                if os.path.exists(file_path):
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    self._send_json({"doc": safe_doc, "content": content})
                else:
                    self._send_json({"error": f"Strategy file '{safe_doc}' not found"}, 404)
            else:
                docs_list = []
                for fname in sorted(files):
                    fpath = os.path.join(strategy_dir, fname)
                    with open(fpath, "r", encoding="utf-8") as f:
                        lines = [line.strip() for line in f.readlines() if line.strip()]
                    title = fname
                    for l in lines[:5]:
                        if l.startswith("#"):
                            title = l.lstrip("#").strip()
                            break
                    docs_list.append({"file": fname, "title": title, "size": os.path.getsize(fpath)})
                assets_dir = os.path.join(HERE, "docs", "assets")
                images = []
                if os.path.exists(assets_dir):
                    for img in sorted(os.listdir(assets_dir)):
                        if img.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
                            ipath = os.path.join(assets_dir, img)
                            images.append({
                                "file": img,
                                "url": f"/docs/assets/{img}",
                                "size": os.path.getsize(ipath),
                            })
                self._send_json({"docs": docs_list, "images": images})
        except Exception as e:
            self._send_json({"error": str(e)}, 500)
            self._send_json({"error": str(e)}, 500)

    def _handle_vwap_scanner(self, params):
        try:
            min_confidence = self._get_float(params, "min_confidence", 60)
            signal_filter = self._get_param(params, "signal", "ALL")
            top_n = int(self._get_param(params, "top_n", "30"))
            results = _vwap_intraday_scan(min_confidence=min_confidence, signal_filter=signal_filter, top_n=top_n)
            self._send_json({"count": len(results), "picks": results})
        except Exception as e:
            self._send_json({"error": str(e)}, 500)

    def _handle_vwap_ema(self, params):
        try:
            top_n = int(self._get_param(params, "top_n", "30"))
            signal_filter = self._get_param(params, "signal", "ALL")
            # options_only=0 to show all Nifty200, default 1 = F&O enabled only via IndMoney
            options_only_raw = self._get_param(params, "options_only", "1")
            options_only = str(options_only_raw).lower() not in ("0", "false", "no")
            picks = _vwap_ema_picks(signal_filter=signal_filter, top_n=top_n, options_only=options_only)
            # expose universe size for UI
            try:
                universe = len(indmoney_api.filter_option_enabled(NIFTY200_SYMBOLS)) if options_only else len(NIFTY200_SYMBOLS)
            except Exception:
                universe = len(NIFTY200_SYMBOLS)
            self._send_json({"count": len(picks), "picks": picks, "universe": universe, "options_only": options_only})
        except Exception as e:
            self._send_json({"error": str(e)}, 500)

    def _handle_sol_chart(self, params):
        try:
            timeframe = self._get_param(params, "timeframe", "1m")
            if timeframe not in ["1m", "15m", "1h"]:
                timeframe = "1m"
            limit = 1000
            
            url = f"https://public.coindcx.com/market_data/candles?pair=B-SOL_USDT&interval={timeframe}&limit={limit}"
            res = _requests.get(url, timeout=10).json()
            
            res_sorted = list(reversed(res))
            df = pd.DataFrame(res_sorted)
            
            numeric_cols = ['open', 'high', 'low', 'close', 'volume']
            df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric)
            
            import datetime
            now_utc = datetime.datetime.now(datetime.timezone.utc)
            start_of_day_ts = int(now_utc.replace(hour=0, minute=0, second=0, microsecond=0).timestamp() * 1000)
            
            df_session = df[df['time'] >= start_of_day_ts].copy()
            if len(df_session) < 10:
                df_session = df.tail(100).copy()
            
            tp = (df_session['high'] + df_session['low'] + df_session['close']) / 3
            df_session['vwap'] = (tp * df_session['volume']).cumsum() / df_session['volume'].cumsum()
            df_session['ema9'] = df_session['close'].ewm(span=9, adjust=False).mean()
            
            latest = df_session.iloc[-1]
            prev = df_session.iloc[-2]
            
            bullish = bool((prev['ema9'] <= prev['vwap']) and (latest['ema9'] > latest['vwap']))
            bearish = bool((prev['ema9'] >= prev['vwap']) and (latest['ema9'] < latest['vwap']))
            
            self._send_json({
                "symbol": "SOL/USDT (CoinDCX)",
                "timeframe": timeframe,
                "price": round(float(latest['close']), 2),
                "vwap": round(float(latest['vwap']), 2),
                "ema9": round(float(latest['ema9']), 2),
                "bullish_cross": bullish,
                "bearish_cross": bearish
            })
        except Exception as e:
            self._send_json({"error": str(e)}, 500)



def _scan_vwap_stock(t: str) -> dict:
    """
    Intraday stock scanning according to docs/strategy/vwap.md rules:
    - Timeframe: 5-minute candles
    - Stock Universe: Liquid NSE F&O / NIFTY 50 / Next 50
    - Indicators: VWAP, EMA20, EMA50, Volume, ATR(14)
    - Rules & Scoring system (max 100):
      Price > VWAP (Long) or Price < VWAP (Short): +20
      EMA20 > EMA50 (Long) or EMA20 < EMA50 (Short): +15
      VWAP slope > 0 (Long) or < 0 (Short): +15
      Relative Strength (vs NIFTY 5d): +15
      Volume confirmation (> 5-candle avg): +15
      Pullback Zone (within 0.5% of VWAP): +10
      Candlestick Confirmation: +5
      Gap filter (0.5% - 3.0%): +5
    Threshold signal generated if score >= 75 (or configurable min_confidence).
    """
    try:
        df = indmoney_api.get_history(t + ".NS", interval="5m", period="5d")
        if df.empty or len(df) < 30:
            return None
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        df["Date"] = df.index.date
        latest_date = df["Date"].iloc[-1]
        df_day = df[df["Date"] == latest_date].copy()
        if len(df_day) < 5:
            df_day = df.tail(30).copy()

        typical = (df_day["High"] + df_day["Low"] + df_day["Close"]) / 3
        vol = df_day["Volume"].replace(0, 1)
        df_day["VWAP"] = (typical * vol).cumsum() / vol.cumsum()
        df_day["EMA20"] = df_day["Close"].ewm(span=20, adjust=False).mean()
        df_day["EMA50"] = df_day["Close"].ewm(span=50, adjust=False).mean()

        row = df_day.iloc[-1]
        prev = df_day.iloc[-2]
        close = float(row["Close"])
        vwap = float(row["VWAP"])
        vwap_prev = float(prev["VWAP"])
        ema20 = float(row["EMA20"])
        ema50 = float(row["EMA50"])
        vol_curr = float(row["Volume"])
        vol_avg5 = float(df_day["Volume"].iloc[max(0, len(df_day)-6):-1].mean()) if len(df_day) >= 6 else vol_curr

        nifty_ret = _get_nifty_ret_5d()
        stock_5d_ret = (float(df["Close"].iloc[-1]) / float(df["Close"].iloc[0]) - 1) * 100 if len(df) >= 20 else 0
        rel_strength = stock_5d_ret - nifty_ret

        score = 0
        reasons = []

        is_long = close >= vwap

        # 1. Trend & VWAP Side (+20)
        if is_long:
            score += 20
            reasons.append("Price > VWAP (+20)")
        else:
            score += 20
            reasons.append("Price < VWAP (Short) (+20)")

        # 2. EMA Alignment (+15)
        if is_long and ema20 > ema50:
            score += 15
            reasons.append("EMA20 > EMA50 (+15)")
        elif not is_long and ema20 < ema50:
            score += 15
            reasons.append("EMA20 < EMA50 (+15)")

        # 3. VWAP Slope (+15)
        vwap_slope = vwap - vwap_prev
        if is_long and vwap_slope > 0:
            score += 15
            reasons.append("VWAP Slope > 0 (+15)")
        elif not is_long and vwap_slope < 0:
            score += 15
            reasons.append("VWAP Slope < 0 (+15)")

        # 4. Relative Strength (+15)
        if (is_long and rel_strength > 0.5) or (not is_long and rel_strength < -0.5):
            score += 15
            reasons.append(f"Relative Strength {rel_strength:+.2f}% vs NIFTY (+15)")
        elif abs(rel_strength) > 0:
            score += 8
            reasons.append(f"Relative Strength {rel_strength:+.2f}% vs NIFTY (+8)")

        # 5. Volume Confirmation (+15)
        if vol_curr > vol_avg5:
            score += 15
            reasons.append(f"Volume ({int(vol_curr)}) > 5-bar avg ({int(vol_avg5)}) (+15)")

        # 6. Pullback Zone (+10)
        dist_pct = abs(close - vwap) / vwap * 100
        if dist_pct <= 0.25:
            score += 10
            reasons.append(f"VWAP Pullback Zone ({dist_pct:.2f}% from VWAP) (+10)")
        elif dist_pct <= 0.75:
            score += 5
            reasons.append(f"Near VWAP ({dist_pct:.2f}% from VWAP) (+5)")

        # 7. Candlestick Confirmation (+5)
        c_open = float(row["Open"])
        if is_long and close > c_open:
            score += 5
            reasons.append("Bullish candle confirmation (+5)")
        elif not is_long and close < c_open:
            score += 5
            reasons.append("Bearish candle confirmation (+5)")

        # 8. Gap Range Filter (+5)
        open_day = float(df_day["Open"].iloc[0])
        prev_close = float(df["Close"][df["Date"] < latest_date].iloc[-1]) if len(df["Date"].unique()) > 1 else open_day
        gap_pct = ((open_day / prev_close) - 1) * 100
        if 0.5 <= abs(gap_pct) <= 3.0:
            score += 5
            reasons.append(f"Pre-market Gap in 0.5-3% range ({gap_pct:+.2f}%) (+5)")

        # ATR calculation for risk management (0.5 * ATR stop loss, 2R target)
        tr = pd.concat([df_day["High"] - df_day["Low"], (df_day["High"] - df_day["Close"].shift()).abs(), (df_day["Low"] - df_day["Close"].shift()).abs()], axis=1).max(axis=1)
        atr = float(tr.rolling(14).mean().iloc[-1]) if len(tr) >= 14 else float(tr.mean())
        if pd.isna(atr) or atr <= 0:
            atr = close * 0.01

        stop_dist = 0.5 * atr
        stop_loss = round(close - stop_dist if is_long else close + stop_dist, 2)
        target = round(close + 2.0 * stop_dist if is_long else close - 2.0 * stop_dist, 2)
        risk_reward = 2.0

        signal = "BUY" if is_long and score >= 75 else ("SELL" if not is_long and score >= 75 else "NO_TRADE")

        return {
            "symbol": t,
            "signal": signal,
            "price": round(close, 2),
            "vwap": round(vwap, 2),
            "ema20": round(ema20, 2),
            "ema50": round(ema50, 2),
            "entry": round(close, 2),
            "stop_loss": stop_loss,
            "target": target,
            "risk_reward": risk_reward,
            "confidence": score,
            "vwap_dist_pct": round(dist_pct, 2),
            "gap_pct": round(gap_pct, 2),
            "rel_strength": round(rel_strength, 2),
            "reasons": reasons,
        }
    except Exception:
        return None


def _vwap_intraday_scan(min_confidence=60, signal_filter="ALL", top_n=30):
    tickers = NIFTY_50[:]
    results = []
    workers = min(20, len(tickers))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_scan_vwap_stock, t): t for t in tickers}
        done, _ = wait(futures, timeout=120)
        for f in done:
            try:
                res = f.result()
                if res and res["confidence"] >= min_confidence:
                    if signal_filter == "ALL" or res["signal"] == signal_filter or (signal_filter == "ACTIVE" and res["signal"] != "NO_TRADE"):
                        results.append(res)
            except Exception:
                pass
    results.sort(key=lambda x: x["confidence"], reverse=True)
    return results[:top_n]

    def log_message(self, format, *args):
        pass


def _get_nifty200_symbols():
    csv_file = os.path.join(HERE, "nifty200.csv")
    stocks = []
    if os.path.exists(csv_file):
        try:
            import csv
            with open(csv_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sym = row.get("Symbol", "").strip()
                    company = row.get("Company Name", "").strip()
                    industry = row.get("Industry", "").strip()
                    if sym:
                        stocks.append({"symbol": sym, "company": company, "industry": industry})
        except Exception:
            pass
    if not stocks:
        stocks = [{"symbol": s, "company": s, "industry": "N/A"} for s in NIFTY_50]
    return stocks


def _fetch_single_nifty200_rsi(item):
    sym = item["symbol"]
    try:
        ticker_sym = sym if (sym.endswith(".NS") or sym.endswith(".BO") or sym.startswith("^")) else f"{sym}.NS"
        df = indmoney_api.get_history(ticker_sym, interval="1d", period="1mo")
        if df.empty or len(df) < 15:
            return None
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        close = df["Close"]
        price = float(close.iloc[-1])
        prev_close = float(close.iloc[-2]) if len(close) >= 2 else price
        change_pct = ((price - prev_close) / prev_close) * 100

        delta = close.diff()
        gain = delta.where(delta > 0, 0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / loss.replace(0, 1e-9)
        rsi_series = 100 - (100 / (1 + rs))
        rsi_val = float(rsi_series.iloc[-1]) if not pd.isna(rsi_series.iloc[-1]) else 50.0

        return {
            "symbol": sym,
            "company": item.get("company", sym),
            "industry": item.get("industry", ""),
            "price": round(price, 2),
            "change_pct": round(change_pct, 2),
            "rsi": round(rsi_val, 1)
        }
    except Exception:
        return None


def _fetch_nifty200_rsi_data():
    symbols_list = _get_nifty200_symbols()
    results = []
    workers = min(40, len(symbols_list))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_fetch_single_nifty200_rsi, item): item for item in symbols_list}
        done, _ = wait(futures, timeout=300)
        for f in done:
            try:
                res = f.result()
                if res:
                    results.append(res)
            except Exception:
                pass
    results.sort(key=lambda x: x["symbol"])
    return results


def main():
    parser = argparse.ArgumentParser(description="Stock Dashboard Server")
    parser.add_argument("--port", type=int, default=PORT, help=f"Port (default: {PORT})")
    args = parser.parse_args()

    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer(("0.0.0.0", args.port), DashboardHandler)
    print(f"Stock dashboard running at http://localhost:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    main()
