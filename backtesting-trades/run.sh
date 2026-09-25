#!/usr/bin/env bash
set -e

# Default token if environment variable INDSTOCKS_TOKEN is not set
export TOKEN="${INDSTOCKS_TOKEN:-eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJRCI6IjQ1OVEyIiwiZXhwIjoxNzg4NjU4MjAwLCJpYXQiOjE3ODg1OTU0NzgsImlzcyI6ImluZG1vbmV5IiwicGFydG5lcklEIjoyMTAwMSwidG9rZW5JRCI6Nzk3ODV9.yTC51G1G00z-JL5u9fdj7_wnSV7Gw4U9g0Z2WVju-j0y_nlTOFCTgR4V0ZRN-63lkIlbrLVpiPy00c1QHOOYcg}"

echo "=========================================="
echo "🚀 NIFTY 50 VWAP x 9 EMA Backtest Runner"
echo "=========================================="

node -e '
const fs = require("fs");
const https = require("https");

const TOKEN = process.env.TOKEN;
const SCRIP_CODE = "NSE_40000001";

const endMs = new Date().getTime();
const startMs = endMs - (365 * 24 * 3600 * 1000);
const chunkMs = 7 * 24 * 3600 * 1000;

function fetchChunk(currStart, currEnd) {
    return new Promise((resolve) => {
        const url = `https://api.indstocks.com/market/historical/5minute?scrip-codes=${SCRIP_CODE}&start_time=${currStart}&end_time=${currEnd}`;
        const options = {
            headers: {
                "Authorization": TOKEN,
                "Content-Type": "application/json"
            }
        };
        https.get(url, options, (res) => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => {
                try {
                    const json = JSON.parse(body);
                    if (json.success && json.data && json.data[SCRIP_CODE]) {
                        resolve(json.data[SCRIP_CODE].candles || []);
                    } else { resolve([]); }
                } catch(e) { resolve([]); }
            });
        }).on("error", () => resolve([]));
    });
}

function getISTDateStr(ts) {
    const d = new Date((ts + 19800) * 1000);
    return d.toISOString().split("T")[0];
}

async function run() {
    console.log("1. Fetching 1-year Nifty 50 5-min historical data from INDstocks API...");
    let allCandles = [];
    let currStart = startMs;
    while (currStart < endMs) {
        let currEnd = Math.min(currStart + chunkMs, endMs);
        const candles = await fetchChunk(currStart, currEnd);
        allCandles.push(...candles);
        process.stdout.write(".");
        currStart = currEnd;
        await new Promise(r => setTimeout(r, 50));
    }
    console.log("\n   Fetched " + allCandles.length + " raw candles.");
    
    const map = new Map();
    allCandles.forEach(c => map.set(c.ts, c));
    const candles = Array.from(map.values()).sort((a,b) => a.ts - b.ts);

    console.log("2. Calculating VWAP and 9 EMA indicators...");
    const k = 2 / 10;
    let ema = candles[0].c;
    for (let i = 0; i < candles.length; i++) {
        ema = candles[i].c * k + ema * (1 - k);
        candles[i].ema9 = ema;
    }

    let currDay = "";
    let cumPV = 0, cumV = 0;
    for (let i = 0; i < candles.length; i++) {
        const d = getISTDateStr(candles[i].ts);
        if (d !== currDay) {
            currDay = d;
            cumPV = 0; cumV = 0;
        }
        const tp = (candles[i].h + candles[i].l + candles[i].c) / 3;
        const vol = candles[i].v > 0 ? candles[i].v : 1;
        cumPV += tp * vol;
        cumV += vol;
        candles[i].vwap = cumPV / cumV;
    }

    console.log("3. Executing Strategy Backtest Engine...");
    let position = null;
    let trades = [];
    const slippage = 0.5;

    for (let i = 1; i < candles.length; i++) {
        const prev = candles[i - 1];
        const curr = candles[i];
        const prevDay = getISTDateStr(prev.ts);
        const currDay = getISTDateStr(curr.ts);
        const istTime = new Date((curr.ts + 19800) * 1000).toISOString().substr(11, 5);

        const crossAbove = (prev.ema9 <= prev.vwap) && (curr.ema9 > curr.vwap);
        const crossBelow = (prev.ema9 >= prev.vwap) && (curr.ema9 < curr.vwap);

        if (position) {
            let exited = false;
            if (position.type === "LONG") {
                if (curr.l <= position.sl) {
                    const realExit = position.sl - slippage;
                    trades.push({ ...position, exTs: curr.ts, exPx: realExit, pnl: realExit - position.enPx, reason: "SL Hit" });
                    position = null; exited = true;
                } else if (curr.c > curr.o) {
                    position.sl = Math.max(position.sl, curr.l);
                }
            } else if (position.type === "SHORT") {
                if (curr.h >= position.sl) {
                    const realExit = position.sl + slippage;
                    trades.push({ ...position, exTs: curr.ts, exPx: realExit, pnl: position.enPx - realExit, reason: "SL Hit" });
                    position = null; exited = true;
                } else if (curr.c < curr.o) {
                    position.sl = Math.min(position.sl, curr.h);
                }
            }

            if (!exited && position && (istTime >= "15:25" || currDay !== prevDay)) {
                const realExit = position.type === "LONG" ? (curr.c - slippage) : (curr.c + slippage);
                const pnl = position.type === "LONG" ? (realExit - position.enPx) : (position.enPx - realExit);
                trades.push({ ...position, exTs: curr.ts, exPx: realExit, pnl: pnl, reason: "EOD Square-off" });
                position = null;
            }
        }

        if (!position && istTime >= "09:20" && istTime <= "15:15") {
            const isRed = curr.c < curr.o;
            const isGreen = curr.c > curr.o;
            if (crossBelow && isRed) {
                position = { id: trades.length + 1, type: "SHORT", enTs: curr.ts, enPx: curr.c - slippage, sl: prev.h };
            } else if (crossAbove && isGreen) {
                position = { id: trades.length + 1, type: "LONG", enTs: curr.ts, enPx: curr.c + slippage, sl: prev.l };
            }
        }
    }

    console.log("4. Performance Summary:");
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl <= 0);
    const totalPts = trades.reduce((a, b) => a + b.pnl, 0);
    const winRate = ((wins.length / trades.length) * 100).toFixed(1);
    console.log("   - Total Trades: " + trades.length);
    console.log("   - Win Rate: " + winRate + "% (" + wins.length + " W / " + losses.length + " L)");
    console.log("   - Net Return: " + (totalPts >= 0 ? "+" : "") + totalPts.toFixed(2) + " pts");

    console.log("5. Generating HTML Chart Dashboard...");
    const payload = {
        c: candles.map(c => [c.ts, c.o, c.h, c.l, c.c, c.v, Math.round(c.vwap*100)/100, Math.round(c.ema9*100)/100]),
        t: trades.map(t => ({
            id: t.id, type: t.type, enTs: t.enTs, enPx: t.enPx, exTs: t.exTs, exPx: t.exPx,
            pnl: Math.round(t.pnl * 100) / 100, reason: t.reason
        }))
    };

    const chartDataStr = JSON.stringify(payload);
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nifty 50 - VWAP x 9 EMA Backtest Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lightweight-charts@4.1.1/dist/lightweight-charts.standalone.production.js"></script>
    <style>
        body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
        .stat-card { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(8px); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
    </style>
</head>
<body class="flex flex-col h-screen overflow-hidden">
    <header class="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/90">
        <div class="flex items-center space-x-3">
            <div class="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg font-bold text-lg">📈</div>
            <div>
                <h1 class="font-bold text-lg text-slate-100 flex items-center gap-2">
                    NIFTY 50 (5-Min) Backtest Engine
                    <span class="text-xs bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded-full font-normal">1 Year Data</span>
                </h1>
                <p class="text-xs text-slate-400">Strategy: Default Single-Line VWAP & 9 EMA Crossover with Dynamic Trailing Stop Loss</p>
            </div>
        </div>
        <div class="flex items-center space-x-4 text-xs text-slate-300">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> VWAP</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span> 9 EMA</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Long Entry</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Short Entry</span>
        </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
        <div class="w-96 border-r border-slate-800 bg-slate-900/50 flex flex-col justify-between overflow-hidden">
            <div class="p-4 space-y-3 overflow-y-auto max-h-[45vh] custom-scrollbar border-b border-slate-800">
                <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Performance Overview</h2>
                <div class="grid grid-cols-2 gap-2">
                    <div class="stat-card p-3 rounded-xl">
                        <div class="text-xs text-slate-400">Net Return (Pts)</div>
                        <div id="metric-total-pts" class="text-lg font-bold text-emerald-400">+0</div>
                    </div>
                    <div class="stat-card p-3 rounded-xl">
                        <div class="text-xs text-slate-400">Win Rate</div>
                        <div id="metric-win-rate" class="text-lg font-bold text-slate-200">0%</div>
                    </div>
                    <div class="stat-card p-3 rounded-xl">
                        <div class="text-xs text-slate-400">Total Trades</div>
                        <div id="metric-total-trades" class="text-lg font-bold text-slate-200">0</div>
                    </div>
                    <div class="stat-card p-3 rounded-xl">
                        <div class="text-xs text-slate-400">Profit Factor</div>
                        <div id="metric-profit-factor" class="text-lg font-bold text-slate-200">0</div>
                    </div>
                    <div class="stat-card p-3 rounded-xl">
                        <div class="text-xs text-slate-400">Max Drawdown</div>
                        <div id="metric-max-dd" class="text-lg font-bold text-rose-400">0 pts</div>
                    </div>
                    <div class="stat-card p-3 rounded-xl">
                        <div class="text-xs text-slate-400">Win / Loss Count</div>
                        <div id="metric-win-loss" class="text-sm font-semibold text-slate-300">0 / 0</div>
                    </div>
                </div>
                <div class="stat-card p-3 rounded-xl space-y-1.5 text-xs text-slate-300">
                    <div class="flex justify-between"><span>Avg Win Trade:</span><span id="metric-avg-win" class="font-medium text-emerald-400">+0.00</span></div>
                    <div class="flex justify-between"><span>Avg Loss Trade:</span><span id="metric-avg-loss" class="font-medium text-rose-400">-0.00</span></div>
                    <div class="flex justify-between"><span>Max Win Trade:</span><span id="metric-max-win" class="font-medium text-emerald-400">+0.00</span></div>
                    <div class="flex justify-between"><span>Max Loss Trade:</span><span id="metric-max-loss" class="font-medium text-rose-400">-0.00</span></div>
                </div>
            </div>

            <div class="flex-1 flex flex-col overflow-hidden">
                <div class="px-4 py-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                    <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Trade Log (<span id="trade-count-badge">0</span>)</span>
                    <span class="text-[10px] text-slate-500">Click trade to zoom</span>
                </div>
                <div id="trade-log-container" class="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar"></div>
            </div>
        </div>

        <div class="flex-1 flex flex-col relative bg-slate-950">
            <div class="absolute top-3 left-4 z-10 flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800 backdrop-filter backdrop-blur-md">
                <button id="btn-reset-zoom" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded transition">Reset View</button>
                <button id="btn-toggle-vwap" class="px-2.5 py-1 bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 text-xs font-medium rounded transition">VWAP On</button>
                <button id="btn-toggle-ema" class="px-2.5 py-1 bg-amber-950/80 border border-amber-800/50 text-amber-400 text-xs font-medium rounded transition">9 EMA On</button>
            </div>
            <div id="chart" class="w-full h-full"></div>
        </div>
    </div>

    <script>
        const RAW_DATA = ${chartDataStr};
        let chart, candlestickSeries, vwapSeries, emaSeries;
        let selectedTradeCard = null;

        document.addEventListener("DOMContentLoaded", () => { initDashboard(); });

        function initDashboard() {
            calculateAndRenderMetrics();
            renderTradeLog();
            createChart();
        }

        function calculateAndRenderMetrics() {
            const trades = RAW_DATA.t;
            const wins = trades.filter(t => t.pnl > 0);
            const losses = trades.filter(t => t.pnl <= 0);
            const totalPts = trades.reduce((a, b) => a + b.pnl, 0);
            const grossWin = wins.reduce((a, b) => a + b.pnl, 0);
            const grossLoss = Math.abs(losses.reduce((a, b) => a + b.pnl, 0));
            const winRate = ((wins.length / trades.length) * 100).toFixed(1);
            const profitFactor = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : grossWin.toFixed(2);
            
            let peak = 0, maxDD = 0, eq = 0;
            trades.forEach(t => {
                eq += t.pnl;
                if (eq > peak) peak = eq;
                let dd = peak - eq;
                if (dd > maxDD) maxDD = dd;
            });

            const avgWin = wins.length ? (grossWin / wins.length).toFixed(2) : "0.00";
            const avgLoss = losses.length ? (grossLoss / losses.length).toFixed(2) : "0.00";
            const maxWin = Math.max(...trades.map(t => t.pnl)).toFixed(2);
            const maxLoss = Math.min(...trades.map(t => t.pnl)).toFixed(2);

            document.getElementById("metric-total-pts").textContent = (totalPts >= 0 ? "+" : "") + totalPts.toFixed(2) + " pts";
            document.getElementById("metric-total-pts").className = "text-lg font-bold " + (totalPts >= 0 ? "text-emerald-400" : "text-rose-400");
            document.getElementById("metric-win-rate").textContent = winRate + "%";
            document.getElementById("metric-total-trades").textContent = trades.length;
            document.getElementById("metric-profit-factor").textContent = profitFactor;
            document.getElementById("metric-max-dd").textContent = "-" + maxDD.toFixed(2) + " pts";
            document.getElementById("metric-win-loss").textContent = wins.length + " W / " + losses.length + " L";
            document.getElementById("metric-avg-win").textContent = "+" + avgWin;
            document.getElementById("metric-avg-loss").textContent = "-" + avgLoss;
            document.getElementById("metric-max-win").textContent = "+" + maxWin;
            document.getElementById("metric-max-loss").textContent = maxLoss;
            document.getElementById("trade-count-badge").textContent = trades.length;
        }

        function renderTradeLog() {
            const container = document.getElementById("trade-log-container");
            container.innerHTML = "";
            RAW_DATA.t.forEach((t) => {
                const dt = new Date(t.enTs * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                const isWin = t.pnl > 0;
                const card = document.createElement("div");
                card.className = "p-2.5 rounded-lg border cursor-pointer transition text-xs flex justify-between items-center " + (isWin ? "bg-emerald-950/20 border-emerald-900/40 hover:bg-emerald-900/30" : "bg-rose-950/20 border-rose-900/40 hover:bg-rose-900/30");
                card.id = "trade-card-" + t.id;
                card.onclick = () => focusTradeOnChart(t, card);
                card.innerHTML = "<div>" +
                        "<div class=\"flex items-center space-x-1.5\">" +
                            "<span class=\"font-bold px-1.5 py-0.5 rounded text-[10px] " + (t.type === "LONG" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300") + "\">#" + t.id + " " + t.type + "</span>" +
                            "<span class=\"text-slate-400\">" + dt + "</span>" +
                        "</div>" +
                        "<div class=\"text-[11px] text-slate-400 mt-1\">En: <span class=\"text-slate-200 font-mono\">" + t.enPx.toFixed(1) + "</span> | Ex: <span class=\"text-slate-200 font-mono\">" + t.exPx.toFixed(1) + "</span> (" + t.reason + ")</div>" +
                    "</div>" +
                    "<div class=\"text-right\">" +
                        "<div class=\"font-bold text-sm font-mono " + (isWin ? "text-emerald-400" : "text-rose-400") + "\">" + (t.pnl >= 0 ? "+" : "") + t.pnl.toFixed(1) + "</div>" +
                        "<div class=\"text-[10px] text-slate-500\">pts</div>" +
                    "</div>";
                container.appendChild(card);
            });
        }

        function createChart() {
            const chartContainer = document.getElementById("chart");
            chart = LightweightCharts.createChart(chartContainer, {
                width: chartContainer.clientWidth, height: chartContainer.clientHeight,
                layout: { background: { type: "solid", color: "#090d16" }, textColor: "#94a3b8" },
                grid: { vertLines: { color: "rgba(51, 65, 85, 0.25)" }, horzLines: { color: "rgba(51, 65, 85, 0.25)" } },
                crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
                rightPriceScale: { borderColor: "#1e293b" },
                timeScale: { borderColor: "#1e293b", timeVisible: true, secondsVisible: false },
            });

            candlestickSeries = chart.addCandlestickSeries({ upColor: "#10b981", downColor: "#ef4444", borderVisible: false, wickUpColor: "#10b981", wickDownColor: "#ef4444" });
            vwapSeries = chart.addLineSeries({ color: "#22d3ee", lineWidth: 1.5, title: "VWAP" });
            emaSeries = chart.addLineSeries({ color: "#fbbf24", lineWidth: 1.5, title: "9 EMA" });

            const candles = [], vwapData = [], emaData = [];
            RAW_DATA.c.forEach(c => {
                candles.push({ time: c[0], open: c[1], high: c[2], low: c[3], close: c[4] });
                vwapData.push({ time: c[0], value: c[6] });
                emaData.push({ time: c[0], value: c[7] });
            });

            candlestickSeries.setData(candles);
            vwapSeries.setData(vwapData);
            emaSeries.setData(emaData);

            const markers = [];
            RAW_DATA.t.forEach(t => {
                markers.push({ time: t.enTs, position: t.type === "LONG" ? "belowBar" : "aboveBar", color: t.type === "LONG" ? "#10b981" : "#ef4444", shape: t.type === "LONG" ? "arrowUp" : "arrowDown", text: (t.type === "LONG" ? "L #" : "S #") + t.id });
                markers.push({ time: t.exTs, position: t.pnl > 0 ? "aboveBar" : "belowBar", color: t.pnl > 0 ? "#34d399" : "#f87171", shape: "circle", text: "Exit #" + t.id + " (" + (t.pnl >= 0 ? "+" : "") + t.pnl.toFixed(1) + ")" });
            });

            markers.sort((a, b) => a.time - b.time);
            candlestickSeries.setMarkers(markers);

            window.addEventListener("resize", () => { chart.applyOptions({ width: chartContainer.clientWidth, height: chartContainer.clientHeight }); });
            document.getElementById("btn-reset-zoom").onclick = () => chart.timeScale().fitContent();

            let vwapVisible = true;
            document.getElementById("btn-toggle-vwap").onclick = (e) => {
                vwapVisible = !vwapVisible; vwapSeries.applyOptions({ visible: vwapVisible });
                e.target.textContent = vwapVisible ? "VWAP On" : "VWAP Off";
                e.target.className = vwapVisible ? "px-2.5 py-1 bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 text-xs font-medium rounded transition" : "px-2.5 py-1 bg-slate-800 text-slate-400 text-xs font-medium rounded transition";
            };

            let emaVisible = true;
            document.getElementById("btn-toggle-ema").onclick = (e) => {
                emaVisible = !emaVisible; emaSeries.applyOptions({ visible: emaVisible });
                e.target.textContent = emaVisible ? "9 EMA On" : "9 EMA Off";
                e.target.className = emaVisible ? "px-2.5 py-1 bg-amber-950/80 border border-amber-800/50 text-amber-400 text-xs font-medium rounded transition" : "px-2.5 py-1 bg-slate-800 text-slate-400 text-xs font-medium rounded transition";
            };

            if (RAW_DATA.t.length > 0) {
                const lastTrade = RAW_DATA.t[RAW_DATA.t.length - 1];
                chart.timeScale().setVisibleRange({ from: lastTrade.enTs - (3600 * 4), to: lastTrade.exTs + (3600 * 2) });
            }
        }

        function focusTradeOnChart(trade, cardElement) {
            if (selectedTradeCard) { selectedTradeCard.classList.remove("ring-2", "ring-indigo-500"); }
            cardElement.classList.add("ring-2", "ring-indigo-500");
            selectedTradeCard = cardElement;
            chart.timeScale().setVisibleRange({ from: trade.enTs - (3600 * 2), to: trade.exTs + (3600 * 2) });
        }
    </script>
</body>
</html>`;

    fs.writeFileSync("nifty50_backtest_chart.html", htmlContent);
    console.log("✅ Done! Saved updated interactive dashboard to nifty50_backtest_chart.html");
}

run();
'
