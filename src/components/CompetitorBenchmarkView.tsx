import React, { useState } from 'react';
import { Scenario, ChannelTerms } from '../types/simulator';
import {
  COMPETITOR_PROFILES,
  COMPETITOR_PRICES_BY_CHANNEL,
  COMPETITOR_PRICE_HISTORY,
  GERMAN_CONSUMER_SURVEY_SUMMARY
} from '../data/competitorData';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Tag,
  Users,
  Award,
  ArrowUpDown,
  FileSpreadsheet,
  Quote
} from 'lucide-react';

interface CompetitorBenchmarkViewProps {
  activeScenario: Scenario;
}

export const CompetitorBenchmarkView: React.FC<CompetitorBenchmarkViewProps> = ({ activeScenario }) => {
  const [selectedChannel, setSelectedChannel] = useState<'supermarket' | 'dtc' | 'gym'>('supermarket');
  const [activeTab, setActiveTab] = useState<'ladder' | 'history' | 'profiles' | 'survey'>('ladder');

  // Extract LUMEN's prices from activeScenario
  const channels = activeScenario.economics?.channels || {};
  const channelEntries = Object.values(channels) as ChannelTerms[];
  
  // Shelf prices for LUMEN
  const lumenSupermarketPrice = (channels['Retail'] || channels['Supermarket'] || channelEntries[0])?.price?.value ?? 2.49;
  const lumenDtcPrice = (channels['DTC'] || channels['D2C'] || channelEntries[1] || channelEntries[0])?.price?.value ?? 2.49;
  const lumenGymPrice = (channels['Gym'] || channels['Gym & Office'] || channelEntries[2] || channelEntries[0])?.price?.value ?? 2.79;

  // Active channel comparison data
  const channelLabel = selectedChannel === 'supermarket' ? 'Retail / Supermarket' : selectedChannel === 'dtc' ? 'DTC Online Store' : 'Gym & Office Coolers';
  const currentLumenPrice = selectedChannel === 'supermarket' ? lumenSupermarketPrice : selectedChannel === 'dtc' ? lumenDtcPrice : lumenGymPrice;

  const getCompetitorPrice = (name: string) => {
    const prof = COMPETITOR_PROFILES.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (!prof) return 0;
    return selectedChannel === 'supermarket' ? prof.supermarketPrice : selectedChannel === 'dtc' ? prof.dtcSinglePrice : prof.gymOfficePrice;
  };

  const ladderChartData = [
    { name: 'PulsUp', price: getCompetitorPrice('PulsUp'), type: 'Mass Discounter', fill: '#94a3b8' },
    { name: 'Mate Libre', price: getCompetitorPrice('Mate Libre'), type: 'Bio Heritage', fill: '#64748b' },
    { name: `LUMEN (${activeScenario.name})`, price: currentLumenPrice, type: 'Our Strategy', fill: '#059669', isLumen: true },
    { name: 'VoltFit', price: getCompetitorPrice('VoltFit'), type: 'Direct Benchmark', fill: '#3b82f6' },
    { name: 'Root & Rise', price: getCompetitorPrice('Root & Rise'), type: 'Boutique Luxury', fill: '#8b5cf6' },
  ].sort((a, b) => a.price - b.price);

  // Direct comparison with primary benchmark VoltFit
  const voltfitBenchmark = getCompetitorPrice('VoltFit');
  const priceIndexVsVoltfit = voltfitBenchmark > 0 ? (currentLumenPrice / voltfitBenchmark) * 100 : 100;
  const priceDiffVsVoltfit = currentLumenPrice - voltfitBenchmark;

  // Historical price chart data formatting
  const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'];
  const historyChartData = months.map(m => {
    const pulsupEntry = COMPETITOR_PRICE_HISTORY.find(h => h.month === m && h.competitor === 'PulsUp');
    const matelibreEntry = COMPETITOR_PRICE_HISTORY.find(h => h.month === m && h.competitor === 'Mate Libre');
    const voltfitEntry = COMPETITOR_PRICE_HISTORY.find(h => h.month === m && h.competitor === 'VoltFit');
    const rootriseEntry = COMPETITOR_PRICE_HISTORY.find(h => h.month === m && h.competitor === 'Root & Rise');

    return {
      month: m.replace('2025-', 'M'),
      PulsUp: pulsupEntry?.netShelfPriceEur ?? 1.07,
      'Mate Libre': matelibreEntry?.netShelfPriceEur ?? 1.59,
      VoltFit: voltfitEntry?.netShelfPriceEur ?? 2.37,
      'Root & Rise': rootriseEntry?.netShelfPriceEur ?? 2.98,
      'LUMEN (Proposed)': lumenSupermarketPrice,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Insight Summary */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-700">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-3xs font-semibold uppercase tracking-wider border border-emerald-500/30">
                Audited German Market Data
              </span>
              <span className="text-3xs text-slate-400 font-mono">Exhibits 2, 3, 4 & 5</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              German Competitor Benchmark & Strategic Positioning
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real audited shelf prices, channel terms, and 12-month promotional history from the German functional beverage landscape (Berlin, Munich, Hamburg, Cologne).
            </p>
          </div>

          {/* Quick Benchmark Comparison KPI */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-right">
            <span className="text-3xs uppercase font-semibold text-slate-400 tracking-wider block">
              Price Index vs Direct Competitor (VoltFit)
            </span>
            <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
              {priceIndexVsVoltfit.toFixed(1)}%
            </div>
            <p className="text-3xs text-slate-400 mt-0.5">
              {priceDiffVsVoltfit === 0
                ? 'Exact price parity with VoltFit (€' + voltfitBenchmark.toFixed(2) + ')'
                : priceDiffVsVoltfit > 0
                ? `+€${priceDiffVsVoltfit.toFixed(2)} premium vs VoltFit`
                : `-€${Math.abs(priceDiffVsVoltfit).toFixed(2)} discount vs VoltFit`}
            </p>
          </div>
        </div>

        {/* Navigation Subtabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-700/60">
          <button
            onClick={() => setActiveTab('ladder')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'ladder'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Price Ladder by Channel
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            12-Month Price & Promo History
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'profiles'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Competitor Profiles & Strategic Flaws
          </button>
          <button
            onClick={() => setActiveTab('survey')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'survey'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            German Consumer Survey (N=422)
          </button>
        </div>
      </div>

      {/* TAB 1: PRICE LADDER BY CHANNEL */}
      {activeTab === 'ladder' && (
        <div className="space-y-6">
          {/* Channel Selector */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">German Cross-Channel Price Ladder</h3>
              <p className="text-xs text-slate-500">
                Select a distribution channel to see where LUMEN ({activeScenario.name}) ranks against German market incumbents.
              </p>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setSelectedChannel('supermarket')}
                className={`px-3 py-1 rounded-md transition-all ${
                  selectedChannel === 'supermarket'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Retail / Supermarket (Single Can)
              </button>
              <button
                onClick={() => setSelectedChannel('dtc')}
                className={`px-3 py-1 rounded-md transition-all ${
                  selectedChannel === 'dtc'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                DTC Online (Single / Equivalent)
              </button>
              <button
                onClick={() => setSelectedChannel('gym')}
                className={`px-3 py-1 rounded-md transition-all ${
                  selectedChannel === 'gym'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gym & Office Coolers
              </button>
            </div>
          </div>

          {/* Bar Chart & Comparison Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {channelLabel} — Shelf Price Ladder (€ incl. VAT & Pfand)
                </span>
                <span className="text-3xs text-slate-500 font-mono">Source: Exhibit 2 Audit</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ladderChartData} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis
                      domain={[0, 3.8]}
                      tickFormatter={(v) => `€${v.toFixed(2)}`}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <Tooltip
                      formatter={(val: number) => [`€${val.toFixed(2)}`, 'Shelf Price']}
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <ReferenceLine y={2.34} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Avg Survey WTP (€2.34)', fill: '#ef4444', fontSize: 10, position: 'top' }} />
                    <Bar dataKey="price" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-2xs text-slate-600 flex items-start gap-2 border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Strategic Pricing Positioning:</strong> LUMEN is currently priced at{' '}
                  <span className="font-bold text-slate-900 font-mono">€{currentLumenPrice.toFixed(2)}</span> in{' '}
                  {channelLabel}. This places it{' '}
                  {currentLumenPrice < 1.8
                    ? 'in the mass-market discounter zone alongside PulsUp/Mate Libre, risking brand erosion.'
                    : currentLumenPrice <= 2.6
                    ? 'in the premium functional sweetspot alongside VoltFit (€2.37-€2.49), with room for strong margins.'
                    : 'in the boutique organic luxury zone alongside Root & Rise (€2.98), where volume velocity slows.'}
                </div>
              </div>
            </div>

            {/* Structured Table */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Audited Channel Terms Matrix
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-2xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="pb-2">Brand</th>
                      <th className="pb-2">Tier</th>
                      <th className="pb-2 text-right">Price</th>
                      <th className="pb-2 text-right">vs VoltFit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ladderChartData.map((row, idx) => {
                      const diff = row.price - voltfitBenchmark;
                      return (
                        <tr key={idx} className={row.isLumen ? 'bg-emerald-50/70 font-semibold' : ''}>
                          <td className="py-2.5">
                            <div className="flex items-center gap-1.5">
                              {row.isLumen && <Award className="w-3.5 h-3.5 text-emerald-600" />}
                              <span className={row.isLumen ? 'text-emerald-900 font-bold' : 'text-slate-800'}>
                                {row.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 text-slate-500">{row.type}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                            €{row.price.toFixed(2)}
                          </td>
                          <td className={`py-2.5 text-right font-mono ${diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                            {diff === 0 ? 'Parity' : diff > 0 ? `+€${diff.toFixed(2)}` : `-€${Math.abs(diff).toFixed(2)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Multi-pack audit notes */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Audited Pack Formats (Exhibit 2 Details):
                </span>
                <div className="space-y-1 text-3xs text-slate-600">
                  <div>• <strong>PulsUp:</strong> 4-pack at €4.60 (€1.15/can), 12-pack sub at €12.90 (€1.075/can).</div>
                  <div>• <strong>Mate Libre:</strong> 4-pack at €6.80 (€1.70/can), 12-pack sub at €19.20 (€1.60/can).</div>
                  <div>• <strong>VoltFit:</strong> 4-pack at €9.96 (€2.49/can), 12-pack sub at €27.90 (€2.325/can).</div>
                  <div>• <strong>Root & Rise:</strong> 4-pack at €12.44 (€3.11/can), 12-pack sub at €34.90 (€2.908/can).</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 12-MONTH PRICE & PROMOTION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  12-Month Net Shelf Price & Promotion Tracking (Germany 2025–2026)
                </h3>
                <p className="text-xs text-slate-500">
                  Tracks actual monthly net retail shelf prices accounting for seasonal promotional discounts (Exhibit 3).
                </p>
              </div>
              <div className="flex items-center gap-2 text-2xs text-slate-500">
                <span className="w-3 h-0.5 bg-emerald-600 inline-block"></span> Proposed LUMEN
                <span className="w-3 h-0.5 bg-blue-500 inline-block ml-2"></span> VoltFit
                <span className="w-3 h-0.5 bg-slate-400 inline-block ml-2"></span> PulsUp
                <span className="w-3 h-0.5 bg-purple-500 inline-block ml-2"></span> Root & Rise
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyChartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis
                    domain={[0.7, 3.3]}
                    tickFormatter={(v) => `€${v.toFixed(2)}`}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip
                    formatter={(val: number) => [`€${val.toFixed(2)}`, 'Net Shelf Price']}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="PulsUp" stroke="#94a3b8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Mate Libre" stroke="#64748b" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="VoltFit" stroke="#3b82f6" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="Root & Rise" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line type="stepAfter" dataKey="LUMEN (Proposed)" stroke="#059669" strokeWidth={3} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Key Audit Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-2xs font-bold text-slate-800 block mb-1">VoltFit Promotional Strategy</span>
                <p className="text-3xs text-slate-600 leading-relaxed">
                  VoltFit maintains a stable list price of <strong>€2.37</strong>, but executes targeted ~12.7% promotional drops (down to <strong>€2.07</strong>) in April (pre-summer fitness ramp) and July, plus a smaller 8.9% discount in November.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-2xs font-bold text-slate-800 block mb-1">PulsUp High-Velocity Discounting</span>
                <p className="text-3xs text-slate-600 leading-relaxed">
                  PulsUp relies on aggressive seasonal discounting, dropping from <strong>€1.07</strong> to <strong>€0.87 (-18.7%)</strong> in February and August to clear inventory and box out new low-cost entrants.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-2xs font-bold text-slate-800 block mb-1">Root & Rise Price Inelasticity</span>
                <p className="text-3xs text-slate-600 leading-relaxed">
                  Root & Rise never ran a single price promotion in 12 months (0% discount, flat <strong>€2.98</strong>), protecting its ultra-premium luxury posture and high margins at the cost of lower velocity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPETITOR PROFILES & STRATEGIC WEAKNESSES */}
      {activeTab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {COMPETITOR_PROFILES.map(comp => {
            const isDirect = comp.id === 'voltfit';
            return (
              <div
                key={comp.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 ${
                  isDirect ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">{comp.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-3xs font-semibold ${
                        isDirect ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {comp.tier}
                      </span>
                    </div>
                    <p className="text-2xs text-slate-500 mt-0.5">{comp.positioning}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-3xs uppercase font-semibold text-slate-400 block">Retail Shelf</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      €{comp.supermarketPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{comp.description}</p>

                <div className="grid grid-cols-2 gap-2 text-2xs p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-3xs font-semibold text-slate-400 block">Caffeine Source</span>
                    <span className="text-slate-800 font-medium">{comp.caffeineSource}</span>
                  </div>
                  <div>
                    <span className="text-3xs font-semibold text-slate-400 block">Unaided Awareness</span>
                    <span className="text-slate-800 font-mono font-bold">{comp.unaidedAwarenessPct}%</span>
                  </div>
                  <div>
                    <span className="text-3xs font-semibold text-slate-400 block">Target Consumer</span>
                    <span className="text-slate-800 font-medium">{comp.targetDemographic}</span>
                  </div>
                  <div>
                    <span className="text-3xs font-semibold text-slate-400 block">Marketing Intensity</span>
                    <span className="text-slate-800 font-mono font-bold">{comp.marketingIntensityIndex} / 100</span>
                  </div>
                </div>

                {/* Strengths & Vulnerabilities */}
                <div className="space-y-2 text-2xs pt-1">
                  <div>
                    <span className="text-3xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                      Key Strengths:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                      {comp.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-3xs font-bold text-rose-800 uppercase tracking-wider block mb-1">
                      Strategic Vulnerabilities (LUMEN Opportunity):
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                      {comp.vulnerabilities.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: GERMAN CONSUMER SURVEY */}
      {activeTab === 'survey' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Survey Highlights */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  German Consumer Survey & Willingness to Pay (N=422)
                </h3>
                <p className="text-xs text-slate-500">
                  Panel of active urban consumers across Berlin (31%), Munich (26%), Hamburg (23%), and Cologne (20%).
                </p>
              </div>

              {/* Acceptability Thresholds */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Price Acceptability Zones (Van Westendorp Curve):
                </span>
                
                <div className="space-y-2 text-2xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50 border border-rose-100">
                    <span className="text-rose-900 font-medium">Too Cheap / Perceived as Poor Quality</span>
                    <span className="font-mono font-bold text-rose-800">&lt; €1.49</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                    <span className="text-amber-900 font-medium">Bargain Entry Sweetspot</span>
                    <span className="font-mono font-bold text-amber-800">€1.50 – €1.99</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-emerald-950 font-bold">Premium Expected Sweetspot (LUMEN Target)</span>
                    <span className="font-mono font-bold text-emerald-800">€2.00 – €2.50</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                    <span className="text-blue-900 font-medium">High-End Tolerance (Affluent Urbanites)</span>
                    <span className="font-mono font-bold text-blue-800">€2.50 – €2.80</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                    <span className="text-slate-800 font-medium">Too Expensive Barrier (Trial Resistance)</span>
                    <span className="font-mono font-bold text-slate-700">&gt; €2.90</span>
                  </div>
                </div>

                <div className="pt-2 text-3xs text-slate-500">
                  * Mean survey Willingness-to-Pay for clean functional caffeine without crash is <strong>€2.34</strong>.
                </div>
              </div>
            </div>

            {/* Consumer Verbatims & Strategic Quotes */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Qualitative Customer Verbatims (Exhibit 5)
                </h3>
                <p className="text-xs text-slate-500">
                  Representative shopper sentiment directly commenting on VoltFit, price resistance, and wellness caffeine.
                </p>
              </div>

              <div className="space-y-3">
                {GERMAN_CONSUMER_SURVEY_SUMMARY.customerQuotes.map((q, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-3xs">
                      <span className="font-bold text-slate-700">{q.segment}</span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${
                        q.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {q.sentiment}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-2xs italic text-slate-800">
                      <Quote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>"{q.quote}"</span>
                    </div>
                    <div className="text-3xs text-emerald-800 font-medium pt-1 border-t border-slate-200/60">
                      <strong>Takeaway:</strong> {q.strategicInsight}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
