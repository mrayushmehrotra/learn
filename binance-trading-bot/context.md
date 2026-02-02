# Python Developer Intern Assignment

## Application Task – Python Developer (Trading Bot on Binance Futures Testnet)

**Estimated time**: Less than 60 minutes

Thanks for applying. As the first step in our hiring process, please complete the task below. Candidates who meet the acceptance criteria will be shortlisted for an interview.

---

## Application Task: Build a Simplified Trading Bot (Binance Futures Testnet)

### Objective

Create a small Python application that can place orders on **Binance Futures Testnet (USDT-M)** and provide a clean, reusable structure with proper logging and error handling.

### Setup

1. Register and activate a **Binance Futures Testnet** account
2. Generate API credentials
3. Use this testnet base URL for all API interactions:
   ```
   https://testnet.binancefuture.com
   ```
4. You may use either:
   - `python-binance` library, or
   - Direct REST calls (`requests`/`httpx`)

---

## Core Requirements (must-have)

**Language**: Python 3.x

Your app must:

### 1. Order Placement
- Place **Market** and **Limit** orders on Binance Futures Testnet (USDT-M)
- Support both sides: **BUY** and **SELL**

### 2. CLI Input
Accept and validate user input via CLI (e.g., `argparse` / `Typer` / `Click`):
- `symbol` (e.g., BTCUSDT)
- `side` (BUY/SELL)
- `order type` (MARKET/LIMIT)
- `quantity`
- `price` (required for LIMIT)

### 3. Output
Print clear output:
- Order request summary
- Order response details (orderId, status, executedQty, avgPrice if available)
- Success/failure message

### 4. Code Quality
Implement:
- **Structured code**: separate client/API layer and command/CLI layer
- **Logging** of API requests, responses, and errors to a log file
- **Exception handling**: invalid input, API errors, network failures

---

## Deliverables

Please submit:

**A public GitHub repository (preferred) OR a zip folder containing:**

1. **Source code**
2. **README.md** with:
   - Setup steps
   - How to run examples
   - Any assumptions
3. **requirements.txt** (or `pyproject.toml`)
4. **Log files** from at least:
   - One MARKET order
   - One LIMIT order

---

## Bonus (optional — choose any one)

- Add a third order type: **Stop-Limit** / **OCO** / **TWAP** / **Grid**
- Add an **enhanced CLI UX** (menus, prompts, validation messages)
- Add a **lightweight UI** (optional)

---

## Suggested Project Structure (optional)

```
trading_bot/
  bot/
    __init__.py
    client.py        # Binance client wrapper
    orders.py        # order placement logic
    validators.py    # input validation
    logging_config.py
  cli.py             # CLI entry point
  README.md
  requirements.txt
```

---

## Evaluation Criteria (what we grade)

1. **Correctness**: places orders successfully on testnet
2. **Code quality**: readability, structure, reuse
3. **Validation + error handling**
4. **Logging quality**: useful, not noisy
5. **Clear README + runnable instructions**

---

## How to Apply

Email your **resume + submission link** (GitHub/zip) + **log files** to:

- `joydip@anything.ai`
- `chetan@anything.ai`
- `hello@anything.ai`
- CC: `sonika@anything.ai`

**Email subject**: "Junior Python Developer – Crypto Trading Bot"

---

If you want, I can also give you a grading rubric (0–5) and a one-page reviewer checklist so your team can shortlist consistently.
