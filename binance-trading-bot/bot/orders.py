"""
Order placement logic for Binance Futures trading.

Handles MARKET and LIMIT order execution with proper error handling and logging.
"""

from typing import Dict, Any, Optional
from binance.exceptions import BinanceAPIException, BinanceRequestException
from bot.client import BinanceClient
from bot.validators import validate_order_params, ValidationError
from bot.logging_config import logger


class OrderExecutor:
    """Handles order placement on Binance Futures."""
    
    def __init__(self, client: BinanceClient):
        """
        Initialize order executor.
        
        Args:
            client: Initialized BinanceClient instance
        """
        self.client = client
        logger.info("OrderExecutor initialized")
    
    def place_market_order(
        self,
        symbol: str,
        side: str,
        quantity: float
    ) -> Dict[str, Any]:
        """
        Place a MARKET order.
        
        Args:
            symbol: Trading pair (e.g., BTCUSDT)
            side: Order side (BUY or SELL)
            quantity: Order quantity
            
        Returns:
            Order response dictionary
            
        Raises:
            ValidationError: If parameters are invalid
            BinanceAPIException: If API request fails
        """
        logger.info(f"Placing MARKET order: {side} {quantity} {symbol}")
        
        try:
            # Get exchange info for validation
            exchange_info = self.client.get_exchange_info()
            
            # Validate parameters
            params = validate_order_params(
                symbol=symbol,
                side=side,
                order_type="MARKET",
                quantity=quantity,
                exchange_info=exchange_info
            )
            
            # Log order request
            logger.info(f"Order request: {params}")
            
            # Place order
            order = self.client.client.futures_create_order(
                symbol=params["symbol"],
                side=params["side"],
                type="MARKET",
                quantity=params["quantity"]
            )
            
            # Log successful order
            logger.info(f"MARKET order placed successfully: {order}")
            logger.info(
                f"Order ID: {order.get('orderId')} | "
                f"Status: {order.get('status')} | "
                f"Executed Qty: {order.get('executedQty')} | "
                f"Avg Price: {order.get('avgPrice', 'N/A')}"
            )
            
            return order
            
        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            raise
        except BinanceAPIException as e:
            logger.error(f"Binance API error placing MARKET order: {e.message} (Code: {e.code})")
            raise
        except BinanceRequestException as e:
            logger.error(f"Binance request error placing MARKET order: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error placing MARKET order: {e}")
            raise
    
    def place_limit_order(
        self,
        symbol: str,
        side: str,
        quantity: float,
        price: float
    ) -> Dict[str, Any]:
        """
        Place a LIMIT order.
        
        Args:
            symbol: Trading pair (e.g., BTCUSDT)
            side: Order side (BUY or SELL)
            quantity: Order quantity
            price: Limit price
            
        Returns:
            Order response dictionary
            
        Raises:
            ValidationError: If parameters are invalid
            BinanceAPIException: If API request fails
        """
        logger.info(f"Placing LIMIT order: {side} {quantity} {symbol} @ {price}")
        
        try:
            # Get exchange info for validation
            exchange_info = self.client.get_exchange_info()
            
            # Validate parameters
            params = validate_order_params(
                symbol=symbol,
                side=side,
                order_type="LIMIT",
                quantity=quantity,
                price=price,
                exchange_info=exchange_info
            )
            
            # Log order request
            logger.info(f"Order request: {params}")
            
            # Place order
            order = self.client.client.futures_create_order(
                symbol=params["symbol"],
                side=params["side"],
                type="LIMIT",
                timeInForce="GTC",  # Good Till Cancel
                quantity=params["quantity"],
                price=params["price"]
            )
            
            # Log successful order
            logger.info(f"LIMIT order placed successfully: {order}")
            logger.info(
                f"Order ID: {order.get('orderId')} | "
                f"Status: {order.get('status')} | "
                f"Price: {order.get('price')} | "
                f"Executed Qty: {order.get('executedQty')} | "
                f"Avg Price: {order.get('avgPrice', 'N/A')}"
            )
            
            return order
            
        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            raise
        except BinanceAPIException as e:
            logger.error(f"Binance API error placing LIMIT order: {e.message} (Code: {e.code})")
            raise
        except BinanceRequestException as e:
            logger.error(f"Binance request error placing LIMIT order: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error placing LIMIT order: {e}")
            raise
    
    def place_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        quantity: float,
        price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Place an order of any supported type.
        
        Args:
            symbol: Trading pair (e.g., BTCUSDT)
            side: Order side (BUY or SELL)
            order_type: Order type (MARKET or LIMIT)
            quantity: Order quantity
            price: Limit price (required for LIMIT orders)
            
        Returns:
            Order response dictionary
            
        Raises:
            ValidationError: If parameters are invalid
            BinanceAPIException: If API request fails
        """
        order_type = order_type.upper()
        
        if order_type == "MARKET":
            return self.place_market_order(symbol, side, quantity)
        elif order_type == "LIMIT":
            if price is None:
                raise ValidationError("Price is required for LIMIT orders")
            return self.place_limit_order(symbol, side, quantity, price)
        else:
            raise ValidationError(f"Unsupported order type: {order_type}")
