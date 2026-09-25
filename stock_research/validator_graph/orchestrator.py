from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import StateGraph, START, END

from schemas import AgentResult, ValidationRequest, ValidationResponse
from agents.base import BaseAgent
from agents.fundamental import FundamentalAnalysisAgent
from agents.quant_screen import QuantScreenAgent
from agents.technical import TechnicalSignalAgent
from agents.diversification import DiversificationAgent
from agents.risk_limits import RiskLimitsAgent
from agents.portfolio_alignment import PortfolioAlignmentAgent
from agents.upside_thesis import UpsideThesisAgent
from chief_validator import aggregate


class OrchestratorState(TypedDict):
    request: Optional[dict]
    agent_results: Dict[str, AgentResult]
    final_verdict: Optional[ValidationResponse]
    error: Optional[str]


def _build_agents() -> List[BaseAgent]:
    return [
        FundamentalAnalysisAgent(),
        QuantScreenAgent(),
        TechnicalSignalAgent(),
        DiversificationAgent(),
        RiskLimitsAgent(),
        PortfolioAlignmentAgent(),
        UpsideThesisAgent(),
    ]


async def run_agents(state: OrchestratorState) -> dict:
    req_data = state.get("request")
    if not req_data:
        return {"error": "No request data in state"}
    request = ValidationRequest(**req_data)
    agents = _build_agents()

    tasks = [agent._run_with_timeout(request, timeout=60) for agent in agents]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    agent_results: Dict[str, AgentResult] = {}
    for result in results:
        if isinstance(result, Exception):
            continue
        if isinstance(result, AgentResult):
            agent_results[result.agent] = result

    return {"agent_results": agent_results}


async def run_chief_validator(state: OrchestratorState) -> dict:
    results = state.get("agent_results", {})
    if not results:
        error = "No agent results to validate"
        return {"error": error}
    verdict = aggregate(results)
    return {"final_verdict": verdict}


def build_graph() -> StateGraph:
    graph = StateGraph(OrchestratorState)

    graph.add_node("run_agents", run_agents)
    graph.add_node("chief_validator", run_chief_validator)

    graph.add_edge(START, "run_agents")
    graph.add_edge("run_agents", "chief_validator")
    graph.add_edge("chief_validator", END)

    compiled = graph.compile()
    return compiled


async def run_pipeline(request: ValidationRequest) -> ValidationResponse:
    graph = build_graph()
    initial_state: OrchestratorState = {
        "request": request.model_dump(),
        "agent_results": {},
        "final_verdict": None,
        "error": None,
    }

    result = await graph.ainvoke(initial_state)

    if result.get("error"):
        raise RuntimeError(result["error"])

    final = result.get("final_verdict")
    if not isinstance(final, ValidationResponse):
        raise RuntimeError("Pipeline did not produce a valid final verdict")

    return final