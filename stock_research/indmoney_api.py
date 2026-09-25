"""INDstocks (INDmoney) API client for Indian equity market data.

Provides drop-in replacements for the yfinance calls used across this project:

- get_stock_data(ticker)              -> quote dict (same shape as stock_tools.get_stock_data)
- get_stock_data([tickers])           -> batched quote dict {ticker: quote}
- get_history(ticker, interval, ...)  -> OHLCV DataFrame like yfinance.download
- resolve_scrip(ticker)               -> "NSE_<SECURITY_ID>" / "BSE_<...>" instrument code

Token resolution order:
  1. INDSTOCKS_TOKEN environment variable
  2. .indstocks_token file next to this module
  3. demo token embedded in docs/indstocks-api-docs.md

Docs: https://api-docs.indstocks.com/
"""

import csv
import os
import re
import threading
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Union

import pandas as pd
import requests

BASE_URL = "https://api.indstocks.com"
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(HERE, ".cache")

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

_TOKEN = None
_TOKEN_LOADED = False
_TOKEN_LOCK = threading.Lock()


def _load_token() -> Optional[str]:
    global _TOKEN, _TOKEN_LOADED
    if _TOKEN_LOADED:
        return _TOKEN
    with _TOKEN_LOCK:
        if _TOKEN_LOADED:
            return _TOKEN
        token = None
        env = os.environ.get("INDSTOCKS_TOKEN") or os.environ.get("INDSTOCKS_ACCESS_TOKEN")
        if env:
            token = env.strip()
        if not token:
            for p in (os.path.join(HERE, ".indstocks_token"),
                      os.path.expanduser("~/.indstocks_token")):
                if os.path.exists(p):
                    try:
                        token = open(p).read().strip()
                    except Exception:
                        token = None
                    if token:
                        break
        if not token:
            doc = os.path.join(HERE, "docs", "indstocks-api-docs.md")
            if os.path.exists(doc):
                try:
                    for line in open(doc, encoding="utf-8"):
                        if line.strip().startswith("eyJ"):
                            token = line.strip()
                            break
                except Exception:
                    token = None
        _TOKEN = token
        _TOKEN_LOADED = True
    return _TOKEN


def _headers() -> dict:
    token = _load_token()
    if not token:
        raise RuntimeError(
            "No INDstocks access token found. Set INDSTOCKS_TOKEN, add a "
            ".indstocks_token file, or regenerate the token at "
            "indstocks.com/app/api-trading/access-tokens"
        )
    return {"Authorization": token, "Content-Type": "application/json"}


# ---------------------------------------------------------------------------
# Rate limiting + request helper
# ---------------------------------------------------------------------------

_RATE_LOCK = threading.Lock()
_LAST_CALL = 0.0
_MIN_CALL_INTERVAL = 0.22  # ~4.5 req/sec, safely under the 5/sec API limit


def _request(path: str, params: Optional[dict] = None, retries: int = 4) -> requests.Response:
    global _LAST_CALL
    # Global (cross-thread) rate limiter: data/quote APIs allow 5 req/sec.
    with _RATE_LOCK:
        now = time.monotonic()
        wait = _MIN_CALL_INTERVAL - (now - _LAST_CALL)
        if wait > 0:
            time.sleep(wait)
        _LAST_CALL = time.monotonic()

    last_err = None
    for attempt in range(retries):
        try:
            r = requests.get(BASE_URL + path, headers=_headers(), params=params, timeout=30)
        except requests.RequestException as e:
            last_err = e
            time.sleep(1 + attempt)
            continue
        if r.status_code == 200:
            return r
        if r.status_code == 429:
            time.sleep(2 + attempt)  # rate limited -> back off
            last_err = RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")
            continue
        if r.status_code == 401:
            raise RuntimeError("INDstocks auth error (expired/invalid token?)")
        last_err = RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")
        time.sleep(1 + attempt)
    raise RuntimeError(f"INDstocks request failed for {path}: {last_err}")


# ---------------------------------------------------------------------------
# Instruments master
# ---------------------------------------------------------------------------

INDEX_ALIASES = {
    "^NSEI": ["NIFTY 50", "NIFTY"],
    "^BSESN": ["SENSEX", "BSE SENSEX"],
    "^NSEBANK": ["BANK NIFTY", "NIFTY BANK"],
}

_EQUITY_NSE = {}   # SYMBOL -> {"scrip": "NSE_123", "name": ...}
_EQUITY_BSE = {}   # SYMBOL -> {"scrip": "BSE_123", "name": ...}
_INDEX_INSTR = {}  # INDEX NAME (upper) -> {"scrip": ..., "name": ...}
_SCRIP_NAME = {}   # scrip -> display name
_INSTR_LOCK = threading.Lock()
_INSTR_LOADED = False


def _chunks(items, size):
    for i in range(0, len(items), size):
        yield items[i:i + size]


def _load_instruments(force: bool = False) -> None:
    global _EQUITY_NSE, _EQUITY_BSE, _INDEX_INSTR, _SCRIP_NAME, _INSTR_LOADED
    if _INSTR_LOADED and not force:
        return
    with _INSTR_LOCK:
        if _INSTR_LOADED and not force:
            return
        try:
            os.makedirs(CACHE_DIR, exist_ok=True)
            eq_path = os.path.join(CACHE_DIR, "instruments_equity.csv")
            idx_path = os.path.join(CACHE_DIR, "instruments_index.csv")

            def _fresh(path):
                return os.path.exists(path) and (time.time() - os.path.getmtime(path)) < 86400

            if not _fresh(eq_path):
                r = _request("/market/instruments", {"source": "equity"})
                with open(eq_path, "w", encoding="utf-8") as f:
                    f.write(r.text)
            if not _fresh(idx_path):
                r = _request("/market/instruments", {"source": "index"})
                with open(idx_path, "w", encoding="utf-8") as f:
                    f.write(r.text)

            nse, bse = {}, {}
            with open(eq_path, encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    exch = (row.get("EXCH") or "").strip().upper()
                    series = (row.get("SERIES") or "").strip().upper()
                    if series != "EQ":
                        continue
                    sym = (row.get("TRADING_SYMBOL") or row.get("SYMBOL_NAME") or "").strip().upper()
                    if not sym:
                        continue
                    sid = (row.get("SECURITY_ID") or "").strip()
                    name = (row.get("SYMBOL_NAME") or row.get("CUSTOM_SYMBOL") or sym).strip()
                    entry = {"scrip": f"{exch}_{sid}", "name": name}
                    if exch == "NSE":
                        nse[sym] = entry
                    elif exch == "BSE":
                        bse[sym] = entry
                    _SCRIP_NAME[entry["scrip"]] = name

            idx = {}
            with open(idx_path, encoding="utf-8") as f:
                next(f, None)  # header
                for line in f:
                    parts = line.rstrip("\n").split(",")
                    if len(parts) < 3:
                        continue
                    exch, idx_name = parts[0].strip().upper(), parts[1].strip()
                    sid = parts[2].strip()
                    entry = {"scrip": f"{exch}_{sid}", "name": idx_name}
                    idx[idx_name.upper()] = entry
                    _SCRIP_NAME[entry["scrip"]] = idx_name

            _EQUITY_NSE, _EQUITY_BSE, _INDEX_INSTR = nse, bse, idx
            _INSTR_LOADED = True
        except Exception:
            raise


def resolve_scrip(ticker: str, bse: bool = False) -> str:
    _load_instruments()
    t = ticker.upper().strip()

    if t.startswith("^"):
        aliases = INDEX_ALIASES.get(t)
        if aliases:
            for a in aliases:
                if a.upper() in _INDEX_INSTR:
                    return _INDEX_INSTR[a.upper()]["scrip"]
            first = aliases[0].upper().split()[0]
            for key, entry in _INDEX_INSTR.items():
                if key == first or key.startswith(first + " "):
                    return entry["scrip"]
        raise KeyError(f"Unknown index ticker: {ticker}")

    if t.endswith(".BO"):
        bse = True
    t = t.split(".")[0].strip()

    table = _EQUITY_BSE if bse else _EQUITY_NSE
    entry = table.get(t)
    if not entry:
        raise KeyError(f"Unknown instrument: {ticker}")
    return entry["scrip"]


_FNO_SYMBOLS: set = set()
_FNO_LOCK = threading.Lock()
_FNO_LOADED = False


def _load_fno_symbols(force: bool = False) -> set:
    global _FNO_SYMBOLS, _FNO_LOADED
    if _FNO_LOADED and not force:
        return _FNO_SYMBOLS
    with _FNO_LOCK:
        if _FNO_LOADED and not force:
            return _FNO_SYMBOLS
        try:
            os.makedirs(CACHE_DIR, exist_ok=True)
            fno_path = os.path.join(CACHE_DIR, "instruments_fno.csv")

            def _fresh(path):
                return os.path.exists(path) and (time.time() - os.path.getmtime(path)) < 86400

            if not _fresh(fno_path):
                r = _request("/market/instruments", {"source": "fno"})
                with open(fno_path, "w", encoding="utf-8") as f:
                    f.write(r.text)

            symbols = set()
            with open(fno_path, encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    inst = (row.get("INSTRUMENT_NAME") or "").strip().upper()
                    if inst not in ("OPTSTK", "FUTSTK"):
                        continue
                    trad = (row.get("TRADING_SYMBOL") or "").strip()
                    if not trad:
                        continue
                    # TRADING_SYMBOL like "RELIANCE-29SEP2026-1500-CE" -> symbol is prefix
                    sym = trad.split("-")[0].strip().upper()
                    if sym:
                        symbols.add(sym)
            _FNO_SYMBOLS = symbols
            _FNO_LOADED = True
        except Exception:
            # on failure keep whatever we have (maybe empty)
            _FNO_LOADED = True if _FNO_SYMBOLS else False
            raise
    return _FNO_SYMBOLS


def get_option_enabled_symbols() -> set:
    """Return set of underlying symbols that have F&O (options/futures)."""
    return _load_fno_symbols()


def is_option_enabled(symbol: str) -> bool:
    try:
        return symbol.strip().upper() in get_option_enabled_symbols()
    except Exception:
        return False


def filter_option_enabled(symbols: list) -> list:
    try:
        fno = get_option_enabled_symbols()
        return [s for s in symbols if s.strip().upper() in fno]
    except Exception:
        return symbols


def _norm_ticker(ticker: str) -> str:
    return ticker.upper().strip()


def instrument_name(ticker: str, bse: bool = False) -> str:
    """Return the display name for a ticker from the instruments master."""
    try:
        scrip = resolve_scrip(ticker, bse=bse)
        return _SCRIP_NAME.get(scrip) or ticker.upper()
    except Exception:
        return ticker.upper()


def instrument_names(tickers) -> Dict[str, str]:
    """Return {normalized ticker: display name} for a list of tickers."""
    _load_instruments()
    out = {}
    for t in tickers:
        try:
            scrip = resolve_scrip(t)
            out[_norm_ticker(t)] = _SCRIP_NAME.get(scrip) or _norm_ticker(t)
        except Exception:
            out[_norm_ticker(t)] = _norm_ticker(t)
    return out


# ---------------------------------------------------------------------------
# Quotes
# ---------------------------------------------------------------------------

_QUOTE_CACHE: Dict[str, Optional[dict]] = {}
_QUOTE_LOCK = threading.Lock()


def _fetch_full_quotes(scrips: List[str]) -> Dict[str, dict]:
    out = {}
    for chunk in _chunks(scrips, 1000):
        r = _request("/market/quotes/full", {"scrip-codes": ",".join(chunk)})
        payload = r.json()
        data = payload.get("data") or {}
        out.update(data)
    return out


def _to_quote_dict(raw: dict, symbol: str, name: str = "") -> dict:
    price = raw.get("live_price")
    change = raw.get("day_change")
    prev_close = raw.get("prev_close")
    if change is None and price is not None and prev_close:
        change = price - prev_close
    change_pct = raw.get("day_change_percentage")
    if change_pct is None and change is not None and prev_close:
        change_pct = (change / prev_close) * 100
    return {
        "symbol": symbol,
        "company": name or symbol,
        "price": price,
        "change": round(change, 2) if change is not None else None,
        "change_pct": round(change_pct, 2) if change_pct is not None else None,
        "prev_close": prev_close,
        "open": raw.get("day_open"),
        "high": raw.get("day_high"),
        "low": raw.get("day_low"),
        "volume": raw.get("volume"),
        "avg_volume": None,
        "market_cap": None,
        "pe_ratio": None,
        "dividend_yield": None,
        "fifty_two_week_high": raw.get("52week_high"),
        "fifty_two_week_low": raw.get("52week_low"),
        "exchange": symbol.split(".")[0] if symbol.startswith("^") else "NSE",
        "currency": "INR",
    }


def get_stock_data(tickers: Union[str, List[str]]) -> Union[Optional[dict], Dict[str, Optional[dict]]]:
    """Fetch quote(s). Accepts a single ticker or a list; list returns a dict keyed by ticker.

    Prices come from the INDstocks /market/quotes/full endpoint. Fundamental fields that
    endpoint does not expose (market cap, PE, etc.) are set to None.
    """
    single = isinstance(tickers, str)
    if single:
        tickers = [tickers]
    if not tickers:
        return {} if not single else None

    _load_instruments()
    norms = {_norm_ticker(t): t for t in tickers}

    missing = []
    with _QUOTE_LOCK:
        for norm in norms:
            if norm not in _QUOTE_CACHE:
                missing.append(norm)

    if missing:
        scrip_of, scrip_list = {}, []
        for norm in missing:
            try:
                scrip = resolve_scrip(norms[norm])
            except KeyError:
                _QUOTE_CACHE[norm] = None
                continue
            if scrip in scrip_of:  # prefer first duplicate
                continue
            scrip_of[scrip] = norm
            scrip_list.append(scrip)
        quotes = _fetch_full_quotes(scrip_list)
        with _QUOTE_LOCK:
            for scrip, raw in quotes.items():
                norm = scrip_of.get(scrip)
                if norm is None:
                    continue
                name = _SCRIP_NAME.get(scrip, norms[norm])
                _QUOTE_CACHE[norm] = _to_quote_dict(raw, norms[norm], name)
            for norm in missing:
                _QUOTE_CACHE.setdefault(norm, None)

    if single:
        return _QUOTE_CACHE.get(_norm_ticker(tickers[0]))
    return {t: _QUOTE_CACHE.get(_norm_ticker(t)) for t in tickers}


# ---------------------------------------------------------------------------
# Historical data
# ---------------------------------------------------------------------------

_INTERVAL_MAP = {
    "1m": "1minute", "2m": "2minute", "3m": "3minute", "4m": "4minute",
    "5m": "5minute", "10m": "10minute", "15m": "15minute", "30m": "30minute",
    "60m": "60minute", "1h": "60minute", "2h": "120minute", "3h": "180minute",
    "4h": "240minute", "1d": "1day", "1w": "1week", "1wk": "1week",
    "1mo": "1month", "1M": "1month",
}

_INTERVAL_MAX_DAYS = {
    "1minute": 7, "2minute": 7, "3minute": 7, "4minute": 7, "5minute": 7,
    "10minute": 7, "15minute": 7, "30minute": 7,
    "60minute": 15, "120minute": 15, "180minute": 15, "240minute": 15,
    "1day": 365, "1week": 366, "1month": 366,
}

_PERIOD_UNITS = {"d": 1, "w": 7, "mo": 30, "y": 365}


def _period_to_days(period: str) -> int:
    m = re.match(r"(\d+)\s*(d|w|mo|y)(\b|$)", period.strip().lower())
    if not m:
        raise ValueError(f"Unknown period: {period}")
    return int(m.group(1)) * _PERIOD_UNITS[m.group(2)]


def _canon_interval(interval: str) -> str:
    iv = str(interval).strip().lower()
    return _INTERVAL_MAP.get(iv, iv)


def _parse_dt(value, default: datetime) -> datetime:
    s = str(value).strip()
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    raise ValueError(f"Could not parse date: {value!r}")


def _candles_to_df(candles: list, interval: str) -> pd.DataFrame:
    if not candles:
        return pd.DataFrame(columns=["Open", "High", "Low", "Close", "Volume"])
    idx = pd.to_datetime([c["ts"] for c in candles], unit="s", utc=True).tz_convert("Asia/Kolkata")
    df = pd.DataFrame(
        [{"Open": c["o"], "High": c["h"], "Low": c["l"], "Close": c["c"], "Volume": c["v"]}
         for c in candles],
        index=idx,
    )
    return df


_EXPIRY_CACHE: Dict[str, List[str]] = {}
_EXPIRY_LOCK = threading.Lock()

_LOT_SIZE_CACHE: Dict[str, int] = {}


def get_lot_size(symbol: str) -> int:
    """Lot size for an F&O underlying from the FNO master."""
    sym = symbol.strip().upper()
    if sym in _LOT_SIZE_CACHE:
        return _LOT_SIZE_CACHE[sym]
    # ensure FNO loaded
    try:
        _load_fno_symbols()
    except Exception:
        pass
    # parse fno file directly for lot size if not cached
    try:
        fno_path = os.path.join(CACHE_DIR, "instruments_fno.csv")
        if os.path.exists(fno_path):
            with open(fno_path, encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    inst = (row.get("INSTRUMENT_NAME") or "").strip().upper()
                    if inst not in ("OPTSTK", "FUTSTK"):
                        continue
                    trad = (row.get("TRADING_SYMBOL") or "")
                    s = trad.split("-")[0].strip().upper()
                    if s == sym:
                        try:
                            lot = int(float(row.get("LOT_UNITS") or 0))
                            if lot > 0:
                                _LOT_SIZE_CACHE[sym] = lot
                                return lot
                        except Exception:
                            continue
    except Exception:
        pass
    return _LOT_SIZE_CACHE.get(sym, 0)


def get_expiries(symbol: str) -> List[str]:
    """Upcoming expiries for an underlying via IndMoney."""
    sym = symbol.strip().upper()
    with _EXPIRY_LOCK:
        if sym in _EXPIRY_CACHE:
            return _EXPIRY_CACHE[sym]
    r = _request("/market/instruments/expiries", {"underlying": sym, "segment": "DERIVATIVE"})
    data = r.json().get("data") or []
    # data is list of YYYY-MM-DD
    with _EXPIRY_LOCK:
        _EXPIRY_CACHE[sym] = data
    return data


def get_option_chain(symbol: str, expiry: str = None, strike_count: int = 10) -> dict:
    """Option chain for an EQUITY underlying. If expiry None, uses nearest."""
    sym = symbol.strip().upper()
    _load_instruments()
    # underlying scrip from equity master
    scrip = resolve_scrip(sym)
    # scrip is like NSE_2885 -> need just numeric id
    sec_id = scrip.split("_")[-1]
    if not expiry:
        exps = get_expiries(sym)
        if not exps:
            raise RuntimeError(f"No expiries for {sym}")
        expiry = exps[0]
    params = {
        "exchange": "NSE",
        "segment": "EQUITY",
        "underlying-scrip": sec_id,
        "expiry": expiry,
        "strike_count": str(strike_count),
    }
    r = _request("/market/option-chain", params)
    payload = r.json()
    if payload.get("status") != "success":
        raise RuntimeError(f"Option chain failed for {sym}: {payload}")
    return payload.get("data") or {}


def get_history(ticker: str, interval: str = "1d",
                start: Union[str, None] = None, end: Union[str, None] = None,
                period: Union[str, None] = None) -> pd.DataFrame:
    """Fetch OHLCV history as a DataFrame (columns Open/High/Low/Close/Volume).

    `start`/`end` accept dates ("2024-01-01") or period strings ("1mo", "2y"),
    paging across the API's per-call window limits.
    """
    _load_instruments()
    scrip = resolve_scrip(ticker)
    intv = _canon_interval(interval)
    if intv not in _INTERVAL_MAX_DAYS:
        raise ValueError(f"Unsupported interval: {interval}")
    max_days = _INTERVAL_MAX_DAYS[intv]

    now = datetime.now(timezone.utc)
    end_dt = _parse_dt(end, now) if end else now

    if period is None and start and isinstance(start, str) and re.match(
            r"^\d+\s*(d|w|mo|y)(\b|$)", start.strip().lower()):
        period, start = start, None

    if period:
        start_dt = end_dt - timedelta(days=_period_to_days(period))
    elif start:
        start_dt = _parse_dt(start, end_dt)
    else:
        start_dt = end_dt - timedelta(days=max_days)

    if start_dt >= end_dt:
        raise ValueError("start must be before end")

    frames = []
    chunk_start = start_dt
    while chunk_start < end_dt:
        chunk_end = min(chunk_start + timedelta(days=max_days), end_dt)
        params = {
            "scrip-codes": scrip,
            "start_time": int(chunk_start.timestamp() * 1000),
            "end_time": int(chunk_end.timestamp() * 1000),
        }
        r = _request(f"/market/historical/{intv}", params)
        payload = r.json()
        candles = ((payload.get("data") or {}).get(scrip) or {}).get("candles") or []
        frames.append(_candles_to_df(candles, intv))
        chunk_start = chunk_end

    if not frames:
        return pd.DataFrame(columns=["Open", "High", "Low", "Close", "Volume"])
    df = pd.concat(frames)
    df = df[~df.index.duplicated(keep="first")].sort_index()
    return df