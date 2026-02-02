# Demo Logs for Binance Trading Bot

This directory contains demo log files generated for submission purposes. These logs demonstrate the bot's functionality without requiring real Binance API credentials.

## Log Files

### trading_bot_20260202.log
Complete log file showing:
- Demo mode MARKET order (BUY 0.001 BTCUSDT)
- Demo mode LIMIT order (SELL 0.01 ETHUSDT @ 2500.0)
- Validation tests for various error scenarios
- Simulated real orders with realistic responses

### errors_20260202.log
Error-level logs showing:
- Validation error handling
- Input validation tests

## Demo Features Demonstrated

✅ **MARKET Order Placement**
- Symbol: BTCUSDT
- Side: BUY
- Quantity: 0.001
- Status: FILLED
- Avg Price: 42350.5

✅ **LIMIT Order Placement**
- Symbol: ETHUSDT
- Side: SELL
- Quantity: 0.01
- Price: 2500.0
- Status: NEW

✅ **Validation Tests**
- Invalid symbol detection
- Invalid side validation
- Negative quantity handling
- Missing price for LIMIT orders

## How to Generate Fresh Logs

Run the demo script:
```bash
python demo.py
```

This will create new log files with timestamps and realistic order data.

## Note

These are demo logs generated without connecting to the real Binance API. They demonstrate the bot's functionality, logging system, and error handling capabilities.
