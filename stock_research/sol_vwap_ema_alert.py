import time
import requests
import pandas as pd
from plyer import notification

# Configured for SOL/USDT with VWAP & 9 EMA
SYMBOL = "SOLUSDT"
TIMEFRAME = "5m"      # 1m, 5m, 15m, etc.
EMA_PERIOD = 9        # 9 EMA
CHECK_INTERVAL = 10    # Check every 10 seconds

def fetch_binance_klines(symbol=SYMBOL, interval=TIMEFRAME, limit=100):
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit={limit}"
    res = requests.get(url, timeout=10).json()
    
    df = pd.DataFrame(res, columns=[
        'timestamp', 'open', 'high', 'low', 'close', 'volume',
        'close_time', 'qav', 'trades', 'tbb', 'tbq', 'ignore'
    ])
    
    numeric_cols = ['open', 'high', 'low', 'close', 'volume']
    df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric)
    return df

def calculate_indicators(df):
    # Calculate VWAP
    tp = (df['high'] + df['low'] + df['close']) / 3
    df['vwap'] = (tp * df['volume']).cumsum() / df['volume'].cumsum()
    
    # Calculate 9 EMA
    df['ema9'] = df['close'].ewm(span=EMA_PERIOD, adjust=False).mean()
    return df

def trigger_alert(title, message):
    print(f"\n\a🔔 [ALERT] {title}: {message}")
    try:
        notification.notify(
            title=title,
            message=message,
            app_name="SOL/USDT Alert",
            timeout=10
        )
    except Exception as e:
        pass

def main():
    print("=" * 60)
    print(f"🚀 SOL/USDT Monitor: VWAP + 9 EMA Crossover Alert")
    print(f"Timeframe: {TIMEFRAME} | Active and listening...")
    print("=" * 60)
    
    last_signal = None
    
    while True:
        try:
            df = fetch_binance_klines()
            df = calculate_indicators(df)
            
            prev_row = df.iloc[-3]
            curr_row = df.iloc[-2]
            latest_price = df.iloc[-1]['close']
            
            prev_ema, prev_vwap = prev_row['ema9'], prev_row['vwap']
            curr_ema, curr_vwap = curr_row['ema9'], curr_row['vwap']
            
            print(f"\r[SOL: ${latest_price:.2f}] 9 EMA: {curr_ema:.2f} | VWAP: {curr_vwap:.2f}", end="", flush=True)
            
            # Crossover logic
            bullish_cross = (prev_ema <= prev_vwap) and (curr_ema > curr_vwap)
            bearish_cross = (prev_ema >= prev_vwap) and (curr_ema < curr_vwap)
            
            if bullish_cross and last_signal != 'BULLISH':
                msg = f"9 EMA (${curr_ema:.2f}) crossed ABOVE VWAP (${curr_vwap:.2f}) at SOL price ${latest_price:.2f}"
                trigger_alert("🟢 SOL/USDT Bullish Cross", msg)
                last_signal = 'BULLISH'
                
            elif bearish_cross and last_signal != 'BEARISH':
                msg = f"9 EMA (${curr_ema:.2f}) crossed BELOW VWAP (${curr_vwap:.2f}) at SOL price ${latest_price:.2f}"
                trigger_alert("🔴 SOL/USDT Bearish Cross", msg)
                last_signal = 'BEARISH'
                
        except Exception as e:
            print(f"\n⚠️ Reconnecting... ({e})")
            
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()
