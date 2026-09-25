from __future__ import annotations

import json
import os
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict, field

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_STORE_PATH = os.path.join(HERE, "data", "portfolio.json")


@dataclass
class Position:
    ticker: str
    shares: float
    avg_price: float
    sector: str = ""
    country: str = "India"
    role: str = "core"
    purchase_date: str = ""


@dataclass
class Portfolio:
    portfolio_id: str
    name: str
    mandate: str = "growth"
    positions: List[Position] = field(default_factory=list)
    sector_caps: Dict[str, float] = field(
        default_factory=lambda: {"Technology": 0.30, "Financials": 0.25, "Healthcare": 0.15}
    )
    country_caps: Dict[str, float] = field(
        default_factory=lambda: {"India": 0.80, "US": 0.30}
    )

    def to_dict(self) -> dict:
        return {
            "portfolio_id": self.portfolio_id,
            "name": self.name,
            "mandate": self.mandate,
            "sector_caps": self.sector_caps,
            "country_caps": self.country_caps,
            "positions": [asdict(p) for p in self.positions],
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Portfolio":
        positions = [Position(**p) for p in d.get("positions", [])]
        return cls(
            portfolio_id=d.get("portfolio_id", ""),
            name=d.get("name", ""),
            mandate=d.get("mandate", "growth"),
            positions=positions,
            sector_caps=d.get("sector_caps", {}),
            country_caps=d.get("country_caps", {}),
        )


class PortfolioStore:
    def __init__(self, store_path: str = DEFAULT_STORE_PATH):
        self.store_path = store_path
        self._portfolios: Dict[str, Portfolio] = {}
        self._load()

    def _load(self) -> None:
        if not os.path.exists(self.store_path):
            return
        try:
            with open(self.store_path, "r") as f:
                data: dict = json.load(f)
            for pid, pdict in data.items():
                self._portfolios[pid] = Portfolio.from_dict(pdict)
        except (json.JSONDecodeError, IOError):
            pass

    def _save(self) -> None:
        os.makedirs(os.path.dirname(self.store_path), exist_ok=True)
        data: dict = {pid: p.to_dict() for pid, p in self._portfolios.items()}
        with open(self.store_path, "w") as f:
            json.dump(data, f, indent=2)

    def get_portfolio(self, portfolio_id: str) -> Optional[Portfolio]:
        return self._portfolios.get(portfolio_id)

    def save_portfolio(self, portfolio: Portfolio) -> None:
        self._portfolios[portfolio.portfolio_id] = portfolio
        self._save()

    def get_sector_weights(self, portfolio_id: str) -> Dict[str, float]:
        portfolio = self._portfolios.get(portfolio_id)
        if not portfolio or not portfolio.positions:
            return {}
        total_value = sum(p.shares * p.avg_price for p in portfolio.positions)
        if total_value == 0:
            return {}
        sector_weights: Dict[str, float] = {}
        for pos in portfolio.positions:
            value = pos.shares * pos.avg_price
            weight = value / total_value
            sector_weights[pos.sector] = sector_weights.get(pos.sector, 0.0) + weight
        return sector_weights

    def get_country_weights(self, portfolio_id: str) -> Dict[str, float]:
        portfolio = self._portfolios.get(portfolio_id)
        if not portfolio or not portfolio.positions:
            return {}
        total_value = sum(p.shares * p.avg_price for p in portfolio.positions)
        if total_value == 0:
            return {}
        country_weights: Dict[str, float] = {}
        for pos in portfolio.positions:
            value = pos.shares * pos.avg_price
            weight = value / total_value
            country_weights[pos.country] = country_weights.get(pos.country, 0.0) + weight
        return country_weights

    def add_position(self, portfolio_id: str, position: Position) -> None:
        portfolio = self._portfolios.get(portfolio_id)
        if portfolio is None:
            portfolio = Portfolio(portfolio_id=portfolio_id, name=portfolio_id)
            self._portfolios[portfolio_id] = portfolio
        portfolio.positions.append(position)
        self._save()

    def correlation_with_portfolio(
        self, ticker: str, portfolio_id: str
    ) -> Optional[float]:
        from data.gs_quant_client import get_price_history

        import pandas as pd

        portfolio = self._portfolios.get(portfolio_id)
        if not portfolio or not portfolio.positions:
            return None

        try:
            price_history = get_price_history(ticker, lookback="1y")
        except Exception:
            return None

        if price_history.empty or "Close" not in price_history.columns:
            return None

        portfolio_returns: Optional[float] = None
        for pos in portfolio.positions:
            try:
                pos_history = get_price_history(pos.ticker, lookback="1y")
            except Exception:
                continue
            if pos_history.empty or "Close" not in pos_history.columns:
                continue
            aligned = price_history[["Close"]].join(
                pos_history[["Close"]], lsuffix="_ticker", rsuffix="_pos"
            ).dropna()
            if len(aligned) < 30:
                continue
            ticker_returns = aligned["Close_ticker"].pct_change().dropna()
            pos_returns = aligned["Close_pos"].pct_change().dropna()
            aligned_len = min(len(ticker_returns), len(pos_returns))
            ticker_returns = ticker_returns.iloc[-aligned_len:]
            pos_returns = pos_returns.iloc[-aligned_len:]
            if pos_returns.std() == 0:
                continue
            corr = ticker_returns.corr(pos_returns)
            if portfolio_returns is None:
                portfolio_returns = corr
            else:
                portfolio_returns = (portfolio_returns + corr) / 2
        return float(portfolio_returns) if portfolio_returns is not None else None