"""
Binance Futures client wrapper.

Provides a clean interface for interacting with Binance Futures Testnet API.
"""

import os
from typing import Dict, Any, Optional
from binance.client import Client
from binance.exceptions import BinanceAPIException, BinanceRequestException
from dotenv import load_dotenv
from bot.logging_config import logger


class BinanceClient:
    """Wrapper for Binance Futures client with testnet configuration."""
    
    # Testnet base URL
    TESTNET_URL = "https://testnet.binancefuture.com"
    
    def __init__(self, api_key: Optional[str] = None, api_secret: Optional[str] = None):
        """
        Initialize Binance client with testnet configuration.
        
        Args:
            api_key: Binance API key (defaults to environment variable)
            api_secret: Binance API secret (defaults to environment variable)
        """
        # Load environment variables
        load_dotenv()
        
        # Get credentials from parameters or environment
        self.api_key = api_key or os.getenv("API_KEY")
        self.api_secret = api_secret or os.getenv("API_SECRET")
        
        if not self.api_key or not self.api_secret:
            error_msg = "API credentials not found. Please set API_KEY and API_SECRET in .env file."
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        try:
            # Initialize client
            self.client = Client(
                api_key=self.api_key,
                api_secret=self.api_secret,
                testnet=True
            )
            
            # Override base URL to use Futures Testnet
            self.client.API_URL = self.TESTNET_URL
            
            logger.info("Binance Futures Testnet client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Binance client: {e}")
            raise
    
    def get_account_info(self) -> Dict[str, Any]:
        """
        Get futures account information.
        
        Returns:
            Account information dictionary
            
        Raises:
            BinanceAPIException: If API request fails
        """
        try:
            logger.debug("Fetching account information")
            account_info = self.client.futures_account()
            logger.info("Successfully fetched account information")
            return account_info
        except BinanceAPIException as e:
            logger.error(f"API error fetching account info: {e}")
            raise
        except BinanceRequestException as e:
            logger.error(f"Request error fetching account info: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching account info: {e}")
            raise
    
    def get_exchange_info(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        """
        Get exchange trading rules and symbol information.
        
        Args:
            symbol: Optional specific symbol to get info for
            
        Returns:
            Exchange information dictionary
            
        Raises:
            BinanceAPIException: If API request fails
        """
        try:
            logger.debug(f"Fetching exchange info for symbol: {symbol or 'all'}")
            exchange_info = self.client.futures_exchange_info()
            
            if symbol:
                # Filter for specific symbol
                symbols_info = exchange_info.get("symbols", [])
                symbol_info = next(
                    (s for s in symbols_info if s["symbol"] == symbol),
                    None
                )
                if not symbol_info:
                    raise ValueError(f"Symbol {symbol} not found on exchange")
                return symbol_info
            
            return exchange_info
        except BinanceAPIException as e:
            logger.error(f"API error fetching exchange info: {e}")
            raise
        except BinanceRequestException as e:
            logger.error(f"Request error fetching exchange info: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching exchange info: {e}")
            raise
    
    def get_symbol_price(self, symbol: str) -> float:
        """
        Get current price for a symbol.
        
        Args:
            symbol: Trading pair symbol (e.g., BTCUSDT)
            
        Returns:
            Current price as float
            
        Raises:
            BinanceAPIException: If API request fails
        """
        try:
            logger.debug(f"Fetching price for {symbol}")
            ticker = self.client.futures_symbol_ticker(symbol=symbol)
            price = float(ticker["price"])
            logger.info(f"Current price for {symbol}: {price}")
            return price
        except BinanceAPIException as e:
            logger.error(f"API error fetching price for {symbol}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching price for {symbol}: {e}")
            raise
