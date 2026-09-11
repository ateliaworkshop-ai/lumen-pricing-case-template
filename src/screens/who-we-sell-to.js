const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, notation: 'compact' });
const price = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = (value) => `${Math.round(value)}%`;
const SOURCE = { sensitivity: 'price_sensitivity_survey.csv', survey: 'customer_survey.csv', market: 'market_context.csv' };
const source = (file) => `<span class="source-tag" tabindex="0" title="Source: ${file}">${file}</span>`;
const displayName = (segment) => segment === 'Students & Budget-Conscious' ? 'Student / Budget Health' : segment;
const average = (rows, key) => rows.reduce((total, row) => total + row[key], 0) / rows.length;
const segmentSurvey = (data, segment) => data.customer_survey.filter((row) => row.segment === segment);

function preferredChannel(data, selected) {
  const counts = new Map();
  selected.flatMap((segment) => segmentSurvey(data, segment)).forEach((row) => counts.set(row.preferred_channel, (counts.get(row.preferred_channel) || 0) + 1));
  return [...counts.entries()].sort(([, left], [, right]) => right - left)[0]?.[0] || '—';
}

function recommendedPrice(data, selected) {
  return data.price_sensitivity.blended.map((row) => ({ candidate: row.price_eur, acceptance: average(selected.map((segment) => data.price_sensitivity.by_segment[segment].find((item) => item.price_eur === row.price_eur)), 'acceptance_pct') })).sort((left, right) => right.acceptance - left.acceptance || right.candidate - left.candidate)[0];
}

function region(data, name) {
  const rows = data.market_context.filter((row) => row.dimension_type === 'region' && row.name === name);
  const share = rows.find((row) => row.metric === 'population_share_of_market')?.value || 0;
  const cagr = rows.find((row) => row.metric === 'regional_cagr')?.value || 0;
  const totalMarket = data.market_context.filter((row) => row.dimension_type === 'subcategory' && row.metric === 'market_size_eur' && row.year === 2026).reduce((total, row) => total + row.value, 0);
  return { name, size: totalMarket * share, cagr };
}

function markup() {
  return `<header class="hero"><div class="wordmark">LUMEN</div><div><p class="eyebrow">Germany market entry</p><h1>Who do we sell to?<br><em>Choose the first audience.</em></h1><p class="lede">Compare German consumer segments, then focus the launch on the mix with the clearest acceptance and channel fit.</p></div></header><nav class="tabs" aria-label="Case workspaces"><button class="active" type="button" data-tab="who">Who do we sell to?</button><button type="button" data-tab="pricing">Pricing & unit economics</button><button type="button" disabled>Where the data disagrees</button></nav><main class="audience-layout"><section class="segment-area"><div class="section-heading"><div><p class="eyebrow">Audience selection</p><h2>Start with the people most ready to try LUMEN</h2></div><p>Select one or more segments to update the recommendation.</p></div><div id="segment-cards" class="segment-cards" aria-label="Consumer segments"></div></section><aside id="recommendation" class="recommendation-panel" aria-live="polite"></aside></main><section id="launch-strip" class="launch-strip" aria-label="Launch location and timing"></section><section class="methodology audience-method"><h2>How to read this screen</h2><p>Acceptance and price are derived from the German price-sensitivity sample. Channel preference comes from the non-personal survey fields only. City opportunity applies each city’s supplied market share to the functional-beverage market context; it is an indicative opportunity size, not German LUMEN sales.</p></section>`;
}

function renderCards(root, data, selected) {
  const segments = Object.keys(data.price_sensitivity.by_segment);
  root.querySelector('#segment-cards').innerHTML = segments.map((segment) => {
    const pricePoint = recommendedPrice(data, [segment]);
    const share = data.price_sensitivity.segment_shares[segment] * 100;
    const channel = preferredChannel(data, [segment]);
    const isSelected = selected.has(segment);
    return `<button class="segment-card ${isSelected ? 'selected' : ''}" data-segment="${segment}" type="button" aria-pressed="${isSelected}"><span class="segment-card-state">${isSelected ? 'Selected' : 'Select'}</span><strong>${displayName(segment)}</strong><span class="segment-detail">Best tested price <b>${price.format(pricePoint.candidate)}</b>${source(SOURCE.sensitivity)}</span><span class="segment-detail">Preferred channel <b>${channel}</b>${source(SOURCE.survey)}</span><span class="segment-detail">Sample potential <b>${percent(share)}</b>${source(SOURCE.sensitivity)}</span></button>`;
  }).join('');
  root.querySelectorAll('[data-segment]').forEach((button) => { button.onclick = () => { const segment = button.dataset.segment; selected.has(segment) ? selected.delete(segment) : selected.add(segment); render(root, data, selected); }; });
}

function renderRecommendation(root, data, selected) {
  const panel = root.querySelector('#recommendation');
  if (!selected.size) { panel.innerHTML = '<p class="eyebrow">Recommendation</p><h2>Select an audience</h2><p>Choose a segment to compare its likely acceptance, preferred channel, and sample potential.</p>'; return; }
  const segments = [...selected]; const pick = recommendedPrice(data, segments);
  const blended = data.price_sensitivity.blended.find((row) => row.price_eur === pick.candidate)?.acceptance_pct || 0;
  const volume = segments.reduce((total, segment) => total + data.price_sensitivity.segment_shares[segment], 0) * 100;
  const channel = preferredChannel(data, segments); const difference = pick.acceptance - blended;
  panel.innerHTML = `<p class="eyebrow">Recommendation</p><h2>Focus the first wave here</h2><p class="recommendation-copy">${segments.map(displayName).join(' + ')} combines the strongest tested willingness to pay with a clear route to reach buyers.</p><div class="recommendation-metric"><span>Target price</span><b>${price.format(pick.candidate)}</b>${source(SOURCE.sensitivity)}</div><div class="recommendation-metric"><span>Preferred channel</span><b>${channel}</b>${source(SOURCE.survey)}</div><div class="recommendation-metric"><span>Volume potential</span><b>${percent(volume)} of sample</b>${source(SOURCE.sensitivity)}</div><div class="comparison"><p>Compared with the blended view</p><div><b>${percent(pick.acceptance)}</b>${source(SOURCE.sensitivity)}<span>acceptance — ${Math.abs(difference).toFixed(1)} pts ${difference >= 0 ? 'above' : 'below'} the blended ${percent(blended)}${source(SOURCE.sensitivity)}</span></div></div>`;
}

function renderLaunchStrip(root, data) {
  const cities = ['Berlin', 'Munich'].map((name) => region(data, name));
  root.querySelector('#launch-strip').innerHTML = `<div class="launch-copy"><p class="eyebrow">Launch where and when</p><h2>Start in the fastest-growing city markets</h2><p>Both cities have the supplied urban-growth premium, making them the clearest places to validate the chosen audience first.</p></div><div class="city-opportunities">${cities.map((city) => `<article><h3>${city.name}</h3><p>Indicative market size <b>${euro.format(city.size)}</b>${source(SOURCE.market)}</p><p>Regional CAGR <b>${percent(city.cagr * 100)}</b>${source(SOURCE.market)}</p></article>`).join('')}</div>`;
}

function render(root, data, selected) { renderCards(root, data, selected); renderRecommendation(root, data, selected); renderLaunchStrip(root, data); }

export async function mountWhoWeSellTo(root, navigate) {
  root.innerHTML = markup();
  root.querySelectorAll('[data-tab]').forEach((button) => { button.onclick = () => navigate(button.dataset.tab); });
  try {
    const response = await fetch('./assets/data.json');
    if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
    render(root, await response.json(), new Set(['Urban Wellness Professionals']));
  } catch (error) {
    root.querySelector('#segment-cards').innerHTML = '<p class="empty-state">The source data could not be loaded. Please refresh and try again.</p>';
    console.error('Unable to render audience screen', error);
  }
}
