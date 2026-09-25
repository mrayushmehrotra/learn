from __future__ import annotations

from typing import Any

import pandas as pd
from langchain_ollama import ChatOllama

from schemas import AgentResult, ValidationRequest
from agents.base import BaseAgent


class TechnicalSignalAgent(BaseAgent):
    name: str = "technical"

    async def run(self, request: ValidationRequest) -> AgentResult:
        llm = ChatOllama(
            model="qwen2.5:0.5b",
            temperature=0.1,
            num_ctx=2048,
        )

        from data.gs_quant_client import get_price_history

        try:
            df = get_price_history(request.ticker, lookback="6mo", interval="1d")
        except Exception as exc:
            return AgentResult(
                agent=self.name,
                verdict="FAIL",
                score=0,
                rationale=f"Could not retrieve price data: {exc}",
                flags=["data_unavailable"],
            )

        if df.empty or len(df) < 50:
            return AgentResult(
                agent=self.name,
                verdict="FAIL",
                score=0,
                rationale="Insufficient price history (need >= 50 days)",
                flags=["insufficient_data"],
            )

        close = df["Close"]
        current_price = float(close.iloc[-1])

        sma_50 = float(close.rolling(50).mean().iloc[-1])
        sma_200 = float(close.rolling(200).mean().iloc[-1]) if len(close) >= 200 else sma_50 * 0.95

        delta = close.diff()
        gain = delta.where(delta > 0, 0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / loss.replace(0, 0.001)
        rsi = float((100 - (100 / (1 + rs))).iloc[-1])

        ema_12 = close.ewm(span=12).mean().iloc[-1]
        ema_26 = close.ewm(span=26).mean().iloc[-1]
        macd_line = close.ewm(span=12).mean() - close.ewm(span=26).mean()
        macd_signal_line = macd_line.ewm(span=9).mean()
        macd_hist = float((macd_line - macd_signal_line).iloc[-1])
        macd_prev = float((macd_line - macd_signal_line).iloc[-2]) if len(close) >= 2 else 0

        vol_ratio = float(df["Volume"].iloc[-1] / df["Volume"].tail(20).mean()) if "Volume" in df.columns else 1.0

        high = df["High"]
        low = df["Low"]
        tr = pd.concat([high - low, (high - close.shift()).abs(), (low - close.shift()).abs()], axis=1).max(axis=1)
        atr = float(tr.rolling(14).mean().iloc[-1])

        signals_triggered = []
        if current_price > sma_50:
            signals_triggered.append("price_above_50_sma")
        else:
            signals_triggered.append("price_below_50_sma")

        if current_price > sma_200:
            signals_triggered.append("price_above_200_sma")

        if rsi < 70 and rsi > 30:
            signals_triggered.append("rsi_neutral")
        elif rsi < 30:
            signals_triggered.append("rsi_oversold")
        elif rsi > 70:
            signals_triggered.append("rsi_overbought")

        if macd_hist > 0 and macd_prev <= 0:
            signals_triggered.append("macd_bullish_crossover")
        elif macd_hist < 0 and macd_prev >= 0:
            signals_triggered.append("macd_bearish_crossover")

        if vol_ratio > 1.5:
            signals_triggered.append("high_volume")

        if vol_ratio < 0.5:
            signals_triggered.append("low_volume")

        bullish_count = sum(
            1 for s in signals_triggered
            if s in ("price_above_50_sma", "price_above_200_sma", "macd_bullish_crossover", "rsi_oversold")
        )
        bearish_count = sum(
            1 for s in signals_triggered
            if s in ("price_below_50_sma", "macd_bearish_crossover", "rsi_overbought")
        )

        prompt = (
            f"You are a technical analyst. Evaluate {request.ticker} based on these technical indicators:\n"
            f"Current Price: {current_price:.2f}\n"
            f"SMA(50): {sma_50:.2f}\n"
            f"SMA(200): {sma_200:.2f}\n"
            f"RSI(14): {rsi:.1f}\n"
            f"MACD Histogram: {macd_hist:.4f} (prev: {macd_prev:.4f})\n"
            f"ATR(14): {atr:.2f}\n"
            f"Volume Ratio (vs 20d avg): {vol_ratio:.2f}\n"
            f"Signals triggered: {', '.join(signals_triggered)}\n"
            f"\n"
            f"Pass criteria (at least 2 must agree for PASS):\n"
            f"- Price above SMA(50) and SMA(200) with volume confirmation\n"
            f"- RSI recovering from oversold (< 35) or bullish divergence\n"
            f"- MACD bullish crossover (histogram turned positive)\n"
            f"- Volume surge confirming price move\n"
            f"\n"
            f"1-2 signals = WARN. 0 signals or 2+ bearish = FAIL.\n"
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
                rationale=f"LLM technical analysis failed: {exc}",
                flags=["llm_error"],
            )

        return AgentResult(
            agent=self.name,
            verdict=output.verdict,
            score=output.score,
            rationale=output.rationale,
            flags=output.flags + signals_triggered,
            data={
                "price": current_price,
                "sma_50": sma_50,
                "sma_200": sma_200,
                "rsi": rsi,
                "macd_histogram": macd_hist,
                "atr": atr,
                "vol_ratio": vol_ratio,
                "signals_triggered": signals_triggered,
                "bullish_count": bullish_count,
                "bearish_count": bearish_count,
            },
            data_sources=["yfinance"],
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