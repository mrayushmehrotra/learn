from __future__ import annotations

from langchain_ollama import ChatOllama

from schemas import AgentResult, ValidationRequest
from agents.base import BaseAgent


class QuantScreenAgent(BaseAgent):
    name: str = "quant_screen"

    async def run(self, request: ValidationRequest) -> AgentResult:
        llm = ChatOllama(
            model="qwen2.5:0.5b",
            temperature=0.1,
            num_ctx=2048,
        )

        from data.gs_quant_client import get_financials, get_volatility

        try:
            financials = get_financials(request.ticker)
            vol_data = get_volatility(request.ticker, lookback="1y")
        except Exception as exc:
            return AgentResult(
                agent=self.name,
                verdict="FAIL",
                score=0,
                rationale=f"Could not retrieve screening data: {exc}",
                flags=["data_unavailable"],
            )

        pe = financials.get("trailing_pe", 0)
        pb = financials.get("price_to_book", 0)
        ev_ebitda = financials.get("ev_to_ebitda", 0)
        beta = financials.get("beta", 0)
        market_cap = financials.get("market_cap", 0)
        avg_vol = financials.get("average_volume", 0)
        sector = financials.get("sector", "Unknown")
        annualized_vol = vol_data.get("annualized_vol", 0)
        dividend_yield = financials.get("dividend_yield", 0)

        prompt = (
            f"You are a quantitative screening analyst. Evaluate {request.ticker} for "
            f"overvaluation and speculation risk based on these metrics:\n"
            f"Sector: {sector}\n"
            f"Trailing P/E: {pe}\n"
            f"Price-to-Book: {pb}\n"
            f"EV/EBITDA: {ev_ebitda}\n"
            f"Beta: {beta}\n"
            f"Annualized Volatility: {annualized_vol:.4f}\n"
            f"Market Cap: {market_cap}\n"
            f"Average Volume: {avg_vol}\n"
            f"Dividend Yield: {dividend_yield}\n"
            f"\n"
            f"Apply these screening rules:\n"
            f"- FLAG as speculative if: Market Cap < 2 billion AND Beta > 1.5 AND Dividend Yield is null/zero\n"
            f"- FLAG if P/E > 80 or (P/E > 0 and EV/EBITDA > 40)\n"
            f"- WARN if Beta > 2.0 or Annualized Vol > 0.6\n"
            f"- WARN if Average Volume < 500000 (low liquidity)\n"
            f"- PASS if valuation metrics are reasonable relative to sector and volatility is moderate\n"
            f"- FAIL if P/E is negative AND Beta > 1 AND Market Cap < 1 billion\n"
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
                rationale=f"LLM screening failed: {exc}",
                flags=["llm_error"],
            )

        return AgentResult(
            agent=self.name,
            verdict=output.verdict,
            score=output.score,
            rationale=output.rationale,
            flags=output.flags,
            data={
                "pe": pe,
                "pb": pb,
                "ev_ebitda": ev_ebitda,
                "beta": beta,
                "annualized_vol": annualized_vol,
                "market_cap": market_cap,
                "avg_volume": avg_vol,
            },
            data_sources=["yfinance", "gs_quant volatility"],
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