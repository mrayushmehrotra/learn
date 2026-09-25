from __future__ import annotations

from langchain_ollama import ChatOllama

from schemas import AgentResult, ValidationRequest
from agents.base import BaseAgent


class UpsideThesisAgent(BaseAgent):
    name: str = "upside_thesis"

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
                rationale=f"Could not retrieve stock data: {exc}",
                flags=["data_unavailable"],
            )

        revenue_growth = financials.get("revenue_growth_yoy", 0)
        earnings_growth = financials.get("earnings_growth_yoy", 0)
        profit_margin = financials.get("profit_margin", 0)
        market_cap = financials.get("market_cap", 0)
        sector = financials.get("sector", "Unknown")
        company_name = financials.get("company_name", request.ticker)

        prompt = (
            f"You are an investment thesis analyst. Assess the upside potential for {request.ticker} "
            f"({company_name}, sector: {sector}).\n"
            f"Revenue Growth (YoY): {revenue_growth if revenue_growth else 'N/A'}\n"
            f"Earnings Growth (YoY): {earnings_growth if earnings_growth else 'N/A'}\n"
            f"Profit Margin: {profit_margin if profit_margin else 'N/A'}\n"
            f"Market Cap: {market_cap}\n"
            f"\n"
            f"Pass criteria:\n"
            f"- Revenue Growth > 5% (positive topline momentum)\n"
            f"- Earnings Growth > 0% (or positive profit margin trend)\n"
            f"- Clear sector tailwinds or fundamental drivers that can be stated as a thesis\n"
            f"\n"
            f"WARN if:\n"
            f"- Revenue Growth positive but < 5% (slow but stable)\n"
            f"- Earnings flat or mildly negative\n"
            f"\n"
            f"FAIL if:\n"
            f"- Revenue declining (negative growth)\n"
            f"- Both revenue and earnings negative\n"
            f"- No identifiable catalyst or growth driver\n"
            f"\n"
            f"Respond with ONLY a JSON object with keys: verdict (PASS/FAIL/WARN), score (0-100), "
            f"rationale (one paragraph), flags (array of strings), "
            f"thesis_statement (one sentence describing the upside thesis), "
            f"catalysts (array of identified catalysts), "
            f"estimate_revision_trend (flat/positive/negative)."
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
                rationale=f"LLM thesis analysis failed: {exc}",
                flags=["llm_error"],
            )

        output_data = dict(output.data)
        output_data.update({
            "revenue_growth": revenue_growth,
            "earnings_growth": earnings_growth,
        })
        output.data = output_data

        return output

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
            data = {
                "thesis_statement": parsed.get("thesis_statement", ""),
                "catalysts": parsed.get("catalysts", []),
                "estimate_revision_trend": parsed.get("estimate_revision_trend", "flat"),
            }
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
            flags=flags, data=data,
        )