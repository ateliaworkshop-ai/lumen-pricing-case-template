import streamlit as st

st.set_page_config(page_title="LUMEN | Channels", page_icon="📣", layout="wide")

st.title("2. Channel decision")
st.caption("Owner: Marketing and channel analyst | Dataset: data/marketing_funnel_monthly.csv")

with st.expander("Instructions for this page", expanded=True):
    st.markdown(
        """
**Goal**  
Select the German launch channels that appear most efficient in the marketing
funnel and explain the trade-off between reach and commercial efficiency.

**Use this dataset**  
`data/marketing_funnel_monthly.csv`. Do not use other datasets in this first version.

**Required analysis**
- Compare reach, engagement, conversion and CAC by channel.
- Identify channels with strong conversion and efficient acquisition.
- Explain whether the recommendation favors scale, efficiency or a balance.
- Rank the channels and highlight the recommended priorities.

**Expected outputs**
- Funnel or conversion-rate comparison.
- CAC or efficiency comparison by channel.
- A channel-ranking chart and short recommendation.

**Checklist**
- Aggregate monthly observations consistently.
- Define every rate and efficiency metric.
- Check whether unusual months distort the ranking.
- Distinguish observed home-market performance from a forecast for Germany.
        """
    )

st.warning("This page is a ready-to-fill template. Add the analysis and charts below without changing the shared navigation.")
st.markdown("### Planned outputs")
st.columns(2)[0].info("Funnel and conversion comparison")
st.columns(2)[1].info("CAC and channel ranking")
st.markdown("### Recommendation")
st.empty()
