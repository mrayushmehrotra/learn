import json
import os
import threading
import time

import pandas as pd
import requests

# Telegram Bot Token
BOT_TOKEN = "8611801512:AAH_j1G1-1Oq7pqKOXFga-C8C8yMVzEE1Bw"
BASE_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

# CoinDCX Configuration
COINDCX_PAIR = "B-SOL_USDT"  # CoinDCX SOL/USDT pair
TIMEFRAME = "1m"  # CoinDCX intervals: 1m, 15m, 1h
EMA_PERIOD = 9  # 9 EMA
CHECK_INTERVAL = 10  # Check every 10 seconds

# File to store subscribed chat IDs so alerts survive bot restarts
SUBSCRIBERS_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "telegram_subscribers.json"
)


def load_subscribers():
    if os.path.exists(SUBSCRIBERS_FILE):
        try:
            with open(SUBSCRIBERS_FILE, "r") as f:
                return set(json.load(f))
        except Exception:
            pass
    return set()


def save_subscribers(subscribers):
    try:
        with open(SUBSCRIBERS_FILE, "w") as f:
            json.dump(list(subscribers), f)
    except Exception:
        pass


subscribers = load_subscribers()
sub_lock = threading.Lock()


import datetime


def fetch_sol_data(pair=COINDCX_PAIR, interval=TIMEFRAME, limit=1000):
    url = f"https://public.coindcx.com/market_data/candles?pair={pair}&interval={interval}&limit={limit}"
    res = requests.get(url, timeout=10).json()

    if isinstance(res, dict) and res.get("status") == "error":
        raise ValueError(res.get("message", "CoinDCX API error"))

    # CoinDCX returns newest candle first; reverse for chronological order
    res_sorted = list(reversed(res))
    df = pd.DataFrame(res_sorted)

    numeric_cols = ["open", "high", "low", "close", "volume"]
    df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric)
    df["timestamp"] = pd.to_datetime(df["time"], unit="ms", utc=True)

    # Filter candles starting from 00:00 UTC today for true Session VWAP
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    start_of_day_ts = int(
        now_utc.replace(hour=0, minute=0, second=0, microsecond=0).timestamp() * 1000
    )

    df_session = df[df["time"] >= start_of_day_ts].copy()
    if len(df_session) < 10:
        df_session = df.tail(100).copy()

    # Calculate True Daily Session VWAP (matching CoinDCX & TradingView)
    tp = (df_session["high"] + df_session["low"] + df_session["close"]) / 3
    df_session["vwap"] = (tp * df_session["volume"]).cumsum() / df_session["volume"].cumsum()
    df_session["ema9"] = df_session["close"].ewm(span=EMA_PERIOD, adjust=False).mean()

    return df_session


def send_telegram_message(chat_id, text, parse_mode="Markdown"):
    url = f"{BASE_URL}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
    try:
        requests.post(url, json=payload, timeout=10)
    except Exception as e:
        print(f"Error sending message to {chat_id}: {e}")


def broadcast_alert(text):
    with sub_lock:
        targets = list(subscribers)
    for chat_id in targets:
        send_telegram_message(chat_id, text)


def format_status_message(df):
    latest = df.iloc[-1]
    prev = df.iloc[-2]

    price = latest["close"]
    vwap = latest["vwap"]
    ema9 = latest["ema9"]

    pos = "ABOVE 📈" if ema9 > vwap else "BELOW 📉"
    diff = abs(ema9 - vwap)

    msg = (
        f"⚡ *SOL/USDT Market Update*\n\n"
        f"💰 *Current Price:* `${price:.2f}`\n"
        f"📊 *VWAP:* `${vwap:.2f}`\n"
        f"📈 *9 EMA:* `${ema9:.2f}`\n\n"
        f"🔍 *Status:* 9 EMA is currently *{pos}* VWAP by `${diff:.2f}`\n"
        f"⏱️ *Timeframe:* {TIMEFRAME}"
    )
    return msg


ALERT_COOLDOWN_SECONDS = 30 * 60  # 30 Minutes
last_alert_time = 0


# Background Crossover Monitoring Loop
def monitor_crossovers():
    global last_alert_time
    print(
        "🚀 Background SOL/USDT Crossover Monitor started (30m Alert Cooldown Active)..."
    )
    last_signal = None

    while True:
        try:
            df = fetch_sol_data()
            prev_row = df.iloc[-3]
            curr_row = df.iloc[-2]
            latest_price = df.iloc[-1]["close"]

            prev_ema, prev_vwap = prev_row["ema9"], prev_row["vwap"]
            curr_ema, curr_vwap = curr_row["ema9"], curr_row["vwap"]

            bullish_cross = (prev_ema <= prev_vwap) and (curr_ema > curr_vwap)
            bearish_cross = (prev_ema >= prev_vwap) and (curr_ema < curr_vwap)

            now = time.time()
            time_since_last = now - last_alert_time

            if bullish_cross and last_signal != "BULLISH":
                if time_since_last >= ALERT_COOLDOWN_SECONDS:
                    alert_text = (
                        f"🚨 *BULLISH CROSSOVER ALERT!* 🟢\n\n"
                        f"⚡ *SOL/USDT:* `${latest_price:.2f}`\n"
                        f"📈 *9 EMA* (`${curr_ema:.2f}`) crossed *ABOVE* 📊 *VWAP* (`${curr_vwap:.2f}`)\n\n"
                        f"⏱️ *Timeframe:* {TIMEFRAME}"
                    )
                    print(f"[ALERT] {alert_text}")
                    broadcast_alert(alert_text)
                    last_signal = "BULLISH"
                    last_alert_time = now
                else:
                    mins_left = int((ALERT_COOLDOWN_SECONDS - time_since_last) / 60)
                    print(
                        f"[COOLDOWN] Bullish cross detected, but suppressed ({mins_left}m remaining in 30m cooldown)."
                    )

            elif bearish_cross and last_signal != "BEARISH":
                if time_since_last >= ALERT_COOLDOWN_SECONDS:
                    alert_text = (
                        f"🚨 *BEARISH CROSSOVER ALERT!* 🔴\n\n"
                        f"⚡ *SOL/USDT:* `${latest_price:.2f}`\n"
                        f"📉 *9 EMA* (`${curr_ema:.2f}`) crossed *BELOW* 📊 *VWAP* (`${curr_vwap:.2f}`)\n\n"
                        f"⏱️ *Timeframe:* {TIMEFRAME}"
                    )
                    print(f"[ALERT] {alert_text}")
                    broadcast_alert(alert_text)
                    last_signal = "BEARISH"
                    last_alert_time = now
                else:
                    mins_left = int((ALERT_COOLDOWN_SECONDS - time_since_last) / 60)
                    print(
                        f"[COOLDOWN] Bearish cross detected, but suppressed ({mins_left}m remaining in 30m cooldown)."
                    )

        except Exception as e:
            print(f"Error in monitor loop: {e}")

        time.sleep(CHECK_INTERVAL)


# Telegram Command Poller
def poll_telegram_commands():
    print("🤖 Telegram Bot command listener started...")
    last_update_id = None

    while True:
        try:
            url = f"{BASE_URL}/getUpdates"
            params = {"timeout": 20}
            if last_update_id is not None:
                params["offset"] = last_update_id + 1

            res = requests.get(url, params=params, timeout=25).json()

            if res.get("ok"):
                for update in res.get("result", []):
                    last_update_id = update["update_id"]
                    message = update.get("message", {})
                    text = message.get("text", "").strip()
                    chat_id = message.get("chat", {}).get("id")

                    if not chat_id:
                        continue

                    # Auto-subscribe chat ID
                    with sub_lock:
                        if chat_id not in subscribers:
                            subscribers.add(chat_id)
                            save_subscribers(subscribers)

                    cmd = text.lower().split()[0] if text else ""

                    if cmd in ["/start", "/help"]:
                        welcome_text = (
                            "👋 *Welcome to SOL/USDT Alert Bot!*\n\n"
                            "I automatically monitor SOL/USDT and send instant alerts when **9 EMA** crosses **VWAP**.\n\n"
                            "*Available Commands:*\n"
                            "• `/price` or `/sol` - Get live SOL price, 9 EMA & VWAP\n"
                            "• `/status` - Check current indicator positions\n"
                            "• `/help` - Show this message\n\n"
                            "✅ *You are automatically subscribed to live crossover alerts!*"
                        )
                        send_telegram_message(chat_id, welcome_text)

                    elif cmd in ["/price", "/sol", "/status"]:
                        try:
                            df = fetch_sol_data()
                            status_msg = format_status_message(df)
                            send_telegram_message(chat_id, status_msg)
                        except Exception as e:
                            send_telegram_message(
                                chat_id, f"⚠️ Error fetching SOL data: {e}"
                            )

        except Exception as e:
            time.sleep(3)


def main():
    print("==================================================")
    print("🤖 Starting Telegram SOL/USDT VWAP & 9 EMA Alert Bot")
    print("==================================================")

    # Start monitor thread
    monitor_thread = threading.Thread(target=monitor_crossovers, daemon=True)
    monitor_thread.start()

    # Run Telegram poller in main thread
    poll_telegram_commands()


if __name__ == "__main__":
    main()
