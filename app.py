"""Streamlit interface for the LUMEN Germany market-entry scenario."""

import calendar
import math
from collections.abc import Callable
from typing import Any

import streamlit as st

from acceptance import acceptance_rate
from constants import (
    ACCEPTANCE_FLOOR,
    BLENDED_CAC_EUR,
    DEFAULT_PAYBACK_HORIZON_MONTHS,
    SALES_CHANNELS,
    TARGET_LTV_CAC,
)
from data_loader import cleaning_report
from economics import (
    customer_lifetime_months,
    ltv,
    ltv_cac_ratio,
    monthly_contribution,
    payback_months,
    unit_contribution,
)
from verdict import verdict


LAUNCH_MONTHS = tuple(range(1, 13))
# UI affordance only; this range is not a model threshold or business rule.
PAYBACK_HORIZON_UI_RANGE = (1, 24)


def _parse_price(raw_price: str) -> tuple[float | None, str | None]:
    """Parse and validate the user-entered retail price without calculating business metrics."""
    if not raw_price.strip():
        return None, "Enter a retail price to evaluate the scenario."

    try:
        price = float(raw_price)
    except ValueError:
        return None, "Retail price must be a number, for example 2.19."

    if not math.isfinite(price):
        return None, "Retail price must be a finite number."
    if price <= 0:
        return None, "Retail price must be greater than zero."

    return price, None


def _safe_call(function: Callable[..., Any], *args: Any) -> tuple[Any | None, str | None]:
    """Call a contract function and turn incomplete-module failures into UI messages."""
    try:
        return function(*args), None
    except NotImplementedError:
        return None, "This module is not implemented yet."
    except (KeyError, TypeError, ValueError) as error:
        return None, f"The selected scenario is not available: {error}"
    except Exception as error:  # Keep the page usable for unexpected data issues.
        return None, f"The selected scenario could not be evaluated: {error}"


def _format_metric(value: Any, suffix: str = "") -> str:
    """Format a returned metric for display without changing its value."""
    if value is None:
        return "Unavailable"
    if isinstance(value, float):
        return f"{value:,.2f}{suffix}"
    return f"{value}{suffix}"


def _show_metric(label: str, value: Any, explanation: str, suffix: str = "") -> None:
    """Render one labelled metric and its plain-English explanation."""
    st.metric(label, _format_metric(value, suffix))
    st.caption(explanation)


st.set_page_config(page_title="LUMEN Germany Market Entry", page_icon="🥤")
st.title("LUMEN Germany Market Entry")
st.write(
    "Set a price, channel, and launch month to see the per-customer economics "
    "of the scenario."
)


st.subheader("Scenario inputs")
price_text = st.text_input("Retail price (€)", placeholder="For example: 2.19")
channel = st.selectbox("Sales channel", options=SALES_CHANNELS)
launch_month = st.selectbox(
    "Launch month",
    options=LAUNCH_MONTHS,
    format_func=lambda month: calendar.month_name[month],
)
payback_horizon = st.slider(
    "Payback horizon (months)",
    min_value=PAYBACK_HORIZON_UI_RANGE[0],
    max_value=PAYBACK_HORIZON_UI_RANGE[1],
    value=int(DEFAULT_PAYBACK_HORIZON_MONTHS),
    step=1,
    help="This is captured for the verdict layer; this milestone does not calculate a verdict.",
)


price, price_error = _parse_price(price_text)
input_error = price_error
if launch_month not in LAUNCH_MONTHS:
    input_error = "Choose a launch month from January through December."

if input_error:
    st.warning(input_error)


st.subheader("Decision verdict")
if price is None or input_error is not None:
    st.info("Verdict unavailable until all scenario inputs are valid.")
else:
    verdict_result, verdict_error = _safe_call(
        verdict,
        price,
        channel,
        launch_month,
        payback_horizon,
    )
    if verdict_error:
        st.info(f"Verdict not available yet: {verdict_error}")
    elif verdict_result is None:
        st.info("Verdict unavailable for this scenario.")
    else:
        st.metric("Verdict", verdict_result.get("verdict", "Unavailable"))
        st.write("Decided by:", verdict_result.get("decided_by", "Unavailable"))
        st.write("Reasons:")
        reasons = verdict_result.get("reasons")
        if reasons:
            for reason in reasons:
                st.write(f"- {reason}")
        else:
            st.write("Unavailable")
        st.write("Trade-off:", verdict_result.get("trade_off", "Unavailable"))
        st.write("Returned metrics:")
        returned_metrics = verdict_result.get("metrics")
        if returned_metrics:
            st.json(returned_metrics)
        else:
            st.write("Unavailable")


st.subheader("Scenario economics")
metric_definitions = (
    (
        "Unit contribution",
        unit_contribution,
        "Net contribution from one unit after the channel-specific unit cost.",
        " €",
    ),
    (
        "Acceptance rate",
        acceptance_rate,
        "The estimated share of the selected channel's segments likely to buy at this price.",
        "",
    ),
    (
        "Monthly contribution per customer",
        monthly_contribution,
        "The contribution this customer is expected to generate in one month.",
        " €",
    ),
    (
        "Months to payback",
        payback_months,
        "How long before this customer has repaid what we spent to acquire them.",
        " months",
    ),
    (
        "Lifetime value",
        ltv,
        "The expected contribution from this customer over the derived customer lifetime.",
        " €",
    ),
    (
        "LTV:CAC ratio",
        ltv_cac_ratio,
        "How much lifetime contribution we expect for each euro spent acquiring the customer.",
        "",
    ),
)

metric_values: dict[str, Any] = {}
metric_errors: list[str] = []
if price is not None and input_error is None:
    for label, function, _explanation, _suffix in metric_definitions:
        if label in {"Monthly contribution per customer", "Months to payback"}:
            value, error = _safe_call(function, price, channel, launch_month)
        else:
            value, error = _safe_call(function, price, channel)
        metric_values[label] = value
        if error and error not in metric_errors:
            metric_errors.append(error)

columns = st.columns(3)
for index, (label, _function, explanation, suffix) in enumerate(metric_definitions):
    with columns[index % len(columns)]:
        _show_metric(label, metric_values.get(label), explanation, suffix)

for error in metric_errors:
    st.info(error)


st.subheader("Stated assumptions")
lifetime, lifetime_error = _safe_call(customer_lifetime_months)
assumption_columns = st.columns(2)
with assumption_columns[0]:
    st.metric("Derived customer lifetime", _format_metric(lifetime, " months"))
    st.caption("Back-solved from the home-market LTV data and held constant across scenarios.")
with assumption_columns[1]:
    st.metric("Blended acquisition cost", _format_metric(BLENDED_CAC_EUR, " €"))
    st.caption("The acquisition cost assumption used by the economics module.")
if lifetime_error:
    st.info(lifetime_error)
st.caption(
    "Display-only thresholds from the model contract: "
    f"target LTV:CAC {TARGET_LTV_CAC}; acceptance floor {ACCEPTANCE_FLOOR:.2f}."
)


with st.expander("Data quality and cleaning report"):
    report, report_error = _safe_call(cleaning_report)
    if report_error:
        st.info(report_error)
    elif report is not None:
        st.write("Duplicate rows removed:", report.get("duplicate_rows_removed", "Unavailable"))
        st.write("Personal-data columns excluded:", report.get("pii_columns_excluded", "Unavailable"))
        st.write("Anomaly weeks flagged:", report.get("anomaly_weeks_flagged", "Unavailable"))
