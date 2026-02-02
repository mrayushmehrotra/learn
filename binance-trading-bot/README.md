# 🤖 Binance Futures Trading Bot

A Python-based trading bot for placing orders on **Binance Futures Testnet (USDT-M)** with a clean, reusable structure, comprehensive logging, and an intuitive CLI interface.

## ✨ Features

- ✅ **Market & Limit Orders**: Support for both MARKET and LIMIT orders
- ✅ **Buy & Sell**: Trade on both sides of the market
- ✅ **Input Validation**: Comprehensive validation of all trading parameters
- ✅ **Structured Logging**: Detailed logging to both console and rotating log files
- ✅ **Error Handling**: Robust error handling for API failures, network issues, and invalid inputs
- ✅ **Beautiful CLI**: Rich terminal interface with tables, colors, and status indicators
- ✅ **Clean Architecture**: Separated concerns with dedicated modules for client, orders, validation, and logging
- ✅ **Demo Mode**: Test all functionality without API credentials or real money!

## 🎭 Demo Mode (No API Required!)

**Want to test without spending money or setting up Binance?**

We've got you covered! Use the demo mode to test all functionality with mock data:

```bash
python demo.py
```

Or submit the pre-generated log files in the `logs/` directory!

👉 **See [DEMO.md](DEMO.md) for complete demo mode documentation.**

## 📋 Prerequisites

- Python 3.8 or higher
- Binance Futures Testnet account (register at [testnet.binancefuture.com](https://testnet.binancefuture.com))
- API credentials from Binance Futures Testnet

## 🚀 Setup

### 1. Clone or Download the Repository

```bash
git clone <repository-url>
cd binance-trading-bot
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

Or if you prefer using a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure API Credentials

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Binance Futures Testnet credentials:
   ```
   API_KEY=your_actual_api_key_here
   API_SECRET=your_actual_api_secret_here
   ```

   > ⚠️ **Important**: Never commit your `.env` file to version control. It contains sensitive credentials.

## 💻 Usage

### Basic Command Structure

```bash
python cli.py place-order --symbol <SYMBOL> --side <SIDE> --type <TYPE> --quantity <QTY> [--price <PRICE>]
```

### Examples

#### Place a MARKET Order (Buy)

```bash
python cli.py place-order --symbol BTCUSDT --side BUY --type MARKET --quantity 0.001
```

#### Place a MARKET Order (Sell)

```bash
python cli.py place-order --symbol ETHUSDT --side SELL --type MARKET --quantity 0.01
```

#### Place a LIMIT Order (Buy)

```bash
python cli.py place-order --symbol BTCUSDT --side BUY --type LIMIT --quantity 0.001 --price 40000
```

#### Place a LIMIT Order (Sell)

```bash
python cli.py place-order --symbol BTCUSDT --side SELL --type LIMIT --quantity 0.001 --price 50000
```

### Command Options

| Option | Short | Required | Description |
|--------|-------|----------|-------------|
| `--symbol` | `-s` | Yes | Trading pair (e.g., BTCUSDT, ETHUSDT) |
| `--side` | - | Yes | Order side: `BUY` or `SELL` |
| `--type` | `-t` | Yes | Order type: `MARKET` or `LIMIT` |
| `--quantity` | `-q` | Yes | Order quantity (positive number) |
| `--price` | `-p` | For LIMIT | Limit price (required for LIMIT orders) |

### Check Version

```bash
python cli.py version
```

## 📂 Project Structure

```
binance-trading-bot/
├── bot/
│   ├── __init__.py          # Package initialization
│   ├── client.py            # Binance Futures client wrapper
│   ├── orders.py            # Order placement logic
│   ├── validators.py        # Input validation
│   └── logging_config.py    # Logging configuration
├── cli.py                   # CLI entry point
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── context.md               # Assignment context
├── README.md                # This file
└── logs/                    # Log files (created automatically)
    ├── trading_bot_YYYYMMDD.log  # All logs
    └── errors_YYYYMMDD.log       # Error logs only
```

## 📝 Logging

All trading activities are logged to files in the `logs/` directory:

- **`trading_bot_YYYYMMDD.log`**: Contains all log messages (DEBUG, INFO, WARNING, ERROR)
- **`errors_YYYYMMDD.log`**: Contains only ERROR level messages

Log files include:
- Timestamp
- Log level
- Module name
- Detailed message
- API requests and responses
- Order details
- Error information

Log files are automatically rotated when they reach 10 MB, with up to 5 backup files retained.

## ⚠️ Error Handling

The bot handles various error scenarios gracefully:

- **Validation Errors**: Invalid symbols, quantities, prices, etc.
- **API Errors**: Binance API errors with detailed error codes and messages
- **Network Errors**: Connection failures and timeouts
- **Configuration Errors**: Missing or invalid API credentials

All errors are:
1. Logged to the error log file
2. Displayed in the terminal with clear, user-friendly messages
3. Handled without crashing the application

## 🧪 Testing

### Example Test Sequence

1. **Test MARKET Order**:
   ```bash
   python cli.py place-order --symbol BTCUSDT --side BUY --type MARKET --quantity 0.001
   ```

2. **Test LIMIT Order**:
   ```bash
   python cli.py place-order --symbol BTCUSDT --side SELL --type LIMIT --quantity 0.001 --price 100000
   ```

3. **Test Error Handling** (invalid symbol):
   ```bash
   python cli.py place-order --symbol INVALID --side BUY --type MARKET --quantity 0.001
   ```

4. **Verify Logs**:
   ```bash
   cat logs/trading_bot_*.log
   ```

## 🔧 Troubleshooting

### "API credentials not found" Error

**Problem**: Missing or incorrect API credentials.

**Solution**:
1. Ensure you have created a `.env` file (copy from `.env.example`)
2. Add your actual API key and secret from Binance Futures Testnet
3. Verify there are no extra spaces or quotes around the values

### "Symbol not found on exchange" Error

**Problem**: Invalid trading symbol.

**Solution**:
- Use valid Binance Futures symbols (e.g., BTCUSDT, ETHUSDT, BNBUSDT)
- Ensure the symbol is in UPPERCASE
- Check [testnet.binancefuture.com](https://testnet.binancefuture.com) for available symbols

### Connection Errors

**Problem**: Unable to connect to Binance API.

**Solution**:
1. Check your internet connection
2. Verify the testnet is accessible at [testnet.binancefuture.com](https://testnet.binancefuture.com)
3. Check if your IP is blocked (try from a different network)

### Import Errors

**Problem**: Module not found errors.

**Solution**:
```bash
pip install -r requirements.txt
```

## 📦 Dependencies

- **python-binance**: Binance API wrapper
- **typer**: Modern CLI framework
- **rich**: Beautiful terminal formatting
- **python-dotenv**: Environment variable management

## 🔒 Security Notes

- ✅ API credentials are stored in `.env` file (not committed to git)
- ✅ Uses testnet environment (no real funds at risk)
- ✅ All sensitive data is excluded from logs where possible
- ⚠️ Never share your API credentials
- ⚠️ Never commit `.env` file to version control

## 📄 License

This project is created for educational purposes as part of a Python developer assignment.

## 🤝 Support

For issues or questions:
1. Check the logs in `logs/` directory
2. Review the error messages in the terminal
3. Verify your API credentials and internet connection
4. Consult the [Binance Futures API documentation](https://binance-docs.github.io/apidocs/futures/en/)

---

**Happy Trading! 🚀**

*Remember: This bot operates on Binance Futures Testnet with fake funds. Always test thoroughly before using any trading bot with real funds.*
