def verdict(
    price: float,
    channel: str,
    month: int,
    payback_horizon_months: float = 12.0,
) -> dict:
    """Return verdict, deciding metric, reasons, trade-off, and scenario metrics."""
    raise NotImplementedError
