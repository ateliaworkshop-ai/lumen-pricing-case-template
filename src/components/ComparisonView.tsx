import React, { useState } from 'react';
import { Scenario, EvaluationResult } from '../types/simulator';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { AlertCircle, Scale, ShieldCheck } from 'lucide-react';
import { CompetitorBenchmarkView } from './CompetitorBenchmarkView';

interface ComparisonViewProps {
  scenarios: Scenario[];
  evaluations: Record<string, EvaluationResult>;
  selectedIds: string[];
  onToggleCompare: (id: string) => void;
  onSelectActiveScenario: (id: string) => void;
  activeScenario?: Scenario;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  scenarios,
  evaluations,
  selectedIds,
  onToggleCompare,
  activeScenario
}) => {
  const [comparisonMode, setComparisonMode] = useState<'scenarios' | 'competitors'>('scenarios');
  const [horizon, setHorizon] = useState<3 | 6 | 12>(12);
  const [referenceId, setReferenceId] = useState<string>(selectedIds[0] || scenarios[0]?.id || '');

  // Keep only existing selected scenarios (between 2 and 3)
  const compareScenarios = scenarios.filter(s => selectedIds.includes(s.id));
  const currentRefId = compareScenarios.some(s => s.id === referenceId)
    ? referenceId
    : (compareScenarios[0]?.id || scenarios[0]?.id || '');
  const activeRefScenario = scenarios.find(s => s.id === currentRefId) || compareScenarios[0];
  const refEvaluation = evaluations[activeRefScenario?.id];

  const getCheckpoint = (evalRes?: EvaluationResult) => {
    if (!evalRes) return null;
    return horizon === 3 ? evalRes.checkpoints.m3 : horizon === 6 ? evalRes.checkpoints.m6 : evalRes.checkpoints.m12;
  };

  const refCheckpoint = getCheckpoint(refEvaluation);

  // Bar chart data for comparative performance
  const chartData = compareScenarios.map(sc => {
    const ck = getCheckpoint(evaluations[sc.id]);
    return {
      name: sc.name.length > 18 ? sc.name.slice(0, 18) + '...' : sc.name,
      'Net Revenue (k€)': ck ? Math.round(ck.netRevenue / 1000) : 0,
      'Marketing (k€)': ck ? Math.round(ck.marketingSpend / 1000) : 0,
      'Net Contribution (k€)': ck ? Math.round(ck.contributionAfterMarketing / 1000) : 0,
      'Volume (k cans)': ck ? Math.round(ck.volumeTotal / 1000) : 0
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Mode Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/60 shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setComparisonMode('scenarios')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              comparisonMode === 'scenarios'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>Internal Strategy Tradeoffs (F06–F07)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-3xs font-mono">
              {compareScenarios.length} compared
            </span>
          </button>

          <button
            onClick={() => setComparisonMode('competitors')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              comparisonMode === 'competitors'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>German Competitor Benchmark (Exhibits 2–5)</span>
            <span className={`px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider ${
              comparisonMode === 'competitors' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
            }`}>
              VoltFit & Incumbents
            </span>
          </button>
        </div>

        <span className="text-3xs text-slate-500 font-mono hidden md:inline-block px-3">
          {comparisonMode === 'scenarios' ? 'Scenario Sensitivity Matrix' : 'German Functional Market Audit'}
        </span>
      </div>

      {comparisonMode === 'competitors' ? (
        <CompetitorBenchmarkView activeScenario={activeRefScenario || activeScenario || scenarios[0]} />
      ) : (
        <>
          {/* Header & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Multi-Option Comparative Analysis (F06–F07)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Benchmark 2 or 3 strategies to assess tradeoffs across sales volume, margin capture, and marketing intensity.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Horizon Selector */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
                <span className="px-2 text-slate-500 text-2xs">Horizon:</span>
                {[3, 6, 12].map(h => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h as 3 | 6 | 12)}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      horizon === h
                        ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {h}m
                  </button>
                ))}
              </div>
            </div>
          </div>

      {/* Scenario Selector Checkbox Bar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Compared Options (2 to 3 recommended):</span>
          <div className="flex flex-wrap gap-2">
            {scenarios.map(sc => {
              const isChecked = selectedIds.includes(sc.id);
              return (
                <button
                  key={sc.id}
                  onClick={() => onToggleCompare(sc.id)}
                  className={`px-3 py-1 rounded-md font-medium text-2xs border transition-all flex items-center gap-1.5 ${
                    isChecked
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isChecked ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  <span>{sc.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {compareScenarios.length > 1 && (
          <div className="flex items-center gap-2 text-2xs">
            <span className="text-slate-500">Baseline Reference Option:</span>
            <select
              value={currentRefId}
              onChange={e => setReferenceId(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded bg-white font-semibold text-slate-800"
            >
              {compareScenarios.map(sc => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {compareScenarios.length < 2 ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-semibold text-slate-800 text-sm">Select at least 2 options</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Check at least two scenarios above to display the comparative table, differential deltas, and incremental ROI analysis.
          </p>
        </div>
      ) : (
        <>
          {/* Comparative KPI Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Summary Results Matrix ({horizon} Months)
              </h3>
              <span className="text-3xs text-slate-500">
                Baseline: <strong className="text-slate-800">{activeRefScenario?.name}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/50 text-slate-500 text-3xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Key Metric</th>
                    {compareScenarios.map(sc => (
                      <th key={sc.id} className="py-2.5 px-4 text-right">
                        <div className="font-bold text-slate-900 text-xs">{sc.name}</div>
                        <div className="text-slate-400 font-normal">{sc.revision}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Volume */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      Total Sold Volume ({horizon}m)
                    </td>
                    {compareScenarios.map(sc => {
                      const ck = getCheckpoint(evaluations[sc.id]);
                      const isRef = sc.id === activeRefScenario?.id;
                      const delta = (ck?.volumeTotal || 0) - (refCheckpoint?.volumeTotal || 0);
                      return (
                        <td key={sc.id} className="py-2.5 px-4 text-right font-mono">
                          <div className="font-bold text-slate-900">
                            {ck ? ck.volumeTotal.toLocaleString('en-US') : '—'} cans
                          </div>
                          {!isRef && delta !== 0 && (
                            <div className={`text-3xs ${delta > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {delta > 0 ? '+' : ''}{delta.toLocaleString('en-US')} cans
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* CA Brut */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      Gross Consumer Turnover (incl. VAT)
                    </td>
                    {compareScenarios.map(sc => {
                      const ck = getCheckpoint(evaluations[sc.id]);
                      return (
                        <td key={sc.id} className="py-2.5 px-4 text-right font-mono">
                          {ck ? `€${Math.round(ck.grossTurnover).toLocaleString('en-US')}` : '—'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Revenu Net */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      Net Recognized LUMEN Revenue
                    </td>
                    {compareScenarios.map(sc => {
                      const ck = getCheckpoint(evaluations[sc.id]);
                      const isRef = sc.id === activeRefScenario?.id;
                      const delta = (ck?.netRevenue || 0) - (refCheckpoint?.netRevenue || 0);
                      return (
                        <td key={sc.id} className="py-2.5 px-4 text-right font-mono">
                          <div className="font-bold text-emerald-800">
                            {ck ? `€${Math.round(ck.netRevenue).toLocaleString('en-US')}` : '—'}
                          </div>
                          {!isRef && delta !== 0 && (
                            <div className={`text-3xs ${delta > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {delta > 0 ? '+€' : '−€'}{Math.abs(Math.round(delta)).toLocaleString('en-US')}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Taux Marge Brute */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      Gross Margin Rate (% of Net)
                    </td>
                    {compareScenarios.map(sc => {
                      const ck = getCheckpoint(evaluations[sc.id]);
                      return (
                        <td key={sc.id} className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                          {ck ? `${(ck.grossMarginRate * 100).toFixed(1)}%` : '—'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Dépenses Marketing */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      Cumulative Marketing Budget
                    </td>
                    {compareScenarios.map(sc => {
                      const ck = getCheckpoint(evaluations[sc.id]);
                      return (
                        <td key={sc.id} className="py-2.5 px-4 text-right font-mono text-purple-700 font-semibold">
                          {ck ? `€${Math.round(ck.marketingSpend).toLocaleString('en-US')}` : '—'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Contribution Nette */}
                  <tr className="hover:bg-slate-50/50 bg-slate-50/30">
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      Net Contribution after Marketing
                    </td>
                    {compareScenarios.map(sc => {
                      const ck = getCheckpoint(evaluations[sc.id]);
                      const isRef = sc.id === activeRefScenario?.id;
                      const delta = (ck?.contributionAfterMarketing || 0) - (refCheckpoint?.contributionAfterMarketing || 0);
                      const isPos = (ck?.contributionAfterMarketing || 0) >= 0;
                      return (
                        <td key={sc.id} className="py-2.5 px-4 text-right font-mono">
                          <div className={`font-bold text-sm ${isPos ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {ck ? `€${Math.round(ck.contributionAfterMarketing).toLocaleString('en-US')}` : '—'}
                          </div>
                          {!isRef && delta !== 0 && (
                            <div className={`text-3xs font-semibold ${delta > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {delta > 0 ? '+€' : '−€'}{Math.abs(Math.round(delta)).toLocaleString('en-US')} vs Base
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Operating Profit */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      Operating Profit (EBIT)
                    </td>
                    {compareScenarios.map(sc => {
                      const ck = getCheckpoint(evaluations[sc.id]);
                      const isPos = (ck?.operatingProfit || 0) >= 0;
                      return (
                        <td key={sc.id} className={`py-2.5 px-4 text-right font-mono font-bold ${isPos ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {ck ? `€${Math.round(ck.operatingProfit).toLocaleString('en-US')}` : '—'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Payback Month */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      Payback Month (Cash Recovery)
                    </td>
                    {compareScenarios.map(sc => {
                      const ev = evaluations[sc.id];
                      return (
                        <td key={sc.id} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                          {ev?.paybackCrossingMonth ? `Month ${ev.paybackCrossingMonth}` : 'Not achieved'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Incremental ROI vs Reference */}
                  <tr className="hover:bg-slate-50/50 bg-emerald-50/20">
                    <td className="py-2.5 px-4 font-bold text-emerald-950">
                      Incremental ROI (ΔContribution / ΔMarketing)
                    </td>
                    {compareScenarios.map(sc => {
                      if (sc.id === activeRefScenario?.id) {
                        return (
                          <td key={sc.id} className="py-2.5 px-4 text-right text-slate-400 text-3xs font-mono">
                            Baseline reference
                          </td>
                        );
                      }
                      const ck = getCheckpoint(evaluations[sc.id]);
                      const deltaContrib = (ck?.contributionAfterMarketing || 0) - (refCheckpoint?.contributionAfterMarketing || 0);
                      const deltaMktg = (ck?.marketingSpend || 0) - (refCheckpoint?.marketingSpend || 0);

                      const roi = deltaMktg !== 0 ? (deltaContrib / deltaMktg) : 0;
                      return (
                        <td key={sc.id} className="py-2.5 px-4 text-right font-mono font-bold text-emerald-800">
                          {deltaMktg === 0 ? '—' : `${roi.toFixed(2)}x`}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparative Chart */}
          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
            <h3 className="text-xs font-semibold text-slate-900 mb-1">
              Comparative Visual: Net Revenue vs Marketing Spend vs Net Contribution
            </h3>
            <p className="text-2xs text-slate-500 mb-4">
              Comparison in thousands of euros (k€) across {horizon}-month horizon.
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any) => [`€${val}k`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Net Revenue (k€)" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Marketing (k€)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Net Contribution (k€)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
};
