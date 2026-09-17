import React from 'react';
import { Scenario, EvaluationResult } from '../types/simulator';
import { DollarSign, TrendingUp, Target, Clock, ShieldCheck, AlertCircle, ChevronRight } from 'lucide-react';

interface ExecutiveKpiRibbonProps {
  scenario: Scenario;
  evaluation: EvaluationResult;
  horizon: 3 | 6 | 12;
  onChangeHorizon: (horizon: 3 | 6 | 12) => void;
  onNavigateToTab: (tab: 'simulator' | 'scenarios' | 'evidence' | 'comparison' | 'decision') => void;
  onNavigateSubtab?: (subtab: 'commercial' | 'economics' | 'sensitivity' | 'explanation') => void;
}

export const ExecutiveKpiRibbon: React.FC<ExecutiveKpiRibbonProps> = ({
  scenario,
  evaluation,
  horizon,
  onChangeHorizon,
  onNavigateToTab,
  onNavigateSubtab,
}) => {
  const ck = horizon === 3 ? evaluation.checkpoints.m3 : horizon === 6 ? evaluation.checkpoints.m6 : evaluation.checkpoints.m12;
  if (!ck) return null;

  const grossMarginPercent = (ck.grossMarginRate * 100).toFixed(1);
  const isMarginHealthy = ck.grossMarginRate >= 0.40;
  const isContributionPositive = ck.contributionAfterMarketing >= 0;
  const isPaybackHealthy = evaluation.paybackCrossingMonth !== null && evaluation.paybackCrossingMonth <= 10;
  const marketingShareOfRevenue = ck.netRevenue > 0 ? ((ck.marketingSpend / ck.netRevenue) * 100).toFixed(0) : '0';

  return (
    <section className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top line: Active strategy title & quick horizon switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-3xs uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                Executive Pulse
              </span>
              <span className="text-xs font-semibold text-slate-300">
                Strategy: <strong className="text-white font-bold">{scenario.name}</strong>
              </span>
              <span className="text-3xs text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                {scenario.revision}
              </span>
            </div>
            {evaluation.isStale && (
              <span className="text-3xs text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Inputs updated • Recalculate
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-2xs font-medium">Evaluation Horizon:</span>
            <div className="inline-flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              {[3, 6, 12].map((h) => (
                <button
                  key={h}
                  onClick={() => onChangeHorizon(h as 3 | 6 | 12)}
                  className={`px-2.5 py-0.5 text-2xs font-semibold rounded transition-colors ${
                    horizon === h
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {h} Months
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5 Executive Corporate KPI Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2.5">
          {/* Tile 1: Net Revenue */}
          <div
            onClick={() => {
              onNavigateToTab('simulator');
              onNavigateSubtab?.('economics');
            }}
            className="group cursor-pointer bg-slate-800/60 hover:bg-slate-800 rounded-lg p-2.5 border border-slate-700/60 hover:border-emerald-500/50 transition-all"
            title="Click to view detailed revenue breakdown in Economics tab"
          >
            <div className="flex items-center justify-between text-slate-400 text-3xs font-semibold uppercase tracking-wider">
              <span>Net Revenue (LUMEN)</span>
              <DollarSign className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="mt-1 text-base sm:text-lg font-bold font-mono text-white tracking-tight">
              €{Math.round(ck.netRevenue).toLocaleString('en-US')}
            </div>
            <div className="mt-0.5 text-3xs text-slate-400 flex items-center justify-between">
              <span>Gross: €{Math.round(ck.grossTurnover).toLocaleString('en-US')}</span>
              <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                Detail <ChevronRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>

          {/* Tile 2: Gross Margin Rate */}
          <div
            onClick={() => {
              onNavigateToTab('simulator');
              onNavigateSubtab?.('economics');
            }}
            className="group cursor-pointer bg-slate-800/60 hover:bg-slate-800 rounded-lg p-2.5 border border-slate-700/60 hover:border-emerald-500/50 transition-all"
            title="Click to view unit cost breakdown in Economics tab"
          >
            <div className="flex items-center justify-between text-slate-400 text-3xs font-semibold uppercase tracking-wider">
              <span>Gross Margin Rate</span>
              <Target className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
                {grossMarginPercent}%
              </span>
              <span
                className={`text-3xs font-bold px-1.5 py-0.2 rounded ${
                  isMarginHealthy
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                    : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                }`}
              >
                {isMarginHealthy ? 'Target Met' : 'Low (<40%)'}
              </span>
            </div>
            <div className="mt-0.5 text-3xs text-slate-400">
              COGS: €0.88/can • Bench: &gt;40%
            </div>
          </div>

          {/* Tile 3: Cumulative Volume */}
          <div
            onClick={() => {
              onNavigateToTab('simulator');
              onNavigateSubtab?.('commercial');
            }}
            className="group cursor-pointer bg-slate-800/60 hover:bg-slate-800 rounded-lg p-2.5 border border-slate-700/60 hover:border-emerald-500/50 transition-all"
            title="Click to view monthly volume growth in Commercial tab"
          >
            <div className="flex items-center justify-between text-slate-400 text-3xs font-semibold uppercase tracking-wider">
              <span>Sold Volume ({horizon}m)</span>
              <TrendingUp className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="mt-1 text-base sm:text-lg font-bold font-mono text-white tracking-tight">
              {ck.volumeTotal.toLocaleString('en-US')}{' '}
              <span className="text-xs font-normal text-slate-400">cans</span>
            </div>
            <div className="mt-0.5 text-3xs text-slate-400 flex items-center justify-between">
              <span>{Math.round(ck.volumeTotal / horizon).toLocaleString('en-US')}/mo avg</span>
              <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                Volume <ChevronRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>

          {/* Tile 4: Net Operating Contribution */}
          <div
            onClick={() => {
              onNavigateToTab('simulator');
              onNavigateSubtab?.('economics');
            }}
            className="group cursor-pointer bg-slate-800/60 hover:bg-slate-800 rounded-lg p-2.5 border border-slate-700/60 hover:border-emerald-500/50 transition-all"
            title="Click to view contribution bridge"
          >
            <div className="flex items-center justify-between text-slate-400 text-3xs font-semibold uppercase tracking-wider">
              <span>Net Contribution II</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isContributionPositive ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'
                }`}
              />
            </div>
            <div
              className={`mt-1 text-base sm:text-lg font-bold font-mono tracking-tight ${
                isContributionPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isContributionPositive ? '+' : ''}€
              {Math.round(ck.contributionAfterMarketing).toLocaleString('en-US')}
            </div>
            <div className="mt-0.5 text-3xs text-slate-400">
              Mktg: €{Math.round(ck.marketingSpend).toLocaleString('en-US')} ({marketingShareOfRevenue}% rev)
            </div>
          </div>

          {/* Tile 5: Cash Payback Period */}
          <div
            onClick={() => {
              onNavigateToTab('simulator');
              onNavigateSubtab?.('economics');
            }}
            className="group cursor-pointer col-span-2 md:col-span-1 bg-slate-800/60 hover:bg-slate-800 rounded-lg p-2.5 border border-slate-700/60 hover:border-emerald-500/50 transition-all"
            title="Click to view cumulative cash recovery chart"
          >
            <div className="flex items-center justify-between text-slate-400 text-3xs font-semibold uppercase tracking-wider">
              <span>Capital Payback</span>
              <Clock className="w-3 h-3 text-purple-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
                {evaluation.paybackCrossingMonth
                  ? `Month ${evaluation.paybackCrossingMonth}`
                  : 'Beyond 12m'}
              </span>
              <span
                className={`text-3xs font-bold px-1.5 py-0.2 rounded ${
                  isPaybackHealthy
                    ? 'bg-purple-950 text-purple-300 border border-purple-700/60'
                    : 'bg-rose-950 text-rose-300 border border-rose-700/60'
                }`}
              >
                {isPaybackHealthy ? 'Board Ok' : 'Slow'}
              </span>
            </div>
            <div className="mt-0.5 text-3xs text-slate-400 flex items-center justify-between">
              <span>CFO limit: ≤10 mos</span>
              <ShieldCheck
                className={`w-3 h-3 ${isPaybackHealthy ? 'text-emerald-400' : 'text-slate-500'}`}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
