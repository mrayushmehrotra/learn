from __future__ import annotations

from langchain_ollama import ChatOllama

from schemas import AgentResult, ValidationRequest
from agents.base import BaseAgent


class DiversificationAgent(BaseAgent):
    name: str = "diversification"

    async def run(self, request: ValidationRequest) -> AgentResult:
        llm = ChatOllama(
            model="qwen2.5:0.5b",
            temperature=0.1,
            num_ctx=2048,
        )

        from data.gs_quant_client import get_financials
        from data.portfolio_store import PortfolioStore

        portfolio_store = PortfolioStore()
        portfolio = portfolio_store.get_portfolio(request.portfolio_id)
        if portfolio is None:
            return AgentResult(
                agent=self.name,
                verdict="PASS",
                score=100,
                rationale="No portfolio data found; no portfolio-level constraints to check.",
                flags=["no_portfolio_data"],
                data_sources=["portfolio_store"],
            )

        try:
            financials = get_financials(request.ticker)
        except Exception as exc:
            return AgentResult(
                agent=self.name,
                verdict="FAIL",
                score=0,
                rationale=f"Could not retrieve sector info: {exc}",
                flags=["data_unavailable"],
            )

        sector = financials.get("sector", "Unknown")
        country = "India"
        sector_weights = portfolio_store.get_sector_weights(request.portfolio_id)
        country_weights = portfolio_store.get_country_weights(request.portfolio_id)
        sector_cap = portfolio.sector_caps.get(sector, 0.30)
        country_cap = portfolio.country_caps.get(country, 0.80)

        current_sector_weight = sector_weights.get(sector, 0.0)
        proposed_weight = request.proposed_position_size or 0.01
        post_trade_sector = (current_sector_weight + proposed_weight) / (1 + proposed_weight)
        current_country_weight = country_weights.get(country, 0.0)
        post_trade_country = (current_country_weight + proposed_weight) / (1 + proposed_weight)

        correlation = portfolio_store.correlation_with_portfolio(
            request.ticker, request.portfolio_id
        )

        flags = []
        if post_trade_sector > sector_cap:
            flags.append(f"sector_weight_{post_trade_sector:.1%}_exceeds_cap_{sector_cap:.0%}")
        if post_trade_country > country_cap:
            flags.append(f"country_weight_{post_trade_country:.1%}_exceeds_cap_{country_cap:.0%}")
        if correlation is not None and correlation > 0.7:
            flags.append(f"high_correlation_{correlation:.2f}_with_portfolio")

        prompt = (
            f"You are a portfolio diversification analyst. Evaluate adding {request.ticker} "
            f"(sector: {sector}, country: {country}) to the portfolio '{portfolio.name}'.\n"
            f"Current sector weight for {sector}: {current_sector_weight:.1%}\n"
            f"Post-trade sector weight: {post_trade_sector:.1%} (cap: {sector_cap:.0%})\n"
            f"Current country weight for {country}: {current_country_weight:.1%}\n"
            f"Post-trade country weight: {post_trade_country:.1%} (cap: {country_cap:.0%})\n"
            f"Avg correlation with existing holdings: {correlation if correlation is not None else 'N/A'}\n"
            f"Portfolio mandate: {portfolio.mandate}\n"
            f"\n"
            f"Pass criteria:\n"
            f"- Post-trade sector weight does not exceed cap\n"
            f"- Post-trade country weight does not exceed cap\n"
            f"- Correlation to existing holdings < 0.7\n"
            f"\n"
            f"WARN if any single criterion is borderline.\n"
            f"FAIL if any cap is exceeded significantly.\n"
            f"\n"
            f"Respond with ONLY a JSON object with keys: verdict (PASS/FAIL/WARN), score (0-100), "
            f"rationale (one paragraph), and flags (array of strings)."
        )

        try:
            response = llm.invoke(prompt)
            text = response.content if hasattr(response, "content") else str(response)
            output = self._parse_output(text)
        except Exception as exc:
            return AgentResult(
                agent=self.name,
                verdict="WARN",
                score=0,
                rationale=f"LLM diversification analysis failed: {exc}",
                flags=["llm_error"],
            )

        return AgentResult(
            agent=self.name,
            verdict=output.verdict,
            score=output.score,
            rationale=output.rationale,
            flags=output.flags + flags,
            data={
                "sector": sector,
                "country": country,
                "current_sector_weight": current_sector_weight,
                "post_trade_sector_weight": post_trade_sector,
                "sector_cap": sector_cap,
                "post_trade_country_weight": post_trade_country,
                "country_cap": country_cap,
                "correlation": correlation,
            },
            data_sources=["portfolio_store", "yfinance"],
        )

    def _parse_output(self, text: str) -> AgentResult:
        import json
        import re

        json_match = re.search(r"\{[\s\S]*\}", text)
        if not json_match:
            return AgentResult(
                agent=self.name,
                verdict="WARN",
                score=50,
                rationale="Could not parse LLM response; defaulting to WARN",
                flags=["parse_error"],
            )

        try:
            parsed = json.loads(json_match.group(0))
            verdict = parsed.get("verdict", "WARN")
            if verdict not in ("PASS", "FAIL", "WARN"):
                verdict = "WARN"
            score = int(parsed.get("score", 50))
            score = max(0, min(100, score))
            rationale = parsed.get("rationale", "")
            flags = parsed.get("flags", [])
        except (json.JSONDecodeError, ValueError, TypeError):
            return AgentResult(
                agent=self.name,
                verdict="WARN",
                score=50,
                rationale="LLM returned malformed JSON; defaulting to WARN",
                flags=["parse_error"],
            )

        return AgentResult(
            agent=self.name,
            verdict=verdict,
            score=score,
            rationale=rationale,
            flags=flags,
        )