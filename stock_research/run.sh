#!/usr/bin/env bash
#
# Run the stock research dashboard (and other scripts) using the
# INDstocks (INDmoney) API instead of yfinance for market data.
#
# Usage:
#   ./run.sh                         -> start stock_dashboard.py (port 9090)
#   ./run.sh --port 9090             -> pass args through to the dashboard
#   ./run.sh scanner --json          -> stock_scanner.py
#   ./run.sh quote RELIANCE          -> stock_tools.py (quote + news)
#   ./run.sh backtest RELIANCE       -> backtest_tools.py
#
# The INDstocks access token is read (in order) from:
#   1. $INDSTOCKS_TOKEN
#   2. .indstocks_token in this directory
#   3. the demo token in docs/indstocks-api-docs.md (handled by the code)
# Generate/refresh tokens at https://indstocks.com/app/api-trading/access-tokens
set -euo pipefail
cd "$(dirname "$0")"

PY="venv/bin/python"
if [ ! -x "$PY" ]; then
  PY="python3"
fi

# Load the token from a local file if not already in the environment
if [ -z "${INDSTOCKS_TOKEN:-}" ] && [ -f .indstocks_token ]; then
  export INDSTOCKS_TOKEN
  INDSTOCKS_TOKEN="$(tr -d '[:space:]' < .indstocks_token)"
fi

case "${1:-dashboard}" in
  dashboard)
    shift || true
    exec "$PY" stock_dashboard.py "$@"
    ;;
  scanner)
    shift
    exec "$PY" stock_scanner.py "$@"
    ;;
  quote)
    shift
    exec "$PY" stock_tools.py "$@"
    ;;
  backtest)
    shift
    exec "$PY" backtest_tools.py "$@"
    ;;
  *)
    echo "Unknown target '${1}'" >&2
    echo "Usage: $0 [dashboard|scanner|quote|backtest] [args...]" >&2
    exit 1
    ;;
esac