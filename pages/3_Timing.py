import streamlit as st

st.set_page_config(page_title="LUMEN | Timing", page_icon="📅", layout="wide")

st.title("3. Launch-timing decision")
st.caption("Owner: Market and timing analyst | Dataset: data/seasonality_and_weather.csv")

with st.expander("Instructions for this page", expanded=True):
    st.markdown(
        """
**Goal**  
Identify a launch month just before or during peak demand, using the seasonality
index as the primary decision signal.

**Use this dataset**  
`data/seasonality_and_weather.csv`. Do not use other datasets in this first version.

**Required analysis**
- Plot the monthly demand-seasonality index.
- Identify the peak and the best pre-peak launch window.
- Display average temperature as context, not as proof of causation.
- Recommend one month or a short launch window and explain why.

**Expected outputs**
- Monthly seasonality chart with the recommendation highlighted.
- Optional temperature overlay or comparison.
- A short recommendation with timing assumptions and limitations.

**Checklist**
- Confirm the month and seasonality columns.
- Define what “just before peak” means.
- Avoid claiming that weather alone causes demand.
- Explain that the pattern may not perfectly transfer to Germany’s launch year.
        """
    )

st.warning("This page is a ready-to-fill template. Add the analysis and charts below without changing the shared navigation.")
st.markdown("### Planned outputs")
st.columns(2)[0].info("Monthly demand seasonality")
st.columns(2)[1].info("Recommended pre-peak launch window")
st.markdown("### Recommendation")
st.empty()
