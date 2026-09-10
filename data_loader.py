import pandas as pd


def load_all() -> dict[str, pd.DataFrame]:
    """Load every CSV in data/, remove exact historical-sales duplicates, and exclude survey PII."""
    raise NotImplementedError


def cleaning_report() -> dict:
    """Report removed duplicates, excluded PII columns, and flagged anomalous weeks."""
    raise NotImplementedError
