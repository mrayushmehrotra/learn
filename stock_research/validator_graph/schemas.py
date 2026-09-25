from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class AgentResult(BaseModel):
    agent: str
    verdict: Literal["PASS", "FAIL", "WARN"]
    score: int = Field(ge=0, le=100)
    rationale: str = ""
    flags: list[str] = []
    data: dict = {}
    data_sources: list[str] = []


class ValidationRequest(BaseModel):
    ticker: str
    gs_asset_id: Optional[str] = None
    proposed_position_size: Optional[float] = None
    portfolio_id: str = "default"


class ValidationResponse(BaseModel):
    final_verdict: Literal["APPROVE", "REJECT", "FLAG"]
    hard_gate_status: dict
    soft_gate_status: dict
    rationale: str
    position_size_recommended: Optional[str] = None
    stop_loss_price: Optional[str] = None
    agent_results: dict[str, AgentResult] = {}