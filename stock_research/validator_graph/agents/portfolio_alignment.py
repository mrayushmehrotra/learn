from __future__ import annotations

from langchain_ollama import ChatOllama

from schemas import AgentResult, ValidationRequest
from agents.base import BaseAgent


class PortfolioAlignmentAgent(BaseAgent):
    name: str = "portfolio_alignment"

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
                rationale="No portfolio data; skipping portfolio alignment check.",
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
                rationale=f"Could not retrieve stock data: {exc}",
                flags=["data_unavailable"],
            )

        market_cap = financials.get("market_cap", 0)
        dividend_yield = financials.get("dividend_yield", 0)
        avg_volume = financials.get("average_volume", 0)
        sector = financials.get("sector", "Technology")
        pe = financials.get("trailing_pe", 0)
        profit_margin = financials.get("profit_margin", 0)
        beta = financials.get("beta", 1.0)

        limit = 15_000_000_000
        liquidity_quality = "high" if avg_volume > 1_000_000 else "medium" if avg_volume > 200_000 else "low"

        income_qualities = ["dividend", "high_yield", "stable_income", "reit", "bond"]
        is_income_stock = any(
            keyword in (financials.get("industry", "") or "").lower()
            for keyword in income_qualities
        ) or (dividend_yield or 0) > 3

        mandate_match = not (portfolio.mandate == "income" and pe > 0 and (dividend_yield or 0) < 1)

        role_classification = (
            "core"
            if market_cap > limit
            else "tactical"
            if market_cap > limit * 0.2
            else "speculative"
        )

        prompt = (
            f"You are a portfolio alignment analyst. Evaluate whether {request.ticker} "
            f"aligns with the portfolio '{portfolio.name}' (mandate: {portfolio.mandate}).\n"
            f"Stock data:\n"
            f"  Sector: {sector}\n"
            f"  Market Cap: {market_cap}\n"
            f"  P/E: {pe}\n"
            f"  Dividend Yield: {dividend_yield}\n"
            f"  Profit Margin: {profit_margin}\n"
            f"  Beta: {beta}\n"
            f"  Avg Daily Volume: {avg_volume} (liquidity: {liquidity_quality})\n"
            f"  Role Classification: {role_classification}\n"
            f"  Mandate Match (income check): {mandate_match}\n"
            f"\n"
            f"Pass criteria:\n"
            f"- Stock's role ({role_classification}) is compatible with mandate ({portfolio.mandate})\n"
            f"- Liquidity ({liquidity_quality}) supports expected entry/exit size\n"
            f"- Mandate match is true\n"
            f"\n"
            f"WARN if some criteria met but stock's role is borderline for the mandate.\n"
            f"FAIL if mandate contradiction (e.g. income mandate with zero-dividend growth stock) "
            f"or liquidity is too low.\n"
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
                rationale=f"LLM alignment analysis failed: {exc}",
                flags=["llm_error"],
            )

        return AgentResult(
            agent=self.name,
            verdict=output.verdict,
            score=output.score,
            rationale=output.rationale,
            flags=output.flags,
            data={
                "mandate_match": mandate_match,
                "role_classification": role_classification,
                "liquidity_quality": liquidity_quality,
                "sector": sector,
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