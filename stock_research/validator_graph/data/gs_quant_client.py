from __future__ import annotations

import re
import sys
from typing import Any, Dict, Optional, List

import pandas as pd
import yfinance as yf

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


def resolve_gs_asset_id(ticker: str) -> Optional[str]:
    try:
        from gs_quant.markets.securities import resolve_identifier
        result = resolve_identifier(ticker)
        if result:
            return str(result)
    except Exception:
        pass
    return None


def get_price_history(ticker: str, lookback: str = "1y", interval: str = "1d") -> pd.DataFrame:
    resolved = _resolve_ticker(ticker)
    try:
        df = yf.download(resolved, period=lookback, interval=interval, progress=False)
        if df.empty:
            return pd.DataFrame()
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        df.index.name = "date"
        return df
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch price history for {ticker}: {exc}") from exc


def get_financials(ticker: str) -> Dict[str, Any]:
    resolved = _resolve_ticker(ticker)
    try:
        stock = yf.Ticker(resolved)
        info = stock.info or {}
        fundamental = stock.fundamentals if hasattr(stock, "fundamentals") else None
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch financials for {ticker}: {exc}") from exc

    result: Dict[str, Any] = {
        "ticker": resolved,
        "company_name": info.get("longName") or info.get("shortName") or ticker,
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "market_cap": info.get("marketCap"),
        "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
        "trailing_pe": info.get("trailingPE"),
        "forward_pe": info.get("forwardPE"),
        "price_to_book": info.get("priceToBook"),
        "ev_to_ebitda": info.get("trailingEvmEbitda") or info.get("forwardEvmEbitda"),
        "dividend_yield": info.get("dividendYield"),
        "profit_margin": info.get("profitMargins"),
        "operating_margin": info.get("operatingMargins"),
        "return_on_equity": info.get("returnOnEquity"),
        "return_on_assets": info.get("returnOnAssets"),
        "debt_to_equity": info.get("debtToEquity"),
        "current_ratio": info.get("currentRatio"),
        "quick_ratio": info.get("quickRatio"),
        "interest_coverage": info.get("interestCoverage"),
        "total_revenue": info.get("totalRevenue"),
        "revenue_per_share": info.get("revenuePerShare"),
        "revenue_growth_yoy": info.get("revenueGrowth"),
        "earnings_growth_yoy": info.get("earningsGrowth"),
        "earnings_quarterly_growth": info.get("earningsQuarterlyGrowth"),
        "beta": info.get("beta"),
        "52_week_high": info.get("fiftyTwoWeekHigh"),
        "52_week_low": info.get("fiftyTwoWeekLow"),
        "fifty_day_avg": info.get("fiftyDayAverage"),
        "two_hundred_day_avg": info.get("twoHundredDayAverage"),
        "average_volume": info.get("averageVolume"),
        "shares_outstanding": info.get("sharesOutstanding"),
    }
    return {k: v for k, v in result.items() if v is not None}


def get_volatility(ticker: str, lookback: str = "1y") -> Dict[str, float]:
    df = get_price_history(ticker, lookback=lookback, interval="1d")
    if df.empty or "Close" not in df.columns:
        return {"realized_vol": 0.0, "annualized_vol": 0.0}

    close = df["Close"]
    returns = close.pct_change().dropna()
    daily_vol = float(returns.std())
    annualized_vol = daily_vol * (252 ** 0.5)

    try:
        from gs_quant.timeseries import statistics as gs_stats
        vol = float(gs_stats.volatility(close, returns=True, annualized=True))
    except Exception:
        vol = annualized_vol

    return {
        "realized_vol": round(daily_vol, 6),
        "annualized_vol": round(vol, 6),
    }


def get_ohlcv(ticker: str, start: str = "2y", interval: str = "1d") -> pd.DataFrame:
    df = get_price_history(ticker, lookback=start, interval=interval)
    if df.empty:
        raise RuntimeError(f"No OHLCV data for {ticker}")
    required_cols = {"Open", "High", "Low", "Close", "Volume"}
    missing = required_cols - set(df.columns)
    if missing:
        raise RuntimeError(f"Missing columns {missing} for {ticker}")
    return df[list(required_cols)]


def get_sector_peers(ticker: str) -> List[str]:
    resolved = _resolve_ticker(ticker)
    try:
        stock = yf.Ticker(resolved)
        info = stock.info or {}
        sector = info.get("sector")
        industry = info.get("industry")
    except Exception:
        return []

    if not sector:
        return []

    try:
        from gs_quant.markets.securities import get_sector_peers as gs_peers
        peers = gs_peers(ticker, sector=sector)
        return [str(p) for p in peers] if peers else []
    except Exception:
        return []