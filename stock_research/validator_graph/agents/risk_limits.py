from __future__ import annotations

import math

from langchain_ollama import ChatOllama

from schemas import AgentResult, ValidationRequest
from agents.base import BaseAgent


class RiskLimitsAgent(BaseAgent):
    name: str = "risk_limits"

    async def run(self, request: ValidationRequest) -> AgentResult:
        llm = ChatOllama(
            model="qwen2.5:0.5b",
            temperature=0.1,
            num_ctx=2048,
        )

        from data.gs_quant_client import get_price_history, get_volatility, get_financials

        try:
            df = get_price_history(request.ticker, lookback="1y", interval="1d")
            vol_data = get_volatility(request.ticker, lookback="1y")
            financials = get_financials(request.ticker)
        except Exception as exc:
            return AgentResult(
                agent=self.name,
                verdict="FAIL",
                score=0,
                rationale=f"Could not retrieve risk data: {exc}",
                flags=["data_unavailable"],
            )

        if df.empty or len(df) < 20:
            return AgentResult(
                agent=self.name,
                verdict="FAIL",
                score=0,
                rationale="Insufficient data for risk calculation",
                flags=["insufficient_data"],
            )

        close = df["Close"]
        high = df["High"]
        low = df["Low"]
        current_price = float(close.iloc[-1])

        tr = (high - low).combine((high - close.shift()).abs(), max).combine(
            (low - close.shift()).abs(), max
        )
        atr = float(tr.rolling(14).mean().iloc[-1])

        annualized_vol = vol_data.get("annualized_vol", 0.0)
        beta = financials.get("beta", 1.0)
        avg_volume = financials.get("average_volume", 0)
        market_cap = financials.get("market_cap", 0)

        portfolio_risk_budget = 0.02
        proposed_position_size = request.proposed_position_size or 0.01
        stop_loss_price = current_price - (2 * atr)
        stop_loss_pct = ((stop_loss_price / current_price) - 1) * 100
        max_loss_per_unit = abs(stop_loss_pct) / 100
        position_size_from_risk = (
            portfolio_risk_budget / max_loss_per_unit if max_loss_per_unit > 0 else 1.0
        )
        position_size_from_risk = min(max(position_size_from_risk, 0.0), 1.0)

        var_estimate = annualized_vol * 1.645 * math.sqrt(1 / 252)
        var_contribution = var_estimate * proposed_position_size

        prompt = (
            f"You are a risk management specialist. Evaluate risk for {request.ticker} at "
            f"current price {current_price:.2f}.\n"
            f"ATR(14): {atr:.2f} ({(atr / current_price * 100):.2f}% of price)\n"
            f"Stop-loss price (entry - 2xATR): {stop_loss_price:.2f} ({stop_loss_pct:.2f}%)\n"
            f"Annualized Volatility: {annualized_vol:.4f}\n"
            f"Beta: {beta}\n"
            f"Avg Daily Volume: {avg_volume}\n"
            f"Proposed Position Size: {proposed_position_size:.1%} of portfolio\n"
            f"Portfolio Risk Budget: {portfolio_risk_budget:.0%} per position\n"
            f"1-day VaR (95%): {var_estimate:.4f} ({var_estimate * current_price:.2f} per unit)\n"
            f"\n"
            f"Pass criteria:\n"
            f"- Stop-loss within 2-10% of entry price (healthy position sizing)\n"
            f"- Position risk contribution is within budget\n"
            f"- Stop-loss is not too tight (could get stopped out by noise) or too loose (large loss)\n"
            f"- PASS if stop-loss is 3-15% below entry and position size <= risk budget\n"
            f"- WARN if stop-loss is < 3% (too tight) or > 20% (too loose)\n"
            f"- FAIL if no reasonable stop-loss can be set\n"
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
                rationale=f"LLM risk analysis failed: {exc}",
                flags=["llm_error"],
            )

        return AgentResult(
            agent=self.name,
            verdict=output.verdict,
            score=output.score,
            rationale=output.rationale,
            flags=output.flags,
            data={
                "current_price": current_price,
                "atr": atr,
                "stop_loss_price": stop_loss_price,
                "stop_loss_pct": stop_loss_pct,
                "position_size_recommended": round(position_size_from_risk, 4),
                "annualized_volatility": annualized_vol,
                "one_day_var_95pct": round(var_estimate, 6),
                "var_contribution_pct": round(var_contribution, 6),
                "beta": beta,
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