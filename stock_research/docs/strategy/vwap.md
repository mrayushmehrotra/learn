# VWAP Pullback Intraday Strategy (India)

## Strategy Name

VWAP Pullback with Trend Confirmation

---

# Objective

Trade only in the direction of institutional order flow by using VWAP as the primary dynamic support/resistance.

Timeframe:

- Primary: 5 Minute
- Confirmation: 15 Minute

Market:

- NSE India
- Equity Cash
- F&O Stocks

Holding Period:

- Intraday Only
- Exit before market close

---

# Stock Universe

Only consider highly liquid stocks.

Minimum requirements:

- NIFTY 50
- NIFTY NEXT 50
- F&O Eligible Stocks

Liquidity Filters:

Average Daily Volume > 1,000,000 shares

Average Daily Traded Value > ₹100 Crore

Bid Ask Spread < 0.10%

---

# Pre Market Scan

Before market opens:

Select stocks satisfying:

Gap:

0.5% ≤ Gap ≤ 3%

Relative Volume Expected > 2

Positive News (optional)

Sector Strength preferred

---

# Market Opening Rules

Do not trade immediately.

Ignore first 15 minutes.

Trading Start Time:

09:30 AM

Preferred Trading Window:

09:30 AM — 11:30 AM

Avoid:

11:30 AM — 01:30 PM

Last Entries:

Before 02:30 PM

Mandatory Exit:

03:20 PM

---

# Indicators

Required:

VWAP

EMA 20

EMA 50

Volume

ATR(14)

---

# Market Trend Filter

Only Long when:

Current Price > VWAP

AND

EMA20 > EMA50

AND

VWAP slope > 0

AND

Current candle closes above VWAP

Only Short when:

Current Price < VWAP

EMA20 < EMA50

VWAP slope < 0

Current candle closes below VWAP

---

# Pullback Conditions

After a trend begins:

Wait for price to retrace.

Valid Pullback:

Touches VWAP

OR

Moves within 0.20% of VWAP

Rejects VWAP

Must NOT close strongly beyond VWAP.

---

# Long Entry Rules

All conditions MUST be true.

1.

Price above VWAP

2.

EMA20 above EMA50

3.

VWAP rising

4.

Pullback touches VWAP

5.

Bullish rejection candle

Accepted patterns:

Bullish Engulfing

Hammer

Strong Bullish Marubozu

6.

Volume of entry candle >

Average volume of previous five candles

7.

No resistance within ATR distance.

Entry:

Buy at close of confirmation candle.

---

# Short Entry Rules

Mirror image.

Price below VWAP

EMA20 below EMA50

VWAP falling

Pullback into VWAP

Bearish rejection candle

Volume confirmation

No nearby support

Sell after confirmation candle closes.

---

# Stop Loss

Long:

Minimum of:

Pullback Swing Low

OR

0.5 × ATR below entry

OR

Below VWAP

Short:

Swing High

OR

0.5 × ATR

OR

Above VWAP

Always choose the farthest logical stop.

---

# Profit Target

Primary:

2R

Secondary:

Previous Day High

Intraday Resistance

Trailing:

Trail behind EMA20

OR

Previous candle low

---

# Risk Management

Risk Per Trade:

0.5% account value

Maximum Daily Loss:

2%

Maximum Trades:

3

Stop trading after:

2 consecutive losses

No averaging down.

No martingale.

---

# Trade Filters

Reject trade if:

VWAP is flat

EMA20 and EMA50 crossing repeatedly

Volume below average

Inside lunch session

Major news event

Index moving opposite

Spread abnormal

ATR too small

---

# Relative Strength Filter

For Long:

Stock Return >

NIFTY Return

Preferred:

Relative Strength > +0.5%

For Short:

Stock Return <

NIFTY Return

---

# Volume Confirmation

Entry candle volume must be:

Greater than previous 5-candle average

OR

Greater than previous candle

Higher volume = higher confidence.

---

# Session Rules

Preferred:

09:30 — 11:30

Acceptable:

01:30 — 02:30

Avoid:

11:30 — 01:30

No new trades after:

02:30

---

# Exit Rules

Exit immediately if:

VWAP breaks opposite direction

EMA20 crosses EMA50 opposite direction

Volume spike against position

Target reached

Stop Loss hit

Market closing

---

# Confidence Score

Initialize score = 0

Price above VWAP:
+20

EMA20 > EMA50:
+15

VWAP slope positive:
+15

Relative Strength:
+15

Volume Confirmation:
+15

Bullish Pattern:
+10

No Nearby Resistance:
+5

Sector Strong:
+5

Gap in Preferred Range:
+5

Maximum Score:

100

Trade only if:

Confidence ≥ 75

---

# AI Decision Logic

IF

Trend Valid

AND

VWAP Direction Valid

AND

Pullback Valid

AND

Volume Valid

AND

Risk Reward >= 2

AND

Confidence >= 75

THEN

Generate BUY signal.

Else

NO TRADE.

---

# Trade Output Format

```json
{
  "symbol": "",
  "signal": "BUY | SELL | NO_TRADE",
  "entry": 0,
  "stop_loss": 0,
  "target": 0,
  "risk_reward": 0,
  "confidence": 0,
  "reason": ["", "", ""]
}
```

---

# Strategy Principles

Never chase candles.

Trade only with trend.

Wait for pullbacks.

Respect VWAP.

Respect risk management.

Quality over quantity.

One high-quality trade is preferable to multiple low-quality trades.
