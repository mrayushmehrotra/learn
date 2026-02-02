"""
Demo mode for testing without real Binance API connection.

Simulates order placement with realistic responses for demonstration purposes.
"""

import time
import random
from typing import Dict, Any, Optional
from bot.logging_config import logger


class DemoClient:
    """Mock Binance client for demo/testing purposes."""
    
    def __init__(self):
        """Initialize demo client."""
        logger.info("Demo mode activated - No real orders will be placed")
        self.order_counter = random.randint(1000000, 9999999)
    
    def get_exchange_info(self) -> Dict[str, Any]:
        """Return mock exchange info."""
        logger.debug("Fetching demo exchange info")
        return {
            "timezone": "UTC",
            "serverTime": int(time.time() * 1000),
            "symbols": [
                {"symbol": "BTCUSDT", "status": "TRADING"},
                {"symbol": "ETHUSDT", "status": "TRADING"},
                {"symbol": "BNBUSDT", "status": "TRADING"},
                {"symbol": "ADAUSDT", "status": "TRADING"},
                {"symbol": "SOLUSDT", "status": "TRADING"},
            ]
        }
    
    def get_account_info(self) -> Dict[str, Any]:
        """Return mock account info."""
        logger.debug("Fetching demo account info")
        return {
            "totalWalletBalance": "10000.00000000",
            "totalUnrealizedProfit": "0.00000000",
            "availableBalance": "10000.00000000",
        }
    
    def futures_symbol_ticker(self, symbol: str) -> Dict[str, Any]:
        """Return mock price for a symbol."""
        logger.debug(f"Fetching demo price for {symbol}")
        
        # Mock prices for common symbols
        prices = {
            "BTCUSDT": "42350.50",
            "ETHUSDT": "2234.75",
            "BNBUSDT": "312.80",
            "ADAUSDT": "0.4523",
            "SOLUSDT": "98.45",
        }
        
        price = prices.get(symbol, "100.00")
        return {"symbol": symbol, "price": price}
    
    def futures_create_order(
        self,
        symbol: str,
        side: str,
        type: str,
        quantity: float,
        price: Optional[float] = None,
        timeInForce: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Simulate order placement.
        
        Returns a realistic order response without actually placing an order.
        """
        self.order_counter += 1
        current_time = int(time.time() * 1000)
        
        # Get mock current price
        ticker = self.futures_symbol_ticker(symbol)
        current_price = float(ticker["price"])
        
        # Simulate order response
        order_response = {
            "orderId": self.order_counter,
            "clientOrderId": f"demo_{current_time}_{self.order_counter}",
            "symbol": symbol,
            "side": side,
            "type": type,
            "origQty": str(quantity),
            "updateTime": current_time,
        }
        
        if type == "MARKET":
            # Market orders execute immediately
            order_response.update({
                "status": "FILLED",
                "executedQty": str(quantity),
                "avgPrice": str(current_price),
                "price": "0",
            })
            logger.info(f"DEMO: MARKET order executed at {current_price}")
            
        elif type == "LIMIT":
            # Limit orders are placed but may not execute immediately
            order_response.update({
                "status": "NEW",
                "executedQty": "0",
                "price": str(price),
                "avgPrice": "0",
                "timeInForce": timeInForce or "GTC",
            })
            logger.info(f"DEMO: LIMIT order placed at {price}")
        
        # Add a small delay to simulate network latency
        time.sleep(0.1)
        
        return order_response


class DemoOrderExecutor:
    """Demo order executor that uses mock client."""
    
    def __init__(self, demo_client: DemoClient):
        """Initialize demo executor."""
        self.client = demo_client
        logger.info("DemoOrderExecutor initialized")
    
    def place_market_order(
        self,
        symbol: str,
        side: str,
        quantity: float
    ) -> Dict[str, Any]:
        """Place a demo MARKET order."""
        logger.info(f"[DEMO] Placing MARKET order: {side} {quantity} {symbol}")
        
        # Validate symbol
        exchange_info = self.client.get_exchange_info()
        symbols = [s["symbol"] for s in exchange_info["symbols"]]
        
        if symbol not in symbols:
            raise ValueError(f"Symbol {symbol} not found in demo exchange")
        
        # Place demo order
        order = self.client.futures_create_order(
            symbol=symbol,
            side=side,
            type="MARKET",
            quantity=quantity
        )
        
        logger.info(f"[DEMO] MARKET order placed successfully: {order}")
        logger.info(
            f"Order ID: {order.get('orderId')} | "
            f"Status: {order.get('status')} | "
            f"Executed Qty: {order.get('executedQty')} | "
            f"Avg Price: {order.get('avgPrice')}"
        )
        
        return order
    
    def place_limit_order(
        self,
        symbol: str,
        side: str,
        quantity: float,
        price: float
    ) -> Dict[str, Any]:
        """Place a demo LIMIT order."""
        logger.info(f"[DEMO] Placing LIMIT order: {side} {quantity} {symbol} @ {price}")
        
        # Validate symbol
        exchange_info = self.client.get_exchange_info()
        symbols = [s["symbol"] for s in exchange_info["symbols"]]
        
        if symbol not in symbols:
            raise ValueError(f"Symbol {symbol} not found in demo exchange")
        
        # Place demo order
        order = self.client.futures_create_order(
            symbol=symbol,
            side=side,
            type="LIMIT",
            quantity=quantity,
            price=price,
            timeInForce="GTC"
        )
        
        logger.info(f"[DEMO] LIMIT order placed successfully: {order}")
        logger.info(
            f"Order ID: {order.get('orderId')} | "
            f"Status: {order.get('status')} | "
            f"Price: {order.get('price')} | "
            f"Executed Qty: {order.get('executedQty')}"
        )
        
        return order
    
    def place_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        quantity: float,
        price: Optional[float] = None
    ) -> Dict[str, Any]:
        """Place a demo order of any type."""
        order_type = order_type.upper()
        
        if order_type == "MARKET":
            return self.place_market_order(symbol, side, quantity)
        elif order_type == "LIMIT":
            if price is None:
                raise ValueError("Price is required for LIMIT orders")
            return self.place_limit_order(symbol, side, quantity, price)
        else:
            raise ValueError(f"Unsupported order type: {order_type}")
