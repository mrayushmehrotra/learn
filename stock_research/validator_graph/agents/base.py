from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod

from schemas import AgentResult, ValidationRequest


class BaseAgent(ABC):
    name: str = ""

    @abstractmethod
    async def run(self, request: ValidationRequest) -> AgentResult:
        raise NotImplementedError

    async def _run_with_timeout(self, request: ValidationRequest, timeout: int = 60) -> AgentResult:
        try:
            return await asyncio.wait_for(self.run(request), timeout=timeout)
        except asyncio.TimeoutError:
            return AgentResult(
                agent=self.name,
                verdict="WARN",
                score=0,
                rationale=f"Agent timed out after {timeout}s",
                flags=["timeout"],
            )
        except Exception as exc:
            return AgentResult(
                agent=self.name,
                verdict="FAIL",
                score=0,
                rationale=f"Agent errored: {exc}",
                flags=["execution_error"],
            )