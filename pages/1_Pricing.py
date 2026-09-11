import streamlit as st

st.set_page_config(page_title="LUMEN | Pricing", page_icon="💶", layout="wide")

st.title("1. Pricing decision")
st.caption("Owner: Pricing analyst | Dataset: data/price_test_results.csv")

with st.expander("Instructions for this page", expanded=True):
    st.markdown(
        """
**Goal**  
Identify which of the three candidate prices (€1.79, €2.19 and €2.59) offers
the best trade-off between customer acceptance and contribution per unit.

**Use this dataset**  
`data/price_test_results.csv`. Do not use other datasets in this first version.

**Required analysis**
- Compare acceptance by candidate price and channel.
- Compare contribution per unit by candidate price and channel.
- Explain whether the recommendation prioritizes adoption, contribution or a balance.
- Highlight the recommended price and show the channel differences clearly.

**Expected outputs**
- Acceptance-rate chart.
- Contribution-per-unit chart.
- A short recommendation with the main trade-off and limitations.

**Checklist**
- Confirm the price and channel columns.
- Check for missing or duplicated observations.
- State how the recommended price is selected.
- Do not imply that survey acceptance equals actual German demand.
        """
    )

st.warning("This page is a ready-to-fill template. Add the analysis and charts below without changing the shared navigation.")
st.markdown("### Planned outputs")
st.columns(2)[0].info("Acceptance by price and channel")
st.columns(2)[1].info("Contribution per unit by price and channel")
st.markdown("### Recommendation")
st.empty()
