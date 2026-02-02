#!/usr/bin/env python3
"""
Demo script to test the trading bot without real API credentials.

This script demonstrates all functionality using mock data.
"""

import sys
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box

from bot.demo_mode import DemoClient, DemoOrderExecutor
from bot.validators import validate_order_params, ValidationError
from bot.logging_config import logger

console = Console()


def demo_header():
    """Display demo header."""
    console.print("\n")
    console.print(Panel.fit(
        "🎭 [bold magenta]DEMO MODE[/bold magenta]\n"
        "[dim]Testing trading bot without real API connection[/dim]\n"
        "[yellow]No real orders will be placed![/yellow]",
        border_style="magenta"
    ))
    console.print("\n")


def demo_market_order():
    """Demonstrate MARKET order placement."""
    console.print("[bold cyan]Test 1: MARKET Order (BUY)[/bold cyan]\n")
    
    try:
        # Initialize demo client
        client = DemoClient()
        executor = DemoOrderExecutor(client)
        
        # Order parameters
        symbol = "BTCUSDT"
        side = "BUY"
        order_type = "MARKET"
        quantity = 0.001
        
        # Display order summary
        table = Table(title="📋 Order Summary", box=box.ROUNDED, show_header=False)
        table.add_column("Parameter", style="cyan", width=15)
        table.add_column("Value", style="yellow")
        table.add_row("Symbol", symbol)
        table.add_row("Side", side)
        table.add_row("Type", order_type)
        table.add_row("Quantity", str(quantity))
        console.print(table)
        console.print("\n")
        
        # Validate parameters
        exchange_info = client.get_exchange_info()
        validated = validate_order_params(
            symbol=symbol,
            side=side,
            order_type=order_type,
            quantity=quantity,
            exchange_info=exchange_info
        )
        console.print("✅ [green]Parameters validated[/green]\n")
        
        # Place order
        console.print("⏳ [yellow]Placing order...[/yellow]\n")
        order = executor.place_market_order(symbol, side, quantity)
        
        # Display response
        response_table = Table(title="✅ Order Response", box=box.ROUNDED, show_header=False)
        response_table.add_column("Field", style="cyan", width=20)
        response_table.add_column("Value", style="green")
        response_table.add_row("Order ID", str(order.get('orderId')))
        response_table.add_row("Status", order.get('status'))
        response_table.add_row("Executed Qty", order.get('executedQty'))
        response_table.add_row("Avg Price", order.get('avgPrice'))
        console.print(response_table)
        console.print("\n")
        
        console.print(Panel.fit(
            "✅ [bold green]MARKET order demo completed successfully![/bold green]",
            border_style="green"
        ))
        
    except Exception as e:
        console.print(Panel.fit(
            f"❌ [bold red]Error:[/bold red]\n{str(e)}",
            border_style="red"
        ))
        logger.error(f"Demo MARKET order error: {e}")
    
    console.print("\n" + "="*70 + "\n")


def demo_limit_order():
    """Demonstrate LIMIT order placement."""
    console.print("[bold cyan]Test 2: LIMIT Order (SELL)[/bold cyan]\n")
    
    try:
        # Initialize demo client
        client = DemoClient()
        executor = DemoOrderExecutor(client)
        
        # Order parameters
        symbol = "ETHUSDT"
        side = "SELL"
        order_type = "LIMIT"
        quantity = 0.01
        price = 2500.00
        
        # Display order summary
        table = Table(title="📋 Order Summary", box=box.ROUNDED, show_header=False)
        table.add_column("Parameter", style="cyan", width=15)
        table.add_column("Value", style="yellow")
        table.add_row("Symbol", symbol)
        table.add_row("Side", side)
        table.add_row("Type", order_type)
        table.add_row("Quantity", str(quantity))
        table.add_row("Price", str(price))
        console.print(table)
        console.print("\n")
        
        # Validate parameters
        exchange_info = client.get_exchange_info()
        validated = validate_order_params(
            symbol=symbol,
            side=side,
            order_type=order_type,
            quantity=quantity,
            price=price,
            exchange_info=exchange_info
        )
        console.print("✅ [green]Parameters validated[/green]\n")
        
        # Place order
        console.print("⏳ [yellow]Placing order...[/yellow]\n")
        order = executor.place_limit_order(symbol, side, quantity, price)
        
        # Display response
        response_table = Table(title="✅ Order Response", box=box.ROUNDED, show_header=False)
        response_table.add_column("Field", style="cyan", width=20)
        response_table.add_column("Value", style="green")
        response_table.add_row("Order ID", str(order.get('orderId')))
        response_table.add_row("Status", order.get('status'))
        response_table.add_row("Price", order.get('price'))
        response_table.add_row("Executed Qty", order.get('executedQty'))
        console.print(response_table)
        console.print("\n")
        
        console.print(Panel.fit(
            "✅ [bold green]LIMIT order demo completed successfully![/bold green]",
            border_style="green"
        ))
        
    except Exception as e:
        console.print(Panel.fit(
            f"❌ [bold red]Error:[/bold red]\n{str(e)}",
            border_style="red"
        ))
        logger.error(f"Demo LIMIT order error: {e}")
    
    console.print("\n" + "="*70 + "\n")


def demo_validation_errors():
    """Demonstrate validation error handling."""
    console.print("[bold cyan]Test 3: Validation Error Handling[/bold cyan]\n")
    
    test_cases = [
        {
            "name": "Invalid Symbol",
            "params": {
                "symbol": "INVALID123",
                "side": "BUY",
                "order_type": "MARKET",
                "quantity": 0.001
            }
        },
        {
            "name": "Invalid Side",
            "params": {
                "symbol": "BTCUSDT",
                "side": "INVALID",
                "order_type": "MARKET",
                "quantity": 0.001
            }
        },
        {
            "name": "Negative Quantity",
            "params": {
                "symbol": "BTCUSDT",
                "side": "BUY",
                "order_type": "MARKET",
                "quantity": -0.001
            }
        },
        {
            "name": "Missing Price for LIMIT",
            "params": {
                "symbol": "BTCUSDT",
                "side": "BUY",
                "order_type": "LIMIT",
                "quantity": 0.001,
                "price": None
            }
        }
    ]
    
    client = DemoClient()
    exchange_info = client.get_exchange_info()
    
    for test in test_cases:
        console.print(f"Testing: [yellow]{test['name']}[/yellow]")
        
        try:
            validate_order_params(
                **test['params'],
                exchange_info=exchange_info
            )
            console.print("  ⚠️  [yellow]Expected validation error but passed[/yellow]\n")
            
        except ValidationError as e:
            console.print(f"  ✅ [green]Caught validation error: {str(e)}[/green]\n")
            logger.info(f"Validation test '{test['name']}' passed: {e}")
        
        except Exception as e:
            console.print(f"  ❌ [red]Unexpected error: {str(e)}[/red]\n")
            logger.error(f"Validation test '{test['name']}' failed: {e}")
    
    console.print(Panel.fit(
        "✅ [bold green]Validation error handling demo completed![/bold green]",
        border_style="green"
    ))
    
    console.print("\n" + "="*70 + "\n")


def demo_log_check():
    """Display log file information."""
    console.print("[bold cyan]Test 4: Log File Check[/bold cyan]\n")
    
    console.print("Log files are being written to the [yellow]logs/[/yellow] directory:\n")
    
    log_table = Table(box=box.SIMPLE)
    log_table.add_column("Log File", style="cyan")
    log_table.add_column("Contents", style="white")
    log_table.add_row(
        "trading_bot_YYYYMMDD.log",
        "All logs (DEBUG, INFO, WARNING, ERROR)"
    )
    log_table.add_row(
        "errors_YYYYMMDD.log",
        "Error logs only"
    )
    console.print(log_table)
    console.print("\n")
    
    console.print("💡 [yellow]Check the logs/ directory to see detailed logging output![/yellow]\n")


def main():
    """Run all demo tests."""
    logger.info("Starting demo mode tests")
    
    demo_header()
    
    # Run all demos
    demo_market_order()
    demo_limit_order()
    demo_validation_errors()
    demo_log_check()
    
    # Final summary
    console.print(Panel.fit(
        "🎉 [bold green]All Demo Tests Completed![/bold green]\n\n"
        "Check the [yellow]logs/[/yellow] directory for detailed log files.\n"
        "These logs can be submitted as part of your application.\n\n"
        "[dim]Note: No real orders were placed. This was a demonstration only.[/dim]",
        border_style="green"
    ))
    console.print("\n")
    
    logger.info("Demo mode tests completed successfully")


if __name__ == "__main__":
    main()
