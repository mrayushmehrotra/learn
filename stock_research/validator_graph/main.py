from __future__ import annotations

import argparse
import asyncio
import json
import sys

from schemas import ValidationRequest
from orchestrator import run_pipeline


async def main_async(ticker: str, portfolio_id: str = "default",
                     position_size: float = 0.02, output_json: bool = False) -> None:
    request = ValidationRequest(
        ticker=ticker,
        portfolio_id=portfolio_id,
        proposed_position_size=position_size,
    )

    try:
        result = await run_pipeline(request)
    except Exception as exc:
        print(f"Pipeline error: {exc}", file=sys.stderr)
        sys.exit(1)

    if output_json:
        print(json.dumps(result.model_dump(), indent=2, default=str))
    else:
        _print_result(ticker, result)


def _print_result(ticker: str, result) -> None:
    print(f"\n{'=' * 60}")
    print(f"  STOCK RECOMMENDATION VALIDATOR — {ticker}")
    print(f"{'=' * 60}")
    verdict = result.final_verdict
    color = _color(verdict)
    print(f"  FINAL VERDICT: {color}{verdict}{_reset()}")
    print(f"{'=' * 60}")
    print(f"  Rationale: {result.rationale}")
    print()

    print(f"  Hard Gates:")
    for gate, status in result.hard_gate_status.items():
        print(f"    {gate:<20} {status}")
    print()

    print(f"  Soft Gates:")
    for gate, status in result.soft_gate_status.items():
        print(f"    {gate:<20} {status}")
    print()

    if result.stop_loss_price:
        print(f"  Suggested Stop-Loss: {result.stop_loss_price}")
    if result.position_size_recommended:
        print(f"  Recommended Position Size: {result.position_size_recommended}")
    print(f"{'=' * 60}")
    print()

    print(f"  --- Agent Details ---")
    for agent_name, agent_result in result.agent_results.items():
        print(f"  [{agent_name}]")
        print(f"    Verdict: {agent_result.verdict} (Score: {agent_result.score})")
        if agent_result.rationale:
            print(f"    Rationale: {agent_result.rationale[:200]}...")
        if agent_result.flags:
            print(f"    Flags: {', '.join(agent_result.flags[:5])}")
        print()


def _color(verdict: str) -> str:
    if verdict == "APPROVE":
        return "\033[92m"
    elif verdict == "REJECT":
        return "\033[91m"
    elif verdict == "FLAG":
        return "\033[93m"
    return ""


def _reset() -> str:
    return "\033[0m"


def main() -> None:
    parser = argparse.ArgumentParser(description="Stock Recommendation Validator — LangGraph + Ollama")
    parser.add_argument("ticker", help="Stock ticker to validate (e.g. RELIANCE, TCS, HDFCBANK)")
    parser.add_argument("--portfolio", "-p", default="default", help="Portfolio ID")
    parser.add_argument("--position-size", "-s", type=float, default=0.02,
                        help="Proposed position size as fraction of portfolio (default: 0.02)")
    parser.add_argument("--json", "-j", action="store_true", help="Output as JSON")

    args = parser.parse_args()

    asyncio.run(main_async(
        ticker=args.ticker.upper(),
        portfolio_id=args.portfolio,
        position_size=args.position_size,
        output_json=args.json,
    ))


if __name__ == "__main__":
    main()