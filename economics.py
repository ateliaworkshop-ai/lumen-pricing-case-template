def unit_contribution(price: float, channel: str) -> float:
    """Calculate net revenue per unit for the selected channel minus unit cost."""
    raise NotImplementedError


def monthly_contribution(price: float, channel: str, month: int) -> float:
    """Calculate monthly contribution per customer using weighted frequency and launch-month seasonality."""
    raise NotImplementedError


def customer_lifetime_months() -> float:
    """Return customer lifetime in months, back-solved from home-market LTV at home-market prices."""
    raise NotImplementedError


def ltv(price: float, channel: str) -> float:
    """Calculate customer lifetime value for the selected price and channel."""
    raise NotImplementedError


def payback_months(price: float, channel: str, month: int) -> float:
    """Calculate months required for monthly contribution to recover blended customer acquisition cost."""
    raise NotImplementedError


def ltv_cac_ratio(price: float, channel: str) -> float:
    """Calculate customer lifetime value divided by blended customer acquisition cost."""
    raise NotImplementedError
