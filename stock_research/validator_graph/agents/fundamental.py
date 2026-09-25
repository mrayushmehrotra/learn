from __future__ import annotations

from typing import Any

from langchain_ollama import ChatOllama

from schemas import AgentResult, ValidationRequest
from agents.base import BaseAgent


class FundamentalAnalysisAgent(BaseAgent):
    name: str = "fundamental_analysis"

    async def run(self, request: ValidationRequest) -> AgentResult:
        llm = ChatOllama(
            model="qwen2.5:0.5b",
            temperature=0.1,
            num_ctx=2048,
        )

        from data.gs_quant_client import get_financials

        try:
            financials = get_financials(request.ticker)
        except Exception as exc:
            return AgentResult(
                agent=self.name,
                verdict="FAIL",
                score=0,
                rationale=f"Could not retrieve financial data: {exc}",
                flags=["data_unavailable"],
            )

        sector = financials.get("sector", "Unknown")
        pe = financials.get("trailing_pe", 0)
        pb = financials.get("price_to_book", 0)
        de = financials.get("debt_to_equity", 0)
        cr = financials.get("current_ratio", 0)
        ic = financials.get("interest_coverage", 0)
        peg = financials.get("earnings_growth_yoy", 0)
        roe = financials.get("return_on_equity", 0)
        margin = financials.get("profit_margin", 0)
        rev_growth = financials.get("revenue_growth_yoy", 0)
        beta = financials.get("beta", 0)
        market_cap = financials.get("market_cap", 0)

        prompt = (
            f"You are a fundamental analysis expert. Evaluate the stock {request.ticker} "
            f"for investment quality based on the following financial data:\n"
            f"Sector: {sector}\n"
            f"Market Cap: {market_cap}\n"
            f"Trailing P/E: {pe}\n"
            f"Price-to-Book: {pb}\n"
            f"Debt-to-Equity: {de}\n"
            f"Current Ratio: {cr}\n"
            f"Interest Coverage: {ic}\n"
            f"YoY Revenue Growth: {rev_growth}\n"
            f"YoY Earnings Growth: {peg}\n"
            f"Return on Equity: {roe}\n"
            f"Profit Margin: {margin}\n"
            f"Beta: {beta}\n"
            f"\n"
            f"Apply these pass/fail criteria:\n"
            f"- PASS: Pe > 0 and Pe < 50, De < 2.0, Current Ratio > 1.0, Interest Coverage > 2.0, "
            f"RoE > 10%, Profit Margin > 0%, Revenue Growth > 0%\n"
            f"- WARN: Pe > 0 and Pe < 80, De < 3.0, Current Ratio > 0.5, Interest Coverage > 1.0\n"
            f"- FAIL: Pe <= 0 or Pe >= 80, De >= 3.0, Current Ratio <= 0.5, Interest Coverage <= 1.0, "
            f"RoE <= 0%, Profit Margin <= -10%, Revenue Growth <= -20%\n"
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
                rationale=f"LLM analysis failed: {exc}",
                flags=["llm_error"],
            )

        return AgentResult(
            agent=self.name,
            verdict=output.verdict,
            score=output.score,
            rationale=output.rationale,
            flags=output.flags,
            data=financials,
            data_sources=["yfinance", "fundamentals"],
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