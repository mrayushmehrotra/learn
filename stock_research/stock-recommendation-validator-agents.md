# Stock Recommendation Validator — Sub-Agent Architecture

## Purpose

Your main agent generates a stock recommendation. Before that recommendation is acted on,
it gets routed through a panel of **7 specialist sub-agents**, each responsible for one
validation gate. A final **Chief Validator agent** aggregates their verdicts into a single
APPROVE / REJECT / FLAG decision with reasoning.

This is designed to plug into a GS Quant–based Python pipeline, where GS Quant (`gs_quant`)
supplies market data, risk analytics, and pricing/curve functions that the sub-agents call
into.

```
Main Agent (generates recommendation)
        │
        ▼
 ┌─────────────────────────────────────────────┐
 │           Orchestrator / Router               │
 └─────────────────────────────────────────────┘
        │
        ├── Agent 1: Fundamental Analysis
        ├── Agent 2: Quantitative Screen
        ├── Agent 3: Technical Signal Confirmation
        ├── Agent 4: Diversification & Concentration Risk
        ├── Agent 5: Risk Limits & Stop-Loss
        ├── Agent 6: Portfolio Alignment
        └── Agent 7: Sustained Upside Thesis
        │
        ▼
 ┌─────────────────────────────────────────────┐
 │        Chief Validator (aggregator)           │
 │   APPROVE / REJECT / FLAG + rationale         │
 └─────────────────────────────────────────────┘
        │
        ▼
   Back to Main Agent → execution / logging
```

---

## Agent 1 — Fundamental Analysis

**Checks:** earnings stability, revenue growth, balance sheet strength, valuation metrics.

**Inputs needed:**

- Trailing 3–5 years EPS, revenue (YoY and CAGR)
- Debt/Equity, Current Ratio, Interest Coverage
- P/E, P/B, EV/EBITDA vs. sector median

**Pass criteria (example thresholds — tune to your universe):**

- EPS growth positive in ≥3 of last 5 years, no single-year decline >20%
- Revenue CAGR ≥ sector median
- Debt/Equity below sector median or below a hard cap (e.g., 1.5x)
- Valuation multiple within X% of sector median (flag if >2 std dev above)

**Output schema:**

```json
{
  "agent": "fundamental_analysis",
  "verdict": "PASS | FAIL | WARN",
  "score": 0-100,
  "flags": ["e.g. revenue growth below sector median"],
  "data_sources": ["financials API / GS Quant fundamentals dataset"]
}
```

---

## Agent 2 — Quantitative Screen

**Checks:** filters out overvalued or speculative names.

**Inputs needed:**

- Valuation percentile rank within sector/universe
- Volatility (realized + implied, via GS Quant `Volatility` measures)
- Short interest, float, market cap tier
- Speculative-grade flags (e.g., negative earnings + high beta + low liquidity)

**Pass criteria:**

- Not in top decile of valuation within peer group, unless justified by Agent 1/7
- Beta and implied vol within acceptable band for your risk tolerance
- Excludes penny-stock / illiquid-float characteristics unless explicitly flagged as speculative bet

**Output schema:** same shape as Agent 1, with `flags` specific to overvaluation/speculation.

---

## Agent 3 — Technical Signal Confirmation

**Checks:** trend reversal or bullish momentum.

**Inputs needed:**

- Price series (OHLCV), moving averages (50/100/200 DMA)
- Momentum indicators: RSI, MACD, ADX
- Volume trend confirmation

**Pass criteria:**

- Price crossing above key MA with volume confirmation, OR
- RSI recovering from oversold with bullish divergence, OR
- MACD bullish crossover
- At least 2 independent signals should agree — single-indicator triggers get `WARN`, not `PASS`

**Output schema:** includes `signals_triggered: []` listing which indicators fired.

---

## Agent 4 — Sector & Geographic Diversification

**Checks:** avoids concentration risk at the portfolio level.

**Inputs needed:**

- Current portfolio sector/geography weights (from your holdings ledger)
- Proposed position's sector/geography
- Correlation of proposed stock to existing top holdings

**Pass criteria:**

- Adding this position does not push any sector weight above your defined cap (e.g., 25%)
- Adding this position does not push any single-country exposure above cap
- Correlation to existing top 5 holdings below threshold (e.g., 0.7), or flagged if not

**Output schema:** includes `post_trade_sector_weight`, `post_trade_geo_weight`.

---

## Agent 5 — Risk Limits & Stop-Loss

**Checks:** defines stop-loss levels and risk limits before entry.

**Inputs needed:**

- ATR (Average True Range) or historical volatility for stop distance
- Account/portfolio risk budget (e.g., max 1–2% portfolio risk per position)
- GS Quant risk measures (VaR contribution, scenario shocks) if available

**Pass criteria:**

- Stop-loss level calculated (e.g., entry − 2×ATR) and position size derived from risk budget
- Position's contribution to portfolio VaR stays under cap
- Max loss in a defined stress scenario (e.g., -10% sector shock) stays within tolerance

**Output schema:** includes `stop_loss_price`, `position_size_recommended`, `var_contribution`.

---

## Agent 6 — Portfolio Alignment

**Checks:** alignment with overall portfolio goals (growth/income/hedging mandate, time horizon, liquidity needs).

**Inputs needed:**

- Stated portfolio mandate/objective (growth, income, capital preservation, etc.)
- Stock's role classification (core holding, tactical trade, hedge)
- Liquidity needs / time horizon of the fund or account

**Pass criteria:**

- Stock's expected holding period matches account's time horizon
- Stock's role (e.g., high-growth/no-dividend) doesn't contradict a stated income mandate
- Liquidity of the stock (avg daily volume) supports expected entry/exit size

**Output schema:** includes `mandate_match: true/false`, `role_classification`.

---

## Agent 7 — Sustained Upside Thesis

**Checks:** verifies a clear path to sustained upside even if short-term trends are negative.

**Inputs needed:**

- Forward catalysts (earnings dates, product launches, regulatory events)
- Analyst estimate revisions (trend, not just level)
- Structural/thematic tailwinds (industry growth, market share trajectory)

**Pass criteria:**

- At least one identifiable forward catalyst within a defined window (e.g., 2 quarters)
- Estimate revisions trend flat-to-positive (not sharply negative)
- Thesis can be stated as one sentence citing a specific, falsifiable catalyst — not just "market sentiment"

**Output schema:** includes `thesis_statement`, `catalysts: []`, `estimate_revision_trend`.

---

## Chief Validator — Aggregation Logic

Runs after all 7 agents return. Suggested aggregation rule (tune to taste):

- **REJECT** if any of Agents 1, 2, 5 (fundamentals, quant screen, risk limits) return `FAIL`
  — these are treated as hard gates.
- **FLAG for manual review** if 2+ agents return `WARN`, or if Agent 3 (technical) is the
  only agent supporting entry while Agent 1/2 are borderline.
- **APPROVE** if all 7 return `PASS`, or all hard-gate agents `PASS` and soft-gate agents
  (3, 4, 6, 7) have at most one `WARN`.

**Output schema:**

```json
{
  "final_verdict": "APPROVE | REJECT | FLAG",
  "hard_gate_status": {
    "fundamental": "PASS",
    "quant_screen": "PASS",
    "risk_limits": "PASS"
  },
  "soft_gate_status": {
    "technical": "PASS",
    "diversification": "WARN",
    "portfolio_alignment": "PASS",
    "upside_thesis": "PASS"
  },
  "rationale": "One-paragraph human-readable summary",
  "position_size_recommended": "...",
  "stop_loss_price": "..."
}
```

---

## Implementation Notes (GS Quant-specific)

- Use `gs_quant.markets.securities` to resolve tickers to GS asset IDs before fanning out
  to sub-agents, so every agent works off the same instrument reference.
- Agents 2 and 5 are the most natural fits for GS Quant's risk/measures API (volatility,
  VaR-style measures) — pull these once at the orchestrator level and pass down, rather
  than each agent independently querying, to avoid rate-limit issues and inconsistent
  timestamps across agents.
- Consider running Agents 1, 2, 3, 4 in parallel (independent data pulls), then running
  Agent 5 and 6 sequentially after, since they depend on portfolio-level state that should
  reflect the _outcome_ of earlier checks (e.g., proposed position size feeds into risk
  limit and diversification calcs).
- Log every agent's raw output (not just PASS/FAIL) — you'll want this for backtesting the
  screening rules themselves later, not just the stock picks.

## Open Items to Fill In Before Building

- [ ] Exact numeric thresholds per agent (sector caps, VaR caps, valuation bands)
- [ ] Data source for portfolio state (ledger/DB schema)
- [ ] Whether Chief Validator's decision is fully automated or requires human sign-off on FLAG/REJECT
- [ ] Cadence: is this run once per recommendation, or re-run periodically on open positions?

---

## Step-by-Step Build Plan

Build in this order. Each step produces something runnable before you move to the next —
don't try to build all 7 agents in parallel from scratch, you'll end up debugging 7 things
at once with no way to isolate a failure.

### Step 0 — Environment & project skeleton

```
validator/
├── agents/
│   ├── __init__.py
│   ├── base.py              # shared Agent interface
│   ├── fundamental.py        # Agent 1
│   ├── quant_screen.py       # Agent 2
│   ├── technical.py          # Agent 3
│   ├── diversification.py    # Agent 4
│   ├── risk_limits.py        # Agent 5
│   ├── portfolio_alignment.py# Agent 6
│   └── upside_thesis.py      # Agent 7
├── chief_validator.py
├── orchestrator.py
├── schemas.py                 # Pydantic models for I/O
├── data/
│   ├── gs_quant_client.py     # thin wrapper around gs_quant calls
│   └── portfolio_store.py     # reads current holdings/weights
├── tests/
└── main.py                    # entrypoint called by your recommendation agent
```

Install and authenticate GS Quant first, in isolation, before writing any agent logic:

```bash
pip install gs-quant
python -c "from gs_quant.session import GsSession; GsSession.use(); print('auth ok')"
```

Confirm this works before Step 1. If GS Quant auth fails, every downstream agent fails
silently in confusing ways.

### Step 1 — Define the shared contracts first

Write `schemas.py` before any agent logic. Every agent's output must conform to one
Pydantic model so the Chief Validator can consume them uniformly:

```python
from pydantic import BaseModel
from typing import Literal, Optional

class AgentResult(BaseModel):
    agent: str
    verdict: Literal["PASS", "FAIL", "WARN"]
    score: int  # 0-100
    flags: list[str] = []
    data: dict = {}          # agent-specific extra fields (stop_loss_price, thesis, etc.)
    data_sources: list[str] = []

class ValidationRequest(BaseModel):
    ticker: str
    gs_asset_id: Optional[str] = None
    proposed_position_size: Optional[float] = None
    portfolio_id: str
```

Locking this schema first means every agent you build afterward has a fixed target —
you're not renegotiating the interface every time you add an agent.

### Step 2 — Write `base.py`: one abstract Agent class

```python
from abc import ABC, abstractmethod
from schemas import ValidationRequest, AgentResult

class BaseAgent(ABC):
    name: str

    @abstractmethod
    async def run(self, request: ValidationRequest) -> AgentResult:
        ...
```

Every one of the 7 agents subclasses this. This is what lets the orchestrator call all
7 the same way (`asyncio.gather`) without special-casing any of them.

### Step 3 — Build the GS Quant data wrapper before any agent

`data/gs_quant_client.py` should expose plain functions like `get_fundamentals(asset_id)`,
`get_volatility(asset_id)`, `get_price_history(asset_id, lookback)`. Build and unit-test
these in isolation, with real API calls against 2–3 known tickers, before any agent
imports them. This way, if an agent misbehaves later, you already know the raw data
layer is trustworthy and the bug is in the agent's logic, not the data fetch.

### Step 4 — Build agents in hard-gate order: 1, 2, 5 first

Build Agent 1 (Fundamental), Agent 2 (Quant Screen), and Agent 5 (Risk Limits) before
the other four. They're your hard gates — the ones that can REJECT outright — so they're
also the ones you most need working correctly early. For each:

1. Write the agent against one hardcoded ticker, printing raw output — no verdict logic yet.
2. Add the PASS/FAIL/WARN thresholds from the "Open Items" checklist above.
3. Write one test asserting a known-good stock PASSes and one known-bad stock FAILs.

Do not move to the next agent until this one returns a correct verdict on at least 2
test tickers.

### Step 5 — Build the remaining soft-gate agents: 3, 4, 6, 7

Same process as Step 4, in any order — Technical, Diversification, Portfolio Alignment,
Upside Thesis. These feed the FLAG logic rather than hard rejection, so slightly looser
thresholds here are lower-risk than in Step 4.

Note Agent 4 (Diversification) and Agent 6 (Portfolio Alignment) both need
`data/portfolio_store.py` — build that alongside Agent 4, since it's needed first.

### Step 6 — Build `orchestrator.py`

```python
import asyncio
from schemas import ValidationRequest

async def run_all_agents(request: ValidationRequest, agents: list[BaseAgent]):
    results = await asyncio.gather(*(agent.run(request) for agent in agents))
    return {r.agent: r for r in results}
```

Run this with all 7 agents wired in and confirm you get back a dict of 7 `AgentResult`
objects for a real ticker before writing the Chief Validator. At this point you have
7 independent opinions but no decision yet — that's expected and correct.

### Step 7 — Build `chief_validator.py`

Implement the aggregation rule from the "Chief Validator" section above as a pure
function that takes the dict of 7 `AgentResult`s and returns the final verdict object.
Keep this function pure (no I/O, no API calls) so it's trivial to unit test with
fabricated `AgentResult` combinations — feed it all-PASS, one hard-gate FAIL, two
soft-gate WARNs, etc., and assert the correct final verdict each time.

### Step 8 — Wire `main.py` end to end

This is the first point where you run the full pipeline: request in, 7 agents in
parallel, Chief Validator aggregation, final verdict out. Test against 3–5 real tickers
you already have an opinion on, and sanity-check that the system's verdict matches your
own judgment before trusting it on anything new.

### Step 9 — Log everything, then backtest the screen itself

Persist every `AgentResult` (not just the final verdict) to a store — even a flat file
or SQLite table is fine at this stage. After a few weeks of recommendations, you'll want
to check whether the agents' PASS/FAIL calls actually correlated with good outcomes, and
you can't do that if you only kept the final APPROVE/REJECT.

### Step 10 — Decide human-in-the-loop behavior last

Once the pipeline runs end to end, implement the sign-off logic from your "Open Items"
list (fully automated vs. requiring approval on FLAG/REJECT). Do this last, after you
trust the agents' outputs — automating sign-off around an unproven scoring system just
means bugs reach execution faster.
