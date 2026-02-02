"""
Input validation for trading bot parameters.

Validates trading symbols, order types, sides, quantities, and prices.
"""

import re
from typing import Optional
from decimal import Decimal, InvalidOperation
from bot.logging_config import logger


class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass


def validate_symbol(symbol: str, exchange_info: Optional[dict] = None) -> str:
    """
    Validate trading symbol format.
    
    Args:
        symbol: Trading pair symbol (e.g., BTCUSDT)
        exchange_info: Optional exchange info to validate against
        
    Returns:
        Validated symbol in uppercase
        
    Raises:
        ValidationError: If symbol format is invalid
    """
    if not symbol:
        raise ValidationError("Symbol cannot be empty")
    
    # Convert to uppercase
    symbol = symbol.upper()
    
    # Basic format check: alphanumeric only
    if not re.match(r'^[A-Z0-9]+$', symbol):
        raise ValidationError(f"Invalid symbol format: {symbol}. Must contain only letters and numbers.")
    
    # Check minimum length
    if len(symbol) < 6:
        raise ValidationError(f"Symbol {symbol} is too short. Minimum 6 characters.")
    
    # If exchange info provided, validate symbol exists
    if exchange_info:
        symbols = [s["symbol"] for s in exchange_info.get("symbols", [])]
        if symbol not in symbols:
            raise ValidationError(f"Symbol {symbol} not found on exchange")
    
    logger.debug(f"Symbol validated: {symbol}")
    return symbol


def validate_side(side: str) -> str:
    """
    Validate order side.
    
    Args:
        side: Order side (BUY or SELL)
        
    Returns:
        Validated side in uppercase
        
    Raises:
        ValidationError: If side is invalid
    """
    if not side:
        raise ValidationError("Side cannot be empty")
    
    side = side.upper()
    
    valid_sides = ["BUY", "SELL"]
    if side not in valid_sides:
        raise ValidationError(f"Invalid side: {side}. Must be one of {valid_sides}")
    
    logger.debug(f"Side validated: {side}")
    return side


def validate_order_type(order_type: str) -> str:
    """
    Validate order type.
    
    Args:
        order_type: Order type (MARKET or LIMIT)
        
    Returns:
        Validated order type in uppercase
        
    Raises:
        ValidationError: If order type is invalid
    """
    if not order_type:
        raise ValidationError("Order type cannot be empty")
    
    order_type = order_type.upper()
    
    valid_types = ["MARKET", "LIMIT"]
    if order_type not in valid_types:
        raise ValidationError(f"Invalid order type: {order_type}. Must be one of {valid_types}")
    
    logger.debug(f"Order type validated: {order_type}")
    return order_type


def validate_quantity(quantity: float) -> float:
    """
    Validate order quantity.
    
    Args:
        quantity: Order quantity
        
    Returns:
        Validated quantity as float
        
    Raises:
        ValidationError: If quantity is invalid
    """
    try:
        qty = float(quantity)
    except (ValueError, TypeError):
        raise ValidationError(f"Invalid quantity: {quantity}. Must be a number.")
    
    if qty <= 0:
        raise ValidationError(f"Quantity must be positive. Got: {qty}")
    
    logger.debug(f"Quantity validated: {qty}")
    return qty


def validate_price(price: Optional[float], order_type: str) -> Optional[float]:
    """
    Validate order price.
    
    Args:
        price: Order price (required for LIMIT orders)
        order_type: Order type (MARKET or LIMIT)
        
    Returns:
        Validated price as float, or None for MARKET orders
        
    Raises:
        ValidationError: If price is invalid or missing for LIMIT order
    """
    # Price not required for MARKET orders
    if order_type == "MARKET":
        if price is not None:
            logger.warning("Price provided for MARKET order will be ignored")
        return None
    
    # Price required for LIMIT orders
    if order_type == "LIMIT":
        if price is None:
            raise ValidationError("Price is required for LIMIT orders")
        
        try:
            price_float = float(price)
        except (ValueError, TypeError):
            raise ValidationError(f"Invalid price: {price}. Must be a number.")
        
        if price_float <= 0:
            raise ValidationError(f"Price must be positive. Got: {price_float}")
        
        logger.debug(f"Price validated: {price_float}")
        return price_float
    
    return None


def validate_order_params(
    symbol: str,
    side: str,
    order_type: str,
    quantity: float,
    price: Optional[float] = None,
    exchange_info: Optional[dict] = None
) -> dict:
    """
    Validate all order parameters.
    
    Args:
        symbol: Trading pair symbol
        side: Order side (BUY/SELL)
        order_type: Order type (MARKET/LIMIT)
        quantity: Order quantity
        price: Order price (required for LIMIT)
        exchange_info: Optional exchange info for symbol validation
        
    Returns:
        Dictionary of validated parameters
        
    Raises:
        ValidationError: If any parameter is invalid
    """
    logger.info(f"Validating order parameters: {symbol} {side} {order_type} {quantity} @ {price}")
    
    validated = {
        "symbol": validate_symbol(symbol, exchange_info),
        "side": validate_side(side),
        "type": validate_order_type(order_type),
        "quantity": validate_quantity(quantity),
        "price": validate_price(price, order_type)
    }
    
    logger.info("All order parameters validated successfully")
    return validated
