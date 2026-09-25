from __future__ import annotations

from typing import Dict

from schemas import AgentResult, ValidationResponse


HARD_GATES = {"fundamental_analysis", "quant_screen", "risk_limits"}
SOFT_GATES = {"technical", "diversification", "portfolio_alignment", "upside_thesis"}


def aggregate(results: Dict[str, AgentResult]) -> ValidationResponse:
    hard = {agent: results[agent] for agent in HARD_GATES if agent in results}
    soft = {agent: results[agent] for agent in SOFT_GATES if agent in results}

    hard_fails = {name: r.verdict for name, r in hard.items() if r.verdict == "FAIL"}
    hard_warns = {name: r.verdict for name, r in hard.items() if r.verdict == "WARN"}
    soft_fails = {name: r.verdict for name, r in soft.items() if r.verdict == "FAIL"}
    soft_warns = {name: r.verdict for name, r in soft.items() if r.verdict == "WARN"}

    if hard_fails:
        final_verdict = "REJECT"
    elif len(soft_fails) > 0:
        final_verdict = "REJECT"
    elif len(hard_warns) >= 2:
        final_verdict = "FLAG"
    elif len(soft_warns) + len(soft_fails) >= 3:
        final_verdict = "FLAG"
    elif len(soft_warns) >= 2 and not hard_fails:
        final_verdict = "FLAG"
    else:
        final_verdict = "APPROVE"

    rationale_parts = []
    if hard_fails:
        rationale_parts.append(f"Hard gate failure(s): {', '.join(hard_fails.keys())}")
    if soft_fails:
        rationale_parts.append(f"Soft gate failure(s): {', '.join(soft_fails.keys())}")
    if hard_warns:
        rationale_parts.append(f"Hard gate warnings: {', '.join(hard_warns.keys())}")
    if soft_warns:
        rationale_parts.append(f"Soft gate warnings: {', '.join(soft_warns.keys())}")

    if not rationale_parts:
        rationale_parts.append("All gates passed.")

    rationale = "; ".join(rationale_parts)

    risk_agent = results.get("risk_limits", None)
    stop_loss_price = None
    position_size_recommended = None
    if risk_agent and risk_agent.data:
        stop_loss_data = risk_agent.data.get("stop_loss_price")
        if stop_loss_data is not None:
            stop_loss_price = f"{stop_loss_data:.2f}"
        position_size_data = risk_agent.data.get("position_size_recommended")
        if position_size_data is not None and isinstance(position_size_data, (int, float)):
            position_size_recommended = f"{position_size_data:.1%}"

    short_hard = {"fundamental_analysis": "fundamental", "quant_screen": "quant_screen", "risk_limits": "risk_limits"}
    hard_gate_status = {}
    for agent_name in HARD_GATES:
        if agent_name in results:
            res = results[agent_name]
            key = short_hard.get(agent_name, agent_name)
            hard_gate_status[key] = res.verdict
        else:
            key = short_hard.get(agent_name, agent_name)
            hard_gate_status[key] = "WARN"

    short_soft = {"technical": "technical", "diversification": "diversification", "portfolio_alignment": "portfolio_alignment", "upside_thesis": "upside_thesis"}
    soft_gate_status = {}
    for agent_name in SOFT_GATES:
        if agent_name in results:
            res = results[agent_name]
            key = short_soft.get(agent_name, agent_name)
            soft_gate_status[key] = res.verdict
        else:
            key = short_soft.get(agent_name, agent_name)
            soft_gate_status[key] = "WARN"
    return ValidationResponse(
        final_verdict=final_verdict,
        hard_gate_status=hard_gate_status,
        soft_gate_status=soft_gate_status,
        rationale=rationale,
        position_size_recommended=position_size_recommended,
        stop_loss_price=stop_loss_price,
        agent_results=results,
    )