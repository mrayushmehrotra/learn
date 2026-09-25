from __future__ import annotations

from data.portfolio_store import PortfolioStore, Portfolio, Position


def seed_default_portfolio() -> None:
    store = PortfolioStore()
    existing = store.get_portfolio("default")
    if existing and existing.positions:
        print("Portfolio 'default' already exists with positions. Skipping seed.")
        return

    portfolio = Portfolio(
        portfolio_id="default",
        name="Indian Large-Cap Growth Portfolio",
        mandate="growth",
        positions=[
            Position(ticker="RELIANCE.NS", shares=100, avg_price=2500.0, sector="Energy", role="core"),
            Position(ticker="TCS.NS", shares=50, avg_price=3500.0, sector="Technology", role="core"),
            Position(ticker="HDFCBANK.NS", shares=200, avg_price=1600.0, sector="Financials", role="core"),
            Position(ticker="INFY.NS", shares=150, avg_price=1800.0, sector="Technology", role="core"),
            Position(ticker="ICICIBANK.NS", shares=300, avg_price=1100.0, sector="Financials", role="core"),
            Position(ticker="HINDUNILVR.NS", shares=80, avg_price=2500.0, sector="Consumer Staples", role="core"),
            Position(ticker="ITC.NS", shares=400, avg_price=450.0, sector="Consumer Staples", role="core"),
            Position(ticker="SBIN.NS", shares=500, avg_price=600.0, sector="Financials", role="core"),
            Position(ticker="BHARTIARTL.NS", shares=200, avg_price=1200.0, sector="Telecom", role="core"),
            Position(ticker="LT.NS", shares=100, avg_price=3400.0, sector="Industrials", role="core"),
        ],
        sector_caps={"Technology": 0.30, "Financials": 0.35, "Energy": 0.20, "Healthcare": 0.15, "Consumer Staples": 0.20, "Telecom": 0.15, "Industrials": 0.15},
        country_caps={"India": 0.90, "US": 0.20},
    )

    store.save_portfolio(portfolio)
    print(f"Seeded portfolio '{portfolio.name}' with {len(portfolio.positions)} positions.")


if __name__ == "__main__":
    seed_default_portfolio()