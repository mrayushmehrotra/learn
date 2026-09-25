# Institutional Intraday Momentum Strategy v1.0

## Purpose

Generate high-probability intraday trade signals for Indian equities using trend, liquidity, volume, volatility, and price action.

This strategy prioritizes quality over quantity.

---

# Market

Exchange:
NSE

Segment:
Equity Cash
F&O Stocks

Timeframe:
5 Minute

Confirmation:
15 Minute

Holding:
Intraday Only

Mandatory Exit:
15:15 IST

---

# Stock Universe

Only trade stocks satisfying:

Average Daily Volume > 1,500,000

Average Daily Value > ₹150 Crore

Bid Ask Spread < 0.10%

NIFTY50

NIFTYNEXT50

Highly Liquid F&O Stocks

Reject everything else.

---

# Trading Session

Ignore first 15 minutes.

Allowed:

09:30
to
11:30

Second Session

13:30
to
14:45

Reject trades outside these windows.

---

# Required Indicators

VWAP

EMA20

EMA50

ATR14

Volume

Relative Volume

Previous Day High

Previous Day Low

Today's High

Today's Low

---

# Market Direction Filter

Long Only If

Price > VWAP

EMA20 > EMA50

VWAP Rising

NIFTY above VWAP

Sector Index Green

---

Short Only If

Price < VWAP

EMA20 < EMA50

VWAP Falling

NIFTY below VWAP

Sector Index Red

---

Reject if market trend is mixed.

---

# Relative Strength Filter

For Long

Stock Return

>

NIFTY Return

Minimum Difference

0.50%

---

For Short

Stock Return

<

NIFTY Return

Minimum Difference

-0.50%

---

# Volume Filter

Current Volume >

Average Volume of Previous 10 Candles

AND

Relative Volume >

2.0

---

# Pullback Requirement

Never buy breakout candle.

Wait until

Price retraces

towards

EMA20

or

VWAP

Valid Pullback

Maximum Retracement

40%

of previous impulse move.

---

# Entry Confirmation

Long

Need ALL conditions.

Bullish Candle

Bullish Engulfing

OR

Hammer

OR

Strong Close

Volume Higher

VWAP Holding

EMA20 Holding

No resistance within 1 ATR

Entry Price

High of confirmation candle

-

0.05%

Buffer

Buy only if next candle crosses entry.

---

Short

Mirror Logic.

---

# Stop Loss

Choose the largest value.

Below Swing Low

OR

Below VWAP

OR

0.8 ATR

Never tighten stop initially.

---

# Profit Target

Target1

1R

Sell

40%

Target2

2R

Sell

30%

Target3

Previous Day High

OR

3R

Sell Remaining

---

# Trailing Stop

After Target1

Move Stop

to Entry

After Target2

Trail

EMA20

OR

Previous Candle Low

---

# Reject Trade If

VWAP Flat

ATR Low

Volume Low

Inside Candle

Doji

Lunch Session

Major News

Gap >5%

Gap <0.5%

Spread High

Circuit Stock

Operator Stock

---

# Confidence Score

Initialize

0

Trend Alignment

20

VWAP Alignment

15

EMA Alignment

10

Relative Strength

15

Volume

15

ATR

10

Bullish Pattern

10

Sector Strength

5

Risk Reward

10

Maximum

100

---

# Decision

Confidence

> =85

BUY

Confidence

70-84

WATCH

Confidence

<70

NO TRADE

---

# Entry Price

Entry

Confirmation Candle High

-

0.05%

---

# Stop Loss Formula

Minimum

Entry

-

max(

ATR*0.8,

Entry-VWAP,

Entry-SwingLow

)

---

# Target Formula

Target1

Entry

-

Risk

Target2

Entry

-

2 × Risk

Target3

Entry

-

3 × Risk

---

# Risk Rules

Risk Per Trade

0.5%

Maximum Daily Loss

2%

Maximum Trades

3

Maximum Consecutive Losses

2

Stop Trading Afterwards

Never Average Down

Never Revenge Trade

---

# AI Output

Return JSON

{
"symbol": "",
"signal": "BUY | SELL | WATCH | NO_TRADE",
"entry_price": 0,
"stop_loss": 0,
"target_1": 0,
"target_2": 0,
"target_3": 0,
"risk_reward": 0,
"confidence": 0,
"position_size": 0,
"holding_time_minutes": 0,
"reasons": [
""
]
}

---

# Entry Checklist

✓ Trend Confirmed

✓ VWAP Confirmed

✓ EMA Confirmed

✓ Relative Strength Confirmed

✓ Volume Confirmed

✓ Pullback Completed

✓ Bullish/Bearish Candle

✓ Risk Reward >= 2

✓ Confidence >= 85

If any condition fails

NO TRADE

---

# Exit Rules

Exit Immediately If

Stop Loss Hit

VWAP Breaks

EMA20 Crosses EMA50 Against Position

Market Closes

Target3 Achieved

Trailing Stop Hit

Never Hold Overnight

---

# Core Principle

Do not predict.

Trade only confirmed momentum with institutional participation.

Missing a trade is preferable to taking a low-probability trade.
