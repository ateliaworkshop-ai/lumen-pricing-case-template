const parseCSV = text => { const [head, ...rows] = text.trim().split(/\r?\n/); const keys = head.split(','); return rows.map(row => Object.fromEntries(keys.map((key, i) => [key, row.split(',')[i]]))); };
const eur = n => new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const number = n => new Intl.NumberFormat('en-DE', { maximumFractionDigits: 0 }).format(n);

Promise.all(['data/historical_sales_weekly.csv', 'data/marketing_funnel_monthly.csv', 'data/price_test_results.csv'].map(file => fetch(file).then(r => r.text()).then(parseCSV))).then(([sales, marketing, prices]) => {
  const rows = sales.filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.week_start_date));
  const units = rows.reduce((s,r) => s + +r.units_sold, 0), revenue = rows.reduce((s,r) => s + +r.revenue_eur, 0);
  document.querySelector('#units').textContent = number(units);
  document.querySelector('#revenue').textContent = eur(revenue);
  document.querySelector('#rpu').textContent = eur(revenue / units);
  document.querySelector('#promo').textContent = `${(rows.filter(r => r.promo_active === 'True').length / rows.length * 100).toFixed(1)}%`;

  const weekly = Object.values(rows.reduce((a,r) => { (a[r.week_start_date] ??= { date:r.week_start_date, value:0 }).value += +r.revenue_eur; return a; }, {})).sort((a,b) => a.date.localeCompare(b.date));
  drawTrend(weekly);
  const latest = weekly.at(-1); document.querySelector('#trendNote').textContent = `${latest.date} · ${eur(latest.value)}`;
  const channels = Object.entries(rows.reduce((a,r) => (a[r.channel] = (a[r.channel] || 0) + +r.units_sold, a), {})).sort((a,b) => b[1]-a[1]);
  document.querySelector('#channels').innerHTML = channels.map(([name,value]) => `<div><div class="bar-label"><span>${name}</span><span>${number(value)} units</span></div><div class="track"><div class="fill" style="width:${value/channels[0][1]*100}%"></div></div></div>`).join('');
  const marketingTotals = Object.values(marketing.reduce((a,r) => { const x = a[r.channel] ??= {name:r.channel, spend:0, customers:0, ltv:0}; x.spend += +r.spend_eur; x.customers += +r.conversions_customers_acquired; x.ltv += +r.ltv_estimate_eur * +r.conversions_customers_acquired; return a; }, {})).sort((a,b) => b.ltv/b.customers - b.spend/b.customers - (a.ltv/a.customers-a.spend/a.customers));
  document.querySelector('#marketing').innerHTML = marketingTotals.map(x => { const cac=x.spend/x.customers, ltv=x.ltv/x.customers; return `<div class="marketing-row"><strong>${x.name}</strong><b>${(ltv/cac).toFixed(1)}× LTV/CAC</b><small>CAC ${eur(cac)} · LTV ${eur(ltv)}</small><span class="sub">${number(x.customers)} customers acquired</span></div>`; }).join('');
  const priceSelect = document.querySelector('#priceSelect'); [...new Set(prices.map(p => p.price_eur))].forEach(value => priceSelect.add(new Option(`€${value}`, value, value === '2.19', value === '2.19')));
  const renderPrices = () => { const price = priceSelect.value, options = prices.filter(p => p.price_eur === price); document.querySelector('#priceCards').innerHTML = options.map(p => `<article><h3>${p.channel}</h3><strong>${eur(+p.unit_contribution_eur)}</strong><p>unit contribution · ${p.contribution_margin_pct}% margin</p></article>`).join(''); const acceptance = options[0].estimated_acceptance_pct_of_survey; document.querySelector('#recommendation').textContent = `At €${price}, estimated acceptance is ${acceptance}%. DTC Online offers the strongest unit contribution, while Retail/Grocery maximizes reach potential.`; };
  priceSelect.addEventListener('change', renderPrices); renderPrices();
});

function drawTrend(values) { const w=920,h=244,p={l:58,r:14,t:14,b:32}, max=Math.max(...values.map(d=>d.value))*1.08, x=i=>p.l+i*(w-p.l-p.r)/(values.length-1), y=v=>h-p.b-v*(h-p.t-p.b)/max; const points=values.map((d,i)=>`${x(i)},${y(d.value)}`).join(' '); const area=`${p.l},${h-p.b} ${points} ${x(values.length-1)},${h-p.b}`; const ticks=[0,.5,1].map(f=>({v:max*f,y:y(max*f)})); document.querySelector('#trend').innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img"><defs><linearGradient id="fade" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#276ef1" stop-opacity=".22"/><stop offset="1" stop-color="#276ef1" stop-opacity="0"/></linearGradient></defs>${ticks.map(t=>`<line x1="${p.l}" x2="${w-p.r}" y1="${t.y}" y2="${t.y}" stroke="#e3eaf3"/><text x="0" y="${t.y+4}" class="axis">${eur(t.v)}</text>`).join('')}<polygon class="area" points="${area}"/><polyline class="line" points="${points}"/><circle class="dot" cx="${x(values.length-1)}" cy="${y(values.at(-1).value)}" r="5"/><text x="${p.l}" y="${h-7}" class="axis">${values[0].date.slice(0,7)}</text><text x="${w-p.r}" y="${h-7}" text-anchor="end" class="axis">${values.at(-1).date.slice(0,7)}</text></svg>`; }
