const prices = [
  [1.79,'DTC Online',61.7,1.39,.77,55.3],[1.79,'Retail/Grocery',61.7,1.02,.40,39.2],[1.79,'Gym & Office',61.7,1.43,.81,56.7],
  [2.19,'DTC Online',51.7,1.78,1.16,65.1],[2.19,'Retail/Grocery',51.7,1.25,.63,50.3],[2.19,'Gym & Office',51.7,1.75,1.13,64.6],
  [2.59,'DTC Online',26.7,2.16,1.54,71.4],[2.59,'Retail/Grocery',26.7,1.48,.86,58.0],[2.59,'Gym & Office',26.7,2.07,1.45,70.1]
].map(([price,channel,acceptance,net,unitContribution,margin])=>({price,channel,acceptance,net,unitContribution,margin}));
const baseline={"DTC Online":82069,"Gym & Office":50809,"Retail/Grocery":121896};
const homeShare={"DTC Online":.3187,"Gym & Office":.179,"Retail/Grocery":.5024};
const survey={overallIntent:7.21,channels:{"DTC Online":{share:.283,intent:7.79},"Gym & Office":{share:.252,intent:7.13},"Retail/Grocery":{share:.464,intent:6.9}},segments:[['Urban Wellness Professionals',9.12],['Fitness & Gym-Goers',7.97],['On-the-go Commuters',6.71],['Students & Budget-Conscious',5.5]]};
const competitors={"DTC Online":{PulsUp:1.07,VoltFit:2.37,'Root & Rise':2.91},"Gym & Office":{PulsUp:1.23,'Mate Libre':1.78,VoltFit:2.69},"Retail/Grocery":{PulsUp:1.03,'Mate Libre':1.49,VoltFit:2.26,'Root & Rise':2.78}};
const marketing=[['Referral / Subscription',28.14,82.17],['Influencer / Content',37.53,103.02],['Paid Social',45.79,129.19],['Retail Sampling',60.13,172.30]];
const seasons=[['January',78],['February',80],['March',88],['April',98],['May',118],['June',132],['July',138],['August',128],['September',104],['October',90],['November',82],['December',84]];
const eur=n=>new Intl.NumberFormat('en-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
const num=n=>new Intl.NumberFormat('en-DE',{maximumFractionDigits:0}).format(n);
const el=id=>document.getElementById(id);
const input=id=>Number(el(id).value);
seasons.forEach(([name,index],i)=>el('month').add(new Option(`${name} · seasonality ${index}`,i,i===4,i===4)));
['cfoWeight','scale','readiness','month','fixedCost','marketingSpend','penetration'].forEach(id=>el(id).addEventListener('input',render));

function getState(){return {weight:input('cfoWeight')/100,scale:input('scale'),readiness:input('readiness'),month:input('month'),fixed:input('fixedCost'),marketing:input('marketingSpend'),penetration:input('penetration')}}
function positionIndex(price,channel){const values=competitors[channel],low=[values.PulsUp,values['Mate Libre']].filter(Boolean),high=[values.VoltFit,values['Root & Rise']].filter(Boolean),l=low.reduce((a,b)=>a+b)/low.length,h=high.reduce((a,b)=>a+b)/high.length;return 100*(price-l)/(h-l)}
function render(){
 const s=getState(), valid=[s.scale>0,s.readiness>0&&s.readiness<=1,s.fixed>=0,s.marketing>=0,s.penetration>0&&s.penetration<=.05].every(Boolean);
 el('validation').textContent=valid?'':'Use a positive scale, penetration, and costs; readiness must be between 0.1 and 1.'; if(!valid)return;
 el('weightLabel').textContent=s.weight<.34?'CMO-led':s.weight>.66?'CFO-led':'Balanced';
 const [month,season]=seasons[s.month]; el('seasonNote').textContent=`${month} has a ${season} seasonal-demand index.`;
 const rows=prices.map(x=>{
   const preference=survey.channels[x.channel].share/homeShare[x.channel], intent=survey.channels[x.channel].intent/survey.overallIntent, acceptance=x.acceptance/51.7;
   const uncapped=baseline[x.channel]*s.scale*preference*intent*acceptance*(season/100)*s.readiness;
   const ceiling=2548000000/x.price*s.penetration, volume=Math.min(uncapped,ceiling), net=volume*x.net, contribution=volume*x.unitContribution;
   const payback=(s.fixed+s.marketing)/(contribution/12), ppi=positionIndex(x.price,x.channel), cmo=Math.max(0,1-Math.abs(ppi-100)/100)*.75+(survey.channels[x.channel].intent/10)*.25;
   const cfo=Math.min(1,12/payback)*.6+Math.min(1,x.margin/65)*.4, score=s.weight*cfo+(1-s.weight)*cmo;
   return {...x,volume,uncapped,ceiling,net,contribution,payback,ppi,cmo,cfo,score,capped:volume<uncapped};
 });
 const balanced=[...rows].sort((a,b)=>b.score-a.score)[0], pureCfo=[...rows].sort((a,b)=>b.cfo-a.cfo)[0], pureCmo=[...rows].sort((a,b)=>b.cmo-a.cmo)[0];
 renderRecommendation(balanced,pureCfo,pureCmo,s); renderMetrics(balanced); renderChannelPlan(rows); renderTable(rows,balanced); renderPositioning(balanced); renderMarketing();
}
function renderRecommendation(r,cfo,cmo,s){const cfoDiff=r.payback-cfo.payback,premiumDiff=cmo.ppi-r.ppi;el('recommendation').innerHTML=`<p class="eyebrow">Recommended base case</p><h2>Launch through ${r.channel} at €${r.price.toFixed(2)} in ${seasons[s.month][0]}.</h2><p>It balances a ${Math.round(r.margin)}% contribution margin with a ${r.ppi.toFixed(0)} premium-positioning index and pays back launch plus marketing investment in ${r.payback.toFixed(1)} months.</p><div class="tradeoff"><span><strong>Versus CFO-only:</strong> ${cfoDiff>=0?`${cfoDiff.toFixed(1)} months slower`:`${Math.abs(cfoDiff).toFixed(1)} months faster`} than ${cfo.channel} at €${cfo.price.toFixed(2)}.</span><span><strong>Versus CMO-only:</strong> ${premiumDiff>=0?`${premiumDiff.toFixed(0)} PPI points less premium`:`${Math.abs(premiumDiff).toFixed(0)} PPI points more premium`} than ${cmo.channel} at €${cmo.price.toFixed(2)}.</span></div>`}
function renderMetrics(r){el('metrics').innerHTML=`<article><p>Annual volume</p><strong>${num(r.volume)}</strong><small>estimated cans</small></article><article><p>Net revenue</p><strong>${eur(r.net)}</strong><small>after channel deductions</small></article><article><p>Contribution</p><strong>${eur(r.contribution)}</strong><small>${r.margin}% contribution margin</small></article><article><p>Cash payback</p><strong>${r.payback.toFixed(1)} mo</strong><small>${r.capped?'market ceiling applied':'uncapped demand estimate'}</small></article>`}
function renderChannelPlan(rows){const bestByChannel=Object.values(rows.reduce((acc,row)=>{if(!acc[row.channel]||row.score>acc[row.channel].score)acc[row.channel]=row;return acc},{})).sort((a,b)=>b.score-a.score);const labels=['Start here','Phase 2 test','Defer / validate'];el('channelPlan').innerHTML=bestByChannel.map((r,i)=>{const preference=(survey.channels[r.channel].share*100).toFixed(1),reason=i===0?`Best current balance of ${r.payback.toFixed(1)}-month payback, ${r.margin}% margin and ${preference}% stated channel preference.`:i===1?`Use as a limited follow-on test once the first-channel proposition is proven.`:`Lower current decision score; validate distribution economics before committing launch resources.`;return `<article><p class="eyebrow">${labels[i]}</p><h3>${r.channel}</h3><p>Best option: €${r.price.toFixed(2)} · ${num(r.volume)} estimated cans/year</p><b>${reason}</b></article>`}).join('')}
function renderTable(rows,winner){el('scenarioRows').innerHTML=rows.sort((a,b)=>b.score-a.score).map(r=>`<tr class="${r===winner?'winner':''}"><td>${r.channel}</td><td>€${r.price.toFixed(2)}</td><td>${num(r.volume)}${r.capped?'*':''}</td><td>${eur(r.net)}</td><td>${eur(r.contribution)}</td><td>${r.payback.toFixed(1)} mo</td><td>${Math.round(r.cmo*100)}</td><td>${Math.round(r.cfo*100)}</td><td>${r===winner?'<span class="tag">Recommended</span>':Math.round(r.score*100)}</td></tr>`).join('')}
function renderPositioning(r){const c=competitors[r.channel],entries=Object.entries(c);const all=[...entries.map(x=>x[1]),r.price],min=Math.min(...all)-.2,max=Math.max(...all)+.2;el('positioning').innerHTML=`<p class="footnote">${r.channel} · PPI ${r.ppi.toFixed(0)}. 0 = mass/niche midpoint; 100 = premium midpoint.</p>${[...entries,['LUMEN',r.price]].map(([name,price])=>`<div class="price-line"><span>${name}</span><div class="rail"><i class="mark" style="left:${(price-min)/(max-min)*100}%"></i></div><b>€${price.toFixed(2)}</b></div>`).join('')}`}
function renderMarketing(){el('marketing').innerHTML=marketing.map(([name,cac,ltv])=>`<div class="marketing-row"><b>${name}</b><strong>${(ltv/cac).toFixed(1)}× LTV/CAC</strong><br><span>CAC ${eur(cac)} · estimated LTV ${eur(ltv)}</span></div>`).join('')}
render();
