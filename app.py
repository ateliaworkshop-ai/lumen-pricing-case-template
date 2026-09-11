import streamlit as st

st.set_page_config(page_title="LUMEN Germany Launch", page_icon="🥤", layout="wide")

st.title("LUMEN Germany Launch Dashboard")
st.subheader("Pricing, channels and launch timing")
st.write(
    "This shared workspace will help the team recommend how LUMEN should enter "
    "the German functional-beverage market. The first version focuses on three "
    "decisions and uses one page per dataset."
)

st.info("Use the pages in the sidebar to explore pricing, marketing channels and launch timing.")

st.markdown("### Phase 1 decision questions")
cols = st.columns(3)
with cols[0]:
    st.markdown("#### 1. Price")
    st.write("Which candidate price gives the strongest acceptance–contribution trade-off?")
with cols[1]:
    st.markdown("#### 2. Channels")
    st.write("Which channels should be prioritized based on funnel performance?")
with cols[2]:
    st.markdown("#### 3. Timing")
    st.write("Which month offers the most attractive launch opportunity?")

st.markdown("### Team workspace")
st.write(
    "Each page contains its dataset, objective, expected charts, assumptions and "
    "a checklist for the student responsible for that analysis. Keep the shared "
    "layout consistent and merge page work through reviewed Pull Requests."
)

st.caption("Phase 1 template — scenario comparison can be added after the three analyses are validated.")
