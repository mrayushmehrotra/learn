#!/usr/bin/env python3
"""
Binance Futures Trading Bot CLI

Command-line interface for placing orders on Binance Futures Testnet.
"""

import sys
from typing import Optional
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box

from bot.client import BinanceClient
from bot.orders import OrderExecutor
from bot.validators import ValidationError
from bot.logging_config import logger
from binance.exceptions import BinanceAPIException, BinanceRequestException

# Initialize CLI app and console
app = typer.Typer(help="Binance Futures Trading Bot - Place orders on testnet")
console = Console()


def format_order_summary(
    symbol: str,
    side: str,
    order_type: str,
    quantity: float,
    price: Optional[float] = None
) -> Table:
    """Create a formatted table for order summary."""
    table = Table(title="📋 Order Summary", box=box.ROUNDED, show_header=False)
    table.add_column("Parameter", style="cyan", width=15)
    table.add_column("Value", style="yellow")
    
    table.add_row("Symbol", symbol)
    table.add_row("Side", side)
    table.add_row("Type", order_type)
    table.add_row("Quantity", str(quantity))
    if price is not None:
        table.add_row("Price", str(price))
    
    return table


def format_order_response(order: dict) -> Table:
    """Create a formatted table for order response."""
    table = Table(title="✅ Order Response", box=box.ROUNDED, show_header=False)
    table.add_column("Field", style="cyan", width=20)
    table.add_column("Value", style="green")
    
    # Key fields to display
    fields = [
        ("Order ID", "orderId"),
        ("Client Order ID", "clientOrderId"),
        ("Symbol", "symbol"),
        ("Side", "side"),
        ("Type", "type"),
        ("Status", "status"),
        ("Quantity", "origQty"),
        ("Executed Qty", "executedQty"),
        ("Price", "price"),
        ("Avg Price", "avgPrice"),
        ("Time in Force", "timeInForce"),
        ("Update Time", "updateTime"),
    ]
    
    for label, key in fields:
        value = order.get(key, "N/A")
        if value != "N/A" and value != "" and value != 0:
            table.add_row(label, str(value))
    
    return table


@app.command()
def place_order(
    symbol: str = typer.Option(..., "--symbol", "-s", help="Trading pair (e.g., BTCUSDT)"),
    side: str = typer.Option(..., "--side", help="Order side: BUY or SELL"),
    order_type: str = typer.Option(..., "--type", "-t", help="Order type: MARKET or LIMIT"),
    quantity: float = typer.Option(..., "--quantity", "-q", help="Order quantity"),
    price: Optional[float] = typer.Option(None, "--price", "-p", help="Limit price (required for LIMIT orders)"),
):
    """
    Place an order on Binance Futures Testnet.
    
    Examples:
    
        # Place a MARKET order
        python cli.py place-order --symbol BTCUSDT --side BUY --type MARKET --quantity 0.001
        
        # Place a LIMIT order
        python cli.py place-order --symbol BTCUSDT --side SELL --type LIMIT --quantity 0.001 --price 45000
    """
    try:
        # Display header
        console.print("\n")
        console.print(Panel.fit(
            "🤖 [bold cyan]Binance Futures Trading Bot[/bold cyan]\n"
            "[dim]Placing order on Testnet...[/dim]",
            border_style="cyan"
        ))
        console.print("\n")
        
        # Display order summary
        summary_table = format_order_summary(symbol, side, order_type, quantity, price)
        console.print(summary_table)
        console.print("\n")
        
        # Initialize client and executor
        logger.info("Initializing Binance client...")
        client = BinanceClient()
        executor = OrderExecutor(client)
        
        # Place order
        console.print("⏳ [yellow]Placing order...[/yellow]\n")
        order = executor.place_order(
            symbol=symbol,
            side=side,
            order_type=order_type,
            quantity=quantity,
            price=price
        )
        
        # Display response
        response_table = format_order_response(order)
        console.print(response_table)
        console.print("\n")
        
        # Success message
        console.print(Panel.fit(
            f"✅ [bold green]Order placed successfully![/bold green]\n"
            f"Order ID: {order.get('orderId')}\n"
            f"Status: {order.get('status')}",
            border_style="green"
        ))
        console.print("\n")
        
        logger.info(f"Order placed successfully via CLI: {order.get('orderId')}")
        
    except ValidationError as e:
        console.print("\n")
        console.print(Panel.fit(
            f"❌ [bold red]Validation Error[/bold red]\n\n{str(e)}",
            border_style="red"
        ))
        console.print("\n")
        logger.error(f"CLI validation error: {e}")
        sys.exit(1)
        
    except BinanceAPIException as e:
        console.print("\n")
        console.print(Panel.fit(
            f"❌ [bold red]Binance API Error[/bold red]\n\n"
            f"Code: {e.code}\n"
            f"Message: {e.message}",
            border_style="red"
        ))
        console.print("\n")
        logger.error(f"CLI Binance API error: {e}")
        sys.exit(1)
        
    except BinanceRequestException as e:
        console.print("\n")
        console.print(Panel.fit(
            f"❌ [bold red]Request Error[/bold red]\n\n"
            f"Unable to connect to Binance API.\n"
            f"Error: {str(e)}",
            border_style="red"
        ))
        console.print("\n")
        logger.error(f"CLI request error: {e}")
        sys.exit(1)
        
    except ValueError as e:
        console.print("\n")
        console.print(Panel.fit(
            f"❌ [bold red]Configuration Error[/bold red]\n\n{str(e)}",
            border_style="red"
        ))
        console.print("\n")
        logger.error(f"CLI configuration error: {e}")
        sys.exit(1)
        
    except Exception as e:
        console.print("\n")
        console.print(Panel.fit(
            f"❌ [bold red]Unexpected Error[/bold red]\n\n{str(e)}",
            border_style="red"
        ))
        console.print("\n")
        logger.error(f"CLI unexpected error: {e}", exc_info=True)
        sys.exit(1)


@app.command()
def version():
    """Show version information."""
    console.print("\n[bold cyan]Binance Futures Trading Bot[/bold cyan]")
    console.print("Version: [yellow]1.0.0[/yellow]")
    console.print("Python Trading Bot for Binance Futures Testnet\n")


if __name__ == "__main__":
    app()
