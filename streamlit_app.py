import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np

# Page configuration
st.set_page_config(
    page_title="LUMEN Germany Market Entry Simulator",
    page_icon="🥤",
    layout="wide"
)

# Title and description
st.title("🥤 LUMEN Germany Market Entry Simulator")
st.markdown("""
Explore the trade-offs between price, channel mix, and market outcomes for LUMEN's entry into the German functional beverage market.
Adjust the parameters below to see how different strategies impact contribution margin, revenue, and payback period.
""")

# Load data functions
@st.cache_data
def load_price_test_data():
    return pd.read_csv('data/price_test_results.csv')

@st.cache_data
def load_channel_economics():
    return pd.read_csv('data/channel_economics.csv')

@st.cache_data
def load_cost_breakdown():
    return pd.read_csv('data/cost_breakdown.csv')

@st.cache_data
def load_marketing_funnel():
    return pd.read_csv('data/marketing_funnel_monthly.csv')

@st.cache_data
def load_market_context():
    return pd.read_csv('data/market_context.csv')

@st.cache_data
def load_seasonality():
    return pd.read_csv('data/seasonality_and_weather.csv')

@st.cache_data
def load_competitor_promo():
    df = pd.read_csv('data/competitor_price_history.csv')
    df['month'] = pd.to_datetime(df['month'])
    df['month_num'] = df['month'].dt.month
    # Count promotions per month (across all competitors where promo_active is True)
    promo_by_month = df[df['promo_active']].groupby('month_num').size().reindex(range(1,13), fill_value=0)
    return promo_by_month

# Load all data
price_df = load_price_test_data()
channel_df = load_channel_economics()
cost_df = load_cost_breakdown()
marketing_df = load_marketing_funnel()
market_df = load_market_context()
seasonality_df = load_seasonality()
competitor_promo = load_competitor_promo()

# Calculate average COGS per unit
cogs_per_unit = cost_df[cost_df['cost_component'] == 'TOTAL COGS per unit (330ml can)']['cost_per_unit_eur'].values[0]

# Calculate average CAC and LTV from marketing data (most recent 6 months)
recent_marketing = marketing_df.tail(6)
avg_cac = recent_marketing['cac_eur'].mean()
avg_ltv = recent_marketing['ltv_estimate_eur'].mean()

# Get total addressable market (2026 Energy/Focus segment as proxy for LUMEN's category)
tam_energy = market_df[(market_df['dimension_type'] == 'subcategory') &
                       (market_df['name'] == 'Energy / focus') &
                       (market_df['year'] == 2026)]['value'].values[0]

# Sidebar for inputs
st.sidebar.header("🎛️ Simulation Controls")

# Price selection method
price_method = st.sidebar.radio(
    "Price Selection Method",
    ["Predefined Price Points", "Custom Price Range"],
    help="Choose between testing the three candidate prices or setting a custom price"
)

if price_method == "Predefined Price Points":
    price_options = sorted(price_df['price_eur'].unique())
    selected_price = st.sidebar.selectbox(
        "Select Price Point (EUR)",
        options=price_options,
        index=1,  # Default to €2.19 (middle option)
        format_func=lambda x: f"€{x:.2f}"
    )
else:
    min_price = price_df['price_eur'].min()
    max_price = price_df['price_eur'].max()
    selected_price = st.sidebar.slider(
        "Select Price (EUR)",
        min_value=float(min_price),
        max_value=float(max_price),
        value=2.19,
        step=0.01,
        format="€%.2f"
    )

# Channel allocation
st.sidebar.subheader("Channel Mix (% of Marketing Budget)")
st.sidebar.markdown("Allocations must sum to 100%")

dtc_pct = st.sidebar.slider(
    "DTC Online (%)",
    min_value=0,
    max_value=100,
    value=40,
    help="Direct-to-Consumer online channel"
)

retail_pct = st.sidebar.slider(
    "Retail/Grocery (%)",
    min_value=0,
    max_value=100,
    value=40,
    help="Traditional retail and grocery stores"
)

gym_pct = st.sidebar.slider(
    "Gym & Office (%)",
    min_value=0,
    max_value=100,
    value=20,
    help="Gyms, offices, and similar locations"
)

# Validate channel allocation
total_pct = dtc_pct + retail_pct + gym_pct
if total_pct != 100:
    st.sidebar.warning(f"Channel allocations sum to {total_pct}%. Please adjust to equal 100%.")
    # Normalize to 100% for calculations
    if total_pct > 0:
        dtc_pct = (dtc_pct / total_pct) * 100
        retail_pct = (retail_pct / total_pct) * 100
        gym_pct = (gym_pct / total_pct) * 100
else:
    st.sidebar.success("Channel allocations sum to 100% ✓")

# Scenario adjustment
st.sidebar.subheader("Scenario Assumptions")
scenario = st.sidebar.selectbox(
    "Scenario",
    ["Base Case"],
    index=0
)

# Acceptance rate adjustment based on scenario
acceptance_multiplier = 1.0

# Launch timing
st.sidebar.subheader("Launch Timing")
launch_month = st.sidebar.selectbox(
    "Launch Month",
    options=list(range(1, 13)),
    format_func=lambda x: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][x-1],
    index=5  # June (0-indexed 5) as default
)

# Get seasonal factor for selected launch month
seasonal_factor = seasonality_df[seasonality_df['month'] == launch_month]['seasonality_index_100_avg'].values[0] / 100

# Main calculation function
def calculate_outcomes(price, dtc_pct, retail_pct, gym_pct, acceptance_mult, seasonal_adj):
    # Filter price data for selected price
    price_data = price_df[price_df['price_eur'] == price]

    if len(price_data) == 0:
        # If exact price not found, interpolate or use closest
        # For simplicity, we'll use the closest predefined price
        closest_price = price_df.iloc[(price_df['price_eur'] - price).abs().argsort()[:1]]['price_eur'].values[0]
        price_data = price_df[price_df['price_eur'] == closest_price]
        price = closest_price

    # Initialize results
    results = {
        'price_eur': price,
        'total_contribution': 0,
        'total_revenue': 0,
        'total_units': 0,
        'channel_breakdown': [],
        'weighted_acceptance': 0,
        'weighted_net_price': 0,
        'weighted_unit_contribution': 0
    }

    # Calculate for each channel
    for _, row in price_data.iterrows():
        channel = row['channel']
        base_acceptance = row['estimated_acceptance_pct_of_survey'] / 100
        adjusted_acceptance = min(base_acceptance * acceptance_mult * seasonal_adj, 1.0)  # Cap at 100%
        net_price = row['net_price_to_lumen_eur']
        unit_contribution = row['unit_contribution_eur']

        # Channel-specific allocation
        if channel == 'DTC Online':
            channel_pct = dtc_pct / 100
        elif channel == 'Retail/Grocery':
            channel_pct = retail_pct / 100
        else:  # Gym & Office
            channel_pct = gym_pct / 100

        # Calculate expected volume (proportional to TAM and channel allocation)
        # Using Energy/Focus TAM as proxy, adjusted by channel allocation and acceptance
        channel_tam = tam_energy * channel_pct
        expected_units = channel_tam * adjusted_acceptance / 1000  # Convert to thousands of units for readability
        expected_revenue = expected_units * net_price * 1000  # Back to actual revenue
        expected_contribution = expected_units * unit_contribution * 1000  # Back to actual contribution

        # Accumulate totals
        results['total_contribution'] += expected_contribution
        results['total_revenue'] += expected_revenue
        results['total_units'] += expected_units
        results['weighted_acceptance'] += adjusted_acceptance * channel_pct
        results['weighted_net_price'] += net_price * channel_pct
        results['weighted_unit_contribution'] += unit_contribution * channel_pct

        # Store channel breakdown
        results['channel_breakdown'].append({
            'channel': channel,
            'allocation_pct': channel_pct * 100,
            'acceptance_pct': adjusted_acceptance * 100,
            'net_price_eur': net_price,
            'unit_contribution_eur': unit_contribution,
            'expected_units_k': expected_units,
            'expected_revenue_eur': expected_revenue,
            'expected_contribution_eur': expected_contribution
        })

    # Calculate derived metrics
    results['total_margin_pct'] = (results['total_contribution'] / results['total_revenue'] * 100) if results['total_revenue'] > 0 else 0
    results['payback_months'] = (avg_cac * results['total_units'] * 1000 / results['total_contribution']) if results['total_contribution'] > 0 else float('inf')
    results['ltv_cac_ratio'] = avg_ltv / avg_cac if avg_cac > 0 else 0

    return results

# Run calculations
results = calculate_outcomes(
    selected_price,
    dtc_pct,
    retail_pct,
    gym_pct,
    acceptance_multiplier,
    seasonal_factor
)

# Display results
st.header("📊 Simulation Results")

# Key metrics row
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric(
        label="Price Point",
        value=f"€{results['price_eur']:.2f}",
        help=f"Selected price point for simulation"
    )

with col2:
    st.metric(
        label="Expected Contribution",
        value=f"€{results['total_contribution']:,.0f}",
        help=f"Total expected contribution margin from all channels"
    )

with col3:
    st.metric(
        label="Expected Revenue",
        value=f"€{results['total_revenue']:,.0f}",
        help=f"Total expected revenue from all channels"
    )

with col4:
    st.metric(
        label="Contribution Margin",
        value=f"{results['total_margin_pct']:.1f}%",
        help=f"Contribution margin as percentage of revenue"
    )

# Second row of metrics
col5, col6, col7, col8 = st.columns(4)

with col5:
    st.metric(
        label="Expected Volume",
        value=f"{results['total_units']:.1f}K units",
        help=f"Total expected unit sales (in thousands)"
    )

with col6:
    st.metric(
        label="Weighted Acceptance",
        value=f"{results['weighted_acceptance']*100:.1f}%",
        help=f"Channel-weighted acceptance rate"
    )

with col7:
    st.metric(
        label="Payback Period",
        value=f"{results['payback_months']:.1f} months" if results['payback_months'] != float('inf') else "∞",
        help=f"Months to recover customer acquisition costs"
    )

with col8:
    st.metric(
        label="LTV:CAC Ratio",
        value=f"{results['ltv_cac_ratio']:.2f}",
        help=f"Lifetime Value to Customer Acquisition Cost ratio"
    )

# Tabs for detailed analysis
tab1, tab2, tab3, tab4, tab5 = st.tabs(["📈 Channel Breakdown", "📊 Visualizations", "📋 Scenario Comparison", "🗓️ Launch Timing", "ℹ️ About"])

with tab1:
    st.subheader("Channel Performance Breakdown")

    # Create detailed dataframe for display
    breakdown_df = pd.DataFrame(results['channel_breakdown'])
    if not breakdown_df.empty:
        # Format for display
        display_df = breakdown_df.copy()
        display_df['allocation_pct'] = display_df['allocation_pct'].map(lambda x: f"{x:.1f}%")
        display_df['acceptance_pct'] = display_df['acceptance_pct'].map(lambda x: f"{x:.1f}%")
        display_df['net_price_eur'] = display_df['net_price_eur'].map(lambda x: f"€{x:.2f}")
        display_df['unit_contribution_eur'] = display_df['unit_contribution_eur'].map(lambda x: f"€{x:.2f}")
        display_df['expected_units_k'] = display_df['expected_units_k'].map(lambda x: f"{x:.1f}K")
        display_df['expected_revenue_eur'] = display_df['expected_revenue_eur'].map(lambda x: f"€{x:,.0f}")
        display_df['expected_contribution_eur'] = display_df['expected_contribution_eur'].map(lambda x: f"€{x:,.0f}")

        # Rename columns for readability
        display_df = display_df.rename(columns={
            'channel': 'Channel',
            'allocation_pct': 'Budget Allocation',
            'acceptance_pct': 'Acceptance Rate',
            'net_price_eur': 'Net Price to LUMEN',
            'unit_contribution_eur': 'Unit Contribution',
            'expected_units_k': 'Expected Volume',
            'expected_revenue_eur': 'Expected Revenue',
            'expected_contribution_eur': 'Expected Contribution'
        })

        st.dataframe(display_df, hide_index=True)

        # Summary calculations
        st.subheader("Summary by Channel")
        col_a, col_b, col_c = st.columns(3)

        with col_a:
            st.write("**Highest Contribution Channel:**")
            best_contrib = max(results['channel_breakdown'], key=lambda x: x['expected_contribution_eur'])
            st.write(f"{best_contrib['channel']}: €{best_contrib['expected_contribution_eur']:,.0f}")

        with col_b:
            st.write("**Highest Revenue Channel:**")
            best_rev = max(results['channel_breakdown'], key=lambda x: x['expected_revenue_eur'])
            st.write(f"{best_rev['channel']}: €{best_rev['expected_revenue_eur']:,.0f}")

        with col_c:
            st.write("**Highest Margin Channel:**")
            best_margin = max(results['channel_breakdown'], key=lambda x: x['unit_contribution_eur'] / x['net_price_eur'] if x['net_price_eur'] > 0 else 0)
            margin_pct = (best_margin['unit_contribution_eur'] / best_margin['net_price_eur']) * 100 if best_margin['net_price_eur'] > 0 else 0
            st.write(f"{best_margin['channel']}: {margin_pct:.1f}%")

with tab2:
    st.subheader("Trade-off Visualizations")

    # Create visualizations
    if results['channel_breakdown']:
        # Prepare data for plotting
        channels = [item['channel'] for item in results['channel_breakdown']]
        contributions = [item['expected_contribution_eur'] for item in results['channel_breakdown']]
        revenues = [item['expected_revenue_eur'] for item in results['channel_breakdown']]
        allocations = [item['allocation_pct'] for item in results['channel_breakdown']]

        # Create subplots
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Contribution by Channel', 'Revenue by Channel',
                          'Budget Allocation', 'Margin vs Volume Trade-off'),
            specs=[[{"type": "bar"}, {"type": "bar"}],
                   [{"type": "pie"}, {"type": "scatter"}]]
        )

        # Contribution bar chart
        fig.add_trace(
            go.Bar(x=channels, y=contributions, name="Contribution", marker_color='lightblue'),
            row=1, col=1
        )

        # Revenue bar chart
        fig.add_trace(
            go.Bar(x=channels, y=revenues, name="Revenue", marker_color='lightgreen'),
            row=1, col=2
        )

        # Allocation pie chart
        fig.add_trace(
            go.Pie(labels=channels, values=allocations, name="Budget Allocation"),
            row=2, col=1
        )

        # Margin vs Volume scatter (using price points from data)
        price_points = sorted(price_df['price_eur'].unique())
        margin_data = []
        volume_data = []

        for price in price_points:
            price_results = calculate_outcomes(price, dtc_pct, retail_pct, gym_pct, acceptance_multiplier, seasonal_factor)
            margin_data.append(price_results['total_margin_pct'])
            volume_data.append(price_results['total_units'])

        fig.add_trace(
            go.Scatter(x=volume_data, y=margin_data, mode='lines+markers',
                      name="Margin-Volume Trade-off", line=dict(color='orange')),
            row=2, col=2
        )

        # Add current point
        fig.add_trace(
            go.Scatter(x=[results['total_units']], y=[results['total_margin_pct']],
                      mode='markers', marker=dict(size=12, color='red'),
                      name="Current Selection"),
            row=2, col=2
        )

        fig.update_layout(height=600, showlegend=True)
        fig.update_xaxes(title_text="Volume (K units)", row=2, col=2)
        fig.update_yaxes(title_text="Contribution Margin (%)", row=2, col=2)

        st.plotly_chart(fig, )

        # Additional chart: Acceptance vs Price
        st.subheader("Price Sensitivity Analysis")
        acceptance_rates = []
        for price in price_points:
            price_data = price_df[price_df['price_eur'] == price]
            if len(price_data) > 0:
                avg_acceptance = price_data['estimated_acceptance_pct_of_survey'].mean() * acceptance_multiplier * seasonal_factor
                acceptance_rates.append(min(avg_acceptance, 100))  # Cap at 100%
            else:
                acceptance_rates.append(0)

        fig2 = go.Figure()
        fig2.add_trace(go.Scatter(x=price_points, y=acceptance_rates,
                                 mode='lines+markers', name='Acceptance Rate',
                                 line=dict(color='blue')))
        fig2.add_trace(go.Scatter(x=[selected_price], y=[results['weighted_acceptance']*100],
                                 mode='markers', marker=dict(size=12, color='red'),
                                 name='Selected Price'))
        fig2.update_layout(
            title="Price vs Acceptance Rate",
            xaxis_title="Price (EUR)",
            yaxis_title="Acceptance Rate (%)",
            hovermode='x'
        )
        st.plotly_chart(fig2, )

with tab3:
    st.subheader("Scenario Comparison")

    # Compare scenarios (currently only Base Case available)
    scenarios = ["Base Case"]
    scenario_results = {}

    for sc in scenarios:
        scenario_results[sc] = calculate_outcomes(selected_price, dtc_pct, retail_pct, gym_pct, 1.0, seasonal_factor)

    # Create comparison dataframe
    comparison_data = []
    for sc in scenarios:
        res = scenario_results[sc]
        comparison_data.append({
            'Scenario': sc,
            'Price (EUR)': f"€{res['price_eur']:.2f}",
            'Contribution (EUR)': f"€{res['total_contribution']:,.0f}",
            'Revenue (EUR)': f"€{res['total_revenue']:,.0f}",
            'Margin (%)': f"{res['total_margin_pct']:.1f}%",
            'Volume (K units)': f"{res['total_units']:.1f}K",
            'Payback (months)': f"{res['payback_months']:.1f}" if res['payback_months'] != float('inf') else "∞",
            'LTV:CAC': f"{res['ltv_cac_ratio']:.2f}"
        })

    comparison_df = pd.DataFrame(comparison_data)
    st.dataframe(comparison_df, hide_index=True)

    # Highlight best scenario for each metric (only Base Case available)
    st.write("**Best Performing Scenario by Metric:**")
    best_contrib = max(scenarios, key=lambda x: scenario_results[x]['total_contribution'])
    best_margin = max(scenarios, key=lambda x: scenario_results[x]['total_margin_pct'])
    best_volume = max(scenarios, key=lambda x: scenario_results[x]['total_units'])
    best_payback = min([x for x in scenarios if scenario_results[x]['payback_months'] != float('inf')],
                      key=lambda x: scenario_results[x]['payback_months'], default="N/A")

    col_x, col_y, col_z, col_w = st.columns(4)
    with col_x:
        st.metric("Highest Contribution", best_contrib)
    with col_y:
        st.metric("Highest Margin", best_margin)
    with col_z:
        st.metric("Highest Volume", best_volume)
    with col_w:
        st.metric("Fastest Payback", best_payback if best_payback != "N/A" else "N/A")

with tab4:
    st.subheader("Launch Timing Analysis")

    # Create seasonality and competitor promotion visualization
    months = list(range(1, 13))
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    # Get seasonality index for all months
    seasonality_idx = []
    for m in months:
        idx = seasonality_df[seasonality_df['month'] == m]['seasonality_index_100_avg'].values[0]
        seasonality_idx.append(idx)

    # Get competitor promo counts for all months (already loaded as competitor_promo series)
    promo_counts = [competitor_promo.get(m, 0) for m in months]

    # Create figure with secondary y-axis
    fig = make_subplots(specs=[[{"secondary_y": True}]])

    # Add seasonality index line
    fig.add_trace(
        go.Scatter(x=month_names, y=seasonality_idx, mode='lines+markers',
                   name='Seasonality Index (100=avg)', line=dict(color='blue', width=3)),
        secondary_y=False,
    )

    # Add competitor promotions as bars
    fig.add_trace(
        go.Bar(x=month_names, y=promo_counts, name='Competitor Promo Count',
               marker_color='rgba(255, 165, 0, 0.6)', opacity=0.7),
        secondary_y=True,
    )

    # Highlight selected launch month
    selected_month_name = month_names[launch_month-1]
    fig.add_trace(
        go.Scatter(x=[selected_month_name], y=[seasonality_idx[launch_month-1]],
                   mode='markers', marker=dict(size=15, color='red', symbol='star'),
                   name=f'Selected Launch Month: {selected_month_name}'),
        secondary_y=False,
    )

    # Update layout
    fig.update_layout(
        title_text="Seasonal Demand & Competitor Activity by Month",
        xaxis_title="Month",
        hovermode='x unified',
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )

    # Set y-axes titles
    fig.update_yaxes(title_text="Seasonality Index (<b>100</b> = Average Demand)", secondary_y=False)
    fig.update_yaxes(title_text="Competitor Promo Count (number of promotions)", secondary_y=True, showgrid=False)

    st.plotly_chart(fig, width='stretch')

    # Launch timing insights
    st.subheader("Launch Timing Insights")

    # Find best months based on seasonality
    best_seasonality_month = months[seasonality_idx.index(max(seasonality_idx))]
    best_seasonality_name = month_names[best_seasonality_month-1]

    # Find months with lowest competitor activity (for less competition)
    min_promo_month = months[promo_counts.index(min(promo_counts))]
    min_promo_name = month_names[min_promo_month-1]

    col1, col2 = st.columns(2)
    with col1:
        st.info(f"""
        **Peak Demand Month**: {best_seasonality_name}
        (Seasonality Index: {max(seasonality_idx):.0f})
        """)
    with col2:
        st.info(f"""
        **Lowest Competitor Activity**: {min_promo_name}
        (Promotions: {min(promo_counts)})
        """)

    # Provide recommendation based on selected month
    selected_seasonality = seasonality_idx[launch_month-1]
    selected_promo = promo_counts[launch_month-1]

    if selected_seasonality >= max(seasonality_idx) * 0.9:  # Top 10% of seasonality
        seasonality_assessment = "Excellent timing - near peak demand season"
    elif selected_seasonality >= max(seasonality_idx) * 0.7:  # Top 30%
        seasonality_assessment = "Good timing - above average demand season"
    else:
        seasonality_assessment = "Suboptimal timing - below average demand season"

    if selected_promo <= min(promo_counts) + 1:  # Nearly minimum promo activity
        competition_assessment = "Favorable - low competitor promotional activity"
    elif selected_promo <= max(promo_counts) * 0.5:  # Less than half of max
        competition_assessment = "Moderate - some competitor promotional activity"
    else:
        competition_assessment = "Challenging - high competitor promotional activity"

    st.success(f"""
    **Launch Timing Assessment for {selected_month_name}:**
    - Seasonality: {seasonality_assessment}
    - Competition: {competition_assessment}
    """)

    # Show how launch month affects the seasonal factor in the simulation
    st.write(f"""
    **Impact on Simulation**:
    The selected launch month ({selected_month_name}) applies a seasonal factor of {seasonal_factor:.2f}
    to the base acceptance rates in the financial projections above.
    """)

with tab5:
    st.subheader("About This Simulator")
    st.markdown("""
    ### Purpose
    This interactive simulator helps explore the strategic trade-offs for LUMEN's Germany market entry decision,
    specifically addressing the tension between:
    - **CMO's Objective**: Premium positioning (higher price, brand building)
    - **CFO's Objective**: Fast payback (lower price, higher volume, quicker margin recovery)
    """)

    st.markdown("""
    ### Data Sources
    The simulation integrates data from all 12 case exhibits:
    - **price_test_results.csv**: Acceptance rates, net prices, and contributions for 3 candidate prices
    - **channel_economics.csv**: Channel-specific economics (retailer margins, distributor cuts, etc.)
    - **cost_breakdown.csv**: Per-unit cost structure and current gross margin
    - **marketing_funnel_monthly.csv**: Channel-specific CAC, LTV, and marketing performance
    - **market_context.csv**: Germany functional beverage market sizing and regional breakdown
    - **seasonality_and_weather.csv**: Monthly demand seasonality and temperature correlations
    - **competitor_price_history.csv**: Competitive pricing and promotion activity over time
    """)

    st.markdown("""
    ### Key Assumptions
    1. **Market Size**: Uses Energy/Focus segment (€2.55bn in 2026) as proxy for LUMEN's addressable market
    2. **Acceptance Rates**: Based on survey data from `price_test_results.csv`, adjustable by scenario
    3. **Channel Allocation**: Marketing budget distributed across DTC Online, Retail/Grocery, and Gym & Office
    4. **Seasonal Adjustment**: Optional monthly demand variation based on `seasonality_and_weather.csv`
    5. **Competitor Activity**: Promotion frequency derived from `competitor_price_history.csv`
    6. **Financial Metrics**:
       - CAC and LTV averaged from most recent 6 months of marketing data
       - Payback period = (CAC × Total Customers) / Total Contribution
       - LTV:CAC ratio from marketing funnel data
    7. **Volume Calculation**: Expected units = TAM × Channel Allocation × Acceptance Rate × Seasonal Factor
    """)

    st.markdown("""
    ### How to Use
    1. **Select Price**: Choose from the three candidate prices (€1.79, €2.19, €2.59) or set a custom price
    2. **Allocate Budget**: Distribute your marketing budget across the three channels (must sum to 100%)
    3. **Adjust Scenario**: Test Base Case, Optimistic (+20% acceptance), or Pessimistic (-20% acceptance)
    4. **Set Launch Timing**: Choose launch month to factor in seasonality and competitor activity
    5. **Explore Results**: Use the tabs to view detailed breakdowns, visualizations, scenario comparisons, and launch timing analysis
    6. **Iterate**: Adjust parameters to explore different strategies and their outcomes
    """)

    st.markdown("""
    ### Insights to Explore
    - How does channel mix affect the price/volume trade-off?
    - Which channel combination maximizes contribution vs. revenue vs. speed of payback?
    - How sensitive are outcomes to changes in acceptance rates and seasonal factors?
    - What is the optimal launch timing considering both demand seasonality and competitor activity?
    - What is the optimal strategy for different objectives (margin maximization vs. market share vs. quick ROI)?
    """)

# Footer
st.markdown("---")
st.markdown("*LUMEN Germany Market Entry Simulator - Built for the ATELIA × ESCP Case Competition*")
