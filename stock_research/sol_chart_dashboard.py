import json
import requests
import pandas as pd
import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="SOL/USDT Chart (VWAP & 9 EMA)", layout="wide")

st.markdown("""
    <style>
    .stApp { background-color: #131722; color: #ffffff; }
    </style>
""", unsafe_allow_html=True)

st.title("⚡ SOL/USDT Real-Time Chart (VWAP & 9 EMA)")

timeframe = st.sidebar.selectbox("Timeframe", ["1m", "5m", "15m", "1h"], index=1)
enable_sound = st.sidebar.checkbox("Enable Audio Alert on Crossover", value=True)

@st.cache_data(ttl=10)
def fetch_data(symbol="SOLUSDT", interval="5m", limit=150):
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit={limit}"
    res = requests.get(url, timeout=10).json()
    
    df = pd.DataFrame(res, columns=[
        'timestamp', 'open', 'high', 'low', 'close', 'volume',
        'close_time', 'qav', 'trades', 'tbb', 'tbq', 'ignore'
    ])
    
    numeric_cols = ['open', 'high', 'low', 'close', 'volume']
    df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric)
    
    # Calculate VWAP & 9 EMA
    tp = (df['high'] + df['low'] + df['close']) / 3
    df['vwap'] = (tp * df['volume']).cumsum() / df['volume'].cumsum()
    df['ema9'] = df['close'].ewm(span=9, adjust=False).mean()
    df['time'] = (df['timestamp'] / 1000).astype(int)
    
    return df

df = fetch_data("SOLUSDT", timeframe, 150)

latest = df.iloc[-1]
prev = df.iloc[-2]

c1, c2, c3 = st.columns(3)
c1.metric("SOL/USDT Price", f"${latest['close']:.2f}")
c2.metric("VWAP", f"${latest['vwap']:.2f}")
c3.metric("9 EMA", f"${latest['ema9']:.2f}")

# Check Crossover
bullish_cross = (prev['ema9'] <= prev['vwap']) and (latest['ema9'] > latest['vwap'])
bearish_cross = (prev['ema9'] >= prev['vwap']) and (latest['ema9'] < latest['vwap'])

if bullish_cross:
    st.success("🔔 **ALERT: BULLISH CROSSOVER!** 9 EMA crossed ABOVE VWAP!")
    if enable_sound:
        st.components.v1.html("""<script>new Audio('https://media.geeksforgeeks.org/wp-content/uploads/20190531135120/beep.mp3').play();</script>""", height=0)
elif bearish_cross:
    st.error("🔔 **ALERT: BEARISH CROSSOVER!** 9 EMA crossed BELOW VWAP!")
    if enable_sound:
        st.components.v1.html("""<script>new Audio('https://media.geeksforgeeks.org/wp-content/uploads/20190531135120/beep.mp3').play();</script>""", height=0)
else:
    position = "ABOVE" if latest['ema9'] > latest['vwap'] else "BELOW"
    st.info(f"Monitoring: 9 EMA is currently **{position}** VWAP.")

# Chart JSON Data
candles_data = df[['time', 'open', 'high', 'low', 'close']].to_dict(orient='records')
vwap_data = df[['time', 'vwap']].rename(columns={'vwap': 'value'}).dropna().to_dict(orient='records')
ema_data = df[['time', 'ema9']].rename(columns={'ema9': 'value'}).dropna().to_dict(orient='records')

html_code = f"""
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
    <style>
        body {{ margin: 0; background-color: #131722; }}
        #chart {{ width: 100%; height: 500px; }}
    </style>
</head>
<body>
    <div id="chart"></div>
    <script>
        const chart = LightweightCharts.createChart(document.getElementById('chart'), {{
            layout: {{ background: {{ color: '#131722' }}, textColor: '#d1d4dc' }},
            grid: {{ vertLines: {{ color: '#2B2B43' }}, horzLines: {{ color: '#2B2B43' }} }},
            crosshair: {{ mode: LightweightCharts.CrosshairMode.Normal }},
            rightPriceScale: {{ borderColor: '#2B2B43' }},
            timeScale: {{ borderColor: '#2B2B43', timeVisible: true }},
        }});

        const candlestickSeries = chart.addCandlestickSeries({{
            upColor: '#26a69a', downColor: '#ef5350',
            borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350'
        }});
        candlestickSeries.setData({json.dumps(candles_data)});

        const vwapSeries = chart.addLineSeries({{
            color: '#ff9800',
            lineWidth: 2,
            title: 'VWAP'
        }});
        vwapSeries.setData({json.dumps(vwap_data)});

        const emaSeries = chart.addLineSeries({{
            color: '#2196f3',
            lineWidth: 2,
            title: '9 EMA'
        }});
        emaSeries.setData({json.dumps(ema_data)});
    </script>
</body>
</html>
"""

components.html(html_code, height=520)
